import Store from 'electron-store'
import { app } from 'electron'

export interface Settings {
  defaultDownloadDirectory: string
  maxConcurrentDownloads: number
  enableNotifications: boolean
  themeMode: 'light' | 'dark' | 'system'
  autoCaptureEnabled: boolean
  autoCaptureSources: ('clipboard' | 'magnet')[]
}

const schema: Store.Schema<Settings> = {
  defaultDownloadDirectory: {
    type: 'string',
    default: app.getPath('downloads')
  },
  maxConcurrentDownloads: {
    type: 'number',
    minimum: 1,
    maximum: 10,
    default: 3
  },
  enableNotifications: {
    type: 'boolean',
    default: true
  },
  themeMode: {
    type: 'string',
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  autoCaptureEnabled: {
    type: 'boolean',
    default: true
  },
  autoCaptureSources: {
    type: 'array',
    items: {
      type: 'string',
      enum: ['clipboard', 'magnet']
    },
    default: ['clipboard', 'magnet']
  }
}

export const store = new Store<Settings>({ schema })
