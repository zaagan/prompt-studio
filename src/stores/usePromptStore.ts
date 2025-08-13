import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { parseSearchQuery } from '@/lib/search-parser'
import type { 
  Prompt, 
  Category, 
  Template, 
  CreatePromptData, 
  UpdatePromptData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateTemplateData,
  UpdateTemplateData,
  SearchFilters,
  SortOptions,
  ToastMessage
} from '@/types'

interface PromptStore {
  // State
  prompts: readonly Prompt[]
  categories: readonly Category[]
  templates: readonly Template[]
  tags: readonly string[]
  loading: boolean
  error: string | null
  
  // Filters and search
  searchFilters: SearchFilters
  sortOptions: SortOptions
  
  // Template filters
  templateSearchQuery: string
  
  // View modes
  promptViewMode: 'list' | 'grid'
  templateViewMode: 'list' | 'grid'
  
  // UI state
  selectedPrompt: Prompt | null
  isPromptEditorOpen: boolean
  isPromptViewerOpen: boolean
  isSettingsOpen: boolean
  
  // Template editor state
  selectedTemplate: Template | null
  isTemplateEditorOpen: boolean
  
  // Toast notifications
  toasts: readonly ToastMessage[]
  
  // Draft persistence
  draftFormData: any
  
  // Recently interacted prompts (IDs in order of interaction)
  recentlyInteractedIds: number[]
  
  // Actions
  // Data fetching
  fetchPrompts: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchTemplates: () => Promise<void>
  fetchTags: () => Promise<void>
  fetchAllData: () => Promise<void>
  
  // Prompt operations
  createPrompt: (data: CreatePromptData) => Promise<void>
  updatePrompt: (id: number, data: UpdatePromptData) => Promise<void>
  deletePrompt: (id: number) => Promise<void>
  duplicatePrompt: (id: number) => Promise<void>
  selectPrompt: (prompt: Prompt | null) => void
  
  // Category operations
  createCategory: (data: CreateCategoryData) => Promise<void>
  updateCategory: (id: number, data: UpdateCategoryData) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  
  // Template operations
  createTemplate: (data: CreateTemplateData) => Promise<void>
  updateTemplate: (id: number, data: UpdateTemplateData) => Promise<void>
  deleteTemplate: (id: number) => Promise<void>
  selectTemplate: (template: Template | null) => void
  
  // Search and filtering
  setSearchFilters: (filters: Partial<SearchFilters>) => void
  setSortOptions: (options: Partial<SortOptions>) => void
  getFilteredPrompts: () => readonly Prompt[]
  getRecentlyInteractedPrompts: () => readonly Prompt[]
  searchPrompts: (query: string) => Promise<void>
  
  // Template search
  setTemplateSearchQuery: (query: string) => void
  getFilteredTemplates: () => readonly Template[]
  
  // View modes
  setPromptViewMode: (mode: 'list' | 'grid') => void
  setTemplateViewMode: (mode: 'list' | 'grid') => void
  
  // UI actions
  openPromptEditor: (prompt?: Prompt) => void
  closePromptEditor: () => void
  openPromptViewer: (prompt: Prompt) => void
  closePromptViewer: () => void
  openSettings: () => void
  closeSettings: () => void
  
  // Template editor actions
  openTemplateEditor: (template?: Template) => void
  closeTemplateEditor: () => void
  
  // Draft persistence
  saveDraftFormData: (formData: any) => void
  clearDraftFormData: () => void
  getDraftFormData: () => any
  
  // Toast management
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Error handling
  setError: (error: string | null) => void
  clearError: () => void
}

const generateToastId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Persistence helpers
const STORAGE_KEYS = {
  EDITOR_STATE: 'promptStudio_editorState',
  SELECTED_PROMPT: 'promptStudio_selectedPrompt',
  DRAFT_FORM_DATA: 'promptStudio_draftFormData',
  PROMPT_VIEW_MODE: 'promptStudio_promptViewMode',
  TEMPLATE_VIEW_MODE: 'promptStudio_templateViewMode'
}

const getStoredEditorState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_STATE)
    return stored ? JSON.parse(stored) : { isOpen: false }
  } catch {
    return { isOpen: false }
  }
}

