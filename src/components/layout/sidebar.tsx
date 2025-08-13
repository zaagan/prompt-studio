import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, Plus, Tag, Heart, Clock, Settings, MoreVertical, Edit, Trash2, Info, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePromptStore } from '@/stores/usePromptStore'
import { cn } from '@/lib/utils'
import AppIcon from '/assets/icon.png'
import { CategoryModal } from '../modals/category-modal'
import { ThemeSwitcher } from '../ui/theme-switcher'
import { KeyboardShortcutsHelp } from '../keyboard-shortcuts-help'
import { parseSearchQuery, formatSearchQuery } from '@/lib/search-parser'
import type { Category } from '@/types'

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
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
    openSettings,
    getRecentlyInteractedPrompts,
    openPromptViewer
  } = usePromptStore()

  const recentPrompts = getRecentlyInteractedPrompts().slice(0, 5)
  const favoritePrompts = prompts.filter(p => p.is_favorite)
  
  // Calculate prompt counts per category
  const getCategoryPromptCount = (categoryId: number) => {
    return prompts.filter(p => p.category_id === categoryId).length
  }
  
  const getAllCategoriesPromptCount = () => {
    return prompts.length
  }
  
  // Calculate prompt counts per tag
  const getTagPromptCount = (tag: string) => {
    return prompts.filter(p => p.tags.includes(tag)).length
  }
  
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
              <DropdownMenuItem onClick={() => handleCategoryFilter(null)} className="justify-between">
                <div className="flex items-center flex-1">
                  <Folder className="h-4 w-4 mr-2" />
                  All Categories
                </div>
                <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center">
                  {getAllCategoriesPromptCount()}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem 
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                  className="justify-between"
                >
                  <div className="flex items-center flex-1">
                    <div 
                      className="h-2 w-2 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                  <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center">
                    {getCategoryPromptCount(category.id)}
                  </span>
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
                      "justify-between",
                      currentParsedQuery.tags.includes(tag) && "bg-secondary"
                    )}
                  >
                    <div className="flex items-center flex-1">
                      <Tag className="h-3 w-3 mr-2" />
                      {tag}
                      {currentParsedQuery.tags.includes(tag) && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center">
                      {getTagPromptCount(tag)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Recent Prompts */}
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
                {recentPrompts.length > 0 ? (
                  recentPrompts.map((prompt) => (
                    <DropdownMenuItem 
                      key={prompt.id}
                      onClick={() => openPromptViewer(prompt)}
                      className="flex flex-col items-start p-2"
                    >
                      <div className="font-medium text-sm truncate w-full">{prompt.title}</div>
                      {prompt.description && (
                        <div className="text-xs text-muted-foreground truncate w-full mt-1">
                          {prompt.description}
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No recent interactions
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          <div className="flex-1" />
          
          {/* Theme Switcher */}
          <ThemeSwitcher collapsed={true} />
          
          {/* Keyboard Shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setShortcutsOpen(true)}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Keyboard Shortcuts</p>
            </TooltipContent>
          </Tooltip>

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
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp 
          open={shortcutsOpen} 
          onOpenChange={setShortcutsOpen} 
        />
      </TooltipProvider>
    )
  }

  return (
    <div className="h-full bg-muted/30 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={AppIcon} 
              alt="Prompt Studio" 
              className="h-5 w-5 object-contain rounded"
            />
            <h2 className="text-sm font-semibold">Prompt Studio</h2>
          </div>
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
              className="w-full justify-start h-8 text-xs px-2"
            >
              <Heart className={cn(
                "h-4 w-4 mr-2 flex-shrink-0",
                currentParsedQuery.isFavorite === true && "fill-current"
              )} />
              <span className="truncate">Favorites</span>
              {favoritePrompts.length > 0 && (
                <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center flex-shrink-0 ml-2">
                  {favoritePrompts.length > 99 ? '99+' : favoritePrompts.length}
                </span>
              )}
            </Button>
          </div>

          {/* Categories */}
          <Collapsible 
            open={sectionsOpen.categories}
            onOpenChange={() => toggleSection('categories')}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs font-medium px-2"
              >
                {sectionsOpen.categories ? (
                  <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span className="truncate">Categories</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 flex-shrink-0 ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCategoryModalOpen(true)
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 ml-6">
              <Button
                variant={!currentParsedQuery.category ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleCategoryFilter(null)}
                className="w-full justify-start h-7 text-xs"
              >
                <span className="text-left">All Categories</span>
                <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center flex-shrink-0 ml-2">
                  {getAllCategoriesPromptCount()}
                </span>
              </Button>
              {categories.map((category) => (
                <div key={category.id} className="group">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={currentParsedQuery.category === category.name ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => handleCategoryFilter(category.id)}
                          className="w-full justify-start h-7 text-xs px-2"
                        >
                          <div 
                            className="h-2 w-2 rounded-full mr-2 shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate text-left">{category.name}</span>
                          <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center flex-shrink-0 ml-2 mr-1">
                            {getCategoryPromptCount(category.id)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                                onClick={(e) => e.stopPropagation()}
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
                        </Button>
                      </TooltipTrigger>
                      {category.description && (
                        <TooltipContent side="right">
                          <p className="max-w-xs">{category.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                  className="w-full justify-start h-8 text-xs font-medium px-2"
                >
                  {sectionsOpen.tags ? (
                    <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  <span className="truncate">Tags</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 flex-shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      openSettings()
                      // Note: Would need to add logic to switch to tags tab in settings
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
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
                    <span className="truncate text-left">{tag}</span>
                    <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none min-w-[18px] text-center flex-shrink-0 ml-2">
                      {getTagPromptCount(tag)}
                    </span>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Recent */}
          <Collapsible 
              open={sectionsOpen.recent}
              onOpenChange={() => toggleSection('recent')}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs font-medium px-2"
                >
                  {sectionsOpen.recent ? (
                    <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  <span className="truncate">Recent</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-6">
                {recentPrompts.length > 0 ? (
                  recentPrompts.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => openPromptViewer(prompt)}
                      className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="truncate">{prompt.title}</span>
                    </Button>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground px-2">
                    No recent prompts
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
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
          onClick={() => setShortcutsOpen(true)}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Keyboard Shortcuts
        </Button>
        
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
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp 
        open={shortcutsOpen} 
        onOpenChange={setShortcutsOpen} 
      />
    </div>
  )
}