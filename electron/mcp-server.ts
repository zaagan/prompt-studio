import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import { Database } from 'sqlite3'

interface McpServerConfig {
  port: number
  host: string
  enableAuth: boolean
  apiKey: string
  maxConnections: number
  rateLimit: number
  enableCors: boolean
  enableLogging: boolean
  logLevel: string
}

interface ExposedPrompt {
  id: number
  secureHash: string
  exposed: boolean
}

class McpServer {
  private server: any = null
  private config: McpServerConfig
  private db: Database
  private exposedPrompts: Map<string, number> = new Map()
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map()
  
  // Metrics tracking
  private startTime: number = 0
  private totalRequests: number = 0
  private totalErrors: number = 0
  private activeConnections: number = 0
  private recentLogs: Array<{ timestamp: string; level: string; message: string; data?: any }> = []
  private readonly MAX_LOGS = 50 // Keep more logs internally, show recent 10 in UI

  constructor(db: Database) {
    this.db = db
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      enableAuth: true,
      apiKey: '',
      maxConnections: 100,
      rateLimit: 60,
      enableCors: true,
      enableLogging: true,
      logLevel: 'info'
    }
  }

  updateConfig(config: Partial<McpServerConfig>) {
    this.config = { ...this.config, ...config }
  }

  updateExposedPrompts(prompts: ExposedPrompt[]) {
    this.exposedPrompts.clear()
    let count = 0
    prompts.forEach(p => {
      if (p.exposed && p.secureHash) {
        this.exposedPrompts.set(p.secureHash, p.id)
        count++
      }
    })
    this.log('info', `Updated exposed prompts: ${count} prompts now available`)
  }

  private log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString()
    
    // Store log entry
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data: args.length > 0 ? args : undefined
    }
    
    this.recentLogs.push(logEntry)
    
    // Keep only recent logs
    if (this.recentLogs.length > this.MAX_LOGS) {
      this.recentLogs = this.recentLogs.slice(-this.MAX_LOGS)
    }
    
    if (!this.config.enableLogging) return
    
    const levels = ['debug', 'info', 'warn', 'error']
    const configLevel = levels.indexOf(this.config.logLevel)
    const messageLevel = levels.indexOf(level)
    
    if (messageLevel >= configLevel) {
      console.log(`[MCP Server ${timestamp}] [${level.toUpperCase()}] ${message}`, ...args)
    }
  }

  private checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const limit = this.requestCounts.get(ip)
    
    if (!limit || limit.resetTime < now) {
      // Reset rate limit window
      this.requestCounts.set(ip, {
        count: 1,
        resetTime: now + 60000 // 1 minute window
      })
      return true
    }
    
    if (limit.count >= this.config.rateLimit) {
      return false
    }
    
    limit.count++
    return true
  }

  private sendCorsHeaders(res: ServerResponse) {
    if (this.config.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
  }

  private sendJsonResponse(res: ServerResponse, statusCode: number, data: any) {
    // Track errors (4xx and 5xx status codes)
    if (statusCode >= 400) {
      this.totalErrors++
    }
    
    this.sendCorsHeaders(res)
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  private authenticateRequest(req: IncomingMessage): boolean {
    if (!this.config.enableAuth) return true
    
    const authHeader = req.headers['authorization']
    if (!authHeader) return false
    
    const [type, token] = authHeader.split(' ')
    if (type !== 'Bearer' || token !== this.config.apiKey) {
      return false
    }
    
    return true
  }

  private getPromptById(promptId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const query = `
          SELECT p.*, c.name as category_name, c.color as category_color
          FROM prompts p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ?
        `
        this.db.get(query, [promptId], (err, row) => {
          if (err) {
            this.log('error', 'Database error getting prompt:', { promptId, error: err.message })
            reject(err)
          } else {
            resolve(row)
          }
        })
      } catch (error) {
        this.log('error', 'Failed to get prompt from database:', error)
        reject(error)
      }
    })
  }

  private getAllExposedPrompts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const promptIds = Array.from(this.exposedPrompts.values())
        if (promptIds.length === 0) {
          resolve([])
          return
        }
        
        const placeholders = promptIds.map(() => '?').join(',')
        const query = `
          SELECT p.*, c.name as category_name, c.color as category_color
          FROM prompts p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id IN (${placeholders})
        `
        
        this.db.all(query, promptIds, (err, rows) => {
          if (err) {
            this.log('error', 'Failed to get exposed prompts from database:', err)
            resolve([])
          } else {
            resolve(rows || [])
          }
        })
      } catch (error) {
        this.log('error', 'Failed to get prompts from database:', error)
        resolve([])
      }
    })
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const ip = req.socket.remoteAddress || 'unknown'
    
    // Track metrics
    this.totalRequests++
    
    // Log request
    this.log('info', `${req.method} ${req.url} from ${ip}`)
    
    // Track connection
    this.activeConnections++
    
    // Clean up connection count when response finishes
    res.on('finish', () => {
      this.activeConnections--
    })
    
    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
      this.sendCorsHeaders(res)
      res.writeHead(204)
      res.end()
      return
    }
    
    // Check rate limit
    if (!this.checkRateLimit(ip)) {
      this.sendJsonResponse(res, 429, {
        error: 'Rate limit exceeded',
        message: `Maximum ${this.config.rateLimit} requests per minute`
      })
      return
    }
    
    // Check authentication
    if (!this.authenticateRequest(req)) {
      this.sendJsonResponse(res, 401, {
        error: 'Unauthorized',
        message: 'Invalid or missing API key'
      })
      return
    }
    
    // Parse URL
    const parsedUrl = parse(req.url || '', true)
    const pathname = parsedUrl.pathname || ''
    
    // Route: GET /prompts
    if (pathname === '/prompts' && req.method === 'GET') {
      this.getAllExposedPrompts()
        .then(prompts => {
          const response = []
          
          for (const p of prompts) {
            const hashEntry = Array.from(this.exposedPrompts.entries()).find(([hash, id]) => id === p.id)
            const hash = hashEntry?.[0]
            
            if (!hash) {
              this.log('warn', `No hash found for exposed prompt ID: ${p.id}`)
              continue
            }
            
            response.push({
              id: hash,
              title: p.title,
              description: p.description,
              category: p.category_name,
              tags: p.tags ? JSON.parse(p.tags) : [],
              endpoint: `/prompts/${hash}`
            })
          }
          
          this.sendJsonResponse(res, 200, {
            prompts: response,
            count: response.length
          })
        })
        .catch(error => {
          this.log('error', 'Error getting exposed prompts list:', error)
          this.sendJsonResponse(res, 500, {
            error: 'Internal server error',
            message: 'Failed to retrieve exposed prompts'
          })
        })
      return
    }
    
    // Route: GET /prompts/:hash
    const promptMatch = pathname.match(/^\/prompts\/([a-zA-Z0-9]+)$/)
    if (promptMatch && req.method === 'GET') {
      const hash = promptMatch[1]
      const promptId = this.exposedPrompts.get(hash)
      
      if (!promptId) {
        this.sendJsonResponse(res, 404, {
          error: 'Not found',
          message: 'Prompt not found or not exposed'
        })
        return
      }
      
      this.getPromptById(promptId)
        .then(prompt => {
          if (!prompt) {
            this.sendJsonResponse(res, 404, {
              error: 'Not found',
              message: 'Prompt not found'
            })
            return
          }
          
          const response = {
            id: hash,
            title: prompt.title || 'Untitled',
            description: prompt.description || '',
            content: prompt.content || '',
            category: prompt.category_name || null,
            tags: prompt.tags ? JSON.parse(prompt.tags) : [],
            metadata: {
              created_at: prompt.created_at,
              updated_at: prompt.updated_at,
              is_favorite: prompt.is_favorite
            }
          }
          
          this.sendJsonResponse(res, 200, response)
        })
        .catch(error => {
          console.error('MCP Server: Error getting prompt:', error)
          this.sendJsonResponse(res, 500, {
            error: 'Internal server error',
            message: 'Failed to retrieve prompt'
          })
        })
      return
    }
    
    // Route: POST /prompts/:hash/execute
    const executeMatch = pathname.match(/^\/prompts\/([a-zA-Z0-9]+)\/execute$/)
    if (executeMatch && req.method === 'POST') {
      const hash = executeMatch[1]
      const promptId = this.exposedPrompts.get(hash)
      
      if (!promptId) {
        this.sendJsonResponse(res, 404, {
          error: 'Not found',
          message: 'Prompt not found or not exposed'
        })
        return
      }
      
      // Collect POST data
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', () => {
        this.getPromptById(promptId)
          .then(prompt => {
            if (!prompt) {
              this.sendJsonResponse(res, 404, {
                error: 'Not found',
                message: 'Prompt not found'
              })
              return
            }
            
            try {
              const params = body ? JSON.parse(body) : {}
              
              // Process prompt with parameters
              let processedContent = prompt.content
              if (params.variables) {
                Object.entries(params.variables).forEach(([key, value]) => {
                  processedContent = processedContent.replace(
                    new RegExp(`{{${key}}}`, 'g'),
                    String(value)
                  )
                })
              }
              
              this.sendJsonResponse(res, 200, {
                prompt: processedContent,
                metadata: {
                  title: prompt.title,
                  description: prompt.description,
                  parameters_applied: params.variables || {}
                }
              })
            } catch (error) {
              this.sendJsonResponse(res, 400, {
                error: 'Bad request',
                message: 'Invalid JSON in request body'
              })
            }
          })
          .catch(error => {
            console.error('MCP Server: Error getting prompt for execute:', error)
            this.sendJsonResponse(res, 500, {
              error: 'Internal server error',
              message: 'Failed to retrieve prompt'
            })
          })
      })
      return
    }
    
    // Route: GET /health
    if (pathname === '/health' && req.method === 'GET') {
      this.sendJsonResponse(res, 200, {
        status: 'healthy',
        server: 'Prompt Studio MCP Server',
        uptime: process.uptime(),
        exposedPrompts: this.exposedPrompts.size
      })
      return
    }
    
    // 404 for unknown routes
    this.sendJsonResponse(res, 404, {
      error: 'Not found',
      message: 'Endpoint not found'
    })
  }

  start(): Promise<{ success: boolean; message: string; port?: number }> {
    return new Promise((resolve) => {
      if (this.server) {
        resolve({
          success: false,
          message: 'Server is already running'
        })
        return
      }
      
      try {
        this.server = createServer((req, res) => this.handleRequest(req, res))
        
        this.server.on('error', (error: any) => {
          this.log('error', 'Server error:', error)
          if (error.code === 'EADDRINUSE') {
            resolve({
              success: false,
              message: `Port ${this.config.port} is already in use`
            })
          } else {
            resolve({
              success: false,
              message: `Failed to start server: ${error.message}`
            })
          }
          this.server = null
        })
        
        this.server.listen(this.config.port, this.config.host, () => {
          this.startTime = Date.now()
          this.totalRequests = 0
          this.totalErrors = 0
          this.activeConnections = 0
          
          this.log('info', `MCP Server started on http://${this.config.host}:${this.config.port}`)
          resolve({
            success: true,
            message: 'Server started successfully',
            port: this.config.port
          })
        })
      } catch (error: any) {
        this.log('error', 'Failed to create server:', error)
        resolve({
          success: false,
          message: `Failed to create server: ${error.message}`
        })
      }
    })
  }

  stop(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve({
          success: false,
          message: 'Server is not running'
        })
        return
      }
      
      try {
        this.server.close(() => {
          this.log('info', 'MCP Server stopped')
          this.server = null
          resolve({
            success: true,
            message: 'Server stopped successfully'
          })
        })
      } catch (error: any) {
        this.log('error', 'Failed to stop server:', error)
        resolve({
          success: false,
          message: `Failed to stop server: ${error.message}`
        })
      }
    })
  }

  isRunning(): boolean {
    return this.server !== null
  }

  getStatus() {
    const uptime = this.isRunning() ? Math.floor((Date.now() - this.startTime) / 1000) : 0
    
    return {
      running: this.isRunning(),
      port: this.isRunning() ? this.config.port : 0,
      exposedPrompts: this.exposedPrompts.size,
      connections: this.activeConnections,
      uptime: uptime,
      requests: this.totalRequests,
      errors: this.totalErrors,
      logs: this.recentLogs.slice(-10).reverse(), // Get recent 10 logs, newest first
      config: this.config
    }
  }

  clearLogs() {
    this.recentLogs = []
    this.log('info', 'Server logs cleared')
  }
}

export default McpServer