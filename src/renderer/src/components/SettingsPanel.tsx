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

  if (!settings) return <div className="loading-state">Loading settings...</div>

  return (
    <div className="settings-container">
        {/* General Settings Card */}
        <section className="common-card settings-card">
            <h3 className="section-title">General</h3>
            
            <div className="setting-row">
                <div className="setting-info">
                    <label className="setting-label" htmlFor="dl-dir">Default Download Directory</label>
                    <p className="setting-desc">Where your files will be saved.</p>
                </div>
                <input
                  id="dl-dir"
                  type="text"
                  className="common-input setting-input"
                  value={settings.defaultDownloadDirectory}
                  onChange={(e) => handleChange('defaultDownloadDirectory', e.target.value)}
                />
            </div>

            <div className="setting-row">
                <div className="setting-info">
                    <label className="setting-label" htmlFor="max-dl">Max Concurrent Downloads</label>
                    <p className="setting-desc">Limit how many files download at once (1-10).</p>
                </div>
                <input
                  id="max-dl"
                  type="number"
                  className="common-input setting-input-small"
                  min="1"
                  max="10"
                  value={settings.maxConcurrentDownloads}
                  onChange={(e) => handleChange('maxConcurrentDownloads', Number(e.target.value))}
                />
            </div>

            <div className="setting-row">
                <div className="setting-info">
                    <label className="setting-label">Theme</label>
                    <p className="setting-desc">Choose your preferred appearance.</p>
                </div>
                <select 
                    className="common-input setting-select" 
                    value={settings.themeMode} 
                    onChange={(e) => handleChange('themeMode', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
            </div>
        </section>

        {/* Notifications & Automation Card */}
        <section className="common-card settings-card">
            <h3 className="section-title">Notifications & Automation</h3>

            <div className="setting-row">
                <div className="setting-info">
                    <label className="setting-label">Enable Notifications</label>
                    <p className="setting-desc">Get notified when downloads finish.</p>
                </div>
                <label className="common-toggle">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                  />
                  <span className="common-slider"></span>
                </label>
            </div>

            <div className="setting-row">
                <div className="setting-info">
                    <label className="setting-label">Auto Capture Links</label>
                    <p className="setting-desc">Automatically detect downloadable links.</p>
                </div>
                <label className="common-toggle">
                  <input
                    type="checkbox"
                    checked={settings.autoCaptureEnabled}
                    onChange={(e) => handleChange('autoCaptureEnabled', e.target.checked)}
                  />
                  <span className="common-slider"></span>
                </label>
            </div>

            {settings.autoCaptureEnabled && (
                <div className="setting-row sub-setting">
                    <div className="setting-info">
                        <label className="setting-label">Capture Sources</label>
                    </div>
                    <div className="checkbox-group">
                        <label className="checkbox-label">
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
                            <span>Clipboard</span>
                        </label>
                        <label className="checkbox-label">
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
                            <span>Magnet Links</span>
                        </label>
                    </div>
                </div>
            )}
        </section>
    </div>
  )
}

export default SettingsPanel
