"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Search, ChevronRight, Clock, FileText, Plus, Play, Settings, Upload, Sparkles, Folder } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  category: string
  action: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  testSuites: any[]
  onNavigate: (action: string, data?: any) => void
}

export function CommandPalette({ isOpen, onClose, testSuites, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>([])
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  // Load recent commands from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentCommands')
      if (recent) {
        setRecentCommands(JSON.parse(recent))
      }
    }
  }, [])

  // Save recent command
  const saveRecentCommand = useCallback((commandId: string) => {
    const updated = [commandId, ...recentCommands.filter(id => id !== commandId)].slice(0, 5)
    setRecentCommands(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentCommands', JSON.stringify(updated))
    }
  }, [recentCommands])

  // Build command list
  const buildCommands = useCallback((): CommandItem[] => {
    const commands: CommandItem[] = [
      // Quick Actions
      {
        id: 'new-suite',
        title: 'Create New Test Suite',
        icon: <Plus className="h-4 w-4" />,
        category: 'Actions',
        action: () => onNavigate('new-suite'),
        keywords: ['create', 'new', 'add', 'suite']
      },
      {
        id: 'import-curl',
        title: 'Import from cURL',
        icon: <Upload className="h-4 w-4" />,
        category: 'Import',
        action: () => onNavigate('import-curl'),
        keywords: ['import', 'curl', 'api', 'upload']
      },
      {
        id: 'import-swagger',
        title: 'Import from Swagger/OpenAPI',
        icon: <Upload className="h-4 w-4" />,
        category: 'Import',
        action: () => onNavigate('import-swagger'),
        keywords: ['import', 'swagger', 'openapi', 'api']
      },
      {
        id: 'import-postman',
        title: 'Import Postman Collection',
        icon: <Upload className="h-4 w-4" />,
        category: 'Import',
        action: () => onNavigate('import-postman'),
        keywords: ['import', 'postman', 'collection']
      },
      {
        id: 'import-bruno',
        title: 'Import Bruno Collection',
        icon: <Upload className="h-4 w-4" />,
        category: 'Import',
        action: () => onNavigate('import-bruno'),
        keywords: ['import', 'bruno']
      },
      {
        id: 'import-playwright',
        title: 'Import Playwright Tests',
        icon: <Upload className="h-4 w-4" />,
        category: 'Import',
        action: () => onNavigate('import-playwright'),
        keywords: ['import', 'playwright', 'ui', 'tests']
      },
      {
        id: 'run-all',
        title: 'Run All Test Suites',
        icon: <Play className="h-4 w-4" />,
        category: 'Actions',
        action: () => onNavigate('run-all'),
        keywords: ['run', 'execute', 'test', 'all', 'suites']
      },
      {
        id: 'view-results',
        title: 'View Test Results',
        icon: <FileText className="h-4 w-4" />,
        category: 'Navigation',
        action: () => onNavigate('view-results'),
        keywords: ['results', 'reports', 'view', 'dashboard']
      },
      {
        id: 'settings',
        title: 'Open Settings',
        icon: <Settings className="h-4 w-4" />,
        category: 'Navigation',
        action: () => onNavigate('settings'),
        keywords: ['settings', 'config', 'preferences', 'configure']
      },
      {
        id: 'ai-chat',
        title: 'Open AI Assistant',
        icon: <Sparkles className="h-4 w-4" />,
        category: 'AI',
        action: () => onNavigate('ai-chat'),
        keywords: ['ai', 'assistant', 'help', 'generate', 'copilot']
      },
      {
        id: 'env-variables',
        title: 'Manage Environment Variables',
        icon: <Folder className="h-4 w-4" />,
        category: 'Settings',
        action: () => onNavigate('env-variables'),
        keywords: ['env', 'environment', 'variables', 'config']
      }
    ]

    // Add test suites to commands
    testSuites.forEach(suite => {
      const tags = suite.tags?.map((t: any) => Object.values(t)).flat() || []
      commands.push({
        id: `suite-${suite.id}`,
        title: suite.suiteName,
        subtitle: `${suite.testCases?.length || 0} tests • ${suite.type || 'API'}`,
        icon: <FileText className="h-4 w-4" />,
        category: 'Test Suites',
        action: () => onNavigate('open-suite', suite),
        keywords: [suite.suiteName, suite.applicationName, suite.type, ...tags].filter(Boolean)
      })
    })

    return commands
  }, [testSuites, onNavigate])

  // Fuzzy search implementation
  const fuzzyMatch = (str: string, pattern: string): number => {
    const patternLower = pattern.toLowerCase()
    const strLower = str.toLowerCase()

    // Exact match gets highest score
    if (strLower.includes(patternLower)) {
      return 100
    }

    // Fuzzy match
    let patternIdx = 0
    let score = 0

    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        score += 10
        patternIdx++
      }
    }

    return patternIdx === patternLower.length ? score : 0
  }

  // Filter commands based on query
  useEffect(() => {
    const commands = buildCommands()

    if (!query) {
      // Show recent commands first, then popular actions
      const recent = commands.filter(cmd => recentCommands.includes(cmd.id))
      const popular = commands.filter(cmd =>
        ['new-suite', 'import-postman', 'run-all', 'ai-chat'].includes(cmd.id) &&
        !recentCommands.includes(cmd.id)
      )
      setFilteredCommands([...recent, ...popular].slice(0, 10))
      return
    }

    // Fuzzy search across title, subtitle, category, and keywords
    const filtered = commands
      .map(cmd => {
        const searchIn = [
          cmd.title,
          cmd.subtitle || '',
          cmd.category,
          ...(cmd.keywords || [])
        ].join(' ')

        const score = fuzzyMatch(searchIn, query)
        return { cmd, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd)
      .slice(0, 10)

    setFilteredCommands(filtered)
    setSelectedIndex(0)
  }, [query, buildCommands, recentCommands])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            const cmd = filteredCommands[selectedIndex]
            saveRecentCommand(cmd.id)
            cmd.action()
            onClose()
            setQuery('')
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          setQuery('')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose, saveRecentCommand])

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3 bg-white dark:bg-slate-900">
          <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search test suites, actions, or type a command..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base bg-transparent"
            autoFocus
          />
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">⌘K</Badge>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96">
          <div className="p-2">
            {!query && recentCommands.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent
                </div>
              </div>
            )}

            {Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {category}
                </div>
                {items.map((item) => {
                  const globalIdx = filteredCommands.indexOf(item)
                  const isSelected = globalIdx === selectedIndex

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        saveRecentCommand(item.id)
                        item.action()
                        onClose()
                        setQuery('')
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors text-left group
                        ${isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent'
                        }
                      `}
                    >
                      <div className={`flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  )
                })}
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2 bg-slate-50 dark:bg-slate-900 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

