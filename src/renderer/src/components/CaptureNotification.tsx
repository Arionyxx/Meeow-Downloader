import React, { useEffect, useState } from 'react'
import './CaptureNotification.css'

interface DetectedLink {
  url: string
  type: string
  timestamp: number
}

const CaptureNotification: React.FC = () => {
  const [detectedLink, setDetectedLink] = useState<DetectedLink | null>(null)

  useEffect(() => {
    const removeListener = window.api.onLinkCaptured((link) => {
      setDetectedLink(link)
    })
    return () => removeListener()
  }, [])

  if (!detectedLink) return null

  const handleAccept = async () => {
    await window.api.acceptCapturedLink(detectedLink.url)
    setDetectedLink(null)
  }

  const handleDismiss = async () => {
    await window.api.dismissCapturedLink(detectedLink.url)
    setDetectedLink(null)
  }

  return (
    <div className="capture-notification">
      <div className="capture-content">
        <div className="capture-title">
          Link Detected
          <span style={{ fontSize: '0.8rem', color: 'var(--cat-accent)' }}>{detectedLink.type}</span>
        </div>
        <div className="capture-url" title={detectedLink.url}>
          {detectedLink.url}
        </div>
      </div>
      <div className="capture-actions">
        <button onClick={handleDismiss} className="btn-dismiss">Ignore</button>
        <button onClick={handleAccept} className="btn-accept">Add to Queue</button>
      </div>
    </div>
  )
}

export default CaptureNotification
