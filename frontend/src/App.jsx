import CameraFeed from './components/CameraFeed'
import TranscriptPanel from './components/TranscriptPanel'
import AlertPanel from './components/AlertPanel'

function App() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-[#0a0a1a] via-[#12122a] to-[#1a0a2e] text-gray-200 overflow-hidden">

      {/* Sidebar — hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex w-[68px] flex-shrink-0 bg-[#0f0f23]/80 backdrop-blur-xl border-r border-white/5 flex-col items-center py-4">
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
        <header className="flex justify-between items-center px-4 md:px-6 py-2.5 md:py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 md:block">
            <span className="text-xl md:hidden">♿</span>
            <div>
              <h1 className="text-sm md:text-lg font-bold text-gray-100 tracking-tight">AI Accessibility Assistant</h1>
              <p className="hidden md:block text-xs text-white/30 mt-0.5">Real-time vision & audio assistance</p>
            </div>
          </div>
          <span className="text-[0.65rem] md:text-xs font-semibold px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● Live</span>
        </header>

        {/* Dashboard Grid — single column on mobile, 2-col on lg */}
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[1.4fr_1fr] lg:grid-rows-[1.6fr_1fr] gap-3 p-3 md:p-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-20 md:pb-4">

          {/* Camera Card */}
          <div className="lg:row-span-2 bg-[#14142d]/60 backdrop-blur-2xl border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col min-h-[250px] sm:min-h-[300px] lg:min-h-0">
            <CameraFeed />
          </div>

          {/* Transcript Card */}
          <div className="bg-[#14142d]/60 backdrop-blur-2xl border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col min-h-[250px] lg:min-h-0">
            <TranscriptPanel />
          </div>

          {/* Alerts Card */}
          <div className="bg-[#14142d]/60 backdrop-blur-2xl border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col min-h-[220px] lg:min-h-0">
            <AlertPanel />
          </div>

        </main>
      </div>

      {/* Bottom Navigation — visible on mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f23]/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center py-2 px-4 z-50">
        <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-purple-500/20" title="Vision">
          <span className="text-lg">👁️</span>
          <span className="text-[0.6rem] text-purple-300">Vision</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors" title="Audio">
          <span className="text-lg">🎙️</span>
          <span className="text-[0.6rem] text-white/40">Audio</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors" title="Alerts">
          <span className="text-lg">🔔</span>
          <span className="text-[0.6rem] text-white/40">Alerts</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors" title="Settings">
          <span className="text-lg">⚙️</span>
          <span className="text-[0.6rem] text-white/40">Settings</span>
        </button>
      </nav>
    </div>
  )
}

export default App
