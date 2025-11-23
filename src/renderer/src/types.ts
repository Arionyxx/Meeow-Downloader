export type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error'
  | 'seeding'
  | 'checking'

export interface BaseTask {
  id: string
  name?: string
  directory: string
  status: DownloadStatus
  totalBytes: number
  downloadedBytes: number
  downloadSpeed?: number
  uploadSpeed?: number
  resumable?: boolean
  error?: string
  createdDate: number
  progress?: number
  isSeeding?: boolean
}

export interface HttpTask extends BaseTask {
  kind: 'http'
  url: string
  filename?: string
}

export interface TorrentTask extends BaseTask {
  kind: 'torrent'
  magnetURI?: string
  filePath?: string
  infoHash?: string
  peers?: number
}

export type DownloadTask = HttpTask | TorrentTask
export type DownloadItem = DownloadTask

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
