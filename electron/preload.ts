import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../src/types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  // Prompts
  getAllPrompts: () => ipcRenderer.invoke('get-all-prompts'),
  getPrompt: (id: number) => ipcRenderer.invoke('get-prompt', id),
  createPrompt: (data) => ipcRenderer.invoke('create-prompt', data),
  updatePrompt: (id, data) => ipcRenderer.invoke('update-prompt', id, data),
  deletePrompt: (id) => ipcRenderer.invoke('delete-prompt', id),
  searchPrompts: (query) => ipcRenderer.invoke('search-prompts', query),
  getPromptsByTag: (tag) => ipcRenderer.invoke('get-prompts-by-tag', tag),

  // Categories
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),
  createCategory: (data) => ipcRenderer.invoke('create-category', data),
  updateCategory: (id, data) => ipcRenderer.invoke('update-category', id, data),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

  // Templates
  getAllTemplates: () => ipcRenderer.invoke('get-all-templates'),
  createTemplate: (data) => ipcRenderer.invoke('create-template', data),
  updateTemplate: (id, data) => ipcRenderer.invoke('update-template', id, data),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),
  generateFromTemplate: (templateId, variables) =>
    ipcRenderer.invoke('generate-from-template', templateId, variables),

  // Tags
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),

  // Versions
  getPromptVersions: (promptId) => ipcRenderer.invoke('get-prompt-versions', promptId),
  createPromptVersion: (promptId, content) =>
    ipcRenderer.invoke('create-prompt-version', promptId, content),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Import/Export
  exportPrompts: (format) => ipcRenderer.invoke('export-prompts', format),
  importPrompts: () => ipcRenderer.invoke('import-prompts'),

  // Testing
  testPrompt: (request) => ipcRenderer.invoke('test-prompt', request),

  // System
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  switchMode: (mode) => ipcRenderer.invoke('switch-mode', mode),
  getCurrentMode: () => ipcRenderer.invoke('get-current-mode'),
  factoryReset: () => ipcRenderer.invoke('factory-reset'),

  // MCP Server
  startMcpServer: (config, exposedPrompts) => ipcRenderer.invoke('mcp-server:start', config, exposedPrompts),
  stopMcpServer: () => ipcRenderer.invoke('mcp-server:stop'),
  getMcpServerStatus: () => ipcRenderer.invoke('mcp-server:status'),
  updateMcpServerConfig: (config) => ipcRenderer.invoke('mcp-server:update-config', config),
  updateMcpServerExposedPrompts: (exposedPrompts) => ipcRenderer.invoke('mcp-server:update-exposed-prompts', exposedPrompts),
  clearMcpServerLogs: () => ipcRenderer.invoke('mcp-server:clear-logs'),

  // Generic IPC invoke method for flexibility
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),

  // Events
  onOpenPreferences: (callback) => ipcRenderer.on('open-preferences', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)