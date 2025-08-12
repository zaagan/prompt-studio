import { useState } from 'react'
import { Search, Filter, SortAsc, SortDesc, Grid, List, Plus, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InfoIcon } from '@/components/ui/info-icon'
import { AdvancedSearchInput } from '../search/advanced-search-input'
import { PromptList } from '../prompts/prompt-list'
import { PromptGrid } from '../prompts/prompt-grid'
import { TestingPanel } from '../testing/testing-panel'
import { TemplateList } from '../templates/template-list-simple'
import { usePromptStore } from '@/stores/usePromptStore'
import type { SortOptions } from '@/types'

export function MainContent() {
  const [activeTab, setActiveTab] = useState('prompts')
  
  const {
    getFilteredPrompts,
    searchFilters,
    sortOptions,
    setSearchFilters,
    setSortOptions,
    openPromptEditor,
    openTemplateEditor,
    templateSearchQuery,
    setTemplateSearchQuery,
    getFilteredTemplates,
    promptViewMode,
    templateViewMode,
    setPromptViewMode,
    setTemplateViewMode,
    isPromptEditorOpen,
    isPromptViewerOpen
  } = usePromptStore()
  
  const filteredTemplates = getFilteredTemplates()

  const filteredPrompts = getFilteredPrompts()

  const handleSearch = (query: string) => {
    setSearchFilters({ query })
  }

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split(':') as [keyof Pick<SortOptions, 'field'>['field'], SortOptions['direction']]
    setSortOptions({ field, direction })
  }

  const clearFilters = () => {
    setSearchFilters({
      query: '',
      categoryId: null,
      tags: [],
      isFavorite: undefined
    })
  }

  const hasActiveFilters = Boolean(
    searchFilters.query ||
    searchFilters.categoryId ||
    (searchFilters.tags && searchFilters.tags.length > 0) ||
    searchFilters.isFavorite !== undefined
  )

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
              </TabsList>
              
              {/* Info icons for each tab */}
              {activeTab === 'prompts' && (
                <InfoIcon 
                  title="Prompts"
                  description={
                    <div className="space-y-2">
                      <p>Create, organize, and manage your AI prompts with advanced features.</p>
                      <p><strong>Categories:</strong> Organize prompts with color-coded categories for easy identification.</p>
                      <p><strong>Tags:</strong> Add multiple tags to prompts for flexible organization and filtering.</p>
                      <p><strong>Advanced Search:</strong> Use syntax like 'tag:AI,Writing' or 'is:favorite' to find prompts quickly.</p>
                      <p><strong>Favorites:</strong> Mark important prompts as favorites for quick access.</p>
                      <p><strong>Templates:</strong> Apply pre-made templates to speed up prompt creation.</p>
                    </div>
                  }
                />
              )}
              
              {activeTab === 'templates' && (
                <InfoIcon 
                  title="Templates"
                  description={
                    <div className="space-y-2">
                      <p>Create reusable templates with variables for quick prompt generation.</p>
                      <p><strong>Variables:</strong> Use {`{{variableName}}`} syntax in your content to create placeholders that can be filled in when the template is used.</p>
                      <p><strong>Categories:</strong> Organize templates by assigning them to categories with color-coded labels.</p>
                      <p><strong>Search:</strong> Find templates by name, content, description, or variable names.</p>
                    </div>
                  }
                />
              )}
              
              {activeTab === 'testing' && (
                <InfoIcon 
                  title="Testing"
                  description={
                    <div className="space-y-2">
                      <p>Test your prompts with different AI models and configurations to optimize their performance.</p>
                      <p><strong>Multi-Model Testing:</strong> Compare how different AI models respond to your prompts.</p>
                      <p><strong>Parameter Tuning:</strong> Adjust temperature, max tokens, and other parameters to fine-tune responses.</p>
                      <p><strong>A/B Testing:</strong> Test multiple prompt variations to find the most effective one.</p>
                      <p><strong>Response Analysis:</strong> Evaluate and compare AI responses to improve your prompts.</p>
                    </div>
                  }
                />
              )}
            </div>
            
            {(activeTab === 'prompts' || activeTab === 'templates') && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'prompts') {
                      setPromptViewMode(promptViewMode === 'list' ? 'grid' : 'list')
                    } else {
                      setTemplateViewMode(templateViewMode === 'list' ? 'grid' : 'list')
                    }
                  }}
                >
                  {(activeTab === 'prompts' ? promptViewMode : templateViewMode) === 'list' ? (
                    <Grid className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'prompts') {
                      openPromptEditor()
                    } else {
                      openTemplateEditor()
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {activeTab === 'prompts' ? 'New Prompt' : 'New Template'}
                </Button>
              </div>
            )}
          </div>

          {activeTab === 'prompts' && (
            <div className="space-y-3">
              {/* Search and Controls Row */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                {/* Advanced Search */}
                <div className="flex-1 min-w-0">
                  <AdvancedSearchInput
                    value={searchFilters.query}
                    onChange={handleSearch}
                    placeholder="Search prompts... (try: tag:AI,Writing or is:favorite)"
                  />
                </div>

                {/* Sort and Filter Controls */}
                <div className="flex items-center gap-3 flex-shrink-0 lg:self-start lg:mt-0">
                  {/* Sort */}
                  <Select
                    value={`${sortOptions.field}:${sortOptions.direction}`}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger className="w-40 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_at:desc">
                        <div className="flex items-center">
                          <SortDesc className="h-4 w-4 mr-2" />
                          Last Modified
                        </div>
                      </SelectItem>
                      <SelectItem value="updated_at:asc">
                        <div className="flex items-center">
                          <SortAsc className="h-4 w-4 mr-2" />
                          Oldest First
                        </div>
                      </SelectItem>
                      <SelectItem value="title:asc">
                        <div className="flex items-center">
                          <SortAsc className="h-4 w-4 mr-2" />
                          Title A-Z
                        </div>
                      </SelectItem>
                      <SelectItem value="title:desc">
                        <div className="flex items-center">
                          <SortDesc className="h-4 w-4 mr-2" />
                          Title Z-A
                        </div>
                      </SelectItem>
                      <SelectItem value="created_at:desc">
                        <div className="flex items-center">
                          <SortDesc className="h-4 w-4 mr-2" />
                          Newest
                        </div>
                      </SelectItem>
                      <SelectItem value="created_at:asc">
                        <div className="flex items-center">
                          <SortAsc className="h-4 w-4 mr-2" />
                          Oldest
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filter indicator */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-10 px-3"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="text-xs">Clear</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'templates' && (
            <div className="space-y-3">
              {/* Template Search */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      className="pl-9 pr-9 h-10"
                    />
                    {templateSearchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTemplateSearchQuery('')}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {filteredTemplates.length > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground lg:self-center lg:mt-0">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                    {templateSearchQuery && ` (filtered)`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <TabsContent value="prompts" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {filteredPrompts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2">No prompts found</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {hasActiveFilters
                          ? "No prompts match your current filters. Try adjusting your search criteria."
                          : "Get started by creating your first prompt."
                        }
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <Button onClick={() => openPromptEditor()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Prompt
                        </Button>
                        {hasActiveFilters && (
                          <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
                          {hasActiveFilters && ' (filtered)'}
                        </p>
                      </div>
                      
                      {promptViewMode === 'list' ? (
                        <PromptList prompts={filteredPrompts} />
                      ) : (
                        <PromptGrid 
                          prompts={filteredPrompts} 
                          compactMode={isPromptEditorOpen || isPromptViewerOpen}
                        />
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="h-full m-0">
            <TemplateList 
              viewMode={templateViewMode} 
              filteredTemplates={filteredTemplates}
            />
          </TabsContent>

          <TabsContent value="testing" className="h-full m-0">
            <TestingPanel />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}