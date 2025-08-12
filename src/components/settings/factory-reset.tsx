import { useState } from 'react'
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePromptStore } from '@/stores/usePromptStore'

export function FactoryReset() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const { addToast, fetchAllData } = usePromptStore()

  const handleFactoryReset = () => {
    setShowConfirmDialog(true)
  }

  const confirmFactoryReset = async () => {
    if (confirmText !== 'RESET MY DATA') {
      addToast({
        type: 'error',
        title: 'Invalid Confirmation',
        description: 'Please type "RESET MY DATA" exactly as shown to confirm.'
      })
      return
    }

    setIsResetting(true)
    try {
      const result = await window.electronAPI.factoryReset()
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Factory Reset Complete',
          description: 'All data has been reset and sample data has been loaded.'
        })
        
        // Refresh the store data to show the new sample data
        await fetchAllData()
      } else {
        throw new Error(result.error || 'Factory reset failed')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Factory Reset Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsResetting(false)
      setShowConfirmDialog(false)
      setConfirmText('')
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive mb-2">Warning: This action cannot be undone</h4>
                <p className="text-sm text-muted-foreground">
                  Factory reset will permanently delete all of your:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Custom prompts and their versions</li>
                  <li>Categories and templates you've created</li>
                  <li>Test results and usage history</li>
                  <li>All personalized settings</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  After the reset, the app will be restored with sample prompts, templates, and categories to help you get started again.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              variant="destructive" 
              onClick={handleFactoryReset}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Factory Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Confirm Factory Reset</span>
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your data and cannot be undone. 
              Sample data will be restored to help you get started again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">To confirm, type:</p>
              <code className="text-sm bg-background px-2 py-1 rounded border">
                RESET MY DATA
              </code>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-text">Confirmation</Label>
              <Input
                id="confirm-text"
                placeholder="Type the confirmation text here..."
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isResetting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmFactoryReset}
              disabled={confirmText !== 'RESET MY DATA' || isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}