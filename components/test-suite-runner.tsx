"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, Square, CheckCircle, XCircle, Clock, Terminal, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TestResultsViewer } from "@/components/test-results-viewer"

interface TestSuiteRunnerProps {
  suite: any
  onClose: () => void
  frameworkPath?: string
}

interface TestResult {
  testCaseName: string
  testDataName: string
  status: "running" | "passed" | "failed" | "pending"
  duration?: number
  error?: string
  response?: any
  assertions?: Array<{
    type: string
    jsonPath?: string
    expected: any
    actual?: any
    passed: boolean
  }>
}

export function TestSuiteRunner({ suite, onClose }: TestSuiteRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  // Add state for real execution and results viewing
  const [isRealExecution, setIsRealExecution] = useState(false)
  const [executionOutput, setExecutionOutput] = useState<string>("")
  const [showResults, setShowResults] = useState(false)
  const [executionCompleted, setExecutionCompleted] = useState(false)

  const totalTests = suite.testCases.reduce((acc: number, testCase: any) => acc + (testCase.testData?.length || 0), 0)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const simulateTestExecution = async (testCase: any, testData: any): Promise<TestResult> => {
    const startTime = Date.now()

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 500))

    const duration = Date.now() - startTime

    // Simulate random pass/fail for demo
    const shouldPass = Math.random() > 0.3

    const result: TestResult = {
      testCaseName: testCase.name,
      testDataName: testData.name,
      status: shouldPass ? "passed" : "failed",
      duration,
      response: shouldPass
        ? {
            status: 200,
            data: { id: "123", name: "Test Data" },
          }
        : undefined,
      error: shouldPass ? undefined : "Connection timeout",
      assertions:
        testData.assertions?.map((assertion: any) => ({
          ...assertion,
          actual: shouldPass ? assertion.expected : "Different value",
          passed: shouldPass,
        })) || [],
    }

    return result
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    setProgress(0)
    setLogs([])
    setExecutionCompleted(false)

    addLog(`Starting test suite: ${suite.suiteName}`)

    let completedTests = 0

    for (const testCase of suite.testCases) {
      if (!testCase.testData) continue

      for (const testData of testCase.testData) {
        setCurrentTest(`${testCase.name} - ${testData.name}`)
        addLog(`Running: ${testCase.name} - ${testData.name}`)

        // Set test as running
        setResults((prev) => [
          ...prev,
          {
            testCaseName: testCase.name,
            testDataName: testData.name,
            status: "running",
          },
        ])

        try {
          const result = await simulateTestExecution(testCase, testData)

          // Update result
          setResults((prev) =>
            prev.map((r) => (r.testCaseName === testCase.name && r.testDataName === testData.name ? result : r)),
          )

          addLog(`${result.status === "passed" ? "✓" : "✗"} ${testCase.name} - ${testData.name} (${result.duration}ms)`)

          if (result.error) {
            addLog(`  Error: ${result.error}`)
          }
        } catch (error) {
          addLog(`✗ ${testCase.name} - ${testData.name} - Unexpected error`)
        }

        completedTests++
        setProgress((completedTests / totalTests) * 100)
      }
    }

    setIsRunning(false)
    setCurrentTest("")
    setExecutionCompleted(true)
    addLog("Test suite execution completed")
  }

  // Add method to extract tags from suite
  const extractTagsFromSuite = (suite: any) => {
    const serviceName = suite.tags?.find((tag: any) => tag.serviceName)?.serviceName
    const suiteType = suite.tags?.find((tag: any) => tag.suiteType)?.suiteType
    return { serviceName, suiteType }
  }

  // Add real test execution method
  const runRealTests = async () => {
    const frameworkPath = localStorage.getItem("frameworkPath")

    if (!frameworkPath) {
      addLog("❌ Framework path not configured. Please configure it in settings.")
      return
    }

    const { serviceName, suiteType } = extractTagsFromSuite(suite)

    if (!serviceName && !suiteType) {
      addLog("❌ No serviceName or suiteType tags found in test suite")
      return
    }

    setIsRealExecution(true)
    setIsRunning(true)
    setExecutionOutput("")
    setExecutionCompleted(false)

    addLog(`🚀 Starting real test execution...`)
    addLog(`📁 Framework Path: ${frameworkPath}`)
    addLog(`🏷️  Service Name: ${serviceName || "Not specified"}`)
    addLog(`🏷️  Suite Type: ${suiteType || "Not specified"}`)

    try {
      const response = await fetch("/api/execute-tests-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frameworkPath,
          serviceName,
          suiteType,
        }),
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
                  addLog(`💻 Executing: ${data.command}`)
                  addLog(`📂 Working Directory: ${data.workingDirectory}`)
                  break
                case "stdout":
                  addLog(data.data.trim())
                  setExecutionOutput((prev) => prev + data.data)
                  break
                case "stderr":
                  addLog(`⚠️  ${data.data.trim()}`)
                  setExecutionOutput((prev) => prev + data.data)
                  break
                case "exit":
                  if (data.success) {
                    addLog(`✅ Test execution completed successfully (exit code: ${data.exitCode})`)
                    setExecutionCompleted(true)
                  } else {
                    addLog(`❌ Test execution failed (exit code: ${data.exitCode})`)
                  }
                  break
                case "error":
                  addLog(`❌ Execution error: ${data.error}`)
                  break
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error: any) {
      addLog(`❌ Failed to execute tests: ${error.message}`)
    } finally {
      setIsRealExecution(false)
      setIsRunning(false)
    }
  }

  const stopTests = () => {
    setIsRunning(false)
    setCurrentTest("")
    addLog("Test execution stopped by user")
  }

  const viewResults = () => {
    setShowResults(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const passedTests = results.filter((r) => r.status === "passed").length
  const failedTests = results.filter((r) => r.status === "failed").length
  const runningTests = results.filter((r) => r.status === "running").length

  // Show results viewer if requested
  if (showResults) {
    return <TestResultsViewer suite={suite} onClose={() => setShowResults(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Test Runner</h1>
              <p className="text-gray-600">{suite.suiteName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {executionCompleted && (
              <Button variant="outline" onClick={viewResults}>
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Button>
            )}
            {!isRunning ? (
              <>
                <Button onClick={runTests} disabled={totalTests === 0} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Simulate Tests
                </Button>
                <Button onClick={runRealTests} disabled={totalTests === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Real Tests
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={stopTests}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold">{totalTests}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{failedTests}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Running</p>
                  <p className="text-2xl font-bold text-blue-600">{runningTests}</p>
                </div>
                <Play className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isRunning && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                {currentTest && <p className="text-sm text-gray-600">Currently running: {currentTest}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {isRealExecution && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Real Test Execution Mode</span>
                <Badge variant="secondary">Live</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          {result.testCaseName} - {result.testDataName}
                        </CardTitle>
                        <CardDescription>{result.duration && `Duration: ${result.duration}ms`}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                    </div>
                  </CardHeader>
                  {(result.error || result.assertions) && (
                    <CardContent>
                      {result.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-medium">Error:</p>
                          <p className="text-sm text-red-700">{result.error}</p>
                        </div>
                      )}

                      {result.assertions && result.assertions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Assertions:</p>
                          {result.assertions.map((assertion, assertionIndex) => (
                            <div
                              key={assertionIndex}
                              className={`p-2 rounded border text-sm ${
                                assertion.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {assertion.passed ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                <span className="font-medium">{assertion.type}</span>
                                {assertion.jsonPath && <span className="text-gray-600">({assertion.jsonPath})</span>}
                              </div>
                              <div className="mt-1 text-xs">
                                Expected: {JSON.stringify(assertion.expected)}
                                {assertion.actual !== undefined && (
                                  <div>Actual: {JSON.stringify(assertion.actual)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}

              {results.length === 0 && !isRunning && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500 mb-4">No test results yet</p>
                    <Button onClick={runTests} disabled={totalTests === 0}>
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests to See Results
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Execution Logs</CardTitle>
                <CardDescription>Real-time test execution logs</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-900 text-green-400 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-500">No logs yet. Run tests to see execution logs.</div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
