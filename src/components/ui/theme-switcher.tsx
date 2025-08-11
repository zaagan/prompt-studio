import { useState } from 'react'
import { Monitor, Moon, Sun, Palette, Droplets, Trees, Apple, Circle, Sparkles, Sunset, Snowflake, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme, type Theme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'

interface ThemeOption {
  value: Theme
  label: string
  icon: React.ElementType
  description: string
  preview?: string
}

const themeOptions: ThemeOption[] = [
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow system preference',
    preview: 'Auto'
  },
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Light theme',
    preview: '🌕'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Dark theme',
    preview: '🌑'
  },
  {
    value: 'matte',
    label: 'Matte Black',
    icon: Circle,
    description: 'Pure black matte finish',
    preview: '⚫'
  },
  {
    value: 'midnight',
    label: 'Midnight',
    icon: Moon,
    description: 'Deep dark with green accents',
    preview: '🌌'
  },
  {
    value: 'ocean',
    label: 'Ocean',
    icon: Droplets,
    description: 'Deep blue theme',
    preview: '🌊'
  },
  {
    value: 'forest',
    label: 'Forest',
    icon: Trees,
    description: 'Nature-inspired green theme',
    preview: '🌲'
  },
  {
    value: 'cosmic',
    label: 'Cosmic Purple',
    icon: Sparkles,
    description: 'Purple cosmic theme',
    preview: '🔮'
  },
  {
    value: 'sunset',
    label: 'Sunset',
    icon: Sunset,
    description: 'Warm amber sunset theme',
    preview: '🌅'
  },
  {
    value: 'arctic',
    label: 'Arctic',
    icon: Snowflake,
    description: 'Cool icy blue theme',
    preview: '❄️'
  },
  {
    value: 'rose',
    label: 'Rose',
    icon: Heart,
    description: 'Elegant rose theme',
    preview: '🌹'
  },
  {
    value: 'macos',
    label: 'macOS',
    icon: Apple,
    description: 'macOS-style dark theme',
    preview: '🍎'
  }
]

interface ThemeSwitcherProps {
  collapsed?: boolean
}

export function ThemeSwitcher({ collapsed = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  const currentTheme = themeOptions.find(option => option.value === theme)

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  if (collapsed) {
    return (
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  {currentTheme ? (
                    <currentTheme.icon className="h-4 w-4" />
                  ) : (
                    <Palette className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Switch Theme ({currentTheme?.label || 'Unknown'})</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="w-48">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2",
                    theme === option.value && "bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                  {option.preview && (
                    <span className="text-sm">{option.preview}</span>
                  )}
                  {theme === option.value && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 text-xs"
        >
          {currentTheme ? (
            <currentTheme.icon className="h-4 w-4 mr-2" />
          ) : (
            <Palette className="h-4 w-4 mr-2" />
          )}
          <span className="flex-1 text-left">
            {currentTheme?.label || 'Theme'}
          </span>
          {currentTheme?.preview && (
            <span className="ml-auto text-sm">{currentTheme.preview}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        {themeOptions.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2",
                theme === option.value && "bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
              {option.preview && (
                <span className="text-sm">{option.preview}</span>
              )}
              {theme === option.value && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}