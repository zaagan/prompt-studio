// Database entity types with strict typing
export interface Category {
  readonly id: number
  name: string
  description: string | null
  color: string
  readonly created_at: string
  readonly updated_at: string
}

export interface Template {
  readonly id: number
  name: string
  description: string | null
  content: string
  variables: readonly string[]
  category_id: number | null
  readonly created_at: string
  readonly updated_at: string
  // Joined fields
  category_name?: string
  category_color?: string
}

export interface Prompt {
  readonly id: number
  title: string
  content: string
  description: string | null
  category_id: number | null
  template_id: number | null
  tags: readonly string[]
  is_favorite: boolean
  readonly created_at: string
  readonly updated_at: string
  // Joined fields
  category_name?: string
  category_color?: string
  template_name?: string
}

export interface PromptVersion {
  readonly id: number
  readonly prompt_id: number
  content: string
  readonly version_number: number
  readonly created_at: string
}

export interface TestResult {
  readonly id: number
  readonly prompt_id: number
  input_prompt: string
  response: string
  model: string | null
  api_endpoint: string | null
  response_time: number | null
  token_usage: TokenUsage | null
  readonly created_at: string
}

export interface TokenUsage {
  readonly prompt_tokens?: number
  readonly completion_tokens?: number
  readonly total_tokens?: number
}

// Form types for creating/updating entities
export interface CreateCategoryData {
  name: string
  description?: string | undefined
  color?: string | undefined
}

export interface UpdateCategoryData {
  name?: string | undefined
  description?: string | undefined
  color?: string | undefined
}

export interface CreateTemplateData {
  name: string
  description?: string | undefined
  content: string
  variables: readonly string[]
  category_id?: number | null | undefined
}

export interface UpdateTemplateData {
  name?: string | undefined
  description?: string | undefined
  content?: string | undefined
  variables?: readonly string[] | undefined
  category_id?: number | null | undefined
}

export interface CreatePromptData {
  title: string
  content: string
  description?: string | undefined
  category_id?: number | null | undefined
  template_id?: number | null | undefined
  tags?: readonly string[] | undefined
  is_favorite?: boolean | undefined
}

export interface UpdatePromptData {
  title?: string | undefined
  content?: string | undefined
  description?: string | undefined
  category_id?: number | null | undefined
  template_id?: number | null | undefined
  tags?: readonly string[] | undefined
  is_favorite?: boolean | undefined
}

// API types for testing prompts
export interface ApiTestConfig {
  readonly apiKey: string
  readonly model: string
  readonly apiEndpoint?: string
  readonly temperature?: number
  readonly maxTokens?: number
}

export interface ApiTestRequest {
  readonly prompt: string
  readonly config: ApiTestConfig
}

export interface ApiTestResponse {
  readonly success: boolean
  readonly response?: string
  readonly usage?: TokenUsage
  readonly error?: string
  readonly responseTime?: number
}

// App state types
export type AppMode = 'desktop' | 'menubar'

export interface AppSettings {
  readonly theme: 'light' | 'dark'
  readonly appMode: AppMode
  readonly apiKey?: string
  readonly defaultModel?: string
  readonly defaultEndpoint?: string
}

export interface SearchFilters {
  readonly query: string
  readonly categoryId?: number | null
  readonly tags?: readonly string[]
  readonly isFavorite?: boolean | undefined
}

export interface SortOptions {
  readonly field: 'updated_at' | 'created_at' | 'title'
  readonly direction: 'asc' | 'desc'
}

// Import/Export types
export interface ExportData {
  readonly prompts: readonly Prompt[]
  readonly categories: readonly Category[]
  readonly templates: readonly Template[]
  readonly exported_at: string
  readonly version: string
}

export interface ImportResult {
  readonly success: boolean
  readonly imported?: number
  readonly total?: number
  readonly error?: string
}

// UI state types
export interface ModalState {
  readonly isOpen: boolean
  readonly type: 'category' | 'template' | 'prompt' | null
  readonly editingItem?: Category | Template | Prompt | null
}

export interface ToastMessage {
  readonly id: string
  readonly type: 'success' | 'error' | 'warning' | 'info'
  readonly title: string
  readonly description?: string
  readonly duration?: number
}

// Electron IPC types
export interface ElectronAPI {
  // Prompts
  getAllPrompts(): Promise<readonly Prompt[]>
  getPrompt(id: number): Promise<Prompt | null>
  createPrompt(data: CreatePromptData): Promise<Prompt>
  updatePrompt(id: number, data: UpdatePromptData): Promise<Prompt>
  deletePrompt(id: number): Promise<{ success: boolean }>
  searchPrompts(query: string): Promise<readonly Prompt[]>
  getPromptsByTag(tag: string): Promise<readonly Prompt[]>
  
  // Categories
  getAllCategories(): Promise<readonly Category[]>
  createCategory(data: CreateCategoryData): Promise<Category>
  updateCategory(id: number, data: UpdateCategoryData): Promise<Category>
  deleteCategory(id: number): Promise<{ success: boolean }>
  
  // Templates
  getAllTemplates(): Promise<readonly Template[]>
  createTemplate(data: CreateTemplateData): Promise<Template>
  updateTemplate(id: number, data: UpdateTemplateData): Promise<Template>
  deleteTemplate(id: number): Promise<{ success: boolean }>
  generateFromTemplate(templateId: number, variables: Record<string, string>): Promise<CreatePromptData>
  
  // Tags
  getAllTags(): Promise<readonly string[]>
  
  // Versions
  getPromptVersions(promptId: number): Promise<readonly PromptVersion[]>
  createPromptVersion(promptId: number, content: string): Promise<PromptVersion>
  
  // Settings
  getSetting(key: keyof AppSettings): Promise<string | null>
  setSetting(key: keyof AppSettings, value: string): Promise<{ key: string; value: string }>
  
  // Import/Export
  exportPrompts(format: 'json' | 'txt'): Promise<{ success: boolean; path?: string }>
  importPrompts(): Promise<ImportResult>
  
  // Testing
  testPrompt(request: ApiTestRequest): Promise<ApiTestResponse>
  
  // System
  copyToClipboard(text: string): Promise<{ success: boolean }>
  switchMode(mode: 'desktop' | 'menubar'): Promise<void>
  getCurrentMode(): Promise<'desktop' | 'menubar'>
  factoryReset(): Promise<{ success: boolean; error?: string }>
  
  // Events
  onOpenPreferences(callback: () => void): void
  removeAllListeners(channel: string): void
}

// Global window interface extension
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// Utility types for better type safety
export type NonEmptyArray<T> = readonly [T, ...T[]]

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>