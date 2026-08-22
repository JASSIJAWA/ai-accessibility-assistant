import { useRef, useEffect, useState } from 'react';
import './CameraFeed.css';

function CameraFeed() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    // Cleanup: stop camera when component unmounts
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // This is the browser API that requests permission to use the webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false, // We handle audio separately in the transcript module
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
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  return (
    <div className="camera-feed">
      <div className="panel-header">
        <span className="panel-icon">👁️</span>
        <h2>Vision Assistant</h2>
        <span className={`status-dot ${isStreaming ? 'active' : ''}`}></span>
      </div>

      <div className="video-container">
        {error ? (
          <div className="camera-error">
            <p>⚠️ {error}</p>
            <button onClick={startCamera}>Retry</button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-stream"
          />
        )}
      </div>

      {/* AI detection results will appear here in Phase 2 */}
      <div className="detection-results">
        <p className="placeholder-text">
          🔍 AI detection will appear here once the Vision module is connected.
        </p>
      </div>
    </div>
  );
}

export default CameraFeed;
