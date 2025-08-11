import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { initDatabase, factoryReset } from './database/init'
import {
  getAllPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  searchPrompts,
  getPromptsByTag,
  getAllTags,
  getPromptVersions,
  createPromptVersion,
  getSetting,
  setSetting,
  exportPrompts,
  importPrompts,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateFromTemplate,
} from './database/queries'
import type { Database } from 'sqlite3'
import type {
  CreatePromptData,
  UpdatePromptData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateTemplateData,
  UpdateTemplateData,
  ApiTestRequest,
  ApiTestResponse,
  ImportResult,
} from '../src/types'

class PromptStudioApp {
  private mainWindow: BrowserWindow | null = null
  private menuBarWindow: BrowserWindow | null = null
  private tray: Tray | null = null
  private db: Database | null = null
  private currentMode: 'desktop' | 'menubar' = 'desktop'
  private readonly isDev: boolean = process.env.IS_DEV === 'true'

  constructor() {
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    app.whenReady().then(() => {
      this.initialize()
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      } else if (this.currentMode === 'desktop' && this.mainWindow) {
        this.mainWindow.show()
      }
    })

    app.on('before-quit', async () => {
      app.isQuitting = true
      // Close database connection
      if (this.db) {
        try {
          const { closeDatabase } = await import('./database/init')
          await closeDatabase()
          console.log('Database closed on app quit')
        } catch (error) {
          console.error('Error closing database:', error)
        }
      }
    })
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize database
      this.db = await initDatabase()

      // Load saved mode
      const savedMode = await getSetting(this.db, 'appMode')
      this.currentMode = (savedMode as 'desktop' | 'menubar') || 'desktop'

      // Setup IPC handlers BEFORE creating windows
      this.setupIpcHandlers()

      // Create windows
      await this.createMainWindow()
      await this.createMenuBarWindow()
      this.createTray()

