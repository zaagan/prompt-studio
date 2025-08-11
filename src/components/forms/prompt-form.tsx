import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { X, Tag, Heart, Save, Loader2 } from 'lucide-react'
import { usePromptStore } from '@/stores/usePromptStore'
import { createPromptSchema, updatePromptSchema, CreatePromptFormData, UpdatePromptFormData } from '@/lib/validations'
import { useState } from 'react'
import type { Prompt } from '@/types'

interface PromptFormProps {
  prompt?: Prompt
  onSuccess?: () => void
  onCancel?: () => void
}

export function PromptForm({ prompt, onSuccess, onCancel }: PromptFormProps) {
  const [newTag, setNewTag] = useState('')
  const { categories, templates, createPrompt, updatePrompt } = usePromptStore()
  
  const isEditing = !!prompt
  const schema = isEditing ? updatePromptSchema : createPromptSchema
  
  const form = useForm<CreatePromptFormData | UpdatePromptFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: prompt?.title || '',
      content: prompt?.content || '',
      description: prompt?.description || '',
      category_id: prompt?.category_id || undefined,
      template_id: prompt?.template_id || undefined,
      tags: prompt?.tags || [],
      is_favorite: prompt?.is_favorite || false,
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

  const watchedTags = watch('tags') || []
  const watchedFavorite = watch('is_favorite')

  const onSubmit = async (data: CreatePromptFormData | UpdatePromptFormData) => {
    try {
      if (isEditing && prompt) {
        await updatePrompt(prompt.id, data as UpdatePromptFormData)
      } else {
        await createPrompt(data as CreatePromptFormData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save prompt:', error)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove))
  }

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
      setValue('template_id', undefined)
      return
    }

    const template = templates.find(t => t.id === parseInt(templateId))
    if (template) {
      setValue('template_id', parseInt(templateId))
      setValue('content', template.content)
      if (template.category_id) {
        setValue('category_id', template.category_id)
      }
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Enter prompt title..."
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Template Selection */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <Label>Template (optional)</Label>
          <Select onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No template</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">
          Content <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="Enter your prompt content..."
          className="min-h-[200px]"
          {...register('content')}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
        <div className="text-xs text-muted-foreground">
          {watch('content')?.length || 0} characters
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Add a description for this prompt..."
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

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
          />
          <Button type="button" onClick={handleAddTag} size="sm">
            <Tag className="h-4 w-4" />
          </Button>
        </div>
        {watchedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {watchedTags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="favorite"
          checked={watchedFavorite}
          onCheckedChange={(checked) => setValue('is_favorite', checked)}
        />
        <Label htmlFor="favorite" className="flex items-center space-x-2 cursor-pointer">
          <Heart className={`h-4 w-4 ${watchedFavorite ? 'fill-current text-red-500' : ''}`} />
          <span>Mark as favorite</span>
        </Label>
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
          {isEditing ? 'Update' : 'Create'} Prompt
        </Button>
      </div>
    </form>
  )
}