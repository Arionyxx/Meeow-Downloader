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
    },
    ipcMain: {
      handle: vi.fn()
    },
    BrowserWindow: {
      getAllWindows: vi.fn(() => [])
    }
  }
})

// Mock fs
const mockStream = new EventEmitter()
// @ts-expect-error - mock implementation
mockStream.write = vi.fn()
// @ts-expect-error - mock implementation
mockStream.end = vi.fn()

vi.mock('fs', () => {
  const mockStream = new EventEmitter()
  // @ts-expect-error - mock implementation
  mockStream.write = vi.fn()
  // @ts-expect-error - mock implementation
  mockStream.end = vi.fn()

  const fsMock = {
    existsSync: vi.fn(() => false),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    createWriteStream: vi.fn(() => mockStream),
    truncateSync: vi.fn(),
    unlinkSync: vi.fn(),
    rename: vi.fn((oldPath, newPath, cb) => cb(null))
  }

  return {
    default: fsMock,
    ...fsMock
  }
})

// Mock https/http
const mockRequest = new EventEmitter()
// @ts-expect-error - mock implementation
mockRequest.destroy = vi.fn()

const mockResponse = new EventEmitter()
// @ts-expect-error - mock implementation
mockResponse.statusCode = 200
// @ts-expect-error - mock implementation
mockResponse.headers = { 'content-length': '1000' }

vi.mock('https', () => ({
  default: {
    get: vi.fn((url, options, cb) => {
      if (typeof options === 'function') {
        cb = options
      }
      process.nextTick(() => cb(mockResponse))
      return mockRequest
    })
  }
}))

vi.mock('http', () => ({
  default: {
    get: vi.fn((url, options, cb) => {
      if (typeof options === 'function') {
        cb = options
      }
      process.nextTick(() => cb(mockResponse))
      return mockRequest
    }),
    ClientRequest: vi.fn()
  }
}))

import { DownloadManager } from './download-manager'

describe('DownloadManager', () => {
  let manager: DownloadManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new DownloadManager()
    // Reset mock response
    // @ts-expect-error - mock implementation
    mockResponse.statusCode = 200
    // @ts-expect-error - mock implementation
    mockResponse.headers = { 'content-length': '1000' }
  })

  it('should enqueue a download', () => {
    const item = manager.enqueue('https://example.com/file.zip')
    expect(item.url).toBe('https://example.com/file.zip')
    expect(item.status).toBe('downloading')
    const queue = manager.getDownloads()
    expect(queue).toHaveLength(1)
    expect(queue[0].id).toBe(item.id)
  })

  it('should start download automatically if queue is empty', async () => {
    manager.enqueue('https://example.com/file.zip')
    // Wait for next tick for processQueue to run
    await new Promise((resolve) => setTimeout(resolve, 10))

    const queue = manager.getDownloads()
    expect(queue[0].status).toBe('downloading')
  })

  it('should handle pause and resume', async () => {
    const item = manager.enqueue('https://example.com/file.zip')
    await new Promise((resolve) => setTimeout(resolve, 10))

    manager.pause(item.id)
    expect(manager.getDownloads()[0].status).toBe('paused')
    expect(mockRequest.destroy).toHaveBeenCalled()

    manager.resume(item.id)
    expect(manager.getDownloads()[0].status).toBe('downloading')
  })

  it('should handle cancel', async () => {
    const item = manager.enqueue('https://example.com/file.zip')
    await new Promise((resolve) => setTimeout(resolve, 10))

    manager.cancel(item.id)
    expect(manager.getDownloads()[0].status).toBe('cancelled')
    expect(mockRequest.destroy).toHaveBeenCalled()
  })
})
