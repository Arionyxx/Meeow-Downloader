import { app, shell, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DownloadManager } from './download-manager'
import { TorrentManager } from './torrent-manager'
import { LinkCaptureService } from './auto-capture'
import { store } from './store'

let downloadManager: DownloadManager
let torrentManager: TorrentManager
let linkCaptureService: LinkCaptureService

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

  torrentManager = new TorrentManager()
  torrentManager.setDefaultDownloadDirectory(store.get('torrentDownloadDirectory'))
  torrentManager.setSeedingEnabled(store.get('torrentSeedingEnabled'))

  linkCaptureService = new LinkCaptureService(downloadManager)

  // IPC handlers
  ipcMain.handle('settings:get', (_, key) => store.get(key))
  ipcMain.handle('settings:getAll', () => store.store)
  ipcMain.handle('settings:set', (_, key, value) => {
    store.set(key, value)
    if (key === 'maxConcurrentDownloads') {
      downloadManager.setMaxConcurrent(value as number)
    } else if (key === 'defaultDownloadDirectory') {
      downloadManager.setDefaultDownloadDirectory(value as string)
    } else if (key === 'torrentDownloadDirectory') {
      torrentManager.setDefaultDownloadDirectory(value as string)
    } else if (key === 'torrentSeedingEnabled') {
      torrentManager.setSeedingEnabled(value as boolean)
    }

    // Notify windows of settings change
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings:updated', store.store)
    })
  })

  // Theme IPC
  ipcMain.handle('theme:getSystem', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'))

  ipcMain.handle('capture:accept', (_, url) => linkCaptureService.accept(url))
  ipcMain.handle('capture:dismiss', (_, url) => linkCaptureService.dismiss(url))

  nativeTheme.on('updated', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('theme:systemChanged', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    })
  })

  // HTTP Download IPC (Legacy)
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

  // Coordinator & Tasks IPC
  const getAllTasks = () => {
    const downloads = downloadManager.getDownloads().map((d) => ({ ...d, kind: 'http' }))
    const torrents = torrentManager.getTorrents().map((t) => ({ ...t, kind: 'torrent' }))
    return [...downloads, ...torrents].sort((a, b) => b.createdDate - a.createdDate)
  }

  const broadcastTasksUpdate = () => {
    const tasks = getAllTasks()
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('tasks:updated', tasks)
    })
  }

  ipcMain.handle('tasks:getAll', () => getAllTasks())

  ipcMain.handle('tasks:pause', (_, id) => {
    // Try both
    downloadManager.pause(id)
    torrentManager.pause(id)
  })

  ipcMain.handle('tasks:resume', (_, id) => {
    // Try both
    downloadManager.resume(id)
    torrentManager.resume(id)
  })

  ipcMain.handle('tasks:cancel', (_, id) => {
    // Try both
    downloadManager.cancel(id)
    torrentManager.cancel(id)
  })

  ipcMain.handle('tasks:addMagnet', (_, magnet) => torrentManager.addFromMagnet(magnet))
  ipcMain.handle('tasks:addFile', (_, filePath) => torrentManager.addFromFile(filePath))

  downloadManager.on('updated', (downloads) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('download:updated', downloads)
    })
    broadcastTasksUpdate()
  })

  downloadManager.on('progress', (data) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('download:progress', data)
      win.webContents.send('tasks:progress', { ...data, kind: 'http' })
    })
  })

  torrentManager.on('updated', () => {
    broadcastTasksUpdate()
  })

  torrentManager.on('progress', (data) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('tasks:progress', { ...data, kind: 'torrent' })
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
