import { useEffect } from 'react'

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const { key, ctrl, shift, alt, meta, action } = shortcut

        // Match ctrl/meta (cmd on Mac, ctrl on Windows/Linux)
        const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const shiftMatch = shift ? e.shiftKey : !e.shiftKey
        const altMatch = alt ? e.altKey : !e.altKey
        const metaMatch = meta ? e.metaKey : !e.metaKey

        if (
          e.key.toLowerCase() === key.toLowerCase() &&
          ctrlMatch && shiftMatch && altMatch
        ) {
          e.preventDefault()
          action()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

