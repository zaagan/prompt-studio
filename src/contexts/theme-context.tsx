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
  const [theme, setTheme] = useState<Theme>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme)

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

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}