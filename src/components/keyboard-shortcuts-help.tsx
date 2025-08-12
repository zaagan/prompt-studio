import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  {
    key: ['⌘', 'N'],
    pcKey: ['Ctrl', 'N'],
    action: 'Create new prompt',
    description: 'Opens the prompt editor to create a new prompt'
  },
  {
    key: ['⌘', 'F'],
    pcKey: ['Ctrl', 'F'],
    action: 'Focus search',
    description: 'Focuses and selects the search input field'
  },
  {
    key: ['⌘', 'S'],
    pcKey: ['Ctrl', 'S'],
    action: 'Save current prompt',
    description: 'Saves the current prompt if the editor is open'
  },
  {
    key: ['⌘', 'T'],
    pcKey: ['Ctrl', 'T'],
    action: 'Cycle through themes',
    description: 'Cycles through all 12 available themes (System, Light, Dark, Matte, Midnight, Ocean, Forest, Cosmic, Sunset, Arctic, Rose, macOS)'
  },
  {
    key: ['⌘', 'O'],
    pcKey: ['Ctrl', 'O'],
    action: 'Switch to desktop mode',
    description: 'Switches from menu bar to desktop mode'
  }
]

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const isMac = typeof navigator !== 'undefined' && 
    navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these keyboard shortcuts to work more efficiently with Prompt Studio.
          </p>
          
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => {
              const keys = isMac ? shortcut.key : shortcut.pcKey
              
              return (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{shortcut.action}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {shortcut.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <Badge variant="outline" className="font-mono text-xs px-2">
                          {key}
                        </Badge>
                        {keyIndex < keys.length - 1 && <span className="text-muted-foreground">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p><strong>Note:</strong> Shortcuts work when not typing in input fields. Use <Badge variant="outline" className="font-mono">Esc</Badge> to unfocus inputs if needed.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}