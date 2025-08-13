import { useState, useEffect } from 'react'
import { Search, Plus, X, Heart, Filter, Tag, Folder, Palette, Moon, Sun, Monitor, Wifi, WifiOff, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MenubarPromptCard } from '../prompts/prompt-card-menubar'
import { PromptEditor } from '../prompts/prompt-editor'
import { usePromptStore } from '@/stores/usePromptStore'
import { useTheme, type Theme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'
import AppIcon from '/assets/icon.png'

export function MenuBarLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mcpServerStatus, setMcpServerStatus] = useState({ running: false, port: 0 })
  const [isLoading, setIsLoading] = useState(false)
  
  const { theme, setTheme } = useTheme()
  
  const {
    prompts,
    searchFilters,
    setSearchFilters,
    getFilteredPrompts,
    openPromptEditor,
    closePromptEditor,
    selectedPrompt,
    isPromptEditorOpen,
    categories,
    tags,
    mcpConfig,
    exposedPrompts,
    addToast
  } = usePromptStore()

  const filteredPrompts = getFilteredPrompts()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSearchFilters({ query })
  }

  const toggleFavoriteFilter = () => {
    const newIsFavorite = searchFilters.isFavorite === true ? undefined : true
    setSearchFilters({ 
      ...searchFilters,
      isFavorite: newIsFavorite 
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchFilters({
      query: '',
      categoryId: null,
      tags: [],
      isFavorite: undefined
    })
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = searchFilters.tags?.filter(tag => tag !== tagToRemove) || []
    setSearchFilters({
      ...searchFilters,
      tags: newTags
    })
  }

  const clearCategory = () => {
    setSearchFilters({
      ...searchFilters,
      categoryId: null
    })
  }

  const hasActiveFilters = Boolean(
    searchFilters.query ||
    searchFilters.categoryId ||
    (searchFilters.tags && searchFilters.tags.length > 0) ||
    searchFilters.isFavorite === true
  )

  const activeCategory = categories.find(c => c.id === searchFilters.categoryId)

  const handleCreatePrompt = () => {
    openPromptEditor()
  }

  // Cycle through themes: light -> dark -> system
  const cycleTheme = () => {
    const themeOrder = ['light', 'dark', 'system'] as const
    const currentIndex = themeOrder.indexOf(theme as any) 
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex] as any)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
      case 'matte':
      case 'midnight':
      case 'ocean':
      case 'forest':
      case 'cosmic':
      case 'sunset':
      case 'arctic':
      case 'rose':
      case 'macos':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Palette className="h-4 w-4" />
    }
  }

  const allThemes: { value: Theme; label: string; icon: React.ReactNode; emoji?: string }[] = [
    { value: 'system', label: 'System', icon: <Monitor className="h-3 w-3" />, emoji: '🖥️' },
    { value: 'light', label: 'Light', icon: <Sun className="h-3 w-3" />, emoji: '☀️' },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-3 w-3" />, emoji: '🌙' },
    { value: 'matte', label: 'Matte Black', icon: <Moon className="h-3 w-3" />, emoji: '⚫' },
    { value: 'midnight', label: 'Midnight', icon: <Moon className="h-3 w-3" />, emoji: '🌌' },
    { value: 'ocean', label: 'Ocean', icon: <Moon className="h-3 w-3" />, emoji: '🌊' },
    { value: 'forest', label: 'Forest', icon: <Moon className="h-3 w-3" />, emoji: '🌲' },
    { value: 'cosmic', label: 'Cosmic', icon: <Moon className="h-3 w-3" />, emoji: '🔮' },
    { value: 'sunset', label: 'Sunset', icon: <Moon className="h-3 w-3" />, emoji: '🌅' },
    { value: 'arctic', label: 'Arctic', icon: <Moon className="h-3 w-3" />, emoji: '❄️' },
    { value: 'rose', label: 'Rose', icon: <Moon className="h-3 w-3" />, emoji: '🌹' },
    { value: 'macos', label: 'macOS', icon: <Moon className="h-3 w-3" />, emoji: '🍎' },
  ]

  const handleEditPrompt = (promptId: number) => {
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      openPromptEditor(prompt)
    }
  }

  const handleCloseEditor = () => {
    closePromptEditor()
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

  if (isPromptEditorOpen) {
    return (
      <div className="h-full bg-background">
        <PromptEditor compact onClose={handleCloseEditor} />
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={AppIcon} 
              alt="Prompt Studio" 
              className="h-5 w-5 object-contain rounded"
            />
            <h1 className="text-sm font-semibold">Prompt Studio</h1>
          </div>
          
          {/* MCP Server Controls - Grouped */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md px-1.5 py-0.5">
            {mcpServerStatus.running ? (
              <Wifi className={cn("h-3 w-3 text-green-500", "animate-pulse")} />
            ) : (
              <WifiOff className="h-3 w-3 text-muted-foreground" />
            )}
            <Badge 
              variant={mcpServerStatus.running ? "default" : "secondary"}
              className={cn(
                "text-xs h-3.5 px-1 ml-0.5",
                mcpServerStatus.running && "bg-green-500 hover:bg-green-600"
              )}
            >
              {mcpServerStatus.running ? mcpServerStatus.port : 'OFF'}
            </Badge>
            
            {!mcpServerStatus.running ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartMcpServer}
                disabled={isLoading}
                className="h-4 w-4 p-0 ml-0.5 hover:bg-muted"
                title="Start MCP Server"
              >
                <Play className="h-2.5 w-2.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopMcpServer}
                disabled={isLoading}
                className="h-4 w-4 p-0 ml-0.5 hover:bg-muted"
                title="Stop MCP Server"
              >
                <Square className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreatePrompt}
              className="h-7 w-7 p-0"
              title="New Prompt"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  title={`Theme: ${theme} (click for more)`}
                >
                  {getThemeIcon()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 max-h-80 overflow-y-auto">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Themes
                </div>
                {allThemes.map((t) => (
                  <DropdownMenuItem
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      theme === t.value && "bg-accent"
                    )}
                  >
                    <span className="text-sm">{t.emoji || '🎨'}</span>
                    <span className="flex-1">{t.label}</span>
                    {theme === t.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-2">
          {/* Search Bar with Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-9 h-8 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Favorite Filter Toggle */}
            <Button
              variant={searchFilters.isFavorite === true ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleFavoriteFilter}
              className={cn(
                "h-8 w-8 p-0",
                searchFilters.isFavorite === true && "text-red-500"
              )}
            >
              <Heart className={cn(
                "h-4 w-4",
                searchFilters.isFavorite === true && "fill-current"
              )} />
            </Button>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2"
              >
                <Filter className="h-3 w-3 mr-1" />
                <span className="text-xs">Clear</span>
              </Button>
            )}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1">
              {searchFilters.isFavorite === true && (
                <Badge 
                  variant="secondary" 
                  className="text-xs h-5 pl-1 pr-0.5 gap-1"
                >
                  <Heart className="h-3 w-3 fill-current text-red-500" />
                  <span>Favorites</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavoriteFilter}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {activeCategory && (
                <Badge 
                  variant="secondary" 
                  className="text-xs h-5 pl-1 pr-0.5 gap-1"
                >
                  <Folder className="h-3 w-3" />
                  <span>{activeCategory.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCategory}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {searchFilters.tags?.map(tag => (
                <Badge 
                  key={tag}
                  variant="secondary" 
                  className="text-xs h-5 pl-1 pr-0.5 gap-1"
                >
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Results Count */}
          {filteredPrompts.length > 0 && (
            <p className="text-xs text-muted-foreground px-1 mb-2">
              {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' (filtered)'}
            </p>
          )}
          
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">
                {hasActiveFilters 
                  ? "No prompts match your filters"
                  : "No prompts found"
                }
              </p>
              <div className="space-y-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <Filter className="h-3 w-3 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreatePrompt}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prompt
                </Button>
              </div>
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <MenubarPromptCard
                key={prompt.id}
                prompt={prompt}
                onClick={() => handleEditPrompt(prompt.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}