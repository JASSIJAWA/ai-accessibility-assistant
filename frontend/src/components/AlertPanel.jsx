import { useState, useEffect } from 'react';

function AlertPanel({ visionData }) {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'info', icon: '🟢', message: 'System initialized successfully', time: 'Just now' },
  ]);

  // Derive live stats from vision data
  const objectCount = visionData?.object_count || 0;
  const dominantEmotion = visionData?.emotions?.[0]?.emotion || '--';
  const emotionEmoji = {
    happy: '😊', sad: '😢', angry: '😠', surprise: '😲',
    fear: '😨', disgust: '🤢', neutral: '😐',
  };

  // Add alerts when new things are detected
  useEffect(() => {
    if (!visionData) return;

    // Alert on new person detected with emotion
    if (visionData.emotions?.length > 0) {
      const emotion = visionData.emotions[0];
      if (emotion.confidence > 60) {
        const newAlert = {
          id: Date.now(),
          type: emotion.emotion === 'angry' ? 'danger' : emotion.emotion === 'happy' ? 'info' : 'warning',
          icon: emotionEmoji[emotion.emotion] || '👤',
          message: `Person detected — appears ${emotion.emotion} (${Math.round(emotion.confidence)}%)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setAlerts((prev) => {
          // Avoid duplicate rapid alerts
          const recent = prev[0];
          if (recent && recent.message === newAlert.message) return prev;
          return [newAlert, ...prev].slice(0, 20); // Keep last 20
        });
      }
    }
  }, [visionData]);

  const stats = [
    { icon: '👁️', value: String(objectCount), label: 'Objects' },
    { icon: emotionEmoji[dominantEmotion] || '😊', value: dominantEmotion, label: 'Emotion' },
    { icon: '🔊', value: '0', label: 'Sounds' },
    { icon: '👤', value: String(visionData?.face_count || 0), label: 'Faces' },
  ];

  const borderColors = {
    info: 'border-l-emerald-400/50',
    warning: 'border-l-amber-400/50',
    danger: 'border-l-red-500/50',
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-lg">🔔</span>
        <h2 className="text-sm font-semibold text-gray-200 flex-1">Alerts & Info</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
            <span className="text-xl">{stat.icon}</span>
            <div>
              <p className="text-gray-100 text-base font-bold leading-tight capitalize">{stat.value}</p>
              <p className="text-white/25 text-[0.6rem] uppercase tracking-wide">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Log */}
      <div className="flex-1 px-3 pb-3 overflow-y-auto min-h-0">
        <h3 className="text-white/25 text-[0.65rem] uppercase tracking-widest font-semibold mb-2">Recent Activity</h3>
        {alerts.map((alert) => (
          <div key={alert.id} className={`flex gap-2.5 items-start p-2.5 rounded-lg mb-1.5 bg-white/[0.02] border border-white/[0.04] border-l-[3px] ${borderColors[alert.type] || ''}`}>
            <span className="text-sm flex-shrink-0">{alert.icon}</span>
            <div className="flex-1">
              <p className="text-gray-200 text-xs">{alert.message}</p>
              <span className="text-white/20 text-[0.6rem]">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default AlertPanel;
