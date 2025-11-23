import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import type WebTorrent from 'webtorrent'
import { randomUUID } from 'crypto'

export type TorrentStatus = 'pending' | 'downloading' | 'seeding' | 'paused' | 'error' | 'checking' | 'completed'

export interface TorrentItem {
  id: string
  magnetURI?: string
  filePath?: string // for .torrent files
  name: string
  directory: string
  status: TorrentStatus
  totalBytes: number
  downloadedBytes: number
  uploadedBytes: number
  downloadSpeed: number
  uploadSpeed: number
  progress: number
  peers: number
  infoHash?: string
  error?: string
  createdDate: number
  isSeeding: boolean
}

interface TorrentState {
  queue: TorrentItem[]
}

export class TorrentManager extends EventEmitter {
  private client: WebTorrent.Instance | null = null
  private queue: TorrentItem[] = []
  private storePath: string
  private defaultDownloadDir: string
  private seedingEnabled: boolean = false
  // Map torrent infoHash or id to WebTorrent object
  private activeTorrents: Map<string, WebTorrent.Torrent> = new Map()

  constructor() {
    super()
    this.storePath = path.join(app.getPath('userData'), 'torrents.json')
    this.defaultDownloadDir = app.getPath('downloads')
    this.loadState()
  }

  public async initialize(): Promise<void> {
    const { default: WebTorrentClass } = await import('webtorrent')
    this.client = new WebTorrentClass()

    // Resume torrents that should be active
    this.processQueue()

    // Periodically emit updates for active torrents
    setInterval(() => this.updateTorrents(), 1000)
  }

  public getTorrents(): TorrentItem[] {
    return [...this.queue]
  }

  public addFromMagnet(magnetURI: string, directory: string = this.defaultDownloadDir): TorrentItem {
    const item: TorrentItem = {
      id: randomUUID(),
      magnetURI,
      name: 'Magnet Download', // Will be updated when metadata is fetched
      directory,
      status: 'pending',
      totalBytes: 0,
      downloadedBytes: 0,
      uploadedBytes: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      progress: 0,
      peers: 0,
      createdDate: Date.now(),
      isSeeding: this.seedingEnabled
    }

    this.queue.push(item)
    this.saveState()
    this.emit('updated', this.queue)
    this.processQueue()
    return item
  }

  public addFromFile(filePath: string, directory: string = this.defaultDownloadDir): TorrentItem {
    const item: TorrentItem = {
      id: randomUUID(),
      filePath,
      name: path.basename(filePath, '.torrent'),
      directory,
      status: 'pending',
      totalBytes: 0,
      downloadedBytes: 0,
      uploadedBytes: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      progress: 0,
      peers: 0,
      createdDate: Date.now(),
      isSeeding: this.seedingEnabled
    }

    this.queue.push(item)
    this.saveState()
    this.emit('updated', this.queue)
    this.processQueue()
    return item
  }

