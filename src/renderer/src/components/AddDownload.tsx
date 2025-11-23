import React, { useState } from 'react'
import './AddDownload.css'

const AddDownload: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'http' | 'torrent'>('http')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateUrl = (value: string): boolean => {
    if (!value) return false
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const validateMagnet = (value: string): boolean => {
    return value.startsWith('magnet:?')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'http') {
        if (!validateUrl(url)) {
          setError('Please enter a valid URL (e.g. https://example.com/file.zip)')
          setLoading(false)
          return
        }
        await window.api.enqueue(url)
      } else {
        if (!validateMagnet(url)) {
          setError('Please enter a valid magnet URI')
          setLoading(false)
          return
        }
        await window.api.addMagnet(url)
      }
      setUrl('')
    } catch (err) {
      console.error('Failed to add download:', err)
      setError('Failed to add download. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilePick = async () => {
    setError(null)
    setLoading(true)
    try {
      const filePath = await window.api.pickTorrentFile()
      if (filePath) {
        await window.api.addTorrentFile(filePath)
        setUrl('')
      }
    } catch (err) {
      console.error('Failed to pick torrent file:', err)
      setError('Failed to add torrent file.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setUrl(val)
    if (error) setError(null)

    // Auto-switch to torrent tab if magnet link is pasted in HTTP tab
    if (activeTab === 'http' && val.trim().startsWith('magnet:?')) {
      setActiveTab('torrent')
    }
  }

  return (
    <div className="common-card add-download-card">
      <div className="card-header">
        <h2 className="card-title">Add New Download</h2>
        <p className="card-caption">
          {activeTab === 'http'
            ? 'Paste a link to start downloading immediately.'
            : 'Add a magnet link or select a torrent file.'}
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'http' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('http')
            setError(null)
          }}
        >
          Direct Download
        </button>
        <button
          className={`tab ${activeTab === 'torrent' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('torrent')
            setError(null)
          }}
        >
          Torrent
        </button>
      </div>

      <form className="add-download-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className={`common-input ${error ? 'input-error' : ''}`}
            placeholder={
              activeTab === 'http'
                ? 'Paste URL to download (e.g. https://...)'
                : 'Paste Magnet URI (magnet:?...)'
            }
            value={url}
            onChange={handleInputChange}
            disabled={loading}
          />
          {error && <div className="validation-message">⚠️ {error}</div>}
        </div>

        {activeTab === 'torrent' && (
          <div className="torrent-inputs">
            <div className="or-divider">OR</div>
            <button
              type="button"
              className="common-btn common-btn-secondary"
              onClick={handleFilePick}
              disabled={loading}
            >
              📂 Choose .torrent file
            </button>
          </div>
        )}

        <div className="form-actions">
          <div className="supported-protocols">
            <span className="protocol-icon">ℹ️</span>
            <span>
              {activeTab === 'http'
                ? 'Supports HTTP, HTTPS, FTP'
                : 'Supports Magnet links, .torrent files'}
            </span>
          </div>
          <button
            type="submit"
            className="common-btn common-btn-primary"
            disabled={loading || !url.trim()}
          >
            {loading ? 'Adding...' : 'Start Download'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddDownload
