import React from 'react'
import DownloadCard from './DownloadCard'
import type { DownloadItem } from '../types'

interface DownloadListProps {
  downloads: DownloadItem[]
}

const DownloadList: React.FC<DownloadListProps> = ({ downloads }) => {
  if (downloads.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: 'var(--cat-text-secondary)',
        backgroundColor: 'var(--cat-bg-secondary)',
        borderRadius: 'var(--cat-radius)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>😿</div>
        <p>No downloads yet. Feed me some URLs!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {downloads.map((item) => (
        <DownloadCard key={item.id} item={item} />
      ))}
    </div>
  )
}

export default DownloadList
