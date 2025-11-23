import { ElectronAPI } from '@electron-toolkit/preload'

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

export interface DownloadAPI {
  enqueue: (url: string) => Promise<DownloadItem>
  pause: (id: string) => Promise<void>
  resume: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  getDownloads: () => Promise<DownloadItem[]>
  setMaxConcurrent: (max: number) => Promise<void>
  getSettings: () => Promise<Settings>
  setSetting: (key: keyof Settings, value: any) => Promise<void>
  onSettingsUpdate: (callback: (settings: Settings) => void) => () => void
  onUpdate: (callback: (downloads: DownloadItem[]) => void) => () => void
  onProgress: (callback: (data: { id: string; downloadedBytes: number; totalBytes: number }) => void) => () => void
  getSystemTheme: () => Promise<'light' | 'dark'>
  onSystemThemeChanged: (callback: (theme: 'light' | 'dark') => void) => () => void
  onLinkCaptured: (callback: (link: { url: string; type: string; timestamp: number }) => void) => () => void
  acceptCapturedLink: (url: string) => Promise<void>
  dismissCapturedLink: (url: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DownloadAPI
  }
}
