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
          >
            <span>⬇️</span> Downloads
          </div>
          <div 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <span>⚙️</span> Settings
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <header className="header">
          <h1 className="title">{activeView === 'downloads' ? 'Download Queue' : 'Settings'}</h1>
          <p className="subtitle">{activeView === 'downloads' ? 'Manage your purr-fect downloads' : 'Configure your preferences'}</p>
        </header>
        {children}
      </main>
    </div>
  )
}

export default Layout
