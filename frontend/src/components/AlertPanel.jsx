import { useState } from 'react';
import './AlertPanel.css';

function AlertPanel() {
  // Demo alerts; real alerts will come from the backend in Phase 2 & 3
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'info', icon: '🟢', message: 'System initialized successfully', time: 'Just now' },
  ]);

  return (
    <div className="alert-panel">
      <div className="panel-header">
        <span className="panel-icon">🔔</span>
        <h2>Alerts & Info</h2>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">👁️</span>
          <div>
            <p className="stat-value">0</p>
            <p className="stat-label">Objects Detected</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">😊</span>
          <div>
            <p className="stat-value">--</p>
            <p className="stat-label">Emotion</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔊</span>
          <div>
            <p className="stat-value">0</p>
            <p className="stat-label">Sound Alerts</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div>
            <p className="stat-value">0</p>
            <p className="stat-label">Words Transcribed</p>
          </div>
        </div>
      </div>

      {/* Alert Log */}
      <div className="alert-list">
        <h3 className="alert-list-title">Recent Activity</h3>
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-entry alert-${alert.type}`}>
            <span className="alert-icon">{alert.icon}</span>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
              <span className="alert-time">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertPanel;
