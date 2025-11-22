import React from 'react'
import type { DownloadItem } from '../types'
import './DownloadCard.css'

interface DownloadCardProps {
  item: DownloadItem
}

const DownloadCard: React.FC<DownloadCardProps> = ({ item }) => {
  const { id, filename, url, status, downloadedBytes, totalBytes } = item

  const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePause = () => window.api.pause(id)
  const handleResume = () => window.api.resume(id)
  const handleCancel = () => window.api.cancel(id)

  return (
    <div className="card">
      <div className="card-header">
        <div className="file-info">
          <span className="filename">{filename || 'Unknown File'}</span>
          <span className="url" title={url}>
            {url}
          </span>
        </div>
        <span className={`status-badge status-${status}`}>{status}</span>
      </div>

      <div className="progress-section">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          <span>
            {formatBytes(downloadedBytes)} / {totalBytes ? formatBytes(totalBytes) : '...'}
          </span>
          <span>{progress.toFixed(1)}%</span>
        </div>
      </div>

      <div className="controls">
        {status === 'downloading' && (
          <button className="btn btn-secondary" onClick={handlePause}>
            ⏸ Pause
          </button>
        )}
        {status === 'paused' && (
          <button className="btn btn-primary" onClick={handleResume}>
            ▶ Resume
          </button>
        )}
        {(status === 'downloading' || status === 'paused' || status === 'pending') && (
          <button className="btn btn-danger" onClick={handleCancel}>
            ✕ Cancel
          </button>
        )}
        {status === 'completed' && (
          <button className="btn btn-primary" disabled>
            ✓ Done
          </button>
        )}
      </div>
    </div>
  )
}

export default DownloadCard
