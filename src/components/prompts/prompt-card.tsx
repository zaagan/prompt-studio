import { useState } from 'react'
import { Heart, Copy, Edit, Trash2, Calendar, Tag, Folder, MoreVertical, Check, Files } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePromptStore } from '@/stores/usePromptStore'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Prompt } from '@/types'

interface PromptCardProps {
  prompt: Prompt
  variant?: 'list' | 'card'
  compact?: boolean
  onClick?: () => void
}

export function PromptCard({ 
  prompt, 
  variant = 'list', 
  compact = false,
  onClick 
}: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
  
  const { 
    updatePrompt, 
    deletePrompt, 
    duplicatePrompt,
    openPromptEditor,
    addToast 
  } = usePromptStore()

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
      
      // Show visual feedback
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 2000) // Reset after 2 seconds
      
      addToast({
        type: 'success',
        title: 'Copied to Clipboard',
        description: 'Prompt content copied successfully'
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      addToast({
        type: 'error',
        title: 'Copy Failed',
        description: 'Could not copy prompt content'
      })
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    openPromptEditor(prompt)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this prompt?')) {
      try {
        await deletePrompt(prompt.id)
        addToast({
          type: 'success',
          title: 'Deleted',
          description: 'Prompt has been deleted'
        })
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
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
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown date'
    }
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const isCardVariant = variant === 'card'
  const shouldCompact = compact || isCardVariant

  const cardContent = (
    <>
      {/* Header section with title and actions */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium line-clamp-2",
            shouldCompact ? "text-sm leading-5" : "text-base",
            isCardVariant ? "mb-2" : ""
          )}>
            {prompt.title}
          </h3>
          
          {prompt.description && !shouldCompact && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {prompt.description}
            </p>
          )}
          
          {!shouldCompact && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {truncateContent(prompt.content)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "h-6 w-6 p-0",
              isCardVariant ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-100",
              "transition-opacity"
            )}
          >
            {justCopied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteToggle}
            className={cn(
              "h-6 w-6 p-0",
              isCardVariant ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-100",
              "transition-opacity"
            )}
          >
            <Heart className={cn(
              "h-3 w-3",
              prompt.is_favorite && "fill-current text-red-500"
            )} />
          </Button>

          {!shouldCompact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Files className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content preview for card variant */}
      {isCardVariant && (
        <div className="flex-1 min-h-0 mt-2">
          <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
            {truncateContent(prompt.content, 180)}
          </p>
        </div>
      )}

      {/* Footer section with metadata and tags */}
      <div className={cn(
        "space-y-2 border-t pt-2 mt-auto",
        isCardVariant ? "mt-3" : "mt-3 pt-3"
      )}>
        {/* Metadata row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {prompt.category_name && (
            <div className="flex items-center gap-1 min-w-0">
              <div 
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: prompt.category_color }}
              />
              <span className="truncate">{prompt.category_name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline text-[11px]">{formatDate(prompt.updated_at)}</span>
            <span className="sm:hidden text-[11px]">{formatDate(prompt.updated_at).replace(' ago', '')}</span>
          </div>
        </div>

        {/* Tags row */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className={cn(
                  "text-xs leading-tight",
                  isCardVariant ? "h-4 px-2 text-[10px]" : shouldCompact ? "h-4 px-1.5" : "h-5 px-2"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  )

  if (variant === 'card') {
    return (
      <Card 
        className="group cursor-pointer hover:shadow-md transition-all duration-200 h-full flex flex-col"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
          {cardContent}
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className="group p-4 border rounded-lg cursor-pointer hover:shadow-sm hover:border-accent transition-all"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {cardContent}
    </div>
  )
}