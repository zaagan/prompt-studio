import { useEffect, useState } from 'react'
import { ThemeProvider, useTheme } from './contexts/theme-context'
import { Toaster } from './components/ui/toaster'
import { DesktopLayout } from './components/layout/desktop-layout'
import { MenuBarLayout } from './components/layout/menubar-layout'
import { usePromptStore } from './stores/usePromptStore'
import { CrashHandler, setupGlobalErrorHandlers } from './components/crash-handler'
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts'
import type { AppMode } from './types'

function AppInner() {
  const [mode, setMode] = useState<AppMode>('desktop')
  const [loading, setLoading] = useState(true)
  const fetchAllData = usePromptStore((state) => state.fetchAllData)
  const { theme, setTheme } = useTheme()
  const { 
    openPromptEditor,
    setSearchFilters,
    searchFilters,
    isPromptEditorOpen,
    selectedPrompt,
    updatePrompt,
    createPrompt,
    addToast
  } = usePromptStore()

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      cmd: true,
      description: 'Create new prompt',
      action: () => {
        if (!isPromptEditorOpen) {
          openPromptEditor()
          addToast({
            type: 'info',
            title: 'New Prompt',
            description: 'Opening prompt editor...'
          })
        }
      }
    },
    {
      key: 'f',
      cmd: true,
      description: 'Focus search',
      action: () => {
        // Focus the search input if it exists
        const searchInput = document.querySelector('input[placeholder*="search" i], input[type="search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        } else {
          // If no search input visible, clear and focus on search in main content
          const advancedSearchInput = document.querySelector('[data-search-input]') as HTMLInputElement
          if (advancedSearchInput) {
            advancedSearchInput.focus()
            advancedSearchInput.select()
          }
        }
      }
    },
    {
      key: 's',
      cmd: true,
      description: 'Save current prompt',
      action: () => {
        // Trigger save in prompt editor if it's open
        if (isPromptEditorOpen) {
          const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
          if (saveButton && !saveButton.disabled) {
            saveButton.click()
          } else {
            addToast({
              type: 'warning',
              title: 'Save',
              description: 'No changes to save or save not available'
            })
          }
        }
      }
    },
    {
      key: 't',
      cmd: true,
      description: 'Cycle through all themes',
      action: () => {
        // All available themes in order
        const allThemes = [
          'system', 'light', 'dark', 'matte', 'midnight', 'ocean', 
          'forest', 'cosmic', 'sunset', 'arctic', 'rose', 'macos'
        ] as const
        
        const currentIndex = allThemes.indexOf(theme)
        const nextIndex = (currentIndex + 1) % allThemes.length
        const nextTheme = allThemes[nextIndex]
        
        setTheme(nextTheme)
        
        // Get theme display name
        const themeNames = {
          system: 'System',
          light: 'Light',
          dark: 'Dark',
          matte: 'Matte Black',
          midnight: 'Midnight',
          ocean: 'Ocean',
          forest: 'Forest',
          cosmic: 'Cosmic Purple',
          sunset: 'Sunset',
          arctic: 'Arctic',
          rose: 'Rose',
          macos: 'macOS'
        }
        
        addToast({
          type: 'success',
          title: 'Theme Changed',
          description: `Switched to ${themeNames[nextTheme]} theme`
        })
      }
    },
    {
      key: 'o',
      cmd: true,
      description: 'Switch to desktop mode',
      action: async () => {
        if (mode === 'menubar') {
          try {
            await window.electronAPI.switchMode('desktop')
            setMode('desktop')
            addToast({
              type: 'success',
              title: 'Mode Changed',
              description: 'Switched to desktop mode'
            })
          } catch (error) {
            addToast({
              type: 'error',
              title: 'Error',
              description: 'Failed to switch to desktop mode'
            })
          }
        }
      }
    }
  ])

  useEffect(() => {
    // Setup global error handlers on app initialization
    setupGlobalErrorHandlers()
    
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
      <ThemeProvider>
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
    <CrashHandler>
      <div className="app">
        {mode === 'desktop' ? <DesktopLayout /> : <MenuBarLayout />}
        <Toaster />
      </div>
    </CrashHandler>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}

export default App