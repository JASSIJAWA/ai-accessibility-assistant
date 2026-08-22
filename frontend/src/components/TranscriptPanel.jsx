import { useState } from 'react';
import './TranscriptPanel.css';

function TranscriptPanel() {
  const [isListening, setIsListening] = useState(false);
  // This will hold real transcripts in Phase 3; for now, we use demo data
  const [transcripts, setTranscripts] = useState([
    { id: 1, text: 'Welcome to the AI Accessibility Assistant.', sentiment: 'neutral', time: 'Now' },
  ]);

  const toggleListening = () => {
    setIsListening(!isListening);
    // In Phase 3, this will start/stop the microphone and WebSocket connection
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'happy': return '#00c853';
      case 'angry': return '#ff1744';
      case 'excited': return '#ffc107';
      default: return '#8e8ea0';
    }
  };

  return (
    <div className="transcript-panel">
      <div className="panel-header">
        <span className="panel-icon">📝</span>
        <h2>Live Transcript</h2>
        <button
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '🔴' : '🎙️'}
        </button>
      </div>

      <div className="transcript-list">
        {transcripts.length === 0 ? (
          <p className="placeholder-text">
            🎙️ Press the microphone button to start live transcription.
          </p>
        ) : (
          transcripts.map((entry) => (
            <div key={entry.id} className="transcript-entry">
              <span
                className="sentiment-bar"
                style={{ backgroundColor: getSentimentColor(entry.sentiment) }}
              ></span>
              <div className="transcript-content">
                <p className="transcript-text">{entry.text}</p>
                <span className="transcript-time">{entry.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Catch Me Up button - will connect to LLM in Phase 3 */}
      <div className="summary-section">
        <button className="catch-up-btn" disabled>
          ✨ Catch Me Up (AI Summary)
        </button>
        <p className="summary-hint">Summarizes the last 5 minutes using AI</p>
      </div>
    </div>
  );
}

export default TranscriptPanel;
