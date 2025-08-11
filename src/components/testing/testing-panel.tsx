import { useState } from 'react'
import { Play, Settings, Copy, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePromptStore } from '@/stores/usePromptStore'
import type { ApiTestRequest, ApiTestResponse } from '@/types'

interface TestConfig {
  apiEndpoint: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

export function TestingPanel() {
  const { prompts, selectedPrompt, addToast } = usePromptStore()
  const [testPrompt, setTestPrompt] = useState('')
  const [config, setConfig] = useState<TestConfig>({
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  })
  const [response, setResponse] = useState<ApiTestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    if (!testPrompt.trim()) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a prompt to test'
      })
      return
    }

    if (!config.apiKey.trim()) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter an API key'
      })
      return
    }

    setIsLoading(true)
    setResponse(null)

    try {
      const request: ApiTestRequest = {
        prompt: testPrompt,
        config: {
          apiEndpoint: config.apiEndpoint,
          apiKey: config.apiKey,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      }

      const result = await window.electronAPI.testPrompt(request)
      setResponse(result)

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Test Complete',
          description: `Response received in ${result.responseTime}ms`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Test Failed',
          description: result.error || 'Unknown error'
        })
      }
    } catch (error) {
      console.error('Test failed:', error)
      addToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Failed to run test'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsePrompt = (promptId: number) => {
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      setTestPrompt(prompt.content)
    }
  }

  const handleCopyResponse = async () => {
    if (response?.response) {
      try {
        await window.electronAPI.copyToClipboard(response.response)
        addToast({
          type: 'success',
          title: 'Copied',
          description: 'Response copied to clipboard'
        })
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  return (
    <div className="h-full p-4">
      <Tabs defaultValue="test" className="h-full flex flex-col">
        <TabsList>
          <TabsTrigger value="test">Test Prompt</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="flex-1 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Input Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Test Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Select */}
                  <div className="space-y-2">
                    <Label>Quick Select from Prompts</Label>
                    <Select onValueChange={(value) => handleUsePrompt(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a prompt to test..." />
                      </SelectTrigger>
                      <SelectContent>
                        {prompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id.toString()}>
                            {prompt.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prompt Input */}
                  <div className="space-y-2">
                    <Label htmlFor="test-prompt">Prompt to Test</Label>
                    <Textarea
                      id="test-prompt"
                      placeholder="Enter the prompt you want to test..."
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      className="min-h-[200px] resize-none"
                    />
                    <div className="text-xs text-muted-foreground">
                      {testPrompt.length} characters
                    </div>
                  </div>

                  <Button 
                    onClick={handleTest}
                    disabled={isLoading || !testPrompt.trim() || !config.apiKey.trim()}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? 'Testing...' : 'Run Test'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output Panel */}
            <div className="space-y-4">
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Response</CardTitle>
                    {response?.response && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyResponse}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Running test...</p>
                      </div>
                    </div>
                  ) : response ? (
                    <div className="space-y-4">
                      {response.success ? (
                        <>
                          <ScrollArea className="h-64 border rounded-lg p-3">
                            <pre className="text-sm whitespace-pre-wrap">
                              {response.response}
                            </pre>
                          </ScrollArea>
                          
                          {/* Response Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Response Time</span>
                              </div>
                              <Badge variant="outline">
                                {response.responseTime}ms
                              </Badge>
                            </div>
                            
                            {response.usage && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Zap className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Token Usage</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <div>Prompt: {response.usage.prompt_tokens}</div>
                                  <div>Completion: {response.usage.completion_tokens}</div>
                                  <div>Total: {response.usage.total_tokens}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-destructive mb-2">
                            Test Failed
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {response.error}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Response will appear here after running a test</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-endpoint">API Endpoint</Label>
                    <Input
                      id="api-endpoint"
                      value={config.apiEndpoint}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key..."
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select
                      value={config.model}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature ({config.temperature})</Label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min="1"
                      max="4000"
                      value={config.maxTokens}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}