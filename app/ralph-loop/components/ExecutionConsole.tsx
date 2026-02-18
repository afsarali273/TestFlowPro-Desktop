import React, { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  Code,
  Terminal,
  PlayCircle,
  Maximize2
} from 'lucide-react'

interface ExecutionConsoleProps {
  logs: string[]
  logRef: React.RefObject<HTMLDivElement | null>
}

export function ExecutionConsole({ logs, logRef }: ExecutionConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const getLogIcon = (log: string): React.ReactNode => {
    if (log.includes('success')) return <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
    if (log.includes('error') || log.includes('failed')) return <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
    if (log.includes('Sending to AI')) return <Zap className="h-3.5 w-3.5 text-purple-400 flex-shrink-0 animate-pulse" />
    if (/^Task \d+:/.test(log)) return <PlayCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
    if (log.includes('🔧 Tools used:')) return <Code className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
    if (log.includes('⚠️')) return <AlertCircle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
    if (log.startsWith('Started execution')) return <Clock className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
    return <Terminal className="h-3 w-3 text-slate-500 flex-shrink-0" />
  }

  const getLogColor = (log: string): string => {
    // Task headers - Bold Blue
    if (/^Task \d+:/.test(log)) return 'text-blue-400 font-bold'

    // Description - Cyan
    if (log.startsWith('Description:')) return 'text-cyan-300'

    // Sending to AI - Purple
    if (log === 'Sending to AI...') return 'text-purple-400 font-semibold'

    // Tools used - Green
    if (log.includes('🔧 Tools used:')) return 'text-green-400 font-semibold'

    // Steps executed - Yellow
    if (log.includes('📋 Steps executed:')) return 'text-yellow-400 font-semibold'

    // Success steps - Light Green
    if (log.includes('[playwright]') && log.includes('success')) return 'text-emerald-300'
    if (log.includes('[testflowpro]') && log.includes('success')) return 'text-emerald-300'

    // Error steps - Red
    if (log.includes('error')) return 'text-red-400'

    // Execution completed - Cyan
    if (log === 'Execution completed') return 'text-cyan-400 font-semibold'

    // Result - Light Text
    if (log.startsWith('Result:')) return 'text-slate-200 italic'

    // All tasks completed - Green
    if (log.includes('✅ All tasks completed')) return 'text-green-500 font-bold text-lg'

    // Summary generation - Cyan
    if (log.includes('🔄 Generating execution summary')) return 'text-cyan-400 font-semibold'
    if (log.includes('✅ Execution summary generated')) return 'text-green-400 font-semibold'

    // Warnings - Orange
    if (log.includes('⚠️')) return 'text-orange-400 font-semibold'

    // Retrying - Yellow
    if (log.includes('Retrying')) return 'text-yellow-400'

    // Default - Gray
    return 'text-slate-300'
  }

  const getLogBackground = (log: string): string => {
    // Task headers - Dark blue background with gradient
    if (/^Task \d+:/.test(log)) return 'bg-gradient-to-r from-blue-950/60 to-blue-900/40 border-l-4 border-blue-500 pl-3'

    // MCP tool lines - Subtle background
    if (log.includes('[playwright]')) return 'bg-gradient-to-r from-purple-950/30 to-transparent pl-6 border-l-2 border-purple-500/30'
    if (log.includes('[testflowpro]')) return 'bg-gradient-to-r from-orange-950/30 to-transparent pl-6 border-l-2 border-orange-500/30'

    // Success indicators
    if (log.includes('✅')) return 'bg-green-950/20'

    // Errors
    if (log.includes('error') || log.includes('failed')) return 'bg-red-950/20 border-l-2 border-red-500/50'

    // Warnings
    if (log.includes('⚠️')) return 'bg-orange-950/20 border-l-2 border-orange-500/50'

    return ''
  }

  const formatLogLine = (log: string): React.ReactNode => {
    // Parse tool execution lines - handle both single line and multi-line formats
    const toolLineMatch = log.match(/^\s*(\d+)\.\s*\[(\w+)]\s*([\w_]+):\s*(\w+)\s*(.*)/)
    if (toolLineMatch) {
      const [, num, server, tool, status, details] = toolLineMatch
      const statusColor = status === 'success' ? 'text-emerald-400' : 'text-red-400'
      const statusBg = status === 'success' ? 'bg-emerald-950/50' : 'bg-red-950/50'

      // Enhanced server detection for new MCP tools
      let serverColor = 'text-slate-400'
      let serverBg = 'bg-slate-950/50'

      if (server === 'playwright') {
        serverColor = 'text-purple-400'
        serverBg = 'bg-purple-950/50'
      } else if (server === 'testflowpro') {
        serverColor = 'text-orange-400'
        serverBg = 'bg-orange-950/50'
      } else if (server === 'locator' || tool.includes('locator') || tool === 'get_best_locators') {
        serverColor = 'text-cyan-400'
        serverBg = 'bg-cyan-950/50'
      }

      return (
        <span className="font-mono text-sm flex items-center gap-2">
          <span className="text-slate-600 font-bold w-6">{num}.</span>
          <span className={`${serverBg} px-2 py-0.5 rounded text-xs ${serverColor} font-semibold`}>
            {server === 'locator' || tool === 'get_best_locators' ? 'locator' : server}
          </span>
          <span className="text-pink-300 font-medium">{tool}</span>
          <span className={`${statusBg} px-2 py-0.5 rounded text-xs ${statusColor} font-semibold uppercase`}>
            {status}
          </span>
          {details && <span className="text-slate-400 text-xs truncate">{details}</span>}
        </span>
      )
    }

    // Handle multi-line tool execution logs (like the new locator tool)
    if (log.trim() === 'unknown' || log.trim() === 'get_best_locators' || log.trim() === 'success' || log.includes('action=Get Best Locators')) {
      // This is part of a multi-line tool execution log
      const isServer = log.trim() === 'unknown'
      const isTool = log.trim() === 'get_best_locators'
      const isStatus = log.trim() === 'success'
      const isDetails = log.includes('action=Get Best Locators')

      if (isServer) {
        return (
          <span className="font-mono text-sm flex items-center gap-2">
            <span className="bg-cyan-950/50 px-2 py-0.5 rounded text-xs text-cyan-400 font-semibold">
              locator
            </span>
            <span className="text-slate-400 text-xs">MCP Server</span>
          </span>
        )
      }

      if (isTool) {
        return (
          <span className="font-mono text-sm flex items-center gap-2">
            <span className="text-pink-300 font-medium">get_best_locators</span>
            <span className="text-slate-400 text-xs">Tool</span>
          </span>
        )
      }

      if (isStatus) {
        return (
          <span className="font-mono text-sm flex items-center gap-2">
            <span className="bg-emerald-950/50 px-2 py-0.5 rounded text-xs text-emerald-400 font-semibold uppercase">
              success
            </span>
            <span className="text-slate-400 text-xs">Status</span>
          </span>
        )
      }

      if (isDetails) {
        const actionMatch = log.match(/action=([^,]+)/)
        const locatorMatch = log.match(/locator=([^)]+)/)
        return (
          <span className="font-mono text-sm flex items-center gap-2">
            <span className="text-slate-400 text-xs">Action:</span>
            <span className="text-blue-300 font-medium">{actionMatch ? actionMatch[1] : 'Unknown'}</span>
            {locatorMatch && (
              <>
                <span className="text-slate-400 text-xs">Locator:</span>
                <span className="text-green-300 font-mono text-xs bg-slate-800/50 px-2 py-0.5 rounded">
                  {locatorMatch[1]}
                </span>
              </>
            )}
          </span>
        )
      }
    }

    // Parse tool count lines
    const toolCountMatch = log.match(/^(🔧 Tools used:|📋 Steps executed:)\s*(.*)/)
    if (toolCountMatch) {
      const [, label, count] = toolCountMatch
      const labelColor = label.includes('Tools') ? 'text-green-400' : 'text-yellow-400'
      const bgColor = label.includes('Tools') ? 'bg-green-950/40' : 'bg-yellow-950/40'
      return (
        <span className="font-mono text-sm flex items-center gap-2">
          <span className={`${labelColor} font-semibold`}>{label}</span>
          <span className={`${bgColor} px-2 py-0.5 rounded text-amber-300 font-bold text-xs`}>{count}</span>
        </span>
      )
    }

    // Parse task headers
    const taskMatch = log.match(/^(Task \d+:)\s*(.*)/)
    if (taskMatch) {
      const [, taskNum, taskTitle] = taskMatch
      return (
        <span className="font-mono text-sm flex items-center gap-2">
          <span className="bg-blue-950/60 px-2 py-1 rounded text-blue-300 font-bold">{taskNum}</span>
          <span className="text-blue-200 font-medium">{taskTitle}</span>
        </span>
      )
    }

    // Parse description lines
    if (log.startsWith('Description:')) {
      const description = log.replace('Description:', '').trim()
      return (
        <span className="font-mono text-sm flex items-start gap-2">
          <span className="text-cyan-400 font-semibold min-w-fit">Description:</span>
          <span className="text-cyan-200 opacity-90">{description}</span>
        </span>
      )
    }

    // Parse result lines
    if (log.startsWith('Result:')) {
      const result = log.replace('Result:', '').trim()
      return (
        <span className="font-mono text-sm flex items-start gap-2">
          <span className="text-slate-400 font-semibold min-w-fit">Result:</span>
          <span className="text-slate-300 opacity-90 italic">{result}</span>
        </span>
      )
    }

    // Parse execution time
    const timeMatch = log.match(/^Started execution at (.*)/)
    if (timeMatch) {
      return (
        <span className="font-mono text-sm flex items-center gap-2">
          <span className="bg-cyan-950/40 px-2 py-1 rounded flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">Started at {timeMatch[1]}</span>
          </span>
        </span>
      )
    }

    // Default formatting
    return <span className="font-mono text-sm">{log}</span>
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
      {/* Console Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>
          </div>
          <Terminal className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Execution Console</span>
          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
            {logs.length > 0 ? `${logs.length} entries` : 'Ready'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            {logs.length > 0 ? new Date().toLocaleTimeString() : '—'}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded-md hover:bg-slate-700/50 transition-colors duration-200 group"
            title="Expand Console"
          >
            <Maximize2 className="h-4 w-4 text-slate-400 group-hover:text-slate-300" />
          </button>
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          </div>
        </div>
      </div>

      {/* Console Content */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-4 space-y-1.5 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <Terminal className="h-16 w-16 mx-auto mb-4 text-slate-700 opacity-50" />
              <p className="text-slate-500 text-sm mb-2">Console is ready</p>
              <p className="text-slate-600 text-xs">Execution output will appear here...</p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`group py-2 px-3 rounded-md transition-all duration-150 hover:bg-slate-800/70 ${getLogBackground(log)}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    {getLogIcon(log)}
                  </div>
                  <div className={`flex-1 ${getLogColor(log)}`}>
                    {formatLogLine(log)}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    {idx + 1}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={logRef} className="h-1" />
          <div ref={scrollRef} className="h-1" />
        </div>
      </ScrollArea>

      {/* Console Footer */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 px-4 py-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Ralph Loop Agent
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {logs.filter(l => l.includes('success')).length} success
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="h-3 w-3 text-red-500" />
              {logs.filter(l => l.includes('error') || l.includes('failed')).length} errors
            </span>
          </div>
          <div className="text-xs text-slate-500">
            v1.0
          </div>
        </div>
      </div>

      {/* Expanded Console Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <Terminal className="h-5 w-5 text-slate-400" />
              Execution Console - Expanded View
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[70vh]">
            {/* Modal Console Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-4 py-3 flex items-center justify-between shadow-lg rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>
                </div>
                <Terminal className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">Execution Console</span>
                <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                  {logs.length > 0 ? `${logs.length} entries` : 'Ready'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500">
                  {logs.length > 0 ? new Date().toLocaleTimeString() : '—'}
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                </div>
              </div>
            </div>

            {/* Modal Console Content */}
            <ScrollArea className="flex-1 w-full">
              <div className="p-6 space-y-2 font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-center py-20">
                    <Terminal className="h-20 w-20 mx-auto mb-6 text-slate-700 opacity-50" />
                    <p className="text-slate-500 text-lg mb-2">Console is ready</p>
                    <p className="text-slate-600 text-sm">Execution output will appear here...</p>
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`group py-3 px-4 rounded-lg transition-all duration-150 hover:bg-slate-800/70 ${getLogBackground(log)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          {getLogIcon(log)}
                        </div>
                        <div className={`flex-1 ${getLogColor(log)}`}>
                          {formatLogLine(log)}
                        </div>
                        <div className="text-xs text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                          {idx + 1}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={logRef} className="h-1" />
                <div ref={scrollRef} className="h-1" />
              </div>
            </ScrollArea>

            {/* Modal Console Footer */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 px-4 py-3 shadow-lg rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Ralph Loop Agent
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {logs.filter(l => l.includes('success')).length} success
                  </span>
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {logs.filter(l => l.includes('error') || l.includes('failed')).length} errors
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  v1.0
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
