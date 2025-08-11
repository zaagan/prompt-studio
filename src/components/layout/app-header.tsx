import { cn } from '@/lib/utils'
import { CSSProperties } from 'react'

interface AppHeaderProps {
  className?: string
}

interface ExtendedCSSProperties extends CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

export function AppHeader({ className }: AppHeaderProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  
  const headerStyle: ExtendedCSSProperties = {
    WebkitAppRegion: isMac ? 'drag' : 'no-drag',
  }
  
  return (
    <div 
      className={cn(
        "flex items-center bg-background border-b relative h-12",
        className
      )}
      style={headerStyle}
    >
      {/* Left spacing for macOS window controls */}
      <div className={cn("flex-shrink-0", isMac ? "w-20" : "w-4")} />
      
      {/* Centered title */}
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-lg font-semibold text-foreground select-none">
          Prompt Studio
        </h1>
      </div>
      
      {/* Right spacing for symmetry */}
      <div className={cn("flex-shrink-0", isMac ? "w-20" : "w-4")} />
    </div>
  )
}