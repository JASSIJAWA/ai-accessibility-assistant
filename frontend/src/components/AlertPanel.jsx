import { useState } from 'react';

function AlertPanel() {
  const [alerts] = useState([
    { id: 1, type: 'info', icon: '🟢', message: 'System initialized successfully', time: 'Just now' },
  ]);

  const stats = [
    { icon: '👁️', value: '0', label: 'Objects' },
    { icon: '😊', value: '--', label: 'Emotion' },
    { icon: '🔊', value: '0', label: 'Sounds' },
    { icon: '📝', value: '0', label: 'Words' },
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
              <p className="text-gray-100 text-base font-bold leading-tight">{stat.value}</p>
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
