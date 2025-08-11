import { useState } from 'react'
import { Search, Filter, SortAsc, SortDesc, Grid, List, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AdvancedSearchInput } from '../search/advanced-search-input'
import { PromptList } from '../prompts/prompt-list'
import { PromptGrid } from '../prompts/prompt-grid'
import { TestingPanel } from '../testing/testing-panel'
import { usePromptStore } from '@/stores/usePromptStore'
import type { SortOptions } from '@/types'

export function MainContent() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [activeTab, setActiveTab] = useState('prompts')
  
  const {
    getFilteredPrompts,
    searchFilters,
    sortOptions,
    setSearchFilters,
    setSortOptions,
    openPromptEditor,
    isPromptEditorOpen,
    isPromptViewerOpen
  } = usePromptStore()

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
            <TabsList>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>
            
            {activeTab === 'prompts' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                >
                  {viewMode === 'list' ? (
                    <Grid className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => openPromptEditor()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Prompt
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
                      
                      {viewMode === 'list' ? (
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

          <TabsContent value="testing" className="h-full m-0">
            <TestingPanel />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}