import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, X, Plus, Sparkles } from 'lucide-react'
import { usePromptStore } from '@/stores/usePromptStore'
import { createTemplateSchema, updateTemplateSchema, CreateTemplateFormData, UpdateTemplateFormData } from '@/lib/validations'
import { useState } from 'react'
import type { Template } from '@/types'

interface TemplateFormProps {
  template?: Template
  onSuccess?: () => void
  onCancel?: () => void
}

export function TemplateForm({ template, onSuccess, onCancel }: TemplateFormProps) {
  const [newVariable, setNewVariable] = useState('')
  const { categories, createTemplate, updateTemplate } = usePromptStore()
  
  const isEditing = !!template
  const schema = isEditing ? updateTemplateSchema : createTemplateSchema
  
  const form = useForm<CreateTemplateFormData | UpdateTemplateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      content: template?.content || '',
      variables: template?.variables || [],
      category_id: template?.category_id || undefined,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = form

  const watchedVariables = watch('variables') || []
  const watchedContent = watch('content') || ''

  const onSubmit = async (data: CreateTemplateFormData | UpdateTemplateFormData) => {
    try {
      if (isEditing && template) {
        await updateTemplate(template.id, data as UpdateTemplateFormData)
      } else {
        await createTemplate(data as CreateTemplateFormData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleAddVariable = () => {
    if (newVariable.trim() && !watchedVariables.includes(newVariable.trim())) {
      setValue('variables', [...watchedVariables, newVariable.trim()])
      setNewVariable('')
    }
  }

  const handleRemoveVariable = (variableToRemove: string) => {
    setValue('variables', watchedVariables.filter(variable => variable !== variableToRemove))
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentContent = watchedContent
      const beforeCursor = currentContent.substring(0, start)
      const afterCursor = currentContent.substring(end)
      const newContent = beforeCursor + `{{${variable}}}` + afterCursor
      
      setValue('content', newContent)
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4
        textarea.focus()
      }, 0)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  // Extract variables from content
  const contentVariables = Array.from(watchedContent.matchAll(/\{\{(\w+)\}\}/g), match => match[1])
  const uniqueContentVariables = [...new Set(contentVariables)]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter template name..."
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Add a description for this template..."
          className="min-h-[80px]"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={watch('category_id')?.toString() || ''}
          onValueChange={(value) => setValue('category_id', value ? parseInt(value) : undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Variables */}
      <div className="space-y-4">
        <Label>Variables</Label>
        
        {/* Add Variable */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add a variable name..."
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddVariable()
              }
            }}
          />
          <Button type="button" onClick={handleAddVariable} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Variable List */}
        {watchedVariables.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Click to insert into content:</div>
            <div className="flex flex-wrap gap-2">
              {watchedVariables.map((variable, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleInsertVariable(variable)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {variable}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveVariable(variable)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Variables found in content */}
        {uniqueContentVariables.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Variables found in content:</div>
            <div className="flex flex-wrap gap-2">
              {uniqueContentVariables.map((variable, index) => (
                <Badge
                  key={index}
                  variant={watchedVariables.includes(variable) ? "default" : "outline"}
                  className="text-xs"
                >
                  {variable}
                  {!watchedVariables.includes(variable) && (
                    <button
                      type="button"
                      onClick={() => setValue('variables', [...watchedVariables, variable])}
                      className="ml-1 hover:text-primary"
                      title="Add to variables list"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">
          Content <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="Enter your template content... Use {{variableName}} for variables."
          className="min-h-[200px] font-mono"
          {...register('content')}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{watchedContent.length} characters</span>
          <span>Use {`{{variableName}}`} syntax for variables</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? 'Update' : 'Create'} Template
        </Button>
      </div>
    </form>
  )
}