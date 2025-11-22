import React from 'react'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🐱</span>
          <span>Meeow</span>
        </div>
        <nav className="nav">
          <div className="nav-item active">
            <span>⬇️</span> Downloads
          </div>
          <div className="nav-item">
            <span>⚙️</span> Settings
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <header className="header">
          <h1 className="title">Download Queue</h1>
          <p className="subtitle">Manage your purr-fect downloads</p>
        </header>
        {children}
      </main>
    </div>
  )
}

export default Layout
