import { useState } from 'react'
import { Plus, Edit, Trash2, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePromptStore } from '@/stores/usePromptStore'
import type { Template } from '@/types'

export function TemplateManager() {
  const { templates, categories, deleteTemplate, addToast } = usePromptStore()

  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id)
        addToast({
          type: 'success',
          title: 'Template Deleted',
          description: `"${template.name}" has been deleted successfully`
        })
      } catch (error) {
        console.error('Failed to delete template:', error)
      }
    }
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return null
    const category = categories.find(c => c.id === categoryId)
    return category?.name
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Template Management</h2>
        <p className="text-muted-foreground">
          Create reusable templates with variables for quick prompt generation
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'}
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pb-4">
          <div className="space-y-4">
            {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create templates with variables for reusable prompts
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <CardDescription className="mb-3">
                      {template.description}
                    </CardDescription>
                  )}
                  
                  <div className="space-y-2">
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {template.category_name && (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: template.category_color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {template.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-2 bg-muted rounded text-xs font-mono line-clamp-3">
                    {template.content}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}