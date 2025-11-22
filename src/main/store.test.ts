import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/mock/downloads'
  }
}))

vi.mock('electron-store')

import { store } from './store'

describe('Settings Store', () => {
  it('should be initialized with correct defaults from schema', () => {
    expect(store.get('defaultDownloadDirectory')).toBe('/mock/downloads')
    expect(store.get('maxConcurrentDownloads')).toBe(3)
    expect(store.get('enableNotifications')).toBe(true)
    expect(store.get('themeMode')).toBe('system')
  })

  it('should allow updating settings', () => {
    store.set('maxConcurrentDownloads', 5)
    expect(store.get('maxConcurrentDownloads')).toBe(5)
  })
})
