"use client"

// Updated with detailed test summary in status section
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Square, CheckCircle, XCircle, Clock, Terminal, AlertCircle, Settings, Loader2, BarChart3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SuiteRunnerModalProps {
  suite?: any
  target?: string
  isOpen: boolean
  onClose: () => void
}

interface LogEntry {
  timestamp: string
  type: "command" | "stdout" | "stderr" | "exit" | "error" | "info"
  content: string
  data?: any
}

export function SuiteRunnerModal({ suite, target, isOpen, onClose }: SuiteRunnerModalProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [executionResult, setExecutionResult] = useState<{
    success: boolean
    exitCode?: number
    completed: boolean
    stats?: { passed: number; failed: number; total: number }
  }>({ success: false, completed: false })
  const [frameworkPath, setFrameworkPath] = useState<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load framework path from localStorage
    const savedFrameworkPath = localStorage.getItem("frameworkPath")
    if (savedFrameworkPath) {
      setFrameworkPath(savedFrameworkPath)
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  const addLog = (type: LogEntry["type"], content: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { timestamp, type, content, data }])
  }

  const runSuite = async () => {
    if (!frameworkPath) {
      addLog("error", "Framework path not configured. Please configure it in settings.")
      return
    }

    if (!suite?.filePath && !target) {
      addLog("error", "Suite file path not available. Please save the suite first.")
      return
    }

    setIsRunning(true)
    setLogs([])
    setExecutionResult({ success: false, completed: false })

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    const isTestCaseExecution = suite?._executionTarget?.type === 'testcase' || !!target
    
    if (isTestCaseExecution) {
      addLog("info", `🚀 Starting test case execution...`)
      if (target) {
        addLog("info", `📋 Target: ${target}`)
      } else {
        addLog("info", `📋 Test Case: ${suite?._executionTarget?.testCaseName}`)
      }
    } else {
      addLog("info", `🚀 Starting test suite execution...`)
    }
    addLog("info", `📁 Framework Path: ${frameworkPath}`)
    if (suite?.filePath) {
      addLog("info", `📄 Suite File: ${suite.filePath}`)
    }

    try {
      // Determine API endpoint and payload based on execution type
      const isTestCaseExecution = suite?._executionTarget?.type === 'testcase' || !!target
      const apiEndpoint = isTestCaseExecution ? "/api/run-testcase" : "/api/execute-suite"
      
      const requestBody = isTestCaseExecution ? {
        target: target || `${suite?._executionTarget?.suiteId}:${suite?._executionTarget?.suiteName} > ${suite?._executionTarget?.testCaseId}:${suite?._executionTarget?.testCaseName}`,
        frameworkPath
      } : {
        frameworkPath,
        suiteFilePath: suite?.filePath,
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case "command":
                  addLog("command", `💻 Executing: ${data.command}`, data)
                  break
                case "stdout":
                  addLog("stdout", data.data.trim())
                  break
                case "stderr":
                  addLog("stderr", `⚠️  ${data.data.trim()}`)
                  break
                case "exit":
                  if (data.success) {
                    addLog("info", `✅ Test execution completed successfully (exit code: ${data.exitCode})`)
                    setExecutionResult({ success: true, exitCode: data.exitCode, completed: true, stats: data.stats })
                  } else {
                    addLog("error", `❌ Test execution failed (exit code: ${data.exitCode})`)
                    setExecutionResult({ success: false, exitCode: data.exitCode, completed: true, stats: data.stats })
                  }
                  break
                case "stats":
                  // Update stats during execution
                  setExecutionResult(prev => ({ ...prev, stats: data.stats }))
                  addLog("info", `📊 Progress: ${data.stats.passed} passed, ${data.stats.failed} failed (${data.stats.passed + data.stats.failed}/${data.stats.total})`)
                  break
                case "error":
                  addLog("error", `❌ Execution error: ${data.error}`)
                  setExecutionResult(prev => ({ success: false, completed: true, stats: prev.stats }))
                  break
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        addLog("info", "🛑 Test execution cancelled by user")
      } else {
        addLog("error", `❌ Failed to execute tests: ${error.message}`)
      }
      setExecutionResult({ success: false, completed: true })
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }

  const stopExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsRunning(false)
    addLog("info", "🛑 Stopping test execution...")
  }

  const clearLogs = () => {
    setLogs([])
    setExecutionResult({ success: false, completed: false })
  }

  const navigateToResults = () => {
    // Close this modal and navigate to results dashboard
    onClose()
    // Trigger navigation to results dashboard
    // This will be handled by the parent component
    window.dispatchEvent(new CustomEvent('navigate-to-results'))
  }

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "command":
        return <Terminal className="h-3 w-3 text-cyan-400 flex-shrink-0" />
      case "stdout":
        return <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
      case "stderr":
        return <AlertCircle className="h-3 w-3 text-yellow-400 flex-shrink-0" />
      case "error":
        return <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
      case "info":
        return <CheckCircle className="h-3 w-3 text-blue-400 flex-shrink-0" />
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
    }
  }

  const getLogTextColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "command":
        return "text-cyan-300"
      case "stdout":
        return "text-green-300"
      case "stderr":
        return "text-yellow-300"
      case "error":
        return "text-red-300"
      case "info":
        return "text-blue-300"
      default:
        return "text-gray-300"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Test Suite Runner - {target ? target.split(' > ')[0]?.split(':')[1] || 'Test Case' : suite?.suiteName || suite?._executionTarget?.suiteName || 'Unnamed Suite'}
          </DialogTitle>
          <DialogDescription>Execute the test suite using the configured automation framework</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
          {/* Status and Controls */}
          <div className="p-4 bg-gray-50 rounded-lg flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : executionResult.completed ? (
                    executionResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">
                    {isRunning
                      ? "Running..."
                      : executionResult.completed
                        ? executionResult.success
                          ? "Completed Successfully"
                          : "Failed"
                        : "Ready to Run"}
                  </span>
                </div>

                {executionResult.stats && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      ✓ {executionResult.stats.passed} Passed
                    </Badge>
                    {executionResult.stats.failed > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        ✗ {executionResult.stats.failed} Failed
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {executionResult.stats.passed + executionResult.stats.failed}/{executionResult.stats.total} Complete
                    </Badge>
                  </div>
                )}
                
                {executionResult.completed && !executionResult.stats && (
                  <Badge
                    variant={executionResult.success ? "default" : "destructive"}
                    className={executionResult.success ? "bg-green-100 text-green-800" : ""}
                  >
                    Exit Code: {executionResult.exitCode}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!frameworkPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would open framework config - for now just show alert
                      alert("Please configure framework path in the main settings")
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                )}

                {/* View Results Button - Show when execution is completed */}
                {executionResult.completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToResults}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Results
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={clearLogs} disabled={isRunning}>
                  Clear Logs
                </Button>

                {!isRunning ? (
                  <Button
                    onClick={runSuite}
                    disabled={!frameworkPath || (!suite?.filePath && !target)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {(suite?._executionTarget?.type === 'testcase' || target) ? 'Run Test Case' : 'Run Suite'}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stopExecution}>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </div>


          </div>

          {/* Prerequisites Check */}
          {(!frameworkPath || (!suite?.filePath && !target)) && (
            <Alert className="border-yellow-200 bg-yellow-50 flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-1">
                  {!frameworkPath && <div>• Framework path is not configured</div>}
                  {!suite?.filePath && !target && <div>• Suite file path is not available (save the suite first)</div>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Suite Info */}
          <Card className="flex-shrink-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">{target ? 'Target:' : 'Suite Name:'}</span>
                  <span className="ml-2">{target || suite?.suiteName || suite?._executionTarget?.suiteName || 'Unnamed Suite'}</span>
                </div>
                {!target && (
                  <div>
                    <span className="font-medium text-gray-600">Test Cases:</span>
                    <span className="ml-2">{suite?.testCases?.length || 0}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">Framework Path:</span>
                  <span className="ml-2 text-xs break-all">{frameworkPath || "Not configured"}</span>
                </div>
                {suite?.filePath && (
                  <div>
                    <span className="font-medium text-gray-600">Suite File:</span>
                    <span className="ml-2 text-xs break-all">{suite.filePath}</span>
                  </div>
                )}
              </div>


            </CardContent>
          </Card>

          {/* Execution Logs - This is the main scrollable area */}
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base">Execution Logs</CardTitle>
              <CardDescription>Real-time output from the test execution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
              <div className="h-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 border-t">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-1 font-mono text-sm min-h-full">
                    {logs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No logs yet. Click "Run Suite" to start execution.</p>
                        <p className="text-xs mt-1 opacity-75">Console output will appear here in real-time</p>
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-1 px-2 rounded hover:bg-gray-800/50 transition-colors duration-150"
                        >
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0 font-mono">{log.timestamp}</span>
                          {getLogIcon(log.type)}
                          <span
                            className={`flex-1 whitespace-pre-wrap break-words ${getLogTextColor(log.type)} leading-relaxed`}
                          >
                            {log.content}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}