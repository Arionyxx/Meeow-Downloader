import { useEffect, useState } from 'react'

export function useTheme() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Initial fetch of settings
    window.api.getSettings().then((settings) => {
      setThemeMode(settings.themeMode)
    })

    // Initial fetch of system theme
    window.api.getSystemTheme().then((theme) => {
      setSystemTheme(theme)
    })

    // Listen for settings updates
    const removeSettingsListener = window.api.onSettingsUpdate((settings) => {
      setThemeMode(settings.themeMode)
    })

    // Listen for system theme updates
    const removeSystemThemeListener = window.api.onSystemThemeChanged((theme) => {
      setSystemTheme(theme)
    })

    return () => {
      removeSettingsListener()
      removeSystemThemeListener()
    }
  }, [])

  useEffect(() => {
    const effectiveTheme = themeMode === 'system' ? systemTheme : themeMode
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }, [themeMode, systemTheme])
}
