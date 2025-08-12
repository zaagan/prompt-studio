import * as React from 'react'
import { Copy, AlertTriangle, RefreshCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { cn } from '@/lib/utils'

interface CrashDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  error: Error | null
  errorInfo?: {
    componentStack?: string
    errorBoundary?: string
  }
  onRestart?: () => void
}

export function CrashDialog({ open, onOpenChange, error, errorInfo, onRestart }: CrashDialogProps) {
  const [copied, setCopied] = React.useState(false)

  const fullStackTrace = React.useMemo(() => {
    if (!error) return ''
    
    let trace = `Error: ${error.name}\n`
    trace += `Message: ${error.message}\n\n`
    
    if (error.stack) {
      trace += `Stack Trace:\n${error.stack}\n`
    }
    
    if (errorInfo?.componentStack) {
      trace += `\nComponent Stack:\n${errorInfo.componentStack}\n`
    }
    
    if (errorInfo?.errorBoundary) {
      trace += `\nError Boundary: ${errorInfo.errorBoundary}\n`
    }
    
    trace += `\nTimestamp: ${new Date().toISOString()}\n`
    trace += `User Agent: ${navigator.userAgent}\n`
    
    return trace
  }, [error, errorInfo])

  const handleCopyStackTrace = async () => {
    try {
      // Try using Electron's clipboard API first
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.copyToClipboard(fullStackTrace)
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullStackTrace)
      } else {
        throw new Error('Clipboard API not available')
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers or environments without clipboard access
      try {
        const textArea = document.createElement('textarea')
        textArea.value = fullStackTrace
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Failed to copy to clipboard:', fallbackErr)
      }
    }
  }

  const handleRestart = () => {
    if (onRestart) {
      onRestart()
    } else {
      window.location.reload()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <DialogTitle>Application Crash Detected</DialogTitle>
              <DialogDescription className="mt-1">
                The application encountered an unexpected error and needs to be restarted.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {error && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">Error Details:</h4>
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm font-mono text-destructive">
                  <span className="font-semibold">{error.name}:</span> {error.message}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Full Stack Trace:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyStackTrace}
                className={cn(
                  "text-xs",
                  copied && "text-green-600 border-green-600"
                )}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border bg-muted p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {fullStackTrace}
              </pre>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button
            onClick={handleRestart}
            className="w-full sm:w-auto"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Restart Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}