import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  enqueue: (url: string) => ipcRenderer.invoke('download:enqueue', url),
  pause: (id: string) => ipcRenderer.invoke('download:pause', id),
  resume: (id: string) => ipcRenderer.invoke('download:resume', id),
  cancel: (id: string) => ipcRenderer.invoke('download:cancel', id),
  getDownloads: () => ipcRenderer.invoke('download:getAll'),
  setMaxConcurrent: (max: number) => ipcRenderer.invoke('download:setMaxConcurrent', max),
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  onSettingsUpdate: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('settings:updated', subscription)
    return () => ipcRenderer.removeListener('settings:updated', subscription)
  },
  onUpdate: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('download:updated', subscription)
    return () => ipcRenderer.removeListener('download:updated', subscription)
  },
  onProgress: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('download:progress', subscription)
    return () => ipcRenderer.removeListener('download:progress', subscription)
  },
  getSystemTheme: () => ipcRenderer.invoke('theme:getSystem'),
  onSystemThemeChanged: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('theme:systemChanged', subscription)
    return () => ipcRenderer.removeListener('theme:systemChanged', subscription)
  },
  onLinkCaptured: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('capture:detected', subscription)
    return () => ipcRenderer.removeListener('capture:detected', subscription)
  },
  acceptCapturedLink: (url: string) => ipcRenderer.invoke('capture:accept', url),
  dismissCapturedLink: (url: string) => ipcRenderer.invoke('capture:dismiss', url),

  // Task/Unified APIs
  getAllTasks: () => ipcRenderer.invoke('tasks:getAll'),
  pauseTask: (id: string) => ipcRenderer.invoke('tasks:pause', id),
  resumeTask: (id: string) => ipcRenderer.invoke('tasks:resume', id),
  cancelTask: (id: string) => ipcRenderer.invoke('tasks:cancel', id),
  addMagnet: (magnet: string) => ipcRenderer.invoke('tasks:addMagnet', magnet),
  addTorrentFile: (filePath: string) => ipcRenderer.invoke('tasks:addFile', filePath),

  onTasksUpdate: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('tasks:updated', subscription)
    return () => ipcRenderer.removeListener('tasks:updated', subscription)
  },
  onTaskProgress: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('tasks:progress', subscription)
    return () => ipcRenderer.removeListener('tasks:progress', subscription)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
