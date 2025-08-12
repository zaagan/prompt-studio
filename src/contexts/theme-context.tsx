import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system' | 'midnight' | 'ocean' | 'forest' | 'macos' | 'matte' | 'cosmic' | 'sunset' | 'arctic' | 'rose'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark' // The actual resolved theme (for system theme)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize with saved theme if available
    try {
      const savedTheme = localStorage.getItem('prompt-studio-theme') as Theme
      if (savedTheme && ['light', 'dark', 'system', 'midnight', 'ocean', 'forest', 'macos', 'matte', 'cosmic', 'sunset', 'arctic', 'rose'].includes(savedTheme)) {
        return savedTheme
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
    return 'system'
  })
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  // Separate effect to load theme on mount (for cases where useState initializer doesn't work)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('prompt-studio-theme') as Theme
      if (savedTheme && ['light', 'dark', 'system', 'midnight', 'ocean', 'forest', 'macos', 'matte', 'cosmic', 'sunset', 'arctic', 'rose'].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage on mount:', error)
    }
  }, [])

  useEffect(() => {
    // Save theme to localStorage with better key
    try {
      localStorage.setItem('prompt-studio-theme', theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }

    // Apply theme to document
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'midnight', 'ocean', 'forest', 'macos', 'matte', 'cosmic', 'sunset', 'arctic', 'rose')
    
    let resolvedTheme: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      resolvedTheme = mediaQuery.matches ? 'dark' : 'light'
      root.classList.add(resolvedTheme)
      
      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
        setActualTheme(newTheme)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Apply specific theme
      if (theme === 'light') {
        resolvedTheme = 'light'
        root.classList.add('light')
      } else if (theme === 'dark' || theme === 'midnight' || theme === 'ocean' || theme === 'forest' || theme === 'macos' || theme === 'matte' || theme === 'cosmic' || theme === 'sunset' || theme === 'arctic' || theme === 'rose') {
        resolvedTheme = 'dark'
        root.classList.add('dark')
        
        // Add specific theme class for custom themes
        if (theme !== 'dark') {
          root.classList.add(theme)
        }
      }
    }
    
    setActualTheme(resolvedTheme)
  }, [theme])

  const handleSetTheme = (newTheme: Theme) => {
    try {
      // Immediately save to localStorage
      localStorage.setItem('prompt-studio-theme', newTheme)
      // Update state
      setTheme(newTheme)
    } catch (error) {
      console.warn('Failed to save theme:', error)
      // Still update state even if localStorage fails
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}