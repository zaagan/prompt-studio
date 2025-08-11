import { useState } from 'react'
import { Search, Settings, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PromptCard } from '../prompts/prompt-card'
import { PromptEditor } from '../prompts/prompt-editor'
import { usePromptStore } from '@/stores/usePromptStore'

export function MenuBarLayout() {
  const [showEditor, setShowEditor] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const {
    prompts,
    searchFilters,
    setSearchFilters,
    getFilteredPrompts,
    openPromptEditor,
    selectedPrompt
  } = usePromptStore()

  const filteredPrompts = getFilteredPrompts()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSearchFilters({ query })
  }

  const handleCreatePrompt = () => {
    openPromptEditor()
    setShowEditor(true)
  }

  const handleEditPrompt = (promptId: number) => {
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      openPromptEditor(prompt)
      setShowEditor(true)
    }
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
  }

  if (showEditor) {
    return (
      <div className="h-full bg-background">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-medium">
            {selectedPrompt ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseEditor}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-57px)]">
          <PromptEditor compact onClose={handleCloseEditor} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Prompt Studio</h1>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreatePrompt}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">
                No prompts found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreatePrompt}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Prompt
              </Button>
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                compact
                onClick={() => handleEditPrompt(prompt.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}