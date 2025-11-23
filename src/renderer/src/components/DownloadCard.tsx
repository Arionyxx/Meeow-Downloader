import React from 'react'
import type { DownloadItem } from '../types'
import './DownloadCard.css'

interface DownloadCardProps {
  item: DownloadItem
}

const DownloadCard: React.FC<DownloadCardProps> = ({ item }) => {
  const { id, status, downloadedBytes, totalBytes, kind } = item
  
  const filename = kind === 'torrent' ? (item.name || 'Unknown Torrent') : (item.filename || 'Unknown File')
  const url = kind === 'http' ? item.url : item.magnetURI

  const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSec?: number) => {
      if (!bytesPerSec) return '0 B/s'
      return formatBytes(bytesPerSec) + '/s'
  }

  // Placeholders for metadata not available in the current model
  // Note: App.tsx updates these fields now.
  const downloadSpeed = item.downloadSpeed ? formatSpeed(item.downloadSpeed) : (status === 'downloading' ? '--' : '0 B/s')
  const uploadSpeed = kind === 'torrent' && item.uploadSpeed ? formatSpeed(item.uploadSpeed) : null
  
  // Simple ETA calculation if we wanted to add it, but for now kept simple or '--'
  const eta = '--' 

  const handlePause = () => window.api.pauseTask(id)
  const handleResume = () => window.api.resumeTask(id)
  const handleCancel = () => window.api.cancelTask(id)

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
      case 'seeding':
        return 'Seeding'
      case 'checking':
        return 'Checking'
      default:
        return status
    }
  }

  return (
    <div className={`common-card download-card ${kind === 'torrent' ? 'torrent-card' : ''}`}>
      <div className="card-top-row">
        <div className="file-icon">{kind === 'torrent' ? '🔗' : '📄'}</div>
        <div className="file-details">
          <h3 className="file-name" title={filename}>
            {filename}
          </h3>
          <div className="file-url" title={url}>
            {url}
          </div>
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
            <span className="meta-label">DL Speed</span>
            <span className="meta-value">{downloadSpeed}</span>
          </div>
          {kind === 'torrent' && (
            <>
               <div className="meta-item">
                <span className="meta-label">UL Speed</span>
                <span className="meta-value">{uploadSpeed || '0 B/s'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Peers</span>
                <span className="meta-value">{item.peers || 0}</span>
              </div>
            </>
          )}
          {kind !== 'torrent' && (
            <div className="meta-item">
                <span className="meta-label">ETA</span>
                <span className="meta-value">{eta}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-actions">
        {status === 'downloading' && (
          <button className="common-btn common-btn-secondary" onClick={handlePause} title="Pause">
            ⏸ Pause
          </button>
        )}
        {(status === 'paused' || status === 'error') && (
          <button className="common-btn common-btn-primary" onClick={handleResume} title="Resume">
            ▶ Resume
          </button>
        )}
        {status === 'seeding' && (
             <button className="common-btn common-btn-danger" onClick={handleCancel} title="Stop Seeding">
             ⏹ Stop Seeding
           </button>
        )}
        {(status === 'downloading' || status === 'paused' || status === 'pending' || status === 'checking') && (
          <button className="common-btn common-btn-danger" onClick={handleCancel} title="Cancel">
            ✕ Cancel
          </button>
        )}
        {status === 'completed' && kind !== 'torrent' && (
          <button className="common-btn common-btn-primary" disabled>
            Open Folder
          </button>
        )}
         {status === 'completed' && kind === 'torrent' && !item.isSeeding && (
          <button className="common-btn common-btn-primary" disabled>
            Open Folder
          </button>
        )}
      </div>
    </div>
  )
}

export default DownloadCard
