import { useRef, useEffect, useState } from 'react';

function CameraFeed() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-lg">👁️</span>
        <h2 className="text-sm font-semibold text-gray-200 flex-1">Vision Assistant</h2>
        <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-gray-600'}`} />
      </div>

      {/* Video */}
      <div className="flex-1 bg-[#050510] flex items-center justify-center min-h-0">
        {error ? (
          <div className="text-center text-red-400 p-8">
            <p>⚠️ {error}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-6 py-2 bg-purple-500/30 border border-purple-500/40 rounded-lg text-white text-sm hover:bg-purple-500/50 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
        )}
      </div>

      {/* Detection Results Placeholder */}
      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
        <p className="text-white/25 text-xs text-center">
          🔍 AI detection will appear here once the Vision module is connected.
        </p>
      </div>
    </>
  );
}

export default CameraFeed;
