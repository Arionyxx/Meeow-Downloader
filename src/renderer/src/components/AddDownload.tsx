import React, { useState } from 'react'
import './AddDownload.css'

const AddDownload: React.FC = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      await window.api.enqueue(url)
      setUrl('')
    } catch (error) {
      console.error('Failed to add download:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="add-download" onSubmit={handleSubmit}>
      <input
        type="url"
        className="url-input"
        placeholder="Paste URL to download (e.g. https://...)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button type="submit" className="btn-add" disabled={loading}>
        {loading ? 'Adding...' : '+ Add Download'}
      </button>
    </form>
  )
}

export default AddDownload
