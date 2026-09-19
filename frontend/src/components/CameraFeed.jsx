import { useRef, useEffect, useState, useCallback } from 'react';

const BACKEND_WS = 'ws://localhost:8000/ws/vision';
const FRAME_INTERVAL = 200; // Send a frame every 200ms (5 FPS to backend)

function CameraFeed({ onDetectionUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState({ objects: [], emotions: [] });

  // Start sending frames once streaming
  useEffect(() => {
    let isActive = true;

    const captureAndSend = async () => {
      if (!isActive) return;
      
      // If ready, send a frame
      if (isStreaming && isConnected && videoRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          const base64 = canvas.toDataURL('image/jpeg', 0.5); // Lower quality slightly for speed
          wsRef.current.send(base64);
        }
      }
      
      // Wait a short moment then try again (let the onmessage handler trigger the real fast loop if we want, but a simple polling with requestAnimationFrame or setTimeout is fine).
      // Actually, since we want to wait for the backend, we should trigger the NEXT frame inside the onmessage handler!
      // But to kick it off or keep it alive if a message drops, we use a slow fallback interval:
      intervalRef.current = setTimeout(captureAndSend, 1000); 
    };

    if (isStreaming && isConnected) {
      captureAndSend(); // Kick off the loop
    }

    return () => {
      isActive = false;
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isStreaming, isConnected]);

  // Connect to backend WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(BACKEND_WS);

      ws.onopen = () => {
        console.log('✅ Connected to Vision AI backend');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          if (!result.error) {
            setDetections(result);
            if (onDetectionUpdate) onDetectionUpdate(result);
          }
          
          // FAST LOOP: As soon as we get a result, instantly send the NEXT frame (if video is active)
          if (videoRef.current && videoRef.current.readyState >= 2 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (canvas && video.videoWidth > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              const base64 = canvas.toDataURL('image/jpeg', 0.5);
              wsRef.current.send(base64);
              
              // Reset the fallback timeout so we don't send duplicate frames
              if (intervalRef.current) clearTimeout(intervalRef.current);
              intervalRef.current = setTimeout(() => {
                 if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                     wsRef.current.send(base64);
                 }
              }, 1000);
            }
          }
        } catch (e) {
          console.error('Failed to parse AI result:', e);
        }
      };

      ws.onclose = () => {
        console.log('❌ Vision WebSocket disconnected');
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      setIsConnected(false);
    }
  }, [onDetectionUpdate]); // Removed isStreaming to prevent infinite loop

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  // Initialize camera and WebSocket on mount
  useEffect(() => {
    startCamera();
    connectWebSocket();

    return () => {
      stopCamera();
      if (wsRef.current) wsRef.current.close();
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []); // Empty array ensures this only runs ONCE on mount

  // Generate TTS announcement for emotions
  useEffect(() => {
    if (detections.emotions && detections.emotions.length > 0) {
      const emotion = detections.emotions[0];
      // Only speak if confidence is high enough
      if (emotion.confidence > 60) {
        // Throttle TTS so it doesn't repeat every frame
        const key = `${emotion.emotion}`;
        if (window._lastSpoken !== key) {
          window._lastSpoken = key;
          const utterance = new SpeechSynthesisUtterance(
            `Person detected. They appear ${emotion.emotion}.`
          );
          utterance.rate = 1.1;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
          // Reset after 5 seconds so it can speak again if emotion changes
          setTimeout(() => { window._lastSpoken = null; }, 5000);
        }
      }
    }
  }, [detections.emotions]);

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-lg">👁️</span>
        <h2 className="text-sm font-semibold text-gray-200 flex-1">Vision Assistant</h2>
        <div className="flex items-center gap-2">
          {/* Backend connection status */}
          <span className={`text-[0.6rem] px-2 py-0.5 rounded-full font-medium
            ${isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
            {isConnected ? 'AI Connected' : 'AI Offline'}
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-gray-600'}`} />
        </div>
      </div>

      {/* Video with AI overlay */}
      <div className="flex-1 bg-[#050510] relative min-h-0">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-red-400 p-8">
            <div>
              <p>⚠️ {error}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-6 py-2 bg-purple-500/30 border border-purple-500/40 rounded-lg text-white text-sm hover:bg-purple-500/50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* AI Bounding Box Overlays */}
            <div className="absolute inset-0 pointer-events-none -scale-x-100">
              {/* Object boxes */}
              {detections.objects?.map((obj, i) => {
                const fs = detections.frame_size;
                if (!fs) return null;
                const style = {
                  left: `${(obj.box.x1 / fs.width) * 100}%`,
                  top: `${(obj.box.y1 / fs.height) * 100}%`,
                  width: `${((obj.box.x2 - obj.box.x1) / fs.width) * 100}%`,
                  height: `${((obj.box.y2 - obj.box.y1) / fs.height) * 100}%`,
                };
                return (
                  <div key={`obj-${i}`} className="absolute border-2 border-emerald-400 rounded-sm transition-all duration-300 ease-linear" style={style}>
                    <span className="absolute -top-5 left-0 bg-emerald-500/80 text-white text-[0.6rem] px-1.5 py-0.5 rounded -scale-x-100 whitespace-nowrap">
                      {obj.label} {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>
                );
              })}

              {/* Emotion boxes */}
              {detections.emotions?.map((face, i) => {
                const fs = detections.frame_size;
                if (!fs) return null;
                const style = {
                  left: `${(face.box.x / fs.width) * 100}%`,
                  top: `${(face.box.y / fs.height) * 100}%`,
                  width: `${(face.box.w / fs.width) * 100}%`,
                  height: `${(face.box.h / fs.height) * 100}%`,
                };
                const emotionColors = {
                  happy: 'border-yellow-400 bg-yellow-500/80',
                  sad: 'border-blue-400 bg-blue-500/80',
                  angry: 'border-red-400 bg-red-500/80',
                  surprise: 'border-pink-400 bg-pink-500/80',
                  fear: 'border-orange-400 bg-orange-500/80',
                  disgust: 'border-green-400 bg-green-500/80',
                  neutral: 'border-gray-400 bg-gray-500/80',
                };
                const colors = emotionColors[face.emotion] || 'border-purple-400 bg-purple-500/80';
                const [borderColor, bgColor] = colors.split(' ');

                return (
                  <div key={`emo-${i}`} className={`absolute border-2 ${borderColor} rounded-sm transition-all duration-300 ease-linear`} style={style}>
                    <span className={`absolute -top-5 left-0 ${bgColor} text-white text-[0.6rem] px-1.5 py-0.5 rounded -scale-x-100 whitespace-nowrap`}>
                      {face.emotion} {Math.round(face.confidence)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Detection Summary */}
      <div className="px-4 py-2.5 border-t border-white/5 flex-shrink-0">
        {detections.objects?.length > 0 || detections.emotions?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {detections.objects?.map((obj, i) => (
              <span key={`tag-${i}`} className="text-[0.65rem] px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full">
                {obj.label}
              </span>
            ))}
            {detections.emotions?.map((face, i) => (
              <span key={`emo-tag-${i}`} className="text-[0.65rem] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full">
                😊 {face.emotion}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-white/25 text-xs text-center">
            {isConnected ? '🔍 Analyzing video feed...' : '⏳ Waiting for AI backend connection...'}
          </p>
        )}
      </div>
    </>
  );
}

export default CameraFeed;
