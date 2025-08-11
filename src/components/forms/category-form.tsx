import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Palette } from 'lucide-react'
import { usePromptStore } from '@/stores/usePromptStore'
import { createCategorySchema, updateCategorySchema, CreateCategoryFormData, UpdateCategoryFormData } from '@/lib/validations'
import type { Category } from '@/types'

interface CategoryFormProps {
  category?: Category
  onSuccess?: () => void
  onCancel?: () => void
}

const COLOR_PRESETS = [
  '#007acc', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
  '#ff9f43', '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7'
]

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const { createCategory, updateCategory } = usePromptStore()
  
  const isEditing = !!category
  const schema = isEditing ? updateCategorySchema : createCategorySchema
  
  const form = useForm<CreateCategoryFormData | UpdateCategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      color: category?.color || '#007acc',
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

  const watchedColor = watch('color')

  const onSubmit = async (data: CreateCategoryFormData | UpdateCategoryFormData) => {
    try {
      if (isEditing && category) {
        await updateCategory(category.id, data as UpdateCategoryFormData)
      } else {
        await createCategory(data as CreateCategoryFormData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter category name..."
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
          placeholder="Add a description for this category..."
          className="min-h-[80px]"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Color */}
      <div className="space-y-4">
        <Label>Color</Label>
        
        {/* Current Color Display */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full border-2 border-border"
            style={{ backgroundColor: watchedColor }}
          />
          <Input
            type="color"
            value={watchedColor}
            onChange={(e) => setValue('color', e.target.value)}
            className="w-20 h-8 border-0 p-0"
          />
          <Input
            type="text"
            value={watchedColor}
            onChange={(e) => setValue('color', e.target.value)}
            placeholder="#007acc"
            className="flex-1"
            {...register('color')}
          />
        </div>

        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}

        {/* Color Presets */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            <Palette className="h-4 w-4 inline mr-1" />
            Quick Colors
          </Label>
          <div className="grid grid-cols-8 gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                style={{ backgroundColor: color }}
                onClick={() => setValue('color', color)}
                title={color}
              />
            ))}
          </div>
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
          {isEditing ? 'Update' : 'Create'} Category
        </Button>
      </div>
    </form>
  )
}