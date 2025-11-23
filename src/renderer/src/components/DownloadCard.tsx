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

  // Placeholders for metadata not available in the current model
  const speed = status === 'downloading' ? '2.5 MB/s' : '--'
  const eta = status === 'downloading' ? '5 mins' : '--'

  const handlePause = () => window.api.pause(id)
  const handleResume = () => window.api.resume(id)
  const handleCancel = () => window.api.cancel(id)

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'Downloading'
      case 'completed':
        return 'Completed'
      case 'paused':
        return 'Paused'
      case 'cancelled':
        return 'Cancelled'
      case 'error':
        return 'Error'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

  return (
    <div className="common-card download-card">
      <div className="card-top-row">
        <div className="file-icon">📄</div>
        <div className="file-details">
          <h3 className="file-name" title={filename}>
            {filename || 'Unknown File'}
          </h3>
          <a href={url} className="file-url" title={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </div>
        <div className={`status-pill status-${status}`}>{getStatusLabel(status)}</div>
      </div>

      <div className="progress-section">
        <div className="progress-info">
          <span className="data-transferred">
            {formatBytes(downloadedBytes)} / {totalBytes ? formatBytes(totalBytes) : '...'}
          </span>
          <span className="percentage">{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="meta-row">
          <div className="meta-item">
            <span className="meta-label">Speed</span>
            <span className="meta-value">{speed}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">ETA</span>
            <span className="meta-value">{eta}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        {status === 'downloading' && (
          <button className="common-btn common-btn-secondary" onClick={handlePause} title="Pause">
            ⏸ Pause
          </button>
        )}
        {status === 'paused' && (
          <button className="common-btn common-btn-primary" onClick={handleResume} title="Resume">
            ▶ Resume
          </button>
        )}
        {(status === 'downloading' || status === 'paused' || status === 'pending') && (
          <button className="common-btn common-btn-danger" onClick={handleCancel} title="Cancel">
            ✕ Cancel
          </button>
        )}
        {status === 'completed' && (
          <button className="common-btn common-btn-primary" disabled>
            Open Folder
          </button>
        )}
        {status === 'error' && <span className="error-text">Download failed</span>}
      </div>
    </div>
  )
}

export default DownloadCard
