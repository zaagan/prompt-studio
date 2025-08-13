import { useState, useEffect } from 'react'
import { Server, Play, Square, Settings, Copy, Download, Upload, Users, Shield, Globe, AlertTriangle, CheckCircle, XCircle, Search, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePromptStore } from '@/stores/usePromptStore'
import { generateSecureHash } from '@/lib/secure-hash'

interface ServerStatus {
  running: boolean
  port: number
  connections: number
  uptime: number
  requests: number
  errors: number
}

interface ExposedPrompt {
  id: number
  title: string
  exposed: boolean
  endpoint: string
  description?: string
  hasSecureHash?: boolean
}

export function McpServerPanel() {
  const { 
    prompts, 
    categories, 
    addToast, 
    mcpConfig, 
    exposedPrompts, 
    updateMcpConfig, 
    togglePromptExposure,
    migrateLegacyEndpoints 
  } = usePromptStore()

  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    running: false,
    port: 0,
    connections: 0,
    uptime: 0,
    requests: 0,
    errors: 0
  })

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const [serverLogs, setServerLogs] = useState<any[]>([])

  // Create exposed prompts list combining store data with prompt details
  const exposedPromptsList = prompts.map(prompt => {
    const exposureData = exposedPrompts.find(ep => ep.id === prompt.id)
    
    // Use secure hash if available, otherwise show default endpoint
    let endpoint = `/prompts/${prompt.id}`
    if (exposureData?.secureHash) {
      endpoint = `/prompts/${exposureData.secureHash}`
    }
    
    return {
      id: prompt.id,
      title: prompt.title,
      exposed: exposureData?.exposed || false,
      endpoint,
      description: prompt.description,
      hasSecureHash: !!exposureData?.secureHash
    }
  })

  const handleStartServer = async () => {
    console.log('Start Server button clicked!', { exposedCount, mcpConfig })
    setIsLoading(true)
    try {
      // Call the MCP server start function with config and exposed prompts
      const result = await window.electronAPI.startMcpServer(mcpConfig, exposedPrompts.filter(p => p.exposed))
      console.log('IPC call result:', result)
      
      if (result.success) {
        setServerStatus(prev => ({
          ...prev,
          running: true,
          port: result.port || mcpConfig.port,
          uptime: Date.now()
        }))

        addToast({
          type: 'success',
          title: 'MCP Server Started',
          description: `Server running on ${mcpConfig.host}:${result.port || mcpConfig.port}`
        })
      } else {
        throw new Error(result.message || 'Failed to start server')
      }
    } catch (error) {
      console.error('Failed to start MCP server:', error)
      addToast({
        type: 'error',
        title: 'Server Start Failed',
        description: error instanceof Error ? error.message : 'Failed to start the MCP server'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopServer = async () => {
    setIsLoading(true)
    try {
      // Call the MCP server stop function
      const result = await window.electronAPI.stopMcpServer()
      
      if (result.success) {
        setServerStatus(prev => ({
          ...prev,
          running: false,
          port: 0,
          connections: 0,
          uptime: 0
        }))

        addToast({
          type: 'info',
          title: 'MCP Server Stopped',
          description: 'Server has been shut down successfully'
        })
      } else {
        throw new Error(result.message || 'Failed to stop server')
      }
    } catch (error) {
      console.error('Failed to stop MCP server:', error)
      addToast({
        type: 'error',
        title: 'Server Stop Failed',
        description: error instanceof Error ? error.message : 'Failed to stop the MCP server'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePromptExposure = async (promptId: number) => {
    togglePromptExposure(promptId)
    
    // Update the server's exposed prompts if it's running
    if (serverStatus.running) {
      try {
        await window.electronAPI.updateMcpServerExposedPrompts(exposedPrompts.filter(p => p.exposed))
      } catch (error) {
        console.error('Failed to update server exposed prompts:', error)
      }
    }
  }

  const handleMigrateLegacyEndpoints = () => {
    const legacyCount = exposedPromptsList.filter(p => p.exposed && !p.hasSecureHash).length
    
    if (legacyCount === 0) {
      addToast({
        type: 'info',
        title: 'No Migration Needed',
        description: 'All exposed prompts already use secure endpoints'
      })
      return
    }

    migrateLegacyEndpoints()
    
    addToast({
      type: 'success',
      title: 'Endpoints Migrated',
      description: `Successfully upgraded ${legacyCount} endpoint${legacyCount !== 1 ? 's' : ''} to secure hashes`
    })
  }

  const handleExportConfig = () => {
    const config = {
      server: mcpConfig,
      exposedPrompts: exposedPrompts.filter(p => p.exposed)
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mcp-server-config.json'
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'Config Exported',
      description: 'MCP server configuration has been downloaded'
    })
  }

  const handleGenerateApiKey = () => {
    const key = 'mcp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    updateMcpConfig({ apiKey: key })
  }

  const handleClearLogs = async () => {
    try {
      await window.electronAPI.clearMcpServerLogs()
      setServerLogs([])
      addToast({
        type: 'success',
        title: 'Logs Cleared',
        description: 'Server logs have been cleared successfully'
      })
    } catch (error) {
      console.error('Failed to clear logs:', error)
      addToast({
        type: 'error',
        title: 'Clear Logs Failed',
        description: 'Failed to clear server logs'
      })
    }
  }

  const handleCopyApiKey = async () => {
    if (mcpConfig.apiKey) {
      try {
        await navigator.clipboard.writeText(mcpConfig.apiKey)
        setApiKeyCopied(true)
        addToast({
          type: 'success',
          title: 'API Key Copied',
          description: 'API key has been copied to clipboard'
        })
        setTimeout(() => setApiKeyCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy API key:', error)
        addToast({
          type: 'error',
          title: 'Copy Failed',
          description: 'Failed to copy API key to clipboard'
        })
      }
    }
  }

  const filteredPrompts = exposedPromptsList.filter(p => {
    const prompt = prompts.find(pr => pr.id === p.id)
    
    // Category filter
    const categoryMatch = selectedCategory === 'all' || prompt?.category_id?.toString() === selectedCategory
    
    // Search filter
    const searchMatch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt?.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return categoryMatch && searchMatch
  })

  const exposedCount = exposedPromptsList.filter(p => p.exposed).length
  const legacyCount = exposedPromptsList.filter(p => p.exposed && !p.hasSecureHash).length

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Check server status on component mount and periodically
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const status = await window.electronAPI.getMcpServerStatus()
        setServerStatus(prev => ({
          ...prev,
          running: status.running,
          port: status.port || 0,
          connections: status.connections || 0,
          uptime: status.uptime || 0,
          requests: status.requests || 0,
          errors: status.errors || 0
        }))
        
        // Store logs in a state variable for the logs section
        if (status.logs) {
          setServerLogs(status.logs)
        }
      } catch (error) {
        console.error('Failed to check server status:', error)
      }
    }

    // Initial check
    checkServerStatus()

    // Periodic check every 5 seconds
    const interval = setInterval(checkServerStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  // Auto-migrate legacy endpoints on component mount
  useEffect(() => {
    if (legacyCount > 0) {
      // Small delay to ensure the store is fully initialized
      const timer = setTimeout(() => {
        migrateLegacyEndpoints()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, []) // Only run once on mount

  // Update server config when it changes (if server is running)
  useEffect(() => {
    const updateServerConfig = async () => {
      if (serverStatus.running) {
        try {
          await window.electronAPI.updateMcpServerConfig(mcpConfig)
        } catch (error) {
          console.error('Failed to update server config:', error)
        }
      }
    }

    updateServerConfig()
  }, [mcpConfig, serverStatus.running])

  return (
    <div className="h-full p-4">
      <Tabs defaultValue="overview" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prompts">Exposed Prompts</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-4">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4">
            {/* Server Status Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>MCP Server Status</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {serverStatus.running ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Running
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Stopped
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{serverStatus.running ? serverStatus.port : '--'}</div>
                  <div className="text-sm text-muted-foreground">Port</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{serverStatus.connections}</div>
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{serverStatus.requests}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${serverStatus.errors > 0 ? 'text-red-600' : ''}`}>{serverStatus.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{exposedCount}</div>
                  <div className="text-sm text-muted-foreground">Exposed Prompts</div>
                </div>
              </div>

              {serverStatus.running && (
                <div className="text-center pt-2">
                  <div className="text-sm text-muted-foreground">
                    Uptime: <span className="font-medium">{formatUptime(serverStatus.uptime)}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-center space-x-4">
                {!serverStatus.running ? (
                  <Button
                    onClick={handleStartServer}
                    disabled={isLoading || exposedCount === 0}
                    className="min-w-[120px]"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? 'Starting...' : 'Start Server'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopServer}
                    disabled={isLoading}
                    variant="destructive"
                    className="min-w-[120px]"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {isLoading ? 'Stopping...' : 'Stop Server'}
                  </Button>
                )}
                
                <Button variant="outline" onClick={handleExportConfig}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
              </div>

              {exposedCount === 0 && !serverStatus.running && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need to expose at least one prompt before starting the server. Go to the "Exposed Prompts" tab to configure which prompts to make available.
                  </AlertDescription>
                </Alert>
              )}

              {serverStatus.running && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Server is running at <code className="bg-muted px-1 rounded">http://{mcpConfig.host}:{serverStatus.port}</code>
                    <br />
                    MCP clients can connect using this endpoint.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Access Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Authentication:</span>
                    <Badge variant={mcpConfig.enableAuth ? "default" : "secondary"}>
                      {mcpConfig.enableAuth ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate Limit:</span>
                    <span className="font-mono">{mcpConfig.rateLimit}/min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Network</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CORS:</span>
                    <Badge variant={mcpConfig.enableCors ? "default" : "secondary"}>
                      {mcpConfig.enableCors ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Max Connections:</span>
                    <span className="font-mono">{mcpConfig.maxConnections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Key:</span>
                    <Badge variant={mcpConfig.apiKey ? "default" : "destructive"}>
                      {mcpConfig.apiKey ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Log Level:</span>
                    <span className="font-mono capitalize">{mcpConfig.logLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Server Logs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Server Logs</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLogs}
                  className="h-7 px-2 text-xs"
                >
                  Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] px-6 pb-4">
                <div className="space-y-1">
                  {serverLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No logs available
                    </div>
                  ) : (
                    serverLogs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs font-mono border-b border-border/20 pb-1"
                      >
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge
                          variant={
                            log.level === 'ERROR' ? 'destructive' : 
                            log.level === 'WARN' ? 'secondary' : 
                            'outline'
                          }
                          className="text-xs h-4 px-1"
                        >
                          {log.level}
                        </Badge>
                        <span className="flex-1 break-words">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="prompts" className="flex-1 mt-4">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Manage Exposed Prompts</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
                  </Badge>
                  {legacyCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMigrateLegacyEndpoints}
                      className="h-6 px-2 text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Secure {legacyCount} endpoint{legacyCount !== 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Search and Filter Row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2">
                  {filteredPrompts.map(prompt => {
                    const originalPrompt = prompts.find(p => p.id === prompt.id)
                    return (
                      <div
                        key={prompt.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium truncate">{prompt.title}</h4>
                            {originalPrompt?.category_name && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ backgroundColor: `${originalPrompt.category_color}20`, color: originalPrompt.category_color }}
                              >
                                {originalPrompt.category_name}
                              </Badge>
                            )}
                          </div>
                          {prompt.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {prompt.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <code className="text-xs text-muted-foreground">
                              {prompt.endpoint}
                            </code>
                            {prompt.hasSecureHash && (
                              <Shield className="h-3 w-3 text-green-600" title="Secure endpoint" />
                            )}
                            {prompt.exposed && !prompt.hasSecureHash && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" title="Using insecure numeric ID - toggle to generate secure hash" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={prompt.exposed}
                            onCheckedChange={() => handleTogglePromptExposure(prompt.id)}
                          />
                          {prompt.exposed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`http://${mcpConfig.host}:${mcpConfig.port}${prompt.endpoint}`)
                                addToast({
                                  type: 'success',
                                  title: 'Copied',
                                  description: 'Endpoint URL copied to clipboard'
                                })
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="flex-1 mt-4">
          <Card className="h-full">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Server Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-6 p-6 pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Basic Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="server-name">Server Name</Label>
                    <Input
                      id="server-name"
                      value={mcpConfig.name}
                      onChange={(e) => updateMcpConfig({ name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="server-desc">Description</Label>
                    <Textarea
                      id="server-desc"
                      value={mcpConfig.description}
                      onChange={(e) => updateMcpConfig({ description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="host">Host</Label>
                      <Input
                        id="host"
                        value={mcpConfig.host}
                        onChange={(e) => updateMcpConfig({ host: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        min="1000"
                        max="65535"
                        value={mcpConfig.port}
                        onChange={(e) => updateMcpConfig({ port: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Security & Access</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Authentication</Label>
                      <div className="text-sm text-muted-foreground">Require API key for access</div>
                    </div>
                    <Switch
                      checked={mcpConfig.enableAuth}
                      onCheckedChange={(checked) => updateMcpConfig({ enableAuth: checked })}
                    />
                  </div>

                  {mcpConfig.enableAuth && (
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="api-key"
                            type={showApiKey ? "text" : "password"}
                            value={mcpConfig.apiKey}
                            onChange={(e) => updateMcpConfig({ apiKey: e.target.value })}
                            className="pr-20"
                            placeholder="Enter or generate API key"
                          />
                          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="h-7 w-7 p-0"
                              title={showApiKey ? "Hide API key" : "Show API key"}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            {mcpConfig.apiKey && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={handleCopyApiKey}
                                className="h-7 w-7 p-0"
                                title="Copy API key"
                              >
                                {apiKeyCopied ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleGenerateApiKey}
                          type="button"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      min="1"
                      max="1000"
                      value={mcpConfig.rateLimit}
                      onChange={(e) => updateMcpConfig({ rateLimit: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-connections">Max Connections</Label>
                    <Input
                      id="max-connections"
                      type="number"
                      min="1"
                      max="1000"
                      value={mcpConfig.maxConnections}
                      onChange={(e) => updateMcpConfig({ maxConnections: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CORS Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">CORS & Network</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable CORS</Label>
                      <div className="text-sm text-muted-foreground">Allow cross-origin requests</div>
                    </div>
                    <Switch
                      checked={mcpConfig.enableCors}
                      onCheckedChange={(checked) => updateMcpConfig({ enableCors: checked })}
                    />
                  </div>
                </div>

                {/* Logging Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Logging</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Logging</Label>
                      <div className="text-sm text-muted-foreground">Log server activity</div>
                    </div>
                    <Switch
                      checked={mcpConfig.enableLogging}
                      onCheckedChange={(checked) => updateMcpConfig({ enableLogging: checked })}
                    />
                  </div>

                  {mcpConfig.enableLogging && (
                    <div className="space-y-2">
                      <Label>Log Level</Label>
                      <Select
                        value={mcpConfig.logLevel}
                        onValueChange={(value: any) => updateMcpConfig({ logLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="flex-1 mt-4">
          <Card className="h-full">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle>MCP Server Documentation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 p-6 pt-0">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This MCP server exposes your prompt library as tools and resources that can be used by MCP-compatible clients like Claude Desktop.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Getting Started</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Configure which prompts to expose in the "Exposed Prompts" tab</li>
                    <li>Set up authentication and security settings in the "Configuration" tab</li>
                    <li>Start the server from the "Overview" tab</li>
                    <li>Connect your MCP client using the server endpoint</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">MCP Client Configuration</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <pre>{JSON.stringify({
                      "mcpServers": {
                        "prompt-studio": {
                          "command": "npx",
                          "args": ["-y", "@modelcontextprotocol/server-everything"],
                          "env": {
                            "MCP_SERVER_URL": `http://${mcpConfig.host}:${mcpConfig.port}`,
                            "MCP_API_KEY": mcpConfig.apiKey || "your-api-key"
                          }
                        }
                      }
                    }, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Available Endpoints</h3>
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /prompts</code>
                      <p className="text-sm text-muted-foreground mt-1">List all exposed prompts</p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /prompts/:id</code>
                      <p className="text-sm text-muted-foreground mt-1">Get a specific prompt by ID</p>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">POST /prompts/:id/execute</code>
                      <p className="text-sm text-muted-foreground mt-1">Execute a prompt with parameters</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    When authentication is enabled, include your API key in requests:
                  </p>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    Authorization: Bearer your-api-key
                  </div>
                </div>
              </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}