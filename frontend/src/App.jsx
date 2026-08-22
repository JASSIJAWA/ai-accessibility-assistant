import CameraFeed from './components/CameraFeed'
import TranscriptPanel from './components/TranscriptPanel'
import AlertPanel from './components/AlertPanel'
import './App.css'

function App() {
  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">♿</div>
        <nav className="sidebar-nav">
          <button className="nav-btn active" title="Vision">
            <span>👁️</span>
          </button>
          <button className="nav-btn" title="Audio">
            <span>🎙️</span>
          </button>
          <button className="nav-btn" title="Alerts">
            <span>🔔</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-btn" title="Settings">
            <span>⚙️</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div>
            <h1 className="topbar-title">AI Accessibility Assistant</h1>
            <p className="topbar-subtitle">Real-time vision & audio assistance</p>
          </div>
          <div className="topbar-right">
            <span className="status-pill live">● Live</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="content-grid">
          <div className="card card-camera">
            <CameraFeed />
          </div>
          <div className="card card-transcript">
            <TranscriptPanel />
          </div>
          <div className="card card-alerts">
            <AlertPanel />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
