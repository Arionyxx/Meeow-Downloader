import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
import { EventEmitter } from 'events'
import { IncomingMessage } from 'http'
import { randomUUID } from 'crypto'

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

export class DownloadManager extends EventEmitter {
  private queue: DownloadItem[] = []
  private activeDownloads: Map<string, http.ClientRequest> = new Map()
  private maxConcurrentDownloads: number = 3
  private storePath: string
  private defaultDownloadDir: string

  constructor() {
    super()
    this.storePath = path.join(app.getPath('userData'), 'downloads.json')
    this.defaultDownloadDir = app.getPath('downloads')
    this.loadState()
  }

  public getDownloads(): DownloadItem[] {
    return [...this.queue]
  }

  public enqueue(url: string, directory: string = this.defaultDownloadDir): DownloadItem {
    const filename = path.basename(new URL(url).pathname) || `download-${Date.now()}`
    const item: DownloadItem = {
      id: randomUUID(),
      url,
      filename,
      directory,
      status: 'pending',
      totalBytes: 0,
      downloadedBytes: 0,
      resumable: false,
      createdDate: Date.now()
    }

    this.queue.push(item)
    this.saveState()
    this.emit('updated', this.queue)
    this.processQueue()
    return item
  }

  public pause(id: string): void {
    const item = this.queue.find((i) => i.id === id)
    if (item && item.status === 'downloading') {
      const req = this.activeDownloads.get(id)
      if (req) {
        req.destroy()
        this.activeDownloads.delete(id)
      }
      item.status = 'paused'
      this.saveState()
      this.emit('updated', this.queue)
      this.processQueue()
    }
  }

  public resume(id: string): void {
    const item = this.queue.find((i) => i.id === id)
    if (item && (item.status === 'paused' || item.status === 'error')) {
      item.status = 'pending'
      this.saveState()
      this.emit('updated', this.queue)
      this.processQueue()
    }
  }

  public cancel(id: string): void {
    const item = this.queue.find((i) => i.id === id)
    if (item) {
      if (item.status === 'downloading') {
        const req = this.activeDownloads.get(id)
        if (req) {
          req.destroy()
          this.activeDownloads.delete(id)
        }
      }

      // Remove temporary file
      const tempPath = path.join(item.directory, `${item.filename}.tmp`)
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }

      item.status = 'cancelled'
      this.saveState()
      this.emit('updated', this.queue)
      this.processQueue()
    }
  }

  public setMaxConcurrentDownloads(max: number): void {
    this.maxConcurrentDownloads = max
    this.processQueue()
  }

  public setDefaultDownloadDirectory(dir: string): void {
    this.defaultDownloadDir = dir
  }

  private processQueue(): void {
    const downloadingCount = this.queue.filter((i) => i.status === 'downloading').length
    if (downloadingCount >= this.maxConcurrentDownloads) {
      return
    }

    const pendingItem = this.queue.find((i) => i.status === 'pending')
    if (pendingItem) {
      this.startDownload(pendingItem)
    }
  }

  private startDownload(item: DownloadItem): void {
    item.status = 'downloading'
    this.emit('updated', this.queue)

    const tempPath = path.join(item.directory, `${item.filename}.tmp`)
    const targetPath = path.join(item.directory, item.filename)

    const fileMode = item.downloadedBytes > 0 ? 'a' : 'w'
    const fileStream = fs.createWriteStream(tempPath, { flags: fileMode })

    const options: https.RequestOptions = {
      headers: {}
    }

    if (item.downloadedBytes > 0) {
      options.headers!['Range'] = `bytes=${item.downloadedBytes}-`
    }

    const protocol = item.url.startsWith('https') ? https : http

    const req = protocol.get(item.url, options, (res: IncomingMessage) => {
      if (res.statusCode === 200) {
        // New download or server doesn't support ranges
        if (item.downloadedBytes > 0) {
          // We requested a range but got 200, so we restart
          item.downloadedBytes = 0
          // Need to recreate stream to overwrite
          // But we can't easily change the stream here without closing.
          // Actually 'w' mode would have been appropriate if we knew.
          // Since we used 'a', we might have an issue if we simply write.
          // However, if we get 200, it means we are getting the whole file.
          // We should truncate the file.
          fs.truncateSync(tempPath, 0)
        }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        item.totalBytes = total
        item.resumable = res.headers['accept-ranges'] === 'bytes'
      } else if (res.statusCode === 206) {
        // Partial content
        const contentRange = res.headers['content-range']
        if (contentRange) {
          const match = contentRange.match(/bytes \d+-\d+\/(\d+)/)
          if (match) {
            item.totalBytes = parseInt(match[1], 10)
          }
        }
        item.resumable = true
      } else {
        item.status = 'error'
        item.error = `HTTP Error: ${res.statusCode}`
        this.activeDownloads.delete(item.id)
        this.saveState()
        this.emit('updated', this.queue)
        this.processQueue()
        return
      }

      res.on('data', (chunk) => {
        fileStream.write(chunk)
        item.downloadedBytes += chunk.length
        this.emit('progress', { id: item.id, downloadedBytes: item.downloadedBytes, totalBytes: item.totalBytes })
      })

      res.on('end', () => {
        fileStream.end()
        this.activeDownloads.delete(item.id)

        if (item.status === 'downloading') {
          if (item.totalBytes > 0 && item.downloadedBytes < item.totalBytes) {
            // Incomplete download
            item.status = 'error'
            item.error = 'Download incomplete'
          } else {
            // Rename file
            fs.rename(tempPath, targetPath, (err) => {
              if (err) {
                item.status = 'error'
                item.error = err.message
              } else {
                item.status = 'completed'
              }
              this.saveState()
              this.emit('updated', this.queue)
              this.processQueue()
            })
            return
          }
          this.saveState()
          this.emit('updated', this.queue)
          this.processQueue()
        }
      })

      res.on('error', (err) => {
        fileStream.end()
        this.activeDownloads.delete(item.id)
        if (item.status === 'downloading') {
          item.status = 'error'
          item.error = err.message
          this.saveState()
          this.emit('updated', this.queue)
          this.processQueue()
        }
      })
    })

    req.on('error', (err) => {
      fileStream.end()
      this.activeDownloads.delete(item.id)
      if (item.status === 'downloading') {
        item.status = 'error'
        item.error = err.message
        this.saveState()
        this.emit('updated', this.queue)
        this.processQueue()
      }
    })

    this.activeDownloads.set(item.id, req)
  }

  private saveState(): void {
    try {
      const state: DownloadState = {
        queue: this.queue.map((item) => {
          // Don't save 'downloading' status, revert to 'pending' or 'paused'
          // actually, if it is downloading and we quit, it effectively becomes paused (or pending)
          // Let's save it as 'paused' if it was downloading, so the user can resume it manually or auto-resume
          const savedStatus = item.status === 'downloading' ? 'paused' : item.status
          return { ...item, status: savedStatus }
        })
      }
      fs.writeFileSync(this.storePath, JSON.stringify(state, null, 2))
    } catch (error) {
      console.error('Failed to save download state:', error)
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf-8')
        const state: DownloadState = JSON.parse(data)
        this.queue = state.queue
      }
    } catch (error) {
      console.error('Failed to load download state:', error)
    }
  }
}
