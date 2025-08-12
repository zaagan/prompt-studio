import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  cmd?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.isContentEditable
    ) {
      return
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey

    for (const shortcut of shortcuts) {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrl ? event.ctrlKey : true
      const matchesCmd = shortcut.cmd ? (isMac ? event.metaKey : event.ctrlKey) : !ctrlOrCmd || (!shortcut.ctrl && !shortcut.cmd)
      const matchesAlt = shortcut.alt ? event.altKey : !event.altKey
      const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey

      // For Ctrl/Cmd shortcuts, we want either ctrl OR cmd to work
      const matchesModifier = (shortcut.ctrl || shortcut.cmd) ? ctrlOrCmd : true

      if (matchesKey && matchesModifier && matchesAlt && matchesShift) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

// Global keyboard shortcuts hook for the entire app
export function useGlobalKeyboardShortcuts() {
  return useKeyboardShortcuts
}

// Utility function to get the display string for a shortcut
export function getShortcutDisplay(shortcut: Omit<KeyboardShortcut, 'action'>): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const parts: string[] = []

  if (shortcut.ctrl && shortcut.cmd) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  } else if (shortcut.ctrl || shortcut.cmd) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }

  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : ' + ')
}