      // Show appropriate window
      if (this.currentMode === 'desktop' && this.mainWindow) {
        this.mainWindow.show()
      }
    } catch (error) {
      console.error('Failed to initialize app:', error)
      app.quit()
    }
  }

  private async createMainWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      icon: this.getAppIcon(),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    })

    if (this.isDev) {
      await this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow.webContents.openDevTools()
    } else {
      await this.mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    this.mainWindow.once('ready-to-show', () => {
      if (this.currentMode === 'desktop' && this.mainWindow) {
        this.mainWindow.show()
      }
    })

    this.mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault()
        if (this.mainWindow) {
          this.mainWindow.hide()
        }
      }
    })
  }

  private async createMenuBarWindow(): Promise<void> {
    this.menuBarWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      skipTaskbar: true,
      alwaysOnTop: true,
    })

    if (this.isDev) {
      await this.menuBarWindow.loadURL('http://localhost:5173/menubar')
    } else {
      await this.menuBarWindow.loadFile(join(__dirname, '../dist/menubar.html'))
    }

    this.menuBarWindow.on('blur', () => {
      if (this.currentMode === 'menubar' && this.menuBarWindow) {
        this.menuBarWindow.hide()
      }
    })
  }

  private createTray(): void {
    const icon = this.createTrayIcon()
    this.tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Prompt Studio',
        click: () => this.showApp(),
      },
      { type: 'separator' },
      {
        label: 'Desktop Mode',
        type: 'radio',
        checked: this.currentMode === 'desktop',
        click: () => this.switchMode('desktop'),
      },
      {
        label: 'Menu Bar Mode',
        type: 'radio',
        checked: this.currentMode === 'menubar',
        click: () => this.switchMode('menubar'),
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        click: () => this.openPreferences(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true
          app.quit()
        },
      },
    ])

    this.tray.setToolTip('Prompt Studio')
    this.tray.setContextMenu(contextMenu)

    this.tray.on('click', () => {
      if (process.platform !== 'darwin') {
        this.toggleApp()
      }
    })

    if (process.platform === 'darwin') {
      this.tray.on('right-click', () => {
        if (this.currentMode === 'menubar') {
          this.toggleMenuBarWindow()
        }
      })
    }
  }

  private createTrayIcon(): nativeImage.NativeImage {
    const iconPath = join(__dirname, '../assets/icon.png')
    if (existsSync(iconPath)) {
      const icon = nativeImage.createFromPath(iconPath)
      icon.setTemplateImage(true)
      return icon.resize({ width: 16, height: 16 })
    }

    // Create a simple fallback icon
    const icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAI4SURBVDjLpZPLSyNBEMafJBpfGI0vfIKKD1YR30HFhQVZWFjwgSiIBy+CBx8H8eJBL4IX8eJBD4IXD3oRvHjQi+DFgx4ELx70InjxoAfBiwc9CF48eJEkZjKZt91O05lJJsaD/UF3VVd9X1V3dwvAuHEEeEnNK24HAEhpWjTqsEgUEUlHYgAAAAAAAAD4/nONAAAOFyLSdF3l0AvI7Gii0XDbfU7k9+g7mRn1AHhhNBCJRm+yYdoECUCcvAHxvuwT2g5bMJHsJR0UiSLSSRFJwC'
    )
    icon.setTemplateImage(true)
    return icon
  }

  private getAppIcon(): string {
    const iconPath = join(__dirname, '../assets/icon.png')
    return existsSync(iconPath) ? iconPath : ''
  }

  private showApp(): void {
    if (this.currentMode === 'desktop' && this.mainWindow) {
      this.mainWindow.show()
      this.mainWindow.focus()
    } else if (this.currentMode === 'menubar') {
      this.toggleMenuBarWindow()
    }
  }

  private toggleApp(): void {
    if (this.currentMode === 'desktop' && this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide()
      } else {
        this.mainWindow.show()
        this.mainWindow.focus()
      }
    } else {
      this.toggleMenuBarWindow()
    }
  }

  private toggleMenuBarWindow(): void {
    if (!this.menuBarWindow || !this.tray) return

    if (this.menuBarWindow.isVisible()) {
      this.menuBarWindow.hide()
    } else {
      const bounds = this.tray.getBounds()
      const x = Math.round(bounds.x + bounds.width / 2 - 200)
      const y = Math.round(bounds.y + bounds.height)

      this.menuBarWindow.setPosition(x, y, false)
      this.menuBarWindow.show()
      this.menuBarWindow.focus()
    }
  }

  private async switchMode(mode: 'desktop' | 'menubar'): Promise<void> {
    this.currentMode = mode

    if (this.db) {
      await setSetting(this.db, 'appMode', mode)
    }

    if (mode === 'desktop') {
      if (this.menuBarWindow) this.menuBarWindow.hide()
      if (this.mainWindow) {
        this.mainWindow.show()
        this.mainWindow.focus()
      }
    } else {
      if (this.mainWindow) this.mainWindow.hide()
      if (this.menuBarWindow) this.menuBarWindow.hide()
    }

    this.updateTrayMenu()
  }

  private updateTrayMenu(): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Prompt Studio',
        click: () => this.showApp(),
      },
      { type: 'separator' },
      {
        label: 'Desktop Mode',
        type: 'radio',
        checked: this.currentMode === 'desktop',
        click: () => this.switchMode('desktop'),
      },
      {
        label: 'Menu Bar Mode',
        type: 'radio',
        checked: this.currentMode === 'menubar',
        click: () => this.switchMode('menubar'),
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        click: () => this.openPreferences(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true
          app.quit()
        },
      },
    ])

    this.tray.setContextMenu(contextMenu)
  }

  private openPreferences(): void {
    if (this.mainWindow) {
      this.mainWindow.show()
      this.mainWindow.focus()
      this.mainWindow.webContents.send('open-preferences')
    }
  }

  private setupIpcHandlers(): void {
    // System handlers (don't require database)
    ipcMain.handle('copy-to-clipboard', async (_event, text: string) => {
      const { clipboard } = require('electron')
      clipboard.writeText(text)
      return { success: true }
    })

    ipcMain.handle('switch-mode', async (_event, mode: 'desktop' | 'menubar') => {
      await this.switchMode(mode)
    })

    ipcMain.handle('get-current-mode', () => {
      return this.currentMode
    })

    // Factory reset handler
    ipcMain.handle('factory-reset', async () => {
      try {
        await factoryReset()
        // Reinitialize database to load sample data
        this.db = await initDatabase()
        return { success: true }
      } catch (error) {
        console.error('Factory reset failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // Database-dependent handlers
    if (!this.db) return

    // Prompt handlers
    ipcMain.handle('get-all-prompts', async () => {
      return await getAllPrompts(this.db!)
    })

    ipcMain.handle('get-prompt', async (_event, id: number) => {
      return await getPrompt(this.db!, id)
    })

    ipcMain.handle('create-prompt', async (_event, data: CreatePromptData) => {
      return await createPrompt(this.db!, data)
    })

    ipcMain.handle('update-prompt', async (_event, id: number, data: UpdatePromptData) => {
      return await updatePrompt(this.db!, id, data)
    })

    ipcMain.handle('delete-prompt', async (_event, id: number) => {
      return await deletePrompt(this.db!, id)
    })

    ipcMain.handle('search-prompts', async (_event, query: string) => {
      return await searchPrompts(this.db!, query)
    })

    ipcMain.handle('get-prompts-by-tag', async (_event, tag: string) => {
      return await getPromptsByTag(this.db!, tag)
    })

    // Category handlers
    ipcMain.handle('get-all-categories', async () => {
      return await getAllCategories(this.db!)
    })

    ipcMain.handle('create-category', async (_event, data: CreateCategoryData) => {
      return await createCategory(this.db!, data)
    })

    ipcMain.handle('update-category', async (_event, id: number, data: UpdateCategoryData) => {
      return await updateCategory(this.db!, id, data)
    })

    ipcMain.handle('delete-category', async (_event, id: number) => {
      return await deleteCategory(this.db!, id)
    })

    // Template handlers
    ipcMain.handle('get-all-templates', async () => {
      return await getAllTemplates(this.db!)
    })

    ipcMain.handle('create-template', async (_event, data: CreateTemplateData) => {
      return await createTemplate(this.db!, data)
    })

    ipcMain.handle('update-template', async (_event, id: number, data: UpdateTemplateData) => {
      return await updateTemplate(this.db!, id, data)
    })

    ipcMain.handle('delete-template', async (_event, id: number) => {
      return await deleteTemplate(this.db!, id)
    })

    ipcMain.handle('generate-from-template', async (_event, templateId: number, variables: Record<string, string>) => {
      return await generateFromTemplate(this.db!, templateId, variables)
    })

    // Tag handlers
    ipcMain.handle('get-all-tags', async () => {
      return await getAllTags(this.db!)
    })

    // Version handlers
    ipcMain.handle('get-prompt-versions', async (_event, promptId: number) => {
      return await getPromptVersions(this.db!, promptId)
    })

    ipcMain.handle('create-prompt-version', async (_event, promptId: number, content: string) => {
      return await createPromptVersion(this.db!, promptId, content)
    })

    // Settings handlers
    ipcMain.handle('get-setting', async (_event, key: string) => {
      return await getSetting(this.db!, key)
    })

    ipcMain.handle('set-setting', async (_event, key: string, value: string) => {
      return await setSetting(this.db!, key, value)
    })

    // Import/Export handlers
    ipcMain.handle('export-prompts', async (_event, format: 'json' | 'txt') => {
      const { filePath } = await dialog.showSaveDialog({
        filters: format === 'json'
          ? [{ name: 'JSON Files', extensions: ['json'] }]
          : [{ name: 'Text Files', extensions: ['txt'] }]
      })

      if (filePath) {
        await exportPrompts(this.db!, filePath, format)
        return { success: true, path: filePath }
      }
      return { success: false }
    })

    ipcMain.handle('import-prompts', async (): Promise<ImportResult> => {
      const { filePaths } = await dialog.showOpenDialog({
        filters: [
          { name: 'Supported Files', extensions: ['json', 'txt'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'Text Files', extensions: ['txt'] }
        ],
        properties: ['openFile']
      })

      if (filePaths && filePaths.length > 0) {
        return await importPrompts(this.db!, filePaths[0])
      }
      return { success: false }
    })

    // Testing handler
    ipcMain.handle('test-prompt', async (_event, request: ApiTestRequest): Promise<ApiTestResponse> => {
      try {
        const { prompt, config } = request
        const endpoint = config.apiEndpoint || 'https://api.openai.com/v1/chat/completions'

        const startTime = Date.now()
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens
          })
        })

        const responseTime = Date.now() - startTime
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'API request failed')
        }

        return {
          success: true,
          response: data.choices[0].message.content,
          usage: data.usage,
          responseTime
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
  }
}

// Initialize the application
new PromptStudioApp()