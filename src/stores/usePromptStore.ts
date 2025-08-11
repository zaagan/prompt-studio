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
  
  // UI state
  selectedPrompt: Prompt | null
  isPromptEditorOpen: boolean
  isPromptViewerOpen: boolean
  isSettingsOpen: boolean
  
  // Toast notifications
  toasts: readonly ToastMessage[]
  
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
  selectPrompt: (prompt: Prompt | null) => void
  
  // Category operations
  createCategory: (data: CreateCategoryData) => Promise<void>
  updateCategory: (id: number, data: UpdateCategoryData) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  
  // Template operations
  createTemplate: (data: CreateTemplateData) => Promise<void>
  updateTemplate: (id: number, data: UpdateTemplateData) => Promise<void>
  deleteTemplate: (id: number) => Promise<void>
  
  // Search and filtering
  setSearchFilters: (filters: Partial<SearchFilters>) => void
  setSortOptions: (options: Partial<SortOptions>) => void
  getFilteredPrompts: () => readonly Prompt[]
  searchPrompts: (query: string) => Promise<void>
  
  // UI actions
  openPromptEditor: (prompt?: Prompt) => void
  closePromptEditor: () => void
  openPromptViewer: (prompt: Prompt) => void
  closePromptViewer: () => void
  openSettings: () => void
  closeSettings: () => void
  
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
      
      selectedPrompt: null,
      isPromptEditorOpen: false,
      isPromptViewerOpen: false,
      isSettingsOpen: false,
      toasts: [],

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
          const { prompts } = get()
          const updatedPrompts = prompts.map(p => p.id === id ? updatedPrompt : p)
          set({ 
            prompts: updatedPrompts,
            selectedPrompt: updatedPrompt,
            loading: false 
          })
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

      selectPrompt: (prompt: Prompt | null) => {
        set({ selectedPrompt: prompt })
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
        set({ 
          selectedPrompt: prompt || null,
          isPromptEditorOpen: true 
        })
      },

      closePromptEditor: () => {
        set({ 
          selectedPrompt: null,
          isPromptEditorOpen: false 
        })
      },

      openPromptViewer: (prompt: Prompt) => {
        set({ 
          selectedPrompt: prompt,
          isPromptViewerOpen: true,
          isPromptEditorOpen: false // Close editor if open
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
      }
    }),
    {
      name: 'prompt-store'
    }
  )
)