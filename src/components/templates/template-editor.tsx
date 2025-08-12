import { useState, useEffect } from 'react'
import { X, Save, Plus, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { usePromptStore } from '@/stores/usePromptStore'
import { cn } from '@/lib/utils'
import type { CreateTemplateData, UpdateTemplateData } from '@/types'

interface TemplateEditorProps {
  compact?: boolean
  onClose?: () => void
}

export function TemplateEditor({ compact = false, onClose }: TemplateEditorProps) {
  const {
    selectedTemplate,
    categories,
    createTemplate,
    updateTemplate,
    closeTemplateEditor,
    addToast,
    loading
  } = usePromptStore()

  const [formData, setFormData] = useState<{
    name: string
    description: string
    content: string
    variables: string[]
    category_id: number | null
  }>({
    name: '',
    description: '',
    content: '',
    variables: [],
    category_id: null
  })

  const [newVariable, setNewVariable] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (selectedTemplate) {
      setFormData({
        name: selectedTemplate.name,
        description: selectedTemplate.description || '',
        content: selectedTemplate.content,
        variables: [...selectedTemplate.variables],
        category_id: selectedTemplate.category_id
      })
    } else {
      setFormData({
        name: '',
        description: '',
        content: '',
        variables: [],
        category_id: null
      })
    }
  }, [selectedTemplate])

  const handleClose = () => {
    closeTemplateEditor()
    onClose?.()
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Name and content are required'
      })
      return
    }

    setIsSaving(true)
    try {
      if (selectedTemplate) {
        const updateData: UpdateTemplateData = {
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
          variables: formData.variables,
          category_id: formData.category_id || undefined
        }
        await updateTemplate(selectedTemplate.id, updateData)
      } else {
        const createData: CreateTemplateData = {
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
          variables: formData.variables,
          category_id: formData.category_id || undefined
        }
        await createTemplate(createData)
      }
      handleClose()
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }))
      setNewVariable('')
    }
  }

  const handleRemoveVariable = (variableToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(variable => variable !== variableToRemove)
    }))
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentContent = formData.content
      const beforeCursor = currentContent.substring(0, start)
      const afterCursor = currentContent.substring(end)
      const newContent = beforeCursor + `{{${variable}}}` + afterCursor
      
      setFormData(prev => ({ ...prev, content: newContent }))
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4
        textarea.focus()
      }, 0)
    }
  }

  // Extract variables from content
  const contentVariables = Array.from(formData.content.matchAll(/\{\{(\w+)\}\}/g), match => match[1])
  const uniqueContentVariables = [...new Set(contentVariables)]

  const isFormValid = formData.name.trim() && formData.content.trim()

  return (
    <div className={cn(
      "h-full bg-background flex flex-col",
      compact ? "border-l" : "border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {selectedTemplate ? 'Edit Template' : 'New Template'}
        </h2>
        <div className="flex items-center space-x-2">
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
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  placeholder="Enter template name..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="template-description">Description (optional)</Label>
                <Input
                  id="template-description"
                  placeholder="Add a description for this template..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="template-content">Content</Label>
                <Textarea
                  id="template-content"
                  placeholder="Enter your template content... Use {{variableName}} for variables."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[300px] resize-y font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  {formData.content.length} characters • Use {`{{variableName}}`} syntax for variables
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              {/* Add Variable */}
              <div className="space-y-2">
                <Label>Add Variable</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Variable name..."
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddVariable()
                      }
                    }}
                  />
                  <Button onClick={handleAddVariable} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Current Variables */}
              {formData.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Template Variables</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Click to insert into content:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 text-sm"
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

              {/* Variables Found in Content */}
              {uniqueContentVariables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables Found in Content</Label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueContentVariables.map((variable, index) => (
                      <Badge
                        key={index}
                        variant={formData.variables.includes(variable) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {variable}
                        {!formData.variables.includes(variable) && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              variables: [...prev.variables, variable] 
                            }))}
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

              {/* Variables Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">How Variables Work</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Variables allow you to create reusable templates with placeholders.</p>
                  <p>Use the syntax <code className="bg-muted px-1 rounded">{`{{variableName}}`}</code> in your content.</p>
                  <p>When the template is used, variables will be replaced with actual values.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
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

              {/* Template Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Template Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-xs text-muted-foreground mb-2">Content:</div>
                    <div className="text-sm font-mono whitespace-pre-wrap">
                      {formData.content || 'No content yet...'}
                    </div>
                  </div>
                  {formData.variables.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-2">Variables:</div>
                      <div className="flex flex-wrap gap-1">
                        {formData.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}