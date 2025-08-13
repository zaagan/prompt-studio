import { useState } from 'react'
import { Heart, Copy, ChevronDown, ChevronUp, Check, Edit, Calendar, Files, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePromptStore } from '@/stores/usePromptStore'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Prompt } from '@/types'

interface MenubarPromptCardProps {
  prompt: Prompt
  onClick?: () => void
}

export function MenubarPromptCard({ prompt, onClick }: MenubarPromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [contentHeight, setContentHeight] = useState(192) // Default 192px (h-48)
  const [isDragging, setIsDragging] = useState(false)
  
  const { updatePrompt, duplicatePrompt, addToast } = usePromptStore()

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updatePrompt(prompt.id, { 
        is_favorite: !prompt.is_favorite 
      })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await window.electronAPI.copyToClipboard(prompt.content)
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 2000)
      
      addToast({
        type: 'success',
        title: 'Copied',
        description: 'Prompt copied to clipboard'
      })
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) onClick()
  }

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await duplicatePrompt(prompt.id)
    } catch (error) {
      console.error('Failed to duplicate:', error)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const distance = formatDistanceToNow(date, { addSuffix: true })
      // Shorten the output for menubar
      return distance.replace('about ', '').replace('less than ', '<')
    } catch {
      return 'Unknown'
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const startY = e.clientY
    const startHeight = contentHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const newHeight = Math.max(80, Math.min(400, startHeight + deltaY)) // Min 80px, Max 400px
      setContentHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div 
          className={cn(
            "group border rounded-lg transition-all duration-200",
            isExpanded ? "bg-accent/50 border-accent" : "hover:border-accent hover:bg-accent/20",
            "relative"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Card Content */}
          <div className="p-2.5">
            {/* Header Row */}
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h4 className={cn(
                      "text-sm font-medium line-clamp-1 cursor-help",
                      isHovered ? "pr-1" : "pr-0"
                    )}>
                      {prompt.title}
                    </h4>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p className="text-xs max-w-xs break-words">{prompt.title}</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Quick metadata */}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  {prompt.category_name && (
                    <div className="flex items-center gap-1 min-w-0">
                      <div 
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: prompt.category_color }}
                      />
                      <span className="truncate">
                        {prompt.category_name}
                      </span>
                    </div>
                  )}
                  <span className="flex-shrink-0">
                    {formatDate(prompt.updated_at)}
                  </span>
                </div>

                {/* Tags */}
                {prompt.tags.length > 0 && !isExpanded && (
                  <div className="flex items-center gap-0.5 mt-1 overflow-hidden">
                    {prompt.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="h-3.5 px-1 text-[10px] flex-shrink-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {prompt.tags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="h-3.5 px-1 text-[10px] flex-shrink-0"
                      >
                        +{prompt.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isHovered && (
                <div className="flex items-center gap-0.5 shrink-0 transition-opacity duration-200 opacity-100">
                  {/* Expand/Collapse */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={toggleExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-1.5 w-1.5" />
                        ) : (
                          <ChevronDown className="h-1.5 w-1.5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{isExpanded ? 'Collapse' : 'View content'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Copy */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-4 w-4 p-0"
                    >
                      {justCopied ? (
                        <Check className="h-2 w-2 text-green-600" />
                      ) : (
                        <Copy className="h-1.5 w-1.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Copy</p>
                  </TooltipContent>
                </Tooltip>

                {/* Favorite */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFavoriteToggle}
                      className="h-4 w-4 p-0"
                    >
                      <Heart className={cn(
                        "h-2 w-2",
                        prompt.is_favorite && "fill-current text-red-500"
                      )} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{prompt.is_favorite ? 'Unfavorite' : 'Favorite'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Duplicate */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDuplicate}
                      className="h-4 w-4 p-0"
                    >
                      <Files className="h-1.5 w-1.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Duplicate</p>
                  </TooltipContent>
                </Tooltip>

                {/* Edit */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="h-4 w-4 p-0"
                    >
                      <Edit className="h-1.5 w-1.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Edit</p>
                  </TooltipContent>
                </Tooltip>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Content */}
          <CollapsibleContent>
            <div className="px-2.5 pb-2.5 pt-0">
              <div className="border-t pt-2">
                {/* Description */}
                {prompt.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {prompt.description}
                  </p>
                )}
                
                {/* Full Content */}
                <div className="relative">
                  <div 
                    className="bg-background/50 rounded-t p-2 overflow-y-auto border-b-0"
                    style={{ height: `${contentHeight}px` }}
                  >
                    <p className="text-xs font-mono whitespace-pre-wrap break-words">
                      {prompt.content}
                    </p>
                  </div>
                  {/* Resize Handle */}
                  <div
                    className={cn(
                      "flex items-center justify-center h-3 bg-background/50 rounded-b border-t cursor-ns-resize hover:bg-accent/50 transition-colors",
                      isDragging && "bg-accent/70"
                    )}
                    onMouseDown={handleMouseDown}
                    title="Drag to resize"
                  >
                    <GripHorizontal className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>

                {/* All Tags */}
                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-2">
                    {prompt.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="h-3.5 px-1 text-[10px] inline-flex"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </TooltipProvider>
  )
}