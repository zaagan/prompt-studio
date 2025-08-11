import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/theme/theme-provider'
import { Toaster } from './components/ui/toaster'
import { DesktopLayout } from './components/layout/desktop-layout'
import { MenuBarLayout } from './components/layout/menubar-layout'
import { usePromptStore } from './stores/usePromptStore'
import type { AppMode } from './types'

function App() {
  const [mode, setMode] = useState<AppMode>('desktop')
  const [loading, setLoading] = useState(true)
  const fetchAllData = usePromptStore((state) => state.fetchAllData)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get current mode from Electron
        const currentMode = await window.electronAPI.getCurrentMode()
        setMode(currentMode)

        // Load all application data
        await fetchAllData()
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [fetchAllData])

  useEffect(() => {
    // Listen for preferences dialog
    const handlePreferences = () => {
      // This will be handled by the layout components
      console.log('Open preferences requested')
    }

    window.electronAPI.onOpenPreferences(handlePreferences)

    return () => {
      window.electronAPI.removeAllListeners('open-preferences')
    }
  }, [])

  if (loading) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="prompt-studio-theme">
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Prompt Studio...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="prompt-studio-theme">
      <div className="app">
        {mode === 'desktop' ? <DesktopLayout /> : <MenuBarLayout />}
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App