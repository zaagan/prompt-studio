import { useState } from 'react'
import { Edit, Trash2, Sparkles, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePromptStore } from '@/stores/usePromptStore'
import { cn } from '@/lib/utils'
import type { Template } from '@/types'

interface TemplateGridProps {
  templates: Template[]
}

export function TemplateGrid({ templates }: TemplateGridProps) {
  const { deleteTemplate, openTemplateEditor, addToast } = usePromptStore()

  const handleEdit = (template: Template) => {
    openTemplateEditor(template)
  }

  const handleDelete = async (template: Template) => {
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

  const handleCreateNew = () => {
    openTemplateEditor()
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2">No templates yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create templates with variables for reusable prompts that can be customized when used.
        </p>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="group transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <CardTitle className="text-base truncate">{template.name}</CardTitle>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {template.description && (
              <CardDescription className="mb-3 line-clamp-2">
                {template.description}
              </CardDescription>
            )}
            
            <div className="space-y-2">
              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 4).map((variable, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                  {template.variables.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.variables.length - 4} more
                    </Badge>
                  )}
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
            
            <div className="mt-3 p-2 bg-muted rounded text-xs font-mono line-clamp-4">
              {template.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}