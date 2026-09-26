import { useRef, useEffect, useState, useCallback } from 'react';

const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/vision`;
};

const BACKEND_WS = getWebSocketUrl();
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
  
  // OCR State
  const [isReadingText, setIsReadingText] = useState(false);
  const [recognizedText, setRecognizedText] = useState(null);
  
  // OCR Debug State
  const [ocrDebug, setOcrDebug] = useState({
    imageUrl: null,
    rawText: null,
    confidence: null,
    filteredText: null
  });

  // Scene Narrator State
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const lastNarrationRef = useRef('');
  const narrationTimerRef = useRef(null);

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

  const [facingMode, setFacingMode] = useState('environment');
  const [aspectRatio, setAspectRatio] = useState(4/3);

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
              
              // If front camera, we should probably mirror the canvas capture so coordinates match mirrored video, 
              // but actually the raw frame sent to backend is unmirrored, and bounding boxes are mapped over a mirrored div.
              // Wait, previous code mirrored the DIV, not the capture. We will keep it that way.
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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  // Start webcam
  const startCamera = async (mode = facingMode) => {
    stopCamera(); // Ensure previous stream is closed before opening new one
    setError(null); // Clear error state immediately to mount videoRef
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: mode },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error occurred.'}`);
      }
      setIsStreaming(false);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const handleReadText = async () => {
    if (isReadingText || !videoRef.current || !canvasRef.current || !isStreaming) return;

    setIsReadingText(true);
    setRecognizedText(null);
    setOcrDebug({ imageUrl: null, rawText: null, confidence: null, filteredText: null, status: null, wordDetails: [] });

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Capture frame at full video resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d'); 
      ctx.drawImage(video, 0, 0);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Send to backend EasyOCR endpoint
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      });

      const data = await response.json();

      if (data.error) {
        setRecognizedText("OCR Failed: " + data.error);
        return;
      }

      const wordDetails = (data.results || []).map(r => ({
        text: r.text,
        confidence: r.confidence,
        accepted: r.accepted
      }));

      const isAccepted = data.accepted && data.text.length >= 2;

      if (isAccepted) {
        setRecognizedText(data.text);
      } else {
        setRecognizedText("No clear text detected. Try moving closer, improving lighting, or holding the camera steady.");
      }

      // Debug state
      setOcrDebug({
        imageUrl,
        rawText: (data.results || []).map(r => r.text).join(' '),
        confidence: wordDetails.length > 0 ? Math.round(wordDetails.reduce((sum, w) => sum + w.confidence, 0) / wordDetails.length) : 0,
        filteredText: isAccepted ? data.text : '',
        status: isAccepted ? 'ACCEPTED' : 'REJECTED',
        wordDetails
      });

      // Speak ONLY if accepted — never speak garbage
      window.speechSynthesis.cancel();
      if (isAccepted) {
        let speakableText = data.text;
        if (speakableText.length > 200) {
          speakableText = speakableText.substring(0, 200) + "... and more.";
        }
        const utterance = new SpeechSynthesisUtterance(speakableText);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }

    } catch (err) {
      console.error('OCR Error:', err);
      setRecognizedText("OCR Failed. Please try again.");
    } finally {
      setIsReadingText(false);
    }
  };

  // Initialize camera and WebSocket on mount
  useEffect(() => {
    startCamera(facingMode);
    connectWebSocket();

    return () => {
      stopCamera();
      if (wsRef.current) wsRef.current.close();
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []); // Empty array ensures this only runs ONCE on mount

  // Gemini Scene Description — rich, natural descriptions (every ~6s)
  const lastGeminiRef = useRef('');
  useEffect(() => {
    if (!narrationEnabled || isReadingText) return;
    const desc = detections.scene_description;
    if (!desc || desc === lastGeminiRef.current) return;
    lastGeminiRef.current = desc;

    // Gemini descriptions get priority — cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(desc);
    utterance.rate = 1.05;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [detections.scene_description, narrationEnabled, isReadingText]);

  // YOLO Fallback Narrator — short alerts when Gemini hasn't spoken yet
  useEffect(() => {
    if (!narrationEnabled || isReadingText) return;
    if (!detections.narration || !detections.scene_changed) return;
    // Skip if Gemini already provided a description recently
    if (detections.scene_description) return;

    const narration = detections.narration;

    if (narrationTimerRef.current) return;
    narrationTimerRef.current = setTimeout(() => {
      narrationTimerRef.current = null;
    }, 4000);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 1.15;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [detections, narrationEnabled, isReadingText]);

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">👁️</span>
          <h2 className="text-sm font-semibold text-gray-200">Vision Assistant</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleCamera}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white text-xs flex items-center gap-1 px-3"
            title="Switch Camera"
          >
            <span className="text-base">🔄</span>
            <span className="hidden sm:inline">{facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
          </button>
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
      </div>

      {/* Video with AI overlay */}
      <div className="flex-1 bg-[#050510] relative min-h-0 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-red-400 p-8">
            <div>
              <p>⚠️ {error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-4 px-6 py-2 bg-purple-500/30 border border-purple-500/40 rounded-lg text-white text-sm hover:bg-purple-500/50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="relative flex-shrink-0"
            style={{ 
              aspectRatio: aspectRatio,
              maxHeight: '100%',
              maxWidth: '100%'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                if (e.target.videoWidth && e.target.videoHeight) {
                  setAspectRatio(e.target.videoWidth / e.target.videoHeight);
                }
              }}
              className={`w-full h-full object-contain ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* AI Bounding Box Overlays */}
            <div className={`absolute inset-0 pointer-events-none ${facingMode === 'user' ? '-scale-x-100' : ''}`}>
              {/* Object boxes — color coded by urgency */}
              {detections.objects?.map((obj, i) => {
                const fs = detections.frame_size;
                if (!fs) return null;
                const style = {
                  left: `${(obj.box.x1 / fs.width) * 100}%`,
                  top: `${(obj.box.y1 / fs.height) * 100}%`,
                  width: `${((obj.box.x2 - obj.box.x1) / fs.width) * 100}%`,
                  height: `${((obj.box.y2 - obj.box.y1) / fs.height) * 100}%`,
                };
                const urgencyColors = {
                  critical: 'border-red-500 bg-red-600/90',
                  warning:  'border-amber-400 bg-amber-500/90',
                  info:     'border-emerald-400 bg-emerald-500/80',
                  background: 'border-gray-400 bg-gray-500/70',
                };
                const colors = urgencyColors[obj.urgency] || urgencyColors.info;
                const [borderColor, bgColor] = colors.split(' ');
                const distText = obj.distance_m ? `${obj.distance_m}m` : `~${obj.distance_steps}steps`;
                return (
                  <div key={`obj-${i}`} className={`absolute border-2 ${borderColor} rounded-sm transition-all duration-300 ease-linear`} style={style}>
                    <span className={`absolute -top-5 left-0 ${bgColor} text-white text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap ${facingMode === 'user' ? '-scale-x-100' : ''}`}>
                      {obj.urgency === 'critical' ? '⚠️ ' : ''}{obj.label} {distText} {obj.position || ''}
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
                    <span className={`absolute -top-5 left-0 ${bgColor} text-white text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap ${facingMode === 'user' ? '-scale-x-100' : ''}`}>
                      {face.emotion} {Math.round(face.confidence)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Gemini Scene Description */}
      {detections.scene_description && (
        <div className="px-4 py-2 border-t border-indigo-500/20 bg-indigo-500/5 flex-shrink-0">
          <p className="text-xs text-indigo-200 leading-relaxed">
            <span className="text-indigo-400 font-semibold">🧠 AI:</span> {detections.scene_description}
          </p>
        </div>
      )}

      {/* Detection Summary */}
      <div className="px-4 py-2.5 border-t border-white/5 flex-shrink-0 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {detections.objects?.length > 0 || detections.emotions?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detections.objects?.map((obj, i) => {
                const tagColors = {
                  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
                  warning:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  info:     'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                  background: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                };
                const tc = tagColors[obj.urgency] || tagColors.info;
                return (
                  <span key={`tag-${i}`} className={`text-[0.65rem] px-2 py-0.5 ${tc} rounded-full`}>
                    {obj.urgency === 'critical' ? '⚠️' : ''}{obj.label} {obj.distance_m || '?'}m {obj.position || ''}
                  </span>
                );
              })}
              {detections.emotions?.map((face, i) => (
                <span key={`emo-tag-${i}`} className="text-[0.65rem] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full">
                  😊 {face.emotion}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-white/25 text-xs">
              {isConnected ? '🔍 Analyzing video feed...' : '⏳ Waiting for AI backend connection...'}
            </p>
          )}
        </div>
        
        {/* Narration Toggle */}
        <button
          onClick={() => {
            setNarrationEnabled(!narrationEnabled);
            if (narrationEnabled) window.speechSynthesis.cancel();
          }}
          className={`flex-shrink-0 px-3 py-2 rounded-lg font-bold text-xs transition-colors
            ${narrationEnabled 
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
        >
          {narrationEnabled ? '🔊 GUIDE ON' : '🔇 GUIDE OFF'}
        </button>
        
        {/* Read Text Button */}
        <button
          onClick={handleReadText}
          disabled={isReadingText || !isStreaming}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2
            ${isReadingText 
              ? 'bg-blue-500/50 text-white cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
        >
          {isReadingText ? '⏳ READING...' : '📖 READ TEXT'}
        </button>
      </div>

      {/* OCR Result Display */}
      {recognizedText && (
        <div className="px-4 py-3 border-t border-white/5 bg-blue-500/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Detected Text</span>
            <button onClick={() => setRecognizedText(null)} className="text-white/40 hover:text-white/80 text-xs">✕ Dismiss</button>
          </div>
          <p className="text-sm text-gray-200 whitespace-pre-wrap font-medium">
            {recognizedText}
          </p>
        </div>
      )}

      {/* OCR Debug Panel (Temporary) */}
      {ocrDebug && ocrDebug.rawText !== null && (
        <div className="px-4 py-3 border-t border-white/10 bg-black/50 flex-shrink-0 text-xs font-mono text-gray-400 overflow-y-auto max-h-56">
          <h3 className="text-red-400 mb-2 font-bold uppercase">OCR Debug Info</h3>
          <div className="flex gap-4">
            {ocrDebug.imageUrl && (
              <img 
                src={ocrDebug.imageUrl} 
                alt="OCR Frame" 
                className="w-32 h-24 object-contain border border-gray-600 rounded"
              />
            )}
            <div className="flex-1 space-y-1">
              <p><strong className="text-gray-200">Status:</strong> <span className={ocrDebug.status === 'ACCEPTED' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{ocrDebug.status}</span></p>
              <p><strong className="text-gray-200">Confidence:</strong> {ocrDebug.confidence != null ? Math.round(ocrDebug.confidence) + '%' : 'N/A'}</p>
              <p><strong className="text-gray-200">Raw Text:</strong> <span className="text-yellow-200/80 break-all">{ocrDebug.rawText === "" ? "[EMPTY]" : ocrDebug.rawText}</span></p>
              <p><strong className="text-gray-200">Filtered:</strong> <span className="text-blue-300 break-all">{ocrDebug.filteredText === "" ? "[EMPTY]" : ocrDebug.filteredText}</span></p>
            </div>
          </div>
          {ocrDebug.wordDetails && ocrDebug.wordDetails.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-gray-300 mb-1"><strong>Words:</strong></p>
              <div className="flex flex-wrap gap-1">
                {ocrDebug.wordDetails.map((w, i) => (
                  <span key={i} className={`px-1.5 py-0.5 rounded text-[0.6rem] ${w.accepted ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50 line-through'}`}>
                    {w.text} <span className="opacity-60">{w.confidence}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default CameraFeed;
