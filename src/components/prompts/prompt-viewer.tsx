import { useState } from 'react'
import { X, Copy, Edit, Heart, Calendar, Tag, Folder, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { usePromptStore } from '@/stores/usePromptStore'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Prompt } from '@/types'

interface PromptViewerProps {
  prompt: Prompt
  onClose: () => void
}

export function PromptViewer({ prompt: initialPrompt, onClose }: PromptViewerProps) {
  const [justCopied, setJustCopied] = useState(false)
  
  const { 
    prompts,
    updatePrompt, 
    openPromptEditor,
    addToast 
  } = usePromptStore()
  
  // Get the current prompt from the store to ensure we have the latest data
  const prompt = prompts.find(p => p.id === initialPrompt.id) || initialPrompt

  const handleFavoriteToggle = async () => {
    try {
      const newFavoriteStatus = !prompt.is_favorite
      await updatePrompt(prompt.id, { 
        is_favorite: newFavoriteStatus
      })
      addToast({
        type: 'success',
        title: newFavoriteStatus ? 'Added to Favorites' : 'Removed from Favorites',
        description: `"${prompt.title}" ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`
      })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      addToast({
        type: 'error',
        title: 'Failed to Update',
        description: 'Could not update favorite status'
      })
    }
  }

  const handleCopy = async () => {
    try {
      const result = await window.electronAPI.copyToClipboard(prompt.content)
      
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
        description: `Could not copy prompt content: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const handleEdit = () => {
    openPromptEditor(prompt)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Prompt Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Title and Actions */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold leading-tight">{prompt.title}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavoriteToggle}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    prompt.is_favorite && "fill-current text-red-500"
                  )} />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  className="h-8"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  {justCopied ? (
                    <Check className="h-3 w-3 mr-2 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 mr-2" />
                  )}
                  {justCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                {prompt.category_name && (
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Category:</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: prompt.category_color }}
                      />
                      <span className="font-medium">{prompt.category_name}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last updated:</span>
                  <span className="font-medium">{formatDate(prompt.updated_at)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(prompt.created_at)}</span>
                </div>
              </div>

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {prompt.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm leading-relaxed">{prompt.description}</p>
              </div>
            )}

            {prompt.description && <Separator />}

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Prompt Content</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {prompt.content}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}