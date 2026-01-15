import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="layout">
      <main className="layout-content">{children}</main>
      <nav className="bottom-nav">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-label">打卡</span>
        </Link>
        <Link
          to="/history"
          className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">历史</span>
        </Link>
        <Link
          to="/settings"
          className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">设置</span>
        </Link>
      </nav>
    </div>
  )
}

export default Layout
