export type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error'
  | 'seeding'
  | 'checking'

export interface DownloadItem {
  id: string
  url?: string
  filename?: string
  name?: string
  directory: string
  status: DownloadStatus
  totalBytes: number
  downloadedBytes: number
  resumable?: boolean
  error?: string
  createdDate: number
  // Unified fields
  kind?: 'http' | 'torrent'
  magnetURI?: string
  filePath?: string
  peers?: number
  uploadSpeed?: number
  downloadSpeed?: number
  progress?: number
  infoHash?: string
  isSeeding?: boolean
}

export interface Settings {
  defaultDownloadDirectory: string
  maxConcurrentDownloads: number
  enableNotifications: boolean
  themeMode: 'light' | 'dark' | 'system'
  autoCaptureEnabled: boolean
  autoCaptureSources: ('clipboard' | 'magnet')[]
  torrentDownloadDirectory: string
  torrentSeedingEnabled: boolean
}
