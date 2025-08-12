import { cn } from '@/lib/utils'
import { CSSProperties, useState } from 'react'
import { MoreHorizontal, Keyboard, HelpCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help'
import { usePromptStore } from '@/stores/usePromptStore'

interface AppHeaderProps {
  className?: string
}

interface ExtendedCSSProperties extends CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

export function AppHeader({ className }: AppHeaderProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { openSettings } = usePromptStore()
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
      
      {/* Right side menu */}
      <div className="flex-shrink-0 flex items-center pr-4" style={{ WebkitAppRegion: 'no-drag' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="h-4 w-4 mr-2" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <KeyboardShortcutsHelp 
        open={shortcutsOpen} 
        onOpenChange={setShortcutsOpen} 
      />
    </div>
  )
}