const getStoredSelectedPrompt = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_PROMPT)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const persistEditorState = (isOpen: boolean, selectedPrompt: Prompt | null) => {
  try {
    localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify({ isOpen }))
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROMPT, JSON.stringify(selectedPrompt))
  } catch {
    // Ignore storage errors
  }
}

const clearPersistedEditorState = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.EDITOR_STATE)
    localStorage.removeItem(STORAGE_KEYS.SELECTED_PROMPT)
    localStorage.removeItem(STORAGE_KEYS.DRAFT_FORM_DATA)
  } catch {
    // Ignore storage errors
  }
}

const persistDraftFormData = (formData: any) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT_FORM_DATA, JSON.stringify(formData))
  } catch {
    // Ignore storage errors
  }
}

const getStoredDraftFormData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DRAFT_FORM_DATA)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const getStoredViewMode = (key: string, defaultMode: 'list' | 'grid' = 'list') => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultMode
  } catch {
    return defaultMode
  }
}

const persistViewMode = (key: string, mode: 'list' | 'grid') => {
  try {
    localStorage.setItem(key, JSON.stringify(mode))
  } catch {
    // Ignore storage errors
  }
}

// Track recently interacted prompts
const MAX_RECENT_ITEMS = 10
const trackInteraction = (promptId: number, currentIds: number[]): number[] => {
  // Remove the ID if it already exists
  const filtered = currentIds.filter(id => id !== promptId)
  // Add to the beginning
  const updated = [promptId, ...filtered].slice(0, MAX_RECENT_ITEMS)
  // Persist to localStorage
  localStorage.setItem('recentlyInteractedPrompts', JSON.stringify(updated))
  return updated
}

