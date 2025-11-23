import React, { useEffect, useState } from 'react'
import { Settings } from '../types'
import './SettingsPanel.css'

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    window.api.getSettings().then(setSettings)

    const removeListener = window.api.onSettingsUpdate((newSettings) => {
      setSettings(newSettings)
    })

    return () => removeListener()
  }, [])

  const handleChange = (key: keyof Settings, value: any) => {
    // Optimistic update
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
    window.api.setSetting(key, value)
  }

  if (!settings) return <div>Loading settings...</div>

  return (
    <div className="settings-panel">
      <div className="setting-item">
        <label>Default Download Directory</label>
        <input
          type="text"
          value={settings.defaultDownloadDirectory}
          onChange={(e) => handleChange('defaultDownloadDirectory', e.target.value)}
        />
      </div>

      <div className="setting-item">
        <label>Max Concurrent Downloads (1-10)</label>
        <input
          type="number"
          min="1"
          max="10"
          value={settings.maxConcurrentDownloads}
          onChange={(e) => handleChange('maxConcurrentDownloads', Number(e.target.value))}
        />
      </div>

      <div className="setting-item">
        <label>Enable Notifications</label>
        <div className="toggle-container">
          <input
            type="checkbox"
            checked={settings.enableNotifications}
            onChange={(e) => handleChange('enableNotifications', e.target.checked)}
          />
          <span>{settings.enableNotifications ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="setting-item">
        <label>Theme</label>
        <select value={settings.themeMode} onChange={(e) => handleChange('themeMode', e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="setting-item">
        <label>Auto Capture Links</label>
        <div className="toggle-container">
          <input
            type="checkbox"
            checked={settings.autoCaptureEnabled}
            onChange={(e) => handleChange('autoCaptureEnabled', e.target.checked)}
          />
          <span>{settings.autoCaptureEnabled ? 'On' : 'Off'}</span>
        </div>
      </div>

      {settings.autoCaptureEnabled && (
        <div className="setting-item">
          <label>Capture Sources</label>
          <div className="checkbox-group" style={{ display: 'flex', gap: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={settings.autoCaptureSources?.includes('clipboard')}
                onChange={(e) => {
                  const sources = new Set(settings.autoCaptureSources || [])
                  if (e.target.checked) sources.add('clipboard')
                  else sources.delete('clipboard')
                  handleChange('autoCaptureSources', Array.from(sources))
                }}
              />
              Clipboard
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.autoCaptureSources?.includes('magnet')}
                onChange={(e) => {
                  const sources = new Set(settings.autoCaptureSources || [])
                  if (e.target.checked) sources.add('magnet')
                  else sources.delete('magnet')
                  handleChange('autoCaptureSources', Array.from(sources))
                }}
              />
              Magnet Links
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPanel
