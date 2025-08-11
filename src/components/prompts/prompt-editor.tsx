import { useState, useEffect } from 'react'
import { X, Save, Copy, Heart, Tag, Folder, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { usePromptStore } from '@/stores/usePromptStore'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Prompt, CreatePromptData, UpdatePromptData } from '@/types'

interface PromptEditorProps {
  compact?: boolean
  onClose?: () => void
}

export function PromptEditor({ compact = false, onClose }: PromptEditorProps) {
  const {
    selectedPrompt,
    categories,
    templates,
    createPrompt,
    updatePrompt,
    closePromptEditor,
    addToast,
    loading
  } = usePromptStore()

  const [formData, setFormData] = useState<{
    title: string
    content: string
    description: string
    category_id: number | null
    template_id: number | null
    tags: string[]
    is_favorite: boolean
  }>({
    title: '',
    content: '',
    description: '',
    category_id: null,
    template_id: null,
    tags: [],
    is_favorite: false
  })

  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (selectedPrompt) {
      setFormData({
        title: selectedPrompt.title,
        content: selectedPrompt.content,
        description: selectedPrompt.description || '',
        category_id: selectedPrompt.category_id,
        template_id: selectedPrompt.template_id,
        tags: [...selectedPrompt.tags], // Convert readonly array to mutable array
        is_favorite: selectedPrompt.is_favorite
      })
    } else {
      setFormData({
        title: '',
        content: '',
        description: '',
        category_id: null,
        template_id: null,
        tags: [],
        is_favorite: false
      })
    }
  }, [selectedPrompt])

  const handleClose = () => {
    closePromptEditor()
    onClose?.()
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Title and content are required'
      })
      return
    }

    setIsSaving(true)
    try {
      if (selectedPrompt) {
        const updateData: UpdatePromptData = {
          title: formData.title,
          content: formData.content,
          description: formData.description || undefined,
          category_id: formData.category_id || undefined,
          template_id: formData.template_id || undefined,
          tags: formData.tags,
          is_favorite: formData.is_favorite
        }
        await updatePrompt(selectedPrompt.id, updateData)
      } else {
        const createData: CreatePromptData = {
          title: formData.title,
          content: formData.content,
          description: formData.description || undefined,
          category_id: formData.category_id || undefined,
          template_id: formData.template_id || undefined,
          tags: formData.tags,
          is_favorite: formData.is_favorite
        }
        await createPrompt(createData)
      }
      handleClose()
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyContent = async () => {
    try {
      await window.electronAPI.copyToClipboard(formData.content)
      addToast({
        type: 'success',
        title: 'Copied',
        description: 'Content copied to clipboard'
      })
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTemplateChange = async (templateId: string) => {
    if (!templateId || templateId === 'none') {
      setFormData(prev => ({ ...prev, template_id: null }))
      return
    }

    try {
      const template = templates.find(t => t.id === parseInt(templateId))
      if (template) {
        setFormData(prev => ({
          ...prev,
          template_id: parseInt(templateId),
          content: template.content,
          category_id: template.category_id
        }))
      }
    } catch (error) {
      console.error('Failed to apply template:', error)
    }
  }

  const isFormValid = formData.title.trim() && formData.content.trim()

  return (
    <div className={cn(
      "h-full bg-background flex flex-col",
      compact ? "border-l" : "border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {selectedPrompt ? 'Edit Prompt' : 'New Prompt'}
        </h2>
        <div className="flex items-center space-x-2">
          {formData.content && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              {selectedPrompt && <TabsTrigger value="history">History</TabsTrigger>}
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter prompt title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Template Selection */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="template">Template (optional)</Label>
                  <Select
                    value={formData.template_id?.toString() || 'none'}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your prompt content..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[200px] resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {formData.content.length} characters
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this prompt..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id?.toString() || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    category_id: value === 'none' ? null : parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
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
                  <Button onClick={handleAddTag} size="sm">
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
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
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_favorite: checked }))}
                />
                <Label htmlFor="favorite" className="flex items-center space-x-2 cursor-pointer">
                  <Heart className={cn(
                    "h-4 w-4",
                    formData.is_favorite && "fill-current text-red-500"
                  )} />
                  <span>Mark as favorite</span>
                </Label>
              </div>
            </TabsContent>

            {selectedPrompt && (
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Version History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span>{formatDistanceToNow(new Date(selectedPrompt.created_at), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last modified:</span>
                        <span>{formatDistanceToNow(new Date(selectedPrompt.updated_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}