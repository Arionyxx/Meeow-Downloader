import React from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: string
  action?: React.ReactNode
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "No downloads yet", 
  message = "Feed me some URLs to start downloading!",
  icon = "📦",
  action
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export default EmptyState
