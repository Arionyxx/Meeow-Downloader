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
  onUpdate: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('download:updated', subscription)
    return () => ipcRenderer.removeListener('download:updated', subscription)
  },
  onProgress: (callback) => {
    const subscription = (_event, value) => callback(value)
    ipcRenderer.on('download:progress', subscription)
    return () => ipcRenderer.removeListener('download:progress', subscription)
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
