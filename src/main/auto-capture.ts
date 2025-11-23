import { clipboard, BrowserWindow } from 'electron'
import { store } from './store'
import { DownloadManager } from './download-manager'

export class LinkCaptureService {
  private intervalId: NodeJS.Timeout | null = null
  private lastCapturedText: string = ''
  private dismissedLinks: Set<string> = new Set()
  private downloadManager: DownloadManager

  constructor(downloadManager: DownloadManager) {
    this.downloadManager = downloadManager
    this.startIfEnabled()

    store.onDidChange('autoCaptureEnabled', (newValue) => {
      if (newValue) {
        this.start()
      } else {
        this.stop()
      }
    })
  }

  private startIfEnabled(): void {
    if (store.get('autoCaptureEnabled')) {
      this.start()
    }
  }

  public start(): void {
    if (this.intervalId) return
    this.lastCapturedText = clipboard.readText() // Ignore what's currently there to avoid immediate trigger on startup
    this.intervalId = setInterval(() => this.checkClipboard(), 1000)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private checkClipboard(): void {
    const text = clipboard.readText()
    if (!text || text === this.lastCapturedText) return

    this.lastCapturedText = text

    if (this.dismissedLinks.has(text)) return

    const sources = store.get('autoCaptureSources') || []
    let detected = false
    let type = ''

    if (sources.includes('magnet') && text.startsWith('magnet:?')) {
      detected = true
      type = 'magnet'
    } else if (sources.includes('clipboard') && this.isValidUrl(text)) {
      detected = true
      type = 'url'
    }

    if (detected) {
      this.notifyRenderers(text, type)
    }
  }

  private isValidUrl(text: string): boolean {
    try {
      const url = new URL(text)
      return ['http:', 'https:', 'ftp:'].includes(url.protocol)
    } catch {
      return false
    }
  }

  private notifyRenderers(url: string, type: string): void {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('capture:detected', { url, type, timestamp: Date.now() })
    })
  }

  public accept(url: string): void {
    this.downloadManager.enqueue(url)
  }

  public dismiss(url: string): void {
    this.dismissedLinks.add(url)
  }
}