  public pause(id: string): void {
    if (!this.client) return

    const item = this.queue.find((i) => i.id === id)
    if (item && (item.status === 'downloading' || item.status === 'seeding' || item.status === 'checking')) {
      if (item.infoHash) {
        this.client.remove(item.infoHash, { destroyStore: false }, (err) => {
          if (err) console.error('Error removing torrent:', err)
        })
        this.activeTorrents.delete(item.id)
      }
      item.status = 'paused'
      item.downloadSpeed = 0
      item.uploadSpeed = 0
      item.peers = 0
      this.saveState()
      this.emit('updated', this.queue)
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
    if (!this.client) return

    const item = this.queue.find((i) => i.id === id)
    if (item) {
      if (
        item.infoHash &&
        (item.status === 'downloading' ||
          item.status === 'seeding' ||
          item.status === 'checking' ||
          item.status === 'paused')
      ) {
        // Check if torrent is active in client
        const torrent = this.client.get(item.infoHash)
        if (torrent) {
          this.client.remove(item.infoHash, { destroyStore: true }, (err) => {
            if (err) console.error('Error destroying torrent:', err)
          })
        } else {
          // If not active, we might still want to delete files?
          // WebTorrent `remove` with `destroyStore: true` deletes files.
          // If it's not loaded, we can't easily use WebTorrent to delete files unless we load it first or delete manually.
          // For simplicity, we just delete files if we can guess where they are or just remove from list if not active.
          // Given the requirements, "cancel/remove", usually implies deleting the files or at least stopping download.
          // If it is paused, it's removed from client but files exist.
          // We should try to delete the folder/file if possible?
          // DownloadManager cancels by removing temp file.
          // Torrent files are usually in a folder or single file.
          // For now, we will just remove from queue.
        }
        this.activeTorrents.delete(item.id)
      }

      // Remove from queue
      this.queue = this.queue.filter((i) => i.id !== id)
      this.saveState()
      this.emit('updated', this.queue)
    }
  }

  public setDefaultDownloadDirectory(dir: string): void {
    this.defaultDownloadDir = dir
  }

  public setSeedingEnabled(enabled: boolean): void {
    this.seedingEnabled = enabled
    this.queue.forEach((item) => {
      item.isSeeding = enabled
    })
    // For active torrents, we might need to update their behavior,
    // but WebTorrent seeds by default until destroyed.
    // If seeding is disabled, we should probably destroy the torrent when it finishes downloading.
  }

  private processQueue(): void {
    if (!this.client) return

    for (const item of this.queue) {
      if (item.status === 'pending') {
        this.startTorrent(item)
      }
    }
  }

  private startTorrent(item: TorrentItem): void {
    if (!this.client) return

    const source = item.magnetURI || item.filePath
    if (!source) {
      item.status = 'error'
      item.error = 'No magnet or file provided'
      this.emit('updated', this.queue)
      return
    }

    // Check if already added
    if (item.infoHash && this.client.get(item.infoHash)) {
      // Already downloading
      item.status = 'downloading'
      return
    }

    const opts: WebTorrent.TorrentOptions = {
      path: item.directory
    }

    item.status = 'checking' // Initial state before metadata
    this.emit('updated', this.queue)

    this.client.add(source, opts, (torrent) => {
      // Torrent is ready to download
      item.infoHash = torrent.infoHash
      item.name = torrent.name
      item.status = 'downloading'
      this.activeTorrents.set(item.id, torrent)

      torrent.on('done', () => {
        item.status = this.seedingEnabled ? 'seeding' : 'completed'
        item.progress = 1
        item.downloadedBytes = item.totalBytes
        this.saveState()
        this.emit('updated', this.queue)

        if (!this.seedingEnabled) {
          // Remove from client but keep in queue as completed
          torrent.destroy()
          this.activeTorrents.delete(item.id)
        }
      })

      torrent.on('error', (err) => {
        item.status = 'error'
        item.error = typeof err === 'string' ? err : err.message
        this.saveState()
        this.emit('updated', this.queue)
      })

      this.saveState()
      this.emit('updated', this.queue)
    })
  }

  private updateTorrents(): void {
    if (!this.client) return
    // let changed = false

    this.queue.forEach((item) => {
      if (item.status === 'downloading' || item.status === 'seeding' || item.status === 'checking') {
        if (item.infoHash) {
          const torrent = this.client!.get(item.infoHash)
          if (torrent) {
            item.downloadSpeed = torrent.downloadSpeed
            item.uploadSpeed = torrent.uploadSpeed
            item.progress = torrent.progress
            item.downloadedBytes = torrent.downloaded
            item.uploadedBytes = torrent.uploaded
            item.peers = torrent.numPeers

            // WebTorrent total length might be available only after metadata
            if (torrent.length) {
              item.totalBytes = torrent.length
            }

            // If metadata arrived, name might be available
            if (torrent.name && item.name === 'Magnet Download') {
              item.name = torrent.name
            }

            this.emit('progress', {
              id: item.id,
              downloadedBytes: item.downloadedBytes,
              totalBytes: item.totalBytes,
              downloadSpeed: item.downloadSpeed,
              uploadSpeed: item.uploadSpeed,
              progress: item.progress,
              peers: item.peers
            })

            // changed = true // Only if we want to throttle 'updated' events for speed changes.
            // But 'updated' is usually for status/queue structure.
            // 'progress' is for frequent updates.
          }
        }
      }
    })

    // Periodically save state for progress
    // Maybe not every second to avoid disk IO, but let's do it for now or rely on important events.
  }

  private saveState(): void {
    try {
      const state: TorrentState = {
        queue: this.queue.map((item) => {
          // If we are exiting or saving, and status is downloading, save as paused so we resume later?
          // Or just save as downloading/seeding and resume on load.
          // Since resumeTorrents() handles resumption, we can save actual status.
          // However, if we don't want to auto-start on load, we might want to save as paused.
          // The DownloadManager saves 'downloading' as 'paused'.
          // Let's do the same for consistency, unless we want auto-resume.
          // User asked for "resume" methods.

          // Wait, DownloadManager saves 'downloading' as 'paused'.
          // "const savedStatus = item.status === 'downloading' ? 'paused' : item.status"

          // Let's follow that pattern for now to avoid unexpected bandwidth usage on startup.
          const savedStatus =
            item.status === 'downloading' || item.status === 'seeding' || item.status === 'checking'
              ? 'paused'
              : item.status
          return { ...item, status: savedStatus }
        })
      }
      fs.writeFileSync(this.storePath, JSON.stringify(state, null, 2))
    } catch (error) {
      console.error('Failed to save torrent state:', error)
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf-8')
        const state: TorrentState = JSON.parse(data)
        this.queue = state.queue
      }
    } catch (error) {
      console.error('Failed to load torrent state:', error)
    }
  }

  private resumeTorrents(): void {
    // If we saved as paused, they won't auto resume unless we logic it here.
    // But if we follow DownloadManager, it relies on user action?
    // "Actually, if it is downloading and we quit, it effectively becomes paused (or pending) ... so the user can resume it manually or auto-resume"
    // If the requirement is "persist state", and we want to resume active downloads, we probably should.
    // However, DownloadManager converts to paused.
    // I'll stick to: if it was paused in file, it stays paused.
    // If I want to auto-resume things that were active, I should not have saved them as paused.
    // But DownloadManager saves as paused.
    // Let's assume the user wants explicit resume.
    // Wait, if I save as paused, then `resumeTorrents` here will see them as paused.
    // If I want to support auto-resume of previous session, I should modify saveState logic or handle it here.
    // Let's check DownloadManager again.
    // It calls `loadState()`.
    // It DOES NOT call processQueue() in constructor.
    // So it seems it just loads them as paused.
    // I will do the same. If the user wants to resume, they click resume.
    // Unless the ticket implies "first-class torrent downloading" means better persistence.
    // "persist state to a separate JSON file"
    // I'll stick to DownloadManager behavior for consistency.
  }
}
