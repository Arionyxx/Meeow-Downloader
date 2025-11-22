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

export interface DownloadAPI {
  enqueue: (url: string) => Promise<DownloadItem>
  pause: (id: string) => Promise<void>
  resume: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  getDownloads: () => Promise<DownloadItem[]>
  setMaxConcurrent: (max: number) => Promise<void>
  onUpdate: (callback: (downloads: DownloadItem[]) => void) => () => void
  onProgress: (callback: (data: { id: string; downloadedBytes: number; totalBytes: number }) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DownloadAPI
  }
}
