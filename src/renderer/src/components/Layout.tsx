import React from 'react'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  activeView: 'downloads' | 'settings'
  onNavigate: (view: 'downloads' | 'settings') => void
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🐱</span>
          <span>Meeow</span>
        </div>
        <nav className="nav">
          <div
            className={`nav-item ${activeView === 'downloads' ? 'active' : ''}`}
            onClick={() => onNavigate('downloads')}
            title="Downloads"
          >
            <span role="img" aria-label="downloads">⬇️</span>
            <span>Downloads</span>
          </div>
          <div
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            <span role="img" aria-label="settings">⚙️</span>
            <span>Settings</span>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <header className="status-strip">
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <h1 className="strip-title">{activeView === 'downloads' ? 'Download Queue' : 'Settings'}</h1>
            <span className="strip-subtitle">
              {activeView === 'downloads' ? 'Manage your purr-fect downloads' : 'Configure your preferences'}
            </span>
          </div>
          {/* Placeholder for future status indicators */}
          <div className="status-indicators">
             {/* e.g. Network Status */}
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
