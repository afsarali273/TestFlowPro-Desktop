"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Eye, EyeOff, Download, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TestResult {
  testCase: string
  dataSet: string
  status: "PASS" | "FAIL"
  error?: string
  assertionsPassed: number
  assertionsFailed: number
  responseTimeMs: number
  responseBody?: any
}

interface TestResultsData {
  summary: {
    suiteName: string
    tags: {
      serviceName: string
      suiteType: string
    }
    totalTestCases: number
    totalDataSets: number
    passed: number
    failed: number
    totalAssertionsPassed: number
    totalAssertionsFailed: number
    executionTimeMs: number
  }
  results: TestResult[]
}

interface TestResultsViewerProps {
  suite: any
  onClose: () => void
}

export function TestResultsViewer({ suite, onClose }: TestResultsViewerProps) {
  const [resultsData, setResultsData] = useState<TestResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadTestResults()
  }, [suite])

  const loadTestResults = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, this would load the results JSON file
      // For now, we'll use the sample data you provided
      const sampleResults: TestResultsData = {
        summary: {
          suiteName: "User API Suite Demo",
          tags: {
            serviceName: "@UserService",
            suiteType: "@smoke",
          },
          totalTestCases: 3,
          totalDataSets: 3,
          passed: 2,
          failed: 1,
          totalAssertionsPassed: 6,
          totalAssertionsFailed: 2,
          executionTimeMs: 629,
        },
        results: [
          {
            testCase: "Get Single User",
            dataSet: "Fetch User with ID 2",
            status: "PASS",
            assertionsPassed: 2,
            assertionsFailed: 0,
            responseTimeMs: 367,
          },
          {
            testCase: "List of all objects",
            dataSet: "Listing All Objects Using the endpoint",
            status: "FAIL",
            error:
              "Assertion failed: $.[0].name expected Apple iPhone 12 Pro Max, got Google Pixel 6 Pro | Assertion failed: $. size expected 5, got 13",
            assertionsPassed: 1,
            assertionsFailed: 2,
            responseTimeMs: 114,
            responseBody: [
              {
                id: "1",
                name: "Google Pixel 6 Pro",
                data: {
                  color: "Cloudy White",
                  capacity: "128 GB",
                },
              },
              {
                id: "2",
                name: "Apple iPhone 12 Mini, 256GB, Blue",
                data: null,
              },
              {
                id: "3",
                name: "Apple iPhone 12 Pro Max",
                data: {
                  color: "Cloudy White",
                  "capacity GB": 512,
                },
              },
              // ... more items would be here
            ],
          },
          {
            testCase: "Add Object",
            dataSet: "Adding a new Single Object",
            status: "PASS",
            assertionsPassed: 3,
            assertionsFailed: 0,
            responseTimeMs: 148,
          },
        ],
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setResultsData(sampleResults)
    } catch (err: any) {
      setError(err.message || "Failed to load test results")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleResultExpansion = (index: number) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedResults(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    return status === "PASS" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusColor = (status: string) => {
    return status === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const calculateSuccessRate = (passed: number, total: number) => {
    return total > 0 ? Math.round((passed / total) * 100) : 0
  }

  const exportResults = () => {
    if (!resultsData) return

    const dataStr = JSON.stringify(resultsData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${resultsData.summary.suiteName.replace(/\s+/g, "_")}_results.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Test Results...</p>
            <p className="text-gray-600 mt-2">Please wait while we fetch the results</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium text-red-800">Failed to Load Results</p>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <Button variant="outline" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={loadTestResults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!resultsData) return null

  const { summary, results } = resultsData
  const successRate = calculateSuccessRate(summary.passed, summary.totalDataSets)

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
              <h1 className="text-2xl font-bold">Test Results</h1>
              <p className="text-gray-600">{summary.suiteName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
            <Button onClick={loadTestResults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress value={successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Test Cases</p>
                  <p className="text-2xl font-bold">{summary.totalTestCases}</p>
                  <p className="text-xs text-gray-500">{summary.totalDataSets} data sets</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assertions</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalAssertionsPassed}</p>
                  <p className="text-xs text-red-500">{summary.totalAssertionsFailed} failed</p>
                </div>
                <div className="text-right">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Execution Time</p>
                  <p className="text-2xl font-bold">{formatExecutionTime(summary.executionTimeMs)}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Tags:</span>
              <Badge variant="secondary">{summary.tags.serviceName}</Badge>
              <Badge variant="secondary">{summary.tags.suiteType}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Test Results ({results.length})</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${result.status === "PASS" ? "border-l-green-500" : "border-l-red-500"}`}
                >
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <CardTitle className="text-base">{result.testCase}</CardTitle>
                              <CardDescription>{result.dataSet}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                                <span className="text-gray-500">{formatExecutionTime(result.responseTimeMs)}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ✓ {result.assertionsPassed}
                                {result.assertionsFailed > 0 && (
                                  <span className="text-red-500 ml-2">✗ {result.assertionsFailed}</span>
                                )}
                              </div>
                            </div>
                            {expandedResults.has(index) ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {result.error && (
                          <Alert className="mb-4 border-red-200 bg-red-50">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              <div className="font-medium mb-2">Error Details:</div>
                              <div className="text-sm">
                                {result.error.split(" | ").map((error, i) => (
                                  <div key={i} className="mb-1">
                                    • {error}
                                  </div>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        {result.responseBody && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 text-red-800">Response Body (Failed Test):</h4>
                            <ScrollArea className="h-64 w-full border rounded-lg">
                              <pre className="p-4 text-xs bg-gray-900 text-green-400 font-mono">
                                {JSON.stringify(result.responseBody, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <span className="font-medium">Assertions Passed:</span>
                            <span className="ml-2 text-green-600">{result.assertionsPassed}</span>
                          </div>
                          <div>
                            <span className="font-medium">Assertions Failed:</span>
                            <span className="ml-2 text-red-600">{result.assertionsFailed}</span>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Execution Summary</CardTitle>
                <CardDescription>Detailed breakdown of test execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Test Coverage</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Test Cases:</span>
                          <span className="font-medium">{summary.totalTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Data Sets:</span>
                          <span className="font-medium">{summary.totalDataSets}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Passed:</span>
                          <span className="font-medium">{summary.passed}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Failed:</span>
                          <span className="font-medium">{summary.failed}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Assertion Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-green-600">
                          <span>Assertions Passed:</span>
                          <span className="font-medium">{summary.totalAssertionsPassed}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Assertions Failed:</span>
                          <span className="font-medium">{summary.totalAssertionsFailed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Execution Time:</span>
                          <span className="font-medium">{formatExecutionTime(summary.executionTimeMs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Response Time:</span>
                          <span className="font-medium">
                            {formatExecutionTime(
                              results.reduce((acc, r) => acc + r.responseTimeMs, 0) / results.length,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
