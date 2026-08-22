import CameraFeed from './components/CameraFeed'
import TranscriptPanel from './components/TranscriptPanel'
import AlertPanel from './components/AlertPanel'

function App() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a1a] via-[#12122a] to-[#1a0a2e] text-gray-200 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-[68px] flex-shrink-0 bg-[#0f0f23]/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4">
        <div className="text-2xl mb-6 pb-3 border-b border-white/10 w-4/5 text-center">♿</div>
        <nav className="flex flex-col gap-2 flex-1">
          <button className="w-11 h-11 rounded-xl bg-purple-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)] flex items-center justify-center text-xl" title="Vision">👁️</button>
          <button className="w-11 h-11 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-xl transition-colors" title="Audio">🎙️</button>
          <button className="w-11 h-11 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-xl transition-colors" title="Alerts">🔔</button>
        </nav>
        <button className="w-11 h-11 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-xl transition-colors" title="Settings">⚙️</button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="flex justify-between items-center px-6 py-3 border-b border-white/5 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-100 tracking-tight">AI Accessibility Assistant</h1>
            <p className="text-xs text-white/30 mt-0.5">Real-time vision & audio assistance</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● Live</span>
        </header>

        {/* Dashboard Grid */}
        <main className="flex-1 grid grid-cols-[1.4fr_1fr] grid-rows-[1.6fr_1fr] gap-3 p-4 min-h-0">

          {/* Camera Card - spans both rows */}
          <div className="row-span-2 bg-[#14142d]/60 backdrop-blur-2xl border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
            <CameraFeed />
          </div>

          {/* Transcript Card */}
          <div className="bg-[#14142d]/60 backdrop-blur-2xl border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
            <TranscriptPanel />
          </div>

          {/* Alerts Card */}
          <div className="bg-[#14142d]/60 backdrop-blur-2xl border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
            <AlertPanel />
          </div>

        </main>
      </div>
    </div>
  )
}

export default App
