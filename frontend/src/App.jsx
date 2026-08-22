import CameraFeed from './components/CameraFeed'
import TranscriptPanel from './components/TranscriptPanel'
import AlertPanel from './components/AlertPanel'
import './App.css'

function App() {
  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">♿</span>
          <h1>AI Accessibility Assistant</h1>
        </div>
        <div className="navbar-status">
          <span className="status-badge connected">● Backend Connected</span>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Column - Camera Feed (for Visually Impaired) */}
        <section className="grid-camera">
          <CameraFeed />
        </section>

        {/* Middle Column - Live Transcript (for Hearing Impaired) */}
        <section className="grid-transcript">
          <TranscriptPanel />
        </section>

        {/* Right Column - Alerts & Stats */}
        <section className="grid-alerts">
          <AlertPanel />
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>AI Accessibility Assistant — 7th Semester Major Project</p>
      </footer>
    </div>
  )
}

export default App
