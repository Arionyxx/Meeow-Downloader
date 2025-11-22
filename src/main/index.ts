import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DownloadManager } from './download-manager'
import { store } from './store'

let downloadManager: DownloadManager

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  downloadManager = new DownloadManager()
  downloadManager.setMaxConcurrent(store.get('maxConcurrentDownloads'))
  downloadManager.setDefaultDownloadDirectory(store.get('defaultDownloadDirectory'))

  // IPC handlers
  ipcMain.handle('settings:get', (_, key) => store.get(key))
  ipcMain.handle('settings:getAll', () => store.store)
  ipcMain.handle('settings:set', (_, key, value) => {
    store.set(key, value)
    if (key === 'maxConcurrentDownloads') {
      downloadManager.setMaxConcurrent(value as number)
    } else if (key === 'defaultDownloadDirectory') {
      downloadManager.setDefaultDownloadDirectory(value as string)
    }

    // Notify windows of settings change
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings:updated', store.store)
    })
  })

  ipcMain.handle('download:enqueue', (_, url) => downloadManager.enqueue(url))
  ipcMain.handle('download:pause', (_, id) => downloadManager.pause(id))
  ipcMain.handle('download:resume', (_, id) => downloadManager.resume(id))
  ipcMain.handle('download:cancel', (_, id) => downloadManager.cancel(id))
  ipcMain.handle('download:getAll', () => downloadManager.getDownloads())
  ipcMain.handle('download:setMaxConcurrent', (_, max) => {
    store.set('maxConcurrentDownloads', max)
    downloadManager.setMaxConcurrent(max)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings:updated', store.store)
    })
  })

  downloadManager.on('updated', (downloads) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('download:updated', downloads)
    })
  })

  downloadManager.on('progress', (data) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('download:progress', data)
    })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
