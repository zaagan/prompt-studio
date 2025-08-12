import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from 'lucide-react'

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
    description: 'Cycles through all 12 available themes including System, Light, Dark, Matte, Midnight, Ocean, Forest, Cosmic, Sunset, Arctic, Rose, and macOS'
  },
  {
    key: ['⌘', 'O'],
    pcKey: ['Ctrl', 'O'],
    action: 'Switch to desktop mode',
    description: 'Switches from menu bar to desktop mode'
  }
]

export function KeyboardShortcutsSettings() {
  const isMac = typeof navigator !== 'undefined' && 
    navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </div>
            <CardDescription>
              Use these keyboard shortcuts to work more efficiently with Prompt Studio.
              Shortcuts work when not typing in input fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shortcuts.map((shortcut, index) => {
              const keys = isMac ? shortcut.key : shortcut.pcKey
              
              return (
                <div key={index} className="flex items-start justify-between p-4 rounded-lg border bg-card/50">
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">{shortcut.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {shortcut.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <Badge variant="outline" className="font-mono text-xs px-2 py-1 bg-background">
                          {key}
                        </Badge>
                        {keyIndex < keys.length - 1 && (
                          <span className="text-muted-foreground mx-1">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
            
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Shortcuts are disabled when typing in input fields or text areas</li>
                  <li>Press <Badge variant="outline" className="font-mono text-xs px-1">Esc</Badge> to unfocus inputs if needed</li>
                  <li>Some shortcuts may not work if the required UI component is not visible</li>
                  <li>Theme cycling goes through all 12 themes: System → Light → Dark → Matte → Midnight → Ocean → Forest → Cosmic → Sunset → Arctic → Rose → macOS</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Future shortcuts configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Shortcuts</CardTitle>
            <CardDescription>
              Customize keyboard shortcuts to match your workflow preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
              Custom shortcut configuration coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}