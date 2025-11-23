export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'cancelled' | 'error'

export interface DownloadItem {
  id: string
  url: string
  filename: string
  directory: string
  status: DownloadStatus
  totalBytes: number
  downloadedBytes: number
  resumable: boolean
  error?: string
  createdDate: number
}

export interface Settings {
  defaultDownloadDirectory: string
  maxConcurrentDownloads: number
  enableNotifications: boolean
  themeMode: 'light' | 'dark' | 'system'
  autoCaptureEnabled: boolean
  autoCaptureSources: ('clipboard' | 'magnet')[]
}