export const usePromptStore = create<PromptStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      prompts: [],
      categories: [],
      templates: [],
      tags: [],
      loading: false,
      error: null,
      
      searchFilters: {
        query: '',
        categoryId: null,
        tags: [],
        isFavorite: undefined
      },
      
      sortOptions: {
        field: 'updated_at',
        direction: 'desc'
      },
      
      templateSearchQuery: '',
      
      promptViewMode: getStoredViewMode(STORAGE_KEYS.PROMPT_VIEW_MODE, 'list'),
      templateViewMode: getStoredViewMode(STORAGE_KEYS.TEMPLATE_VIEW_MODE, 'list'),
      
      selectedPrompt: getStoredSelectedPrompt(),
      isPromptEditorOpen: getStoredEditorState().isOpen,
      isPromptViewerOpen: false,
      isSettingsOpen: false,
      
      selectedTemplate: null,
      isTemplateEditorOpen: false,
      
      toasts: [],
      draftFormData: getStoredDraftFormData(),
      recentlyInteractedIds: JSON.parse(localStorage.getItem('recentlyInteractedPrompts') || '[]'),

      // Data fetching actions
      fetchPrompts: async () => {
        try {
          set({ loading: true, error: null })
          const prompts = await window.electronAPI.getAllPrompts()
          set({ prompts, loading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prompts'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await window.electronAPI.getAllCategories()
          set({ categories })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories'
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      fetchTemplates: async () => {
        try {
          const templates = await window.electronAPI.getAllTemplates()
          set({ templates })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates'
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      fetchTags: async () => {
        try {
          const tags = await window.electronAPI.getAllTags()
          set({ tags })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tags'
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      fetchAllData: async () => {
        await Promise.all([
          get().fetchPrompts(),
          get().fetchCategories(),
          get().fetchTemplates(),
          get().fetchTags()
        ])
      },

      // Prompt operations
      createPrompt: async (data: CreatePromptData) => {
        try {
          set({ loading: true, error: null })
          const newPrompt = await window.electronAPI.createPrompt(data)
          const { prompts } = get()
          set({ 
            prompts: [newPrompt, ...prompts],
            loading: false 
          })
          // Clear editor persistence after successful save
          clearPersistedEditorState()
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Prompt created successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create prompt'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      updatePrompt: async (id: number, data: UpdatePromptData) => {
        try {
          set({ loading: true, error: null })
          const updatedPrompt = await window.electronAPI.updatePrompt(id, data)
          const { prompts, recentlyInteractedIds } = get()
          const updatedPrompts = prompts.map(p => p.id === id ? updatedPrompt : p)
          
          // Track interaction (edit or favorite)
          const updatedRecentIds = trackInteraction(id, recentlyInteractedIds)
          
          set({ 
            prompts: updatedPrompts,
            selectedPrompt: updatedPrompt,
            loading: false,
            recentlyInteractedIds: updatedRecentIds
          })
          // Clear editor persistence after successful save
          clearPersistedEditorState()
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Prompt updated successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update prompt'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      deletePrompt: async (id: number) => {
        try {
          set({ loading: true, error: null })
          await window.electronAPI.deletePrompt(id)
          const { prompts } = get()
          const filteredPrompts = prompts.filter(p => p.id !== id)
          set({ 
            prompts: filteredPrompts,
            selectedPrompt: null,
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Prompt deleted successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete prompt'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      duplicatePrompt: async (id: number) => {
        try {
          set({ loading: true, error: null })
          const { prompts } = get()
          const originalPrompt = prompts.find(p => p.id === id)
          
          if (!originalPrompt) {
            throw new Error('Prompt not found')
          }

          // Create duplicate data with "(Copy)" suffix
          const duplicateData: CreatePromptData = {
            title: `${originalPrompt.title} (Copy)`,
            content: originalPrompt.content,
            description: originalPrompt.description || '',
            category_id: originalPrompt.category_id,
            template_id: originalPrompt.template_id,
            tags: [...originalPrompt.tags], // Copy tags array
            is_favorite: false // Don't duplicate favorite status
          }

          const newPrompt = await window.electronAPI.createPrompt(duplicateData)
          set({ 
            prompts: [newPrompt, ...prompts],
            loading: false 
          })
          
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Prompt duplicated successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate prompt'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      selectPrompt: (prompt: Prompt | null) => {
        set({ selectedPrompt: prompt })
      },

      selectTemplate: (template: Template | null) => {
        set({ selectedTemplate: template })
      },

      // Category operations
      createCategory: async (data: CreateCategoryData) => {
        try {
          set({ loading: true, error: null })
          const newCategory = await window.electronAPI.createCategory(data)
          const { categories } = get()
          set({ 
            categories: [...categories, newCategory],
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Category created successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create category'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      updateCategory: async (id: number, data: UpdateCategoryData) => {
        try {
          set({ loading: true, error: null })
          const updatedCategory = await window.electronAPI.updateCategory(id, data)
          const { categories } = get()
          const updatedCategories = categories.map(c => c.id === id ? updatedCategory : c)
          set({ 
            categories: updatedCategories,
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Category updated successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update category'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      deleteCategory: async (id: number) => {
        try {
          set({ loading: true, error: null })
          await window.electronAPI.deleteCategory(id)
          const { categories } = get()
          const filteredCategories = categories.filter(c => c.id !== id)
          set({ 
            categories: filteredCategories,
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Category deleted successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete category'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      // Template operations
      createTemplate: async (data: CreateTemplateData) => {
        try {
          set({ loading: true, error: null })
          const newTemplate = await window.electronAPI.createTemplate(data)
          const { templates } = get()
          set({ 
            templates: [...templates, newTemplate],
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Template created successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create template'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      updateTemplate: async (id: number, data: UpdateTemplateData) => {
        try {
          set({ loading: true, error: null })
          const updatedTemplate = await window.electronAPI.updateTemplate(id, data)
          const { templates } = get()
          const updatedTemplates = templates.map(t => t.id === id ? updatedTemplate : t)
          set({ 
            templates: updatedTemplates,
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Template updated successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update template'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      deleteTemplate: async (id: number) => {
        try {
          set({ loading: true, error: null })
          await window.electronAPI.deleteTemplate(id)
          const { templates } = get()
          const filteredTemplates = templates.filter(t => t.id !== id)
          set({ 
            templates: filteredTemplates,
            loading: false 
          })
          get().addToast({
            type: 'success',
            title: 'Success',
            description: 'Template deleted successfully'
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete template'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      // Search and filtering
      setSearchFilters: (filters: Partial<SearchFilters>) => {
        const currentFilters = get().searchFilters
        set({ searchFilters: { ...currentFilters, ...filters } })
      },

      setSortOptions: (options: Partial<SortOptions>) => {
        const currentOptions = get().sortOptions
        set({ sortOptions: { ...currentOptions, ...options } })
      },

      getFilteredPrompts: () => {
        const { prompts, categories, searchFilters, sortOptions } = get()
        let filtered = [...prompts]

        // Apply advanced search query
        if (searchFilters.query) {
          const parsedQuery = parseSearchQuery(searchFilters.query)
          
          // Apply general text search
          if (parsedQuery.generalQuery) {
            const generalQuery = parsedQuery.generalQuery.toLowerCase()
            filtered = filtered.filter(prompt => 
              prompt.title.toLowerCase().includes(generalQuery) ||
              prompt.content.toLowerCase().includes(generalQuery) ||
              prompt.description?.toLowerCase().includes(generalQuery)
            )
          }
          
          // Apply title-specific search
          if (parsedQuery.title) {
            const titleQuery = parsedQuery.title.toLowerCase()
            filtered = filtered.filter(prompt => 
              prompt.title.toLowerCase().includes(titleQuery)
            )
          }
          
          // Apply content-specific search
          if (parsedQuery.content) {
            const contentQuery = parsedQuery.content.toLowerCase()
            filtered = filtered.filter(prompt => 
              prompt.content.toLowerCase().includes(contentQuery)
            )
          }
          
          // Apply category search
          if (parsedQuery.category) {
            const categoryQuery = parsedQuery.category.toLowerCase()
            const matchingCategory = categories.find(cat => 
              cat.name.toLowerCase().includes(categoryQuery)
            )
            if (matchingCategory) {
              filtered = filtered.filter(prompt => prompt.category_id === matchingCategory.id)
            } else {
              // No matching category found, return empty results
              filtered = []
            }
          }
          
          // Apply tag search
          if (parsedQuery.tags.length > 0) {
            filtered = filtered.filter(prompt =>
              parsedQuery.tags.some(tag => 
                prompt.tags.some(promptTag => 
                  promptTag.toLowerCase().includes(tag.toLowerCase())
                )
              )
            )
          }
          
          // Apply favorite filter from parsed query
          if (parsedQuery.isFavorite !== undefined) {
            filtered = filtered.filter(prompt => prompt.is_favorite === parsedQuery.isFavorite)
          }
        }

        // Apply category filter
        if (searchFilters.categoryId) {
          filtered = filtered.filter(prompt => prompt.category_id === searchFilters.categoryId)
        }

        // Apply tags filter
        if (searchFilters.tags && searchFilters.tags.length > 0) {
          filtered = filtered.filter(prompt =>
            searchFilters.tags!.some(tag => prompt.tags.includes(tag))
          )
        }

        // Apply favorite filter
        if (searchFilters.isFavorite !== undefined) {
          filtered = filtered.filter(prompt => prompt.is_favorite === searchFilters.isFavorite)
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const { field, direction } = sortOptions
          let aValue: string | number = a[field]
          let bValue: string | number = b[field]

          if (field === 'title') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
          } else {
            // For dates, convert to timestamp for comparison
            aValue = new Date(aValue as string).getTime()
            bValue = new Date(bValue as string).getTime()
          }

          if (direction === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
          }
        })

        return filtered as readonly Prompt[]
      },
      
      getRecentlyInteractedPrompts: () => {
        const { prompts, recentlyInteractedIds } = get()
        const recentPrompts: Prompt[] = []
        
        // Get prompts in the order of recent interaction
        for (const id of recentlyInteractedIds) {
          const prompt = prompts.find(p => p.id === id)
          if (prompt) {
            recentPrompts.push(prompt)
          }
        }
        
        return recentPrompts as readonly Prompt[]
      },

      searchPrompts: async (query: string) => {
        try {
          set({ loading: true, error: null })
          const prompts = await window.electronAPI.searchPrompts(query)
          set({ prompts, loading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Search failed'
          set({ error: errorMessage, loading: false })
          get().addToast({
            type: 'error',
            title: 'Error',
            description: errorMessage
          })
        }
      },

      // UI actions
      openPromptEditor: (prompt?: Prompt) => {
        const selectedPrompt = prompt || null
        const { recentlyInteractedIds } = get()
        
        // Track interaction if editing existing prompt
        const updatedRecentIds = selectedPrompt 
          ? trackInteraction(selectedPrompt.id, recentlyInteractedIds)
          : recentlyInteractedIds
        
        set({ 
          selectedPrompt,
          isPromptEditorOpen: true,
          isPromptViewerOpen: false, // Close viewer if open
          isTemplateEditorOpen: false, // Close template editor if open
          recentlyInteractedIds: updatedRecentIds
        })
        persistEditorState(true, selectedPrompt)
      },

      closePromptEditor: () => {
        set({ 
          selectedPrompt: null,
          isPromptEditorOpen: false 
        })
        clearPersistedEditorState()
      },

      openPromptViewer: (prompt: Prompt) => {
        const { recentlyInteractedIds } = get()
        
        // Track interaction (viewing)
        const updatedRecentIds = trackInteraction(prompt.id, recentlyInteractedIds)
        
        set({ 
          selectedPrompt: prompt,
          isPromptViewerOpen: true,
          isPromptEditorOpen: false, // Close editor if open
          isTemplateEditorOpen: false, // Close template editor if open
          recentlyInteractedIds: updatedRecentIds
        })
      },

      closePromptViewer: () => {
        set({ 
          selectedPrompt: null,
          isPromptViewerOpen: false 
        })
      },

      openSettings: () => {
        set({ 
          isSettingsOpen: true,
          isPromptEditorOpen: false,
          isPromptViewerOpen: false,
          selectedPrompt: null 
        })
      },

      closeSettings: () => {
        set({ isSettingsOpen: false })
      },

      // Template editor actions
      openTemplateEditor: (template?: Template) => {
        set({ 
          selectedTemplate: template || null,
          isTemplateEditorOpen: true,
          // Close other editors
          isPromptEditorOpen: false,
          isPromptViewerOpen: false,
          isSettingsOpen: false
        })
      },

      closeTemplateEditor: () => {
        set({ 
          selectedTemplate: null,
          isTemplateEditorOpen: false 
        })
      },

      // Toast management
      addToast: (toast: Omit<ToastMessage, 'id'>) => {
        const id = generateToastId()
        const newToast: ToastMessage = { ...toast, id }
        const { toasts } = get()
        set({ toasts: [...toasts, newToast] })

        // Auto-remove toast after duration
        const duration = toast.duration || 5000
        setTimeout(() => {
          get().removeToast(id)
        }, duration)
      },

      removeToast: (id: string) => {
        const { toasts } = get()
        set({ toasts: toasts.filter(toast => toast.id !== id) })
      },

      clearToasts: () => {
        set({ toasts: [] })
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      // Draft persistence actions
      saveDraftFormData: (formData: any) => {
        set({ draftFormData: formData })
        persistDraftFormData(formData)
      },

      clearDraftFormData: () => {
        set({ draftFormData: null })
        try {
          localStorage.removeItem(STORAGE_KEYS.DRAFT_FORM_DATA)
        } catch {
          // Ignore storage errors
        }
      },

      getDraftFormData: () => {
        return get().draftFormData
      },

      // Template search actions
      setTemplateSearchQuery: (query: string) => {
        set({ templateSearchQuery: query })
      },

      getFilteredTemplates: () => {
        const { templates, templateSearchQuery } = get()
        
        if (!templateSearchQuery.trim()) {
          return templates
        }
        
        const query = templateSearchQuery.toLowerCase()
        return templates.filter(template =>
          template.name.toLowerCase().includes(query) ||
          template.content.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.variables.some(variable => variable.toLowerCase().includes(query))
        ) as readonly Template[]
      },

      // View mode actions
      setPromptViewMode: (mode: 'list' | 'grid') => {
        set({ promptViewMode: mode })
        persistViewMode(STORAGE_KEYS.PROMPT_VIEW_MODE, mode)
      },

      setTemplateViewMode: (mode: 'list' | 'grid') => {
        set({ templateViewMode: mode })
        persistViewMode(STORAGE_KEYS.TEMPLATE_VIEW_MODE, mode)
      }
    }),
    {
      name: 'prompt-store'
    }
  )
)