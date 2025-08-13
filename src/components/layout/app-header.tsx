import { cn } from '@/lib/utils'
import { CSSProperties, useState, useEffect } from 'react'
import { MoreHorizontal, Keyboard, HelpCircle, Settings, Server, Play, Square, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help'
import { usePromptStore } from '@/stores/usePromptStore'
import { Badge } from '@/components/ui/badge'

interface AppHeaderProps {
  className?: string
}

interface ExtendedCSSProperties extends CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

export function AppHeader({ className }: AppHeaderProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mcpServerStatus, setMcpServerStatus] = useState({ running: false, port: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const { openSettings, mcpConfig, exposedPrompts, addToast } = usePromptStore()
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  
  const headerStyle: ExtendedCSSProperties = {
    WebkitAppRegion: isMac ? 'drag' : 'no-drag',
  }

  // Check MCP server status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const status = await window.electronAPI.getMcpServerStatus()
        setMcpServerStatus({
          running: status.running,
          port: status.port || 0
        })
      } catch (error) {
        console.error('Failed to check MCP server status:', error)
      }
    }

    // Initial check
    checkServerStatus()

    // Check every 3 seconds
    const interval = setInterval(checkServerStatus, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleStartMcpServer = async () => {
    const exposedCount = exposedPrompts.filter(p => p.exposed).length
    if (exposedCount === 0) {
      addToast({
        type: 'error',
        title: 'Cannot Start Server',
        description: 'Please expose at least one prompt in the MCP Server tab first'
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.startMcpServer(mcpConfig, exposedPrompts.filter(p => p.exposed))
      
      if (result.success) {
        setMcpServerStatus({ running: true, port: result.port || mcpConfig.port })
        addToast({
          type: 'success',
          title: 'MCP Server Started',
          description: `Server running on port ${result.port || mcpConfig.port}`
        })
      } else {
        throw new Error(result.message || 'Failed to start server')
      }
    } catch (error) {
      console.error('Failed to start MCP server:', error)
      addToast({
        type: 'error',
        title: 'Server Start Failed',
        description: error instanceof Error ? error.message : 'Failed to start the MCP server'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopMcpServer = async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.stopMcpServer()
      
      if (result.success) {
        setMcpServerStatus({ running: false, port: 0 })
        addToast({
          type: 'info',
          title: 'MCP Server Stopped',
          description: 'Server has been shut down successfully'
        })
      } else {
        throw new Error(result.message || 'Failed to stop server')
      }
    } catch (error) {
      console.error('Failed to stop MCP server:', error)
      addToast({
        type: 'error',
        title: 'Server Stop Failed',
        description: error instanceof Error ? error.message : 'Failed to stop the MCP server'
      })
    } finally {
      setIsLoading(false)
    }
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
      
      {/* MCP Server Controls */}
      <div className="flex-shrink-0 flex items-center mr-4" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md px-2 py-1">
          {/* Status indicator */}
          {mcpServerStatus.running ? (
            <Wifi className={cn("h-3 w-3 text-green-500", "animate-pulse")} />
          ) : (
            <WifiOff className="h-3 w-3 text-muted-foreground" />
          )}
          <Badge 
            variant={mcpServerStatus.running ? "default" : "secondary"}
            className={cn(
              "text-xs h-4 px-1 ml-1",
              mcpServerStatus.running && "bg-green-500 hover:bg-green-600"
            )}
          >
            MCP {mcpServerStatus.running ? `${mcpServerStatus.port}` : 'OFF'}
          </Badge>
          
          {/* Start/Stop button */}
          {!mcpServerStatus.running ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartMcpServer}
              disabled={isLoading}
              className="h-5 w-5 p-0 ml-1 hover:bg-muted"
              title="Start MCP Server"
            >
              <Play className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopMcpServer}
              disabled={isLoading}
              className="h-5 w-5 p-0 ml-1 hover:bg-muted"
              title="Stop MCP Server"
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
        </div>
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