import React, { useEffect, useState } from 'react'
import Layout from './components/Layout'
import AddDownload from './components/AddDownload'
import DownloadList from './components/DownloadList'
import SettingsPanel from './components/SettingsPanel'
import CaptureNotification from './components/CaptureNotification'
import type { DownloadItem } from './types'
import { useTheme } from './hooks/useTheme'

function App(): JSX.Element {
  useTheme()
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [view, setView] = useState<'downloads' | 'settings'>('downloads')

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
    <Layout activeView={view} onNavigate={setView}>
      <CaptureNotification />
      {view === 'downloads' ? (
        <>
          <AddDownload />
          <DownloadList downloads={downloads} />
        </>
      ) : (
        <SettingsPanel />
      )}
    </Layout>
  )
}

export default App
