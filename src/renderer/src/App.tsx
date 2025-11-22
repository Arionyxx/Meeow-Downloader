import React, { useEffect, useState } from 'react'
import Layout from './components/Layout'
import AddDownload from './components/AddDownload'
import DownloadList from './components/DownloadList'
import type { DownloadItem } from './types'

function App(): JSX.Element {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])

  useEffect(() => {
    // Initial fetch
    window.api.getDownloads().then(setDownloads).catch(console.error)

    // Listen for updates (status changes, new items)
    const removeUpdateListener = window.api.onUpdate((updatedList) => {
      setDownloads(updatedList)
    })

    // Listen for progress
    const removeProgressListener = window.api.onProgress((data) => {
      setDownloads((prev) => {
        return prev.map((item) => {
          if (item.id === data.id) {
            return {
              ...item,
              downloadedBytes: data.downloadedBytes,
              totalBytes: data.totalBytes
            }
          }
          return item
        })
      })
    })

    return () => {
      removeUpdateListener()
      removeProgressListener()
    }
  }, [])

  return (
    <Layout>
      <AddDownload />
      <DownloadList downloads={downloads} />
    </Layout>
  )
}

export default App
