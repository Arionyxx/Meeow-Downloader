import React, { useState } from 'react'
import './AddDownload.css'

const AddDownload: React.FC = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g. https://example.com/file.zip)')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await window.api.enqueue(url)
      setUrl('')
    } catch (err) {
      console.error('Failed to add download:', err)
      setError('Failed to add download. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (error) setError(null)
  }

  return (
    <div className="common-card add-download-card">
      <div className="card-header">
        <h2 className="card-title">Add New Download</h2>
        <p className="card-caption">Paste a link to start downloading immediately.</p>
      </div>
      
      <form className="add-download-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className={`common-input ${error ? 'input-error' : ''}`}
            placeholder="Paste URL to download (e.g. https://...)"
            value={url}
            onChange={handleInputChange}
            disabled={loading}
          />
          {error && <div className="validation-message">⚠️ {error}</div>}
        </div>
        
        <div className="form-actions">
           <div className="supported-protocols">
             <span className="protocol-icon">ℹ️</span>
             <span>Supports HTTP, HTTPS, FTP</span>
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
