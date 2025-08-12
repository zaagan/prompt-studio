import { useState } from 'react'
import { Plus, Edit, Trash2, Folder, Palette, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CategoryModal } from '../modals/category-modal'
import { usePromptStore } from '@/stores/usePromptStore'
import type { Category } from '@/types'

export function CategoryManager() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { categories, prompts, deleteCategory, addToast } = usePromptStore()

  const handleCreateCategory = () => {
    setEditingCategory(undefined)
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    const promptCount = prompts.filter(p => p.category_id === category.id).length
    const message = promptCount > 0 
      ? `Are you sure you want to delete "${category.name}"? This category is used by ${promptCount} prompt${promptCount !== 1 ? 's' : ''}. The prompts will not be deleted but will have no category.`
      : `Are you sure you want to delete "${category.name}"?`
    
    if (confirm(message)) {
      try {
        await deleteCategory(category.id)
        addToast({
          type: 'success',
          title: 'Category Deleted',
          description: `"${category.name}" has been deleted successfully`
        })
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  const handleModalClose = (open: boolean) => {
    setCategoryModalOpen(open)
    if (!open) {
      setEditingCategory(undefined)
    }
  }

  const getPromptCount = (categoryId: number) => {
    return prompts.filter(p => p.category_id === categoryId).length
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="space-y-4 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
            {searchQuery && ` (filtered)`}
          </div>
          <Button onClick={handleCreateCategory}>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No categories found' : 'No categories yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search criteria.'
                    : 'Create your first category to organize your prompts'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => {
              const promptCount = getPromptCount(category.id)
              
              return (
                <Card key={category.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <CardTitle className="text-base">{category.name}</CardTitle>
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.description && (
                      <CardDescription className="mb-3 line-clamp-2">
                        {category.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Palette className="h-3 w-3" />
                        <span>{category.color}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
          </div>
        </div>
      </ScrollArea>

      {/* Category Modal */}
      <CategoryModal 
        open={categoryModalOpen}
        onOpenChange={handleModalClose}
        category={editingCategory}
      />
    </div>
  )
}