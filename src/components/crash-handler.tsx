import React, { Component, ReactNode } from 'react'
import { CrashDialog } from './ui/crash-dialog'

interface CrashHandlerState {
  hasError: boolean
  error: Error | null
  errorInfo: {
    componentStack?: string
    errorBoundary?: string
  } | null
}

interface CrashHandlerProps {
  children: ReactNode
  fallback?: ReactNode
}

export class CrashHandler extends Component<CrashHandlerProps, CrashHandlerState> {
  constructor(props: CrashHandlerProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<CrashHandlerState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Crash Handler caught an error:', error, errorInfo)
    
    // Enhanced error reporting
    const enhancedErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'CrashHandler'
    }

    this.setState({
      error,
      errorInfo: enhancedErrorInfo
    })

    // Optional: Report to external crash reporting service
    this.reportCrash(error, enhancedErrorInfo)
  }

  private reportCrash = (error: Error, errorInfo: any) => {
    // Log detailed crash information
    const crashReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    }

    console.error('Crash Report:', crashReport)
    
    // Store crash report locally for potential later retrieval
    try {
      const crashes = JSON.parse(localStorage.getItem('crashReports') || '[]')
      crashes.push(crashReport)
      // Keep only last 10 crash reports
      if (crashes.length > 10) {
        crashes.shift()
      }
      localStorage.setItem('crashReports', JSON.stringify(crashes))
    } catch (e) {
      console.error('Failed to store crash report:', e)
    }

    // Here you could integrate with external services like:
    // - Sentry
    // - Bugsnag  
    // - LogRocket
    // - Custom analytics endpoint
  }

  private handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    // Try to restart electron app if available, otherwise reload
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        // In electron environment, we could add a restart API
        window.location.reload()
      } else {
        window.location.reload()
      }
    }, 100)
  }

  private handleClose = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default crash dialog
      return (
        <>
          {this.props.children}
          <CrashDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                this.handleClose()
              }
            }}
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRestart={this.handleRestart}
          />
        </>
      )
    }

    return this.props.children
  }
}

// Hook for programmatic crash handling
export const useCrashHandler = () => {
  const [crash, setCrash] = React.useState<{
    error: Error | null
    errorInfo: any
  }>({ error: null, errorInfo: null })

  const reportCrash = React.useCallback((error: Error, additionalInfo?: any) => {
    console.error('Manual crash report:', error)
    
    const errorInfo = {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: window.location.href,
      ...additionalInfo
    }

    setCrash({ error, errorInfo })
  }, [])

  const clearCrash = React.useCallback(() => {
    setCrash({ error: null, errorInfo: null })
  }, [])

  return {
    crash: crash.error,
    errorInfo: crash.errorInfo,
    reportCrash,
    clearCrash
  }
}

// Global error handler for unhandled promise rejections and runtime errors
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    const error = new Error(event.reason?.message || 'Unhandled Promise Rejection')
    error.name = 'UnhandledPromiseRejection'
    error.stack = event.reason?.stack || error.stack

    // Store for later display
    const crashReport = {
      timestamp: new Date().toISOString(),
      type: 'unhandledrejection',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      userAgent: navigator.userAgent
    }

    try {
      const crashes = JSON.parse(localStorage.getItem('globalCrashes') || '[]')
      crashes.push(crashReport)
      if (crashes.length > 10) crashes.shift()
      localStorage.setItem('globalCrashes', JSON.stringify(crashes))
    } catch (e) {
      console.error('Failed to store global crash report:', e)
    }
  })

  // Handle general runtime errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    const crashReport = {
      timestamp: new Date().toISOString(),
      type: 'error',
      error: {
        name: event.error?.name || 'RuntimeError',
        message: event.error?.message || event.message,
        stack: event.error?.stack || `at ${event.filename}:${event.lineno}:${event.colno}`
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }

    try {
      const crashes = JSON.parse(localStorage.getItem('globalCrashes') || '[]')
      crashes.push(crashReport)
      if (crashes.length > 10) crashes.shift()
      localStorage.setItem('globalCrashes', JSON.stringify(crashes))
    } catch (e) {
      console.error('Failed to store global crash report:', e)
    }
  })
}