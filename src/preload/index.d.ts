import { ElectronAPI } from '@electron-toolkit/preload'

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
  magnetURI?: string
  filePath?: string
  filename?: string
  name?: string
  directory: string
  status: DownloadStatus
  totalBytes: number
  downloadedBytes: number
  uploadedBytes?: number
  downloadSpeed?: number
  uploadSpeed?: number
  progress?: number
  peers?: number
  infoHash?: string
  resumable?: boolean
  error?: string
  createdDate: number
  kind?: 'http' | 'torrent'
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

export interface TaskProgress {
  id: string
  downloadedBytes: number
  totalBytes: number
  downloadSpeed?: number
  uploadSpeed?: number
  progress?: number
  peers?: number
  kind: 'http' | 'torrent'
}

export interface DownloadAPI {
  enqueue: (url: string) => Promise<DownloadItem>
  pause: (id: string) => Promise<void>
  resume: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  getDownloads: () => Promise<DownloadItem[]>
  setMaxConcurrent: (max: number) => Promise<void>
  getSettings: () => Promise<Settings>
  setSetting: (key: keyof Settings, value: unknown) => Promise<void>
  onSettingsUpdate: (callback: (settings: Settings) => void) => () => void
  onUpdate: (callback: (downloads: DownloadItem[]) => void) => () => void
  onProgress: (callback: (data: { id: string; downloadedBytes: number; totalBytes: number }) => void) => () => void
  getSystemTheme: () => Promise<'light' | 'dark'>
  onSystemThemeChanged: (callback: (theme: 'light' | 'dark') => void) => () => void
  onLinkCaptured: (callback: (link: { url: string; type: string; timestamp: number }) => void) => () => void
  acceptCapturedLink: (url: string) => Promise<void>
  dismissCapturedLink: (url: string) => Promise<void>

  // Unified Task API
  getAllTasks: () => Promise<DownloadItem[]>
  pauseTask: (id: string) => Promise<void>
  resumeTask: (id: string) => Promise<void>
  cancelTask: (id: string) => Promise<void>
  addMagnet: (magnet: string) => Promise<DownloadItem>
  addTorrentFile: (filePath: string) => Promise<DownloadItem>
  onTasksUpdate: (callback: (tasks: DownloadItem[]) => void) => () => void
  onTaskProgress: (callback: (data: TaskProgress) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DownloadAPI
  }
}
