import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, Plus, Tag, Heart, Clock, Settings, MoreVertical, Edit, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePromptStore } from '@/stores/usePromptStore'
import { cn } from '@/lib/utils'
import { CategoryModal } from '../modals/category-modal'
import { ThemeSwitcher } from '../ui/theme-switcher'
import { parseSearchQuery, formatSearchQuery } from '@/lib/search-parser'
import type { Category } from '@/types'

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [sectionsOpen, setSectionsOpen] = useState({
    categories: true,
    tags: true,
    recent: true
  })

  const {
    categories,
    tags,
    prompts,
    searchFilters,
    setSearchFilters,
    deleteCategory,
    addToast,
    openSettings
  } = usePromptStore()

  const recentPrompts = prompts.slice(0, 5)
  const favoritePrompts = prompts.filter(p => p.is_favorite)
  
  // Parse current search query to get active filters
  const currentParsedQuery = parseSearchQuery(searchFilters.query || '')

  const handleCategoryFilter = (categoryId: number | null) => {
    const currentQuery = searchFilters.query || ''
    const parsedQuery = parseSearchQuery(currentQuery)
    
    // Find category name for the query string
    const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name || '' : ''
    
    // Create updated query object
    const updatedQuery = {
      ...parsedQuery,
      category: categoryName
    }
    
    // Format back to query string
    const newQueryString = formatSearchQuery(updatedQuery)
    
    // Update the search filters
    setSearchFilters({ 
      query: newQueryString,
      categoryId 
    })
  }

  const handleTagFilter = (tag: string) => {
    const currentQuery = searchFilters.query || ''
    const parsedQuery = parseSearchQuery(currentQuery)
    
    // Toggle the tag in the parsed query
    const currentTags = parsedQuery.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    // Create updated query object
    const updatedQuery = {
      ...parsedQuery,
      tags: newTags
    }
    
    // Format back to query string
    const newQueryString = formatSearchQuery(updatedQuery)
    
    // Update the search filters with the new query string
    setSearchFilters({ 
      query: newQueryString,
      tags: newTags 
    })
  }

  const handleFavoriteFilter = () => {
    const currentQuery = searchFilters.query || ''
    const parsedQuery = parseSearchQuery(currentQuery)
    
    // Toggle favorite filter
    const newIsFavorite = searchFilters.isFavorite === true ? undefined : true
    
    // Create updated query object
    const updatedQuery = {
      ...parsedQuery,
      isFavorite: newIsFavorite
    }
    
    // Format back to query string
    const newQueryString = formatSearchQuery(updatedQuery)
    
    // Update the search filters
    setSearchFilters({ 
      query: newQueryString,
      isFavorite: newIsFavorite 
    })
  }

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"? This will remove the category from all prompts.`)) {
      try {
        await deleteCategory(category.id)
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  const handleCategoryModalClose = (open: boolean) => {
    setCategoryModalOpen(open)
    if (!open) {
      setEditingCategory(undefined)
    }
  }

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="w-12 h-full bg-muted/30 border-r flex flex-col items-center py-4 space-y-2">
          {/* Add New Prompt */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => usePromptStore.getState().openPromptEditor()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add New Prompt</p>
            </TooltipContent>
          </Tooltip>

          {/* Favorites Filter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={currentParsedQuery.isFavorite === true ? "secondary" : "ghost"}
                size="icon" 
                className="h-8 w-8 relative"
                onClick={handleFavoriteFilter}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  currentParsedQuery.isFavorite === true && "fill-current text-red-500"
                )} />
                {favoritePrompts.length > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {favoritePrompts.length > 9 ? '9+' : favoritePrompts.length}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Favorites ({favoritePrompts.length})</p>
            </TooltipContent>
          </Tooltip>

          {/* Categories Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={currentParsedQuery.category ? "secondary" : "ghost"}
                    size="icon" 
                    className="h-8 w-8 relative"
                  >
                    <Folder className="h-4 w-4" />
                    {currentParsedQuery.category && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Categories</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={() => handleCategoryFilter(null)}>
                <Folder className="h-4 w-4 mr-2" />
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem 
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                >
                  <div 
                    className="h-2 w-2 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCategoryModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Dropdown */}
          {tags.length > 0 && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={currentParsedQuery.tags.length > 0 ? "secondary" : "ghost"}
                      size="icon" 
                      className="h-8 w-8 relative"
                    >
                      <Tag className="h-4 w-4" />
                      {currentParsedQuery.tags.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                        >
                          {currentParsedQuery.tags.length > 9 ? '9+' : currentParsedQuery.tags.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tags ({currentParsedQuery.tags.length} selected)</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="start" className="max-h-64 overflow-y-auto">
                {tags.map((tag) => (
                  <DropdownMenuItem 
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={cn(
                      currentParsedQuery.tags.includes(tag) && "bg-secondary"
                    )}
                  >
                    <Tag className="h-3 w-3 mr-2" />
                    {tag}
                    {currentParsedQuery.tags.includes(tag) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Recent Prompts */}
          {recentPrompts.length > 0 && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Clock className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Recent Prompts</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="start" className="w-56">
                {recentPrompts.map((prompt) => (
                  <DropdownMenuItem 
                    key={prompt.id}
                    onClick={() => usePromptStore.getState().openPromptViewer(prompt)}
                    className="flex flex-col items-start p-2"
                  >
                    <div className="font-medium text-sm truncate w-full">{prompt.title}</div>
                    {prompt.description && (
                      <div className="text-xs text-muted-foreground truncate w-full mt-1">
                        {prompt.description}
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex-1" />
          
          {/* Theme Switcher */}
          <ThemeSwitcher collapsed={true} />
          
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={openSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Category Modal */}
        <CategoryModal 
          open={categoryModalOpen}
          onOpenChange={handleCategoryModalClose}
          category={editingCategory}
        />
      </TooltipProvider>
    )
  }

  return (
    <div className="h-full bg-muted/30 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Prompt Studio</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => usePromptStore.getState().openPromptEditor()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Quick Filters */}
          <div className="space-y-1">
            <Button
              variant={currentParsedQuery.isFavorite === true ? "secondary" : "ghost"}
              size="sm"
              onClick={handleFavoriteFilter}
              className="w-full justify-start h-8 text-xs"
            >
              <Heart className={cn(
                "h-4 w-4 mr-2",
                currentParsedQuery.isFavorite === true && "fill-current"
              )} />
              Favorites
              {favoritePrompts.length > 0 && (
                <Badge variant="secondary" className="ml-auto h-5 text-xs">
                  {favoritePrompts.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Categories */}
          <Collapsible 
            open={sectionsOpen.categories}
            onOpenChange={() => toggleSection('categories')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start h-8 text-xs font-medium"
                >
                  {sectionsOpen.categories ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  Categories
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 mr-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCategoryModalOpen(true)
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 ml-6">
              <Button
                variant={!currentParsedQuery.category ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleCategoryFilter(null)}
                className="w-full justify-start h-7 text-xs"
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <div key={category.id} className="group flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={currentParsedQuery.category === category.name ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => handleCategoryFilter(category.id)}
                          className="flex-1 justify-start h-7 text-xs"
                        >
                          <div 
                            className="h-2 w-2 rounded-full mr-2 shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate">{category.name}</span>
                        </Button>
                      </TooltipTrigger>
                      {category.description && (
                        <TooltipContent side="right">
                          <p className="max-w-xs">{category.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  
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
                      {category.description && (
                        <>
                          <DropdownMenuItem className="text-xs" disabled>
                            <Info className="h-3 w-3 mr-2" />
                            <span className="max-w-[200px] truncate">{category.description}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCategory(category)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Tags */}
          {tags.length > 0 && (
            <Collapsible 
              open={sectionsOpen.tags}
              onOpenChange={() => toggleSection('tags')}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs font-medium"
                >
                  {sectionsOpen.tags ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  Tags
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-6">
                {tags.map((tag) => (
                  <Button
                    key={tag}
                    variant={currentParsedQuery.tags.includes(tag) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleTagFilter(tag)}
                    className="w-full justify-start h-7 text-xs"
                  >
                    <Tag className="h-3 w-3 mr-2" />
                    <span className="truncate">{tag}</span>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Recent */}
          {recentPrompts.length > 0 && (
            <Collapsible 
              open={sectionsOpen.recent}
              onOpenChange={() => toggleSection('recent')}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs font-medium"
                >
                  {sectionsOpen.recent ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  Recent
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-6">
                {recentPrompts.map((prompt) => (
                  <Button
                    key={prompt.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => usePromptStore.getState().selectPrompt(prompt)}
                    className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="truncate">{prompt.title}</span>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t space-y-1">
        {/* Theme Switcher */}
        <ThemeSwitcher />
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 text-xs"
          onClick={openSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
      
      {/* Category Modal */}
      <CategoryModal 
        open={categoryModalOpen}
        onOpenChange={handleCategoryModalClose}
        category={editingCategory}
      />
    </div>
  )
}