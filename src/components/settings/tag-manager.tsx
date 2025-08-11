import { useState, useEffect } from 'react'
import { Plus, X, Hash, Search, Trash2, Edit2, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePromptStore } from '@/stores/usePromptStore'

interface TagStats {
  tag: string
  count: number
}

export function TagManager() {
  const { tags, prompts, fetchTags, addToast } = usePromptStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editTagName, setEditTagName] = useState('')
  const [tagStats, setTagStats] = useState<TagStats[]>([])
  const [showAdvancedSearchInfo, setShowAdvancedSearchInfo] = useState(false)

  useEffect(() => {
    // Calculate tag usage statistics
    const stats: Record<string, number> = {}
    
    prompts.forEach(prompt => {
      prompt.tags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1
      })
    })

    const sortedStats = Object.entries(stats)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    setTagStats(sortedStats)
  }, [prompts])

  const filteredStats = tagStats.filter(({ tag }) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteTag = (tag: string) => {
    setSelectedTag(tag)
    setShowDeleteDialog(true)
  }

  const handleEditTag = (tag: string) => {
    setSelectedTag(tag)
    setEditTagName(tag)
    setShowEditDialog(true)
  }

  const confirmDeleteTag = async () => {
    if (!selectedTag) return

    try {
      // This would need to be implemented in the store and backend
      // For now, just show a message that bulk operations aren't implemented yet
      addToast({
        type: 'info',
        title: 'Tag Deletion',
        description: `Bulk tag operations will be implemented in a future update. You can remove "${selectedTag}" from individual prompts for now.`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete tag'
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedTag(null)
    }
  }

  const confirmEditTag = async () => {
    if (!selectedTag || !editTagName.trim()) return

    try {
      // This would need to be implemented in the store and backend
      // For now, just show a message that bulk operations aren't implemented yet
      addToast({
        type: 'info',
        title: 'Tag Editing',
        description: `Bulk tag operations will be implemented in a future update. You can rename "${selectedTag}" in individual prompts for now.`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to rename tag'
      })
    } finally {
      setShowEditDialog(false)
      setSelectedTag(null)
      setEditTagName('')
    }
  }

  const getTagUsagePromptsById = (tag: string) => {
    return prompts.filter(prompt => prompt.tags.includes(tag))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tag Management</h2>
            <p className="text-muted-foreground">
              Manage and organize your prompt tags. Use the search bar to find specific tags.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSearchInfo(!showAdvancedSearchInfo)}
            className="flex items-center space-x-2"
          >
            <Info className="h-4 w-4" />
            <span className="text-sm">Search Help</span>
            {showAdvancedSearchInfo ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Advanced Search Info Panel */}
        {showAdvancedSearchInfo && (
          <div className="mt-4 p-4 bg-muted rounded-lg border">
            <h4 className="font-medium mb-2">Advanced Search Syntax</h4>
            <p className="text-sm text-muted-foreground mb-3">
              You can use advanced search syntax in the main search bar:
            </p>
            <div className="space-y-2 text-sm font-mono bg-background p-3 rounded border">
              <div className="flex items-center space-x-2">
                <code className="text-primary">tag:AI</code>
                <span className="text-muted-foreground">Find prompts with "AI" tag</span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="text-primary">tag:AI,Writing</code>
                <span className="text-muted-foreground">Find prompts with "AI" OR "Writing" tags</span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="text-primary">title:review tag:Code</code>
                <span className="text-muted-foreground">Combine multiple filters</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tag Statistics */}
        <div className="text-sm text-muted-foreground">
          {filteredStats.length} tag{filteredStats.length !== 1 ? 's' : ''} 
          {searchQuery && ' (filtered)'}
        </div>
      </div>

      {/* Tags List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pb-4">
          {filteredStats.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No tags found' : 'No tags yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search criteria.' 
                  : 'Tags will appear here as you add them to your prompts.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStats.map(({ tag, count }) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="font-mono">
                      {tag}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {count} prompt{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTag(tag)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag "{selectedTag}"? This will remove it from all prompts that use it.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTag}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Tag</DialogTitle>
            <DialogDescription>
              Rename the tag "{selectedTag}". This will update it in all prompts that use it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New tag name..."
              value={editTagName}
              onChange={(e) => setEditTagName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  confirmEditTag()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEditTag} disabled={!editTagName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}