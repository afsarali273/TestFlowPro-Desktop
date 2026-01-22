import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcut {
  keys: string[]
  description: string
}

interface ShortcutCategory {
  category: string
  items: KeyboardShortcut[]
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const shortcuts: ShortcutCategory[] = [
    {
      category: 'Navigation',
      items: [
        { keys: ['⌘/Ctrl', 'K'], description: 'Open command palette' },
        { keys: ['⌘/Ctrl', 'F'], description: 'Focus search' },
        { keys: ['Esc'], description: 'Close modal/cancel' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['⌘/Ctrl', 'N'], description: 'New test suite' },
        { keys: ['⌘/Ctrl', 'S'], description: 'Save' },
        { keys: ['⌘/Ctrl', 'R'], description: 'Run selected test' },
        { keys: ['⌘/Ctrl', 'Z'], description: 'Undo' },
        { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: 'Redo' },
      ]
    },
    {
      category: 'Help',
      items: [
        { keys: ['?'], description: 'Show this help' },
      ]
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map(section => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <Badge
                          key={keyIdx}
                          variant="outline"
                          className="font-mono text-xs px-2 py-1"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Pro tip:</strong> Press <Badge variant="outline" className="mx-1">?</Badge> at any time to see keyboard shortcuts relevant to your current screen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

