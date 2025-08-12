import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function CrashTest() {
  const [shouldCrash, setShouldCrash] = React.useState(false)

  // Trigger a React error boundary crash
  const triggerReactCrash = () => {
    setShouldCrash(true)
  }

  // Trigger an unhandled promise rejection
  const triggerPromiseRejection = () => {
    Promise.resolve().then(() => {
      throw new Error('Test unhandled promise rejection')
    })
  }

  // Trigger a runtime error
  const triggerRuntimeError = () => {
    setTimeout(() => {
      // @ts-ignore - intentionally cause runtime error
      window.nonExistentFunction()
    }, 100)
  }

  // Trigger a custom error with detailed stack trace
  const triggerCustomError = () => {
    const createNestedError = () => {
      const deepError = () => {
        throw new Error('Deep nested custom error with detailed stack trace')
      }
      deepError()
    }
    createNestedError()
  }

  if (shouldCrash) {
    throw new Error('Test React Error Boundary - Component crashed intentionally')
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-destructive">🧪 Crash Testing</CardTitle>
        <CardDescription>
          Test different types of application crashes to verify the crash dialog functionality.
          <strong className="block mt-2 text-destructive">
            ⚠️ Warning: These buttons will actually crash parts of the application!
          </strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="destructive"
            onClick={triggerReactCrash}
            className="w-full"
          >
            React Error Boundary
          </Button>
          
          <Button
            variant="destructive"
            onClick={triggerPromiseRejection}
            className="w-full"
          >
            Promise Rejection
          </Button>
          
          <Button
            variant="destructive"
            onClick={triggerRuntimeError}
            className="w-full"
          >
            Runtime Error
          </Button>
          
          <Button
            variant="destructive"
            onClick={triggerCustomError}
            className="w-full"
          >
            Custom Error
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
          <strong>Testing Instructions:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>React Error Boundary:</strong> Should show crash dialog immediately</li>
            <li><strong>Promise Rejection:</strong> Check browser console for global handler</li>
            <li><strong>Runtime Error:</strong> Check browser console for global handler</li>
            <li><strong>Custom Error:</strong> Should show crash dialog with detailed stack</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}