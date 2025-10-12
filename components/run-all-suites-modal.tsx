"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Square, CheckCircle, XCircle, Clock, Terminal, AlertCircle, Settings, Loader2, X, BarChart3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RunAllSuitesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface LogEntry {
  timestamp: string
  type: "command" | "stdout" | "stderr" | "exit" | "error" | "info"
  content: string
  data?: any
}

export function RunAllSuitesModal({ isOpen, onClose }: RunAllSuitesModalProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [executionResult, setExecutionResult] = useState<{
    success: boolean
    exitCode?: number
    completed: boolean
  }>({ success: false, completed: false })
  const [frameworkPath, setFrameworkPath] = useState<string>("")
  
  // Filter states
  const [serviceName, setServiceName] = useState("")
  const [suiteType, setSuiteType] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Load framework path from localStorage
    const savedFrameworkPath = localStorage.getItem("frameworkPath")
    if (savedFrameworkPath) {
      setFrameworkPath(savedFrameworkPath)
    }
  }, [])

  const addLog = (type: LogEntry["type"], content: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { timestamp, type, content, data }])
  }

  const runAllSuites = async () => {
    if (!frameworkPath) {
      addLog("error", "Framework path not configured. Please configure it in settings.")
      return
    }

    setIsRunning(true)
    setLogs([])
    setExecutionResult({ success: false, completed: false })

    addLog("info", `🚀 Starting all test suites execution...`)
    addLog("info", `📁 Framework Path: ${frameworkPath}`)
    
    if (serviceName) {
      addLog("info", `🏷️  Service Name Filter: ${serviceName}`)
    }
    if (suiteType) {
      addLog("info", `🏷️  Suite Type Filter: ${suiteType}`)
    }
    if (!serviceName && !suiteType) {
      addLog("info", `🏷️  No filters applied - running all suites`)
    }

    try {
      // Build the command with optional filters
      const params: any = {
        frameworkPath,
      }
      
      if (serviceName) {
        params.serviceName = serviceName
      }
      if (suiteType) {
        params.suiteType = suiteType
      }

      const response = await fetch("/api/execute-tests-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
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
                  addLog("command", `💻 Executing: ${data.command}`)
                  addLog("info", `📂 Working Directory: ${data.workingDirectory}`)
                  break
                case "stdout":
                  addLog("stdout", data.data.trim())
                  break
                case "stderr":
                  addLog("stderr", `⚠️  ${data.data.trim()}`)
                  break
                case "exit":
                  if (data.success) {
                    addLog("info", `✅ All test suites completed successfully (exit code: ${data.exitCode})`)
                    setExecutionResult({ success: true, exitCode: data.exitCode, completed: true })
                  } else {
                    addLog("error", `❌ Test suites execution failed (exit code: ${data.exitCode})`)
                    setExecutionResult({ success: false, exitCode: data.exitCode, completed: true })
                  }
                  break
                case "error":
                  addLog("error", `❌ Execution error: ${data.error}`)
                  setExecutionResult({ success: false, completed: true })
                  break
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error: any) {
      addLog("error", `❌ Failed to execute test suites: ${error.message}`)
      setExecutionResult({ success: false, completed: true })
    } finally {
      setIsRunning(false)
    }
  }

  const stopExecution = () => {
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

  const handleClose = () => {
    if (!isRunning) {
      onClose()
      // Reset state when closing
      setLogs([])
      setExecutionResult({ success: false, completed: false })
      setServiceName("")
      setSuiteType("")
      setShowFilters(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Run All Test Suites
          </DialogTitle>
          <DialogDescription>Execute all test suites with optional filtering</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
          {/* Filters Section */}
          {!isRunning && (
            <Card className="flex-shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Filter Options (Optional)</CardTitle>
                    <CardDescription className="text-sm">Apply filters to run specific test suites</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>
              </CardHeader>
              {showFilters && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceName" className="text-sm font-medium">
                        Service Name
                      </Label>
                      <Input
                        id="serviceName"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="e.g., @UserService"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suiteType" className="text-sm font-medium">
                        Suite Type
                      </Label>
                      <Input
                        id="suiteType"
                        value={suiteType}
                        onChange={(e) => setSuiteType(e.target.value)}
                        placeholder="e.g., @smoke"
                        className="h-10"
                      />
                    </div>
                  </div>
                  {(serviceName || suiteType) && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      {serviceName && (
                        <Badge variant="secondary" className="text-xs">
                          Service: {serviceName}
                          <button
                            onClick={() => setServiceName("")}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {suiteType && (
                        <Badge variant="secondary" className="text-xs">
                          Type: {suiteType}
                          <button
                            onClick={() => setSuiteType("")}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Status and Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg flex-shrink-0">
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

              {executionResult.completed && (
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
                  onClick={runAllSuites}
                  disabled={!frameworkPath}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run All Suites
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopExecution}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          {/* Prerequisites Check */}
          {!frameworkPath && (
            <Alert className="border-yellow-200 bg-yellow-50 flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Framework path is not configured. Please configure it in the main settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Framework Info */}
          <Card className="flex-shrink-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Framework Path:</span>
                  <span className="ml-2 text-xs break-all">{frameworkPath || "Not configured"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Command:</span>
                  <span className="ml-2 text-xs font-mono">
                    npx ts-node src/runner.ts
                    {serviceName && ` --serviceName=${serviceName}`}
                    {suiteType && ` --suiteType=${suiteType}`}
                  </span>
                </div>
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
                        <p>No logs yet. Click "Run All Suites" to start execution.</p>
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