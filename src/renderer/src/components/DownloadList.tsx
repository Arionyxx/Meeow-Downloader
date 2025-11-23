import React from 'react'
import DownloadCard from './DownloadCard'
import EmptyState from './EmptyState'
import type { DownloadItem } from '../types'

interface DownloadListProps {
  downloads: DownloadItem[]
}

const DownloadList: React.FC<DownloadListProps> = ({ downloads }) => {
  if (downloads.length === 0) {
    return <EmptyState icon="😿" />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {downloads.map((item) => (
        <DownloadCard key={item.id} item={item} />
      ))}
    </div>
  )
}

export default DownloadList
