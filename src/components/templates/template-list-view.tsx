import { useState } from 'react'
import { Edit, Trash2, Sparkles, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePromptStore } from '@/stores/usePromptStore'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Template } from '@/types'

interface TemplateListViewProps {
  templates: Template[]
}

export function TemplateListView({ templates }: TemplateListViewProps) {
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

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown date'
    }
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
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
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group border rounded-lg p-4 hover:shadow-sm hover:border-accent transition-all cursor-pointer"
          onClick={() => handleEdit(template)}
        >
          {/* Header section with title and actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-medium text-base truncate">
                  {template.name}
                </h3>
              </div>
              
              {template.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {template.description}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {truncateContent(template.content)}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(template)
                }}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(template)
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Footer section with metadata and variables */}
          <div className="space-y-2 border-t pt-3 mt-3">
            {/* Metadata row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {template.category_name && (
                <div className="flex items-center gap-1 min-w-0">
                  <div 
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: template.category_color }}
                  />
                  <span className="truncate">{template.category_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(template.updated_at)}</span>
              </div>
            </div>

            {/* Variables row */}
            {template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.variables.slice(0, 6).map((variable, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs h-5 px-2"
                  >
                    {`{{${variable}}}`}
                  </Badge>
                ))}
                {template.variables.length > 6 && (
                  <Badge
                    variant="outline"
                    className="text-xs h-5 px-2"
                  >
                    +{template.variables.length - 6} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}