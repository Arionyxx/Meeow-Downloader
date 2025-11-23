import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

// Mock Electron
vi.mock('electron', () => {
  return {
    app: {
      getPath: vi.fn((name) => {
        if (name === 'userData') return '/tmp/userdata'
        if (name === 'downloads') return '/tmp/downloads'
        return '/tmp'
      })
    }
  }
})

// Mock fs
vi.mock('fs', () => {
  return {
    existsSync: vi.fn(() => false),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    default: {
      existsSync: vi.fn(() => false),
      writeFileSync: vi.fn(),
      readFileSync: vi.fn()
    }
  }
})

// Mock WebTorrent
const mockTorrent = new EventEmitter()
let destroyMock = vi.fn()

// @ts-expect-error - mock properties
mockTorrent.infoHash = 'test-info-hash'
// @ts-expect-error - mock properties
mockTorrent.name = 'Test Torrent'
// @ts-expect-error - mock properties
mockTorrent.progress = 0
// @ts-expect-error - mock properties
mockTorrent.downloaded = 0
// @ts-expect-error - mock properties
mockTorrent.uploaded = 0
// @ts-expect-error - mock properties
mockTorrent.numPeers = 0
// @ts-expect-error - mock properties
mockTorrent.destroy = (...args: unknown[]) => destroyMock(...args)
// @ts-expect-error - mock properties
mockTorrent.length = 1000
// @ts-expect-error - mock properties
mockTorrent.downloadSpeed = 100
// @ts-expect-error - mock properties
mockTorrent.uploadSpeed = 50

const mockClient = {
  add: vi.fn((source, opts, cb) => {
    if (cb) process.nextTick(() => cb(mockTorrent))
    return mockTorrent
  }),
  get: vi.fn((infoHash) => {
    if (infoHash === 'test-info-hash') return mockTorrent
    return null
  }),
  remove: vi.fn((infoHash, opts, cb) => {
    if (cb) cb(null)
  }),
  destroy: vi.fn()
}

vi.mock('webtorrent', () => {
  return {
    default: class WebTorrent {
      constructor() {
        return mockClient
      }
    }
  }
})

import { TorrentManager } from './torrent-manager'

describe('TorrentManager', () => {
  let manager: TorrentManager

  beforeEach(async () => {
    vi.clearAllMocks()
    mockTorrent.removeAllListeners()
    destroyMock = vi.fn()
    manager = new TorrentManager()
    await manager.initialize()
  })

  it('should enqueue a magnet link', async () => {
    const item = manager.addFromMagnet('magnet:?xt=urn:btih:test')
    expect(item.magnetURI).toBe('magnet:?xt=urn:btih:test')
    expect(item.status).toBe('checking') // Changed from pending to checking because it starts immediately

    // Wait for callback
    await new Promise((resolve) => setTimeout(resolve, 10))

    const queue = manager.getTorrents()
    expect(queue).toHaveLength(1)
    expect(queue[0].status).toBe('downloading')
    expect(queue[0].infoHash).toBe('test-info-hash')
  })

  it('should handle pause and resume', async () => {
    const item = manager.addFromMagnet('magnet:?xt=urn:btih:test')
    await new Promise((resolve) => setTimeout(resolve, 10))

    manager.pause(item.id)
    expect(manager.getTorrents()[0].status).toBe('paused')
    expect(mockClient.remove).toHaveBeenCalledWith('test-info-hash', { destroyStore: false }, expect.any(Function))

    manager.resume(item.id)
    // Resume sets status to pending and calls processQueue
    // Since mockClient.get always returns the torrent, startTorrent sees it as active and sets status to downloading immediately
    const status = manager.getTorrents()[0].status
    expect(status === 'checking' || status === 'downloading').toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(manager.getTorrents()[0].status).toBe('downloading')
  })

  it('should handle cancel', async () => {
    const item = manager.addFromMagnet('magnet:?xt=urn:btih:test')
    await new Promise((resolve) => setTimeout(resolve, 10))

    manager.cancel(item.id)
    // Cancel removes from queue
    expect(manager.getTorrents()).toHaveLength(0)
    expect(mockClient.remove).toHaveBeenCalledWith('test-info-hash', { destroyStore: true }, expect.any(Function))
  })

  it('should handle completion', async () => {
    manager.addFromMagnet('magnet:?xt=urn:btih:test')
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Simulate completion
    mockTorrent.emit('done')

    // Default seeding disabled
    expect(manager.getTorrents()[0].status).toBe('completed')
    expect(destroyMock).toHaveBeenCalled()
  })

  it('should handle seeding if enabled', async () => {
    manager.setSeedingEnabled(true)
    manager.addFromMagnet('magnet:?xt=urn:btih:test')
    await new Promise((resolve) => setTimeout(resolve, 10))

    mockTorrent.emit('done')

    expect(manager.getTorrents()[0].status).toBe('seeding')
    expect(destroyMock).not.toHaveBeenCalled()
  })
})
