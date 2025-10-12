"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Settings,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Calendar,
  BarChart3,
  PieChart,
  AlertTriangle,
  Award,
  Timer,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestResultDetailModal } from "@/components/test-result-detail-modal"

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
    runId?: string
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
  fileName?: string
  lastModified?: string
}

interface TestRun {
  runId: string
  runName: string
  suites: TestResultsData[]
  totalSuites: number
  totalTests: number
  totalPassed: number
  totalFailed: number
  totalExecutionTime: number
  lastModified: string
}

interface TestResultsDashboardProps {
  onClose: () => void
}

// Helper function to format XML content
const formatXmlContent = (xmlString: string): string => {
  try {
    const formatted = xmlString.replace(/></g, ">\n<")
    let indent = 0
    const lines = formatted.split("\n")

    return lines
      .map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("</")) {
          indent = Math.max(0, indent - 1)
        }

        const indentedLine = "  ".repeat(indent) + trimmed

        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>")) {
          indent++
        }

        return indentedLine
      })
      .join("\n")
  } catch (error) {
    return xmlString
  }
}

// Helper function to format API assertion errors
const formatApiError = (errorString: string) => {
  const errors = errorString.split(' | ').filter(error => error.trim())
  
  return (
    <div className="space-y-2">
      {errors.map((error, index) => {
        const trimmedError = error.trim()
        
        // Parse different types of API assertions
        if (trimmedError.includes('Assertion failed:')) {
          const assertionText = trimmedError.replace('Assertion failed: ', '')
          
          // Status code assertions
          if (assertionText.includes('statusCode expected')) {
            const match = assertionText.match(/statusCode expected (\d+), got (\d+)/)
            if (match) {
              return (
                <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-800">Status Code Mismatch</div>
                    <div className="text-xs text-red-600 mt-1">
                      Expected: <span className="font-mono bg-red-100 px-1 rounded">{match[1]}</span> | 
                      Received: <span className="font-mono bg-red-100 px-1 rounded">{match[2]}</span>
                    </div>
                  </div>
                </div>
              )
            }
          }
          
          // JSONPath assertions with expected/got values
          if (assertionText.includes('expected') && assertionText.includes('got')) {
            const parts = assertionText.split(' expected ')
            if (parts.length === 2) {
              const jsonPath = parts[0]
              const expectedGot = parts[1].split(', got ')
              const expected = expectedGot[0]
              const got = expectedGot[1] || 'undefined'
              
              return (
                <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-800">JSONPath Assertion Failed</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Path: <span className="font-mono bg-orange-100 px-1 rounded">{jsonPath}</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Expected: <span className="font-mono bg-orange-100 px-1 rounded">{expected}</span> | 
                      Got: <span className="font-mono bg-orange-100 px-1 rounded">{got}</span>
                    </div>
                  </div>
                </div>
              )
            }
          }
          
          // Existence assertions
          if (assertionText.includes('does not exist')) {
            const jsonPath = assertionText.replace(' does not exist', '')
            return (
              <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-800">Missing Field</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Path: <span className="font-mono bg-blue-100 px-1 rounded">{jsonPath}</span> does not exist
                  </div>
                </div>
              </div>
            )
          }
        }
        
        // Fallback for other error formats
        return (
          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <div className="text-sm text-gray-700">{trimmedError}</div>
          </div>
        )
      })}
    </div>
  )
}

// Helper function to format Playwright errors with proper styling
const formatPlaywrightError = (errorString: string) => {
  const cleanError = errorString.replace(/\x1B\[[0-9;]*m/g, '')
  const sections = cleanError.split('\n\n')
  
  return (
    <div className="space-y-3 font-mono text-sm">
      {sections.map((section, index) => {
        const lines = section.split('\n')
        
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lineIndex) => {
              if (line.includes('expect(') && line.includes('failed')) {
                return (
                  <div key={lineIndex} className="text-red-600 font-semibold">
                    {line}
                  </div>
                )
              }
              
              if (line.includes('Locator:')) {
                return (
                  <div key={lineIndex} className="text-blue-600">
                    {line}
                  </div>
                )
              }
              
              if (line.startsWith('- ')) {
                return (
                  <div key={lineIndex} className="text-red-500 bg-red-50 px-2 py-1 rounded">
                    <span className="text-red-700 font-bold">- </span>
                    {line.substring(2)}
                  </div>
                )
              }
              
              if (line.startsWith('+ ')) {
                return (
                  <div key={lineIndex} className="text-green-600 bg-green-50 px-2 py-1 rounded">
                    <span className="text-green-700 font-bold">+ </span>
                    {line.substring(2)}
                  </div>
                )
              }
              
              if (line.includes('Timeout:')) {
                return (
                  <div key={lineIndex} className="text-orange-600 font-medium">
                    {line}
                  </div>
                )
              }
              
              if (line.includes('Call log:')) {
                return (
                  <div key={lineIndex} className="text-gray-700 font-semibold mt-2">
                    {line}
                  </div>
                )
              }
              
              return (
                <div key={lineIndex} className="text-gray-700">
                  {line}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

const isXmlContent = (content: string): boolean => {
  if (typeof content !== "string") return false
  const trimmed = content.trim()
  return trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && trimmed.includes("</"))
}

export function TestResultsDashboard({ onClose }: TestResultsDashboardProps) {
  const [allRuns, setAllRuns] = useState<TestRun[]>([])
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null)
  const [selectedResult, setSelectedResult] = useState<TestResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [resultsPath, setResultsPath] = useState<string>("")
  const [isPathConfigOpen, setIsPathConfigOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>("date")
  const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null)
  const [showTestResultModal, setShowTestResultModal] = useState(false)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())
  const [isDetailedView, setIsDetailedView] = useState(false)

  useEffect(() => {
    const savedResultsPath = localStorage.getItem("resultsPath")
    if (savedResultsPath) {
      setResultsPath(savedResultsPath)
      loadAllResults(savedResultsPath)
    } else {
      setIsPathConfigOpen(true)
    }
  }, [])

  const loadAllResults = async (path: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/test-results/all?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        throw new Error("Failed to load test results")
      }

      const results: TestResultsData[] = await response.json()
      
      // Group results by runId
      const runsMap = new Map<string, TestResultsData[]>()
      
      results.forEach(result => {
        const runId = result.summary.runId || 'unknown-run'
        if (!runsMap.has(runId)) {
          runsMap.set(runId, [])
        }
        runsMap.get(runId)!.push(result)
      })
      
      // Convert to TestRun objects
      const runs: TestRun[] = Array.from(runsMap.entries()).map(([runId, suites]) => {
        const totalSuites = suites.length
        const totalTests = suites.reduce((sum, s) => sum + s.summary.totalDataSets, 0)
        const totalPassed = suites.reduce((sum, s) => sum + s.summary.passed, 0)
        const totalFailed = suites.reduce((sum, s) => sum + s.summary.failed, 0)
        const totalExecutionTime = suites.reduce((sum, s) => sum + s.summary.executionTimeMs, 0)
        const lastModified = suites.reduce((latest, s) => 
          new Date(s.lastModified || 0) > new Date(latest) ? s.lastModified || latest : latest, 
          suites[0]?.lastModified || new Date().toISOString()
        )
        
        return {
          runId,
          runName: `Test Run ${runId.replace('run-', '')}`,
          suites,
          totalSuites,
          totalTests,
          totalPassed,
          totalFailed,
          totalExecutionTime,
          lastModified
        }
      }).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      
      setAllRuns(runs)

      if (runs.length > 0) {
        setSelectedRun(runs[0])
        if (runs[0].suites.length > 0) {
          setSelectedResult(runs[0].suites[0])
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load test results")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePathSave = (path: string) => {
    setResultsPath(path)
    localStorage.setItem("resultsPath", path)
    setIsPathConfigOpen(false)
    loadAllResults(path)
  }

  const handleTestResultClick = (result: TestResult) => {
    setSelectedTestResult(result)
    setShowTestResultModal(true)
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

  const exportResults = (result: TestResultsData) => {
    const dataStr = JSON.stringify(result, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${result.summary.suiteName.replace(/\s+/g, "_")}_results.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const exportHtmlReport = (run: TestRun) => {
    const successRate = calculateSuccessRate(run.totalPassed, run.totalTests)
    const htmlContent = generateHtmlReport(run, successRate)
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TestReport_${run.runName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSuiteHtmlReport = (suite: TestResultsData) => {
    const successRate = calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets)
    const htmlContent = generateSuiteHtmlReport(suite, successRate)
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${suite.summary.suiteName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSuitePdfReport = (suite: TestResultsData) => {
    const successRate = calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets)
    const htmlContent = generateSuitePdfReport(suite, successRate)
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const generateSuitePdfReport = (suite: TestResultsData, successRate: number) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${suite.summary.suiteName} - Test Report</title>
    <style>
        @media print { @page { margin: 0.5in; size: A4; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 15px 0; }
        .stat { background: rgba(255,255,255,0.15); padding: 15px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 20px; font-weight: 700; margin-bottom: 3px; }
        .stat-label { font-size: 11px; opacity: 0.8; }
        .progress { background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 15px; }
        .progress-bar { background: #10b981; height: 100%; width: ${successRate}%; }
        .content { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .section-header { background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0; }
        .section-title { font-size: 16px; font-weight: 600; color: #1e293b; }
        .test-item { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .test-item:last-child { border-bottom: none; }
        .test-info h4 { font-size: 14px; color: #1e293b; margin-bottom: 3px; }
        .test-info p { font-size: 12px; color: #64748b; }
        .test-meta { text-align: right; }
        .status { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .status.pass { background: #dcfce7; color: #166534; }
        .status.fail { background: #fef2f2; color: #991b1b; }
        .time { font-size: 10px; color: #64748b; margin-top: 3px; font-family: monospace; }
        .assertions { font-size: 10px; color: #64748b; margin-top: 2px; }
        .error { background: #fef2f2; border-left: 3px solid #ef4444; padding: 8px; margin-top: 5px; font-size: 11px; color: #991b1b; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🎯 ${suite.summary.suiteName}</div>
        <div class="subtitle">Test Execution Report • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat">
                <div class="stat-value">${suite.summary.totalDataSets}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value">${suite.summary.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${suite.summary.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${formatExecutionTime(suite.summary.executionTimeMs)}</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>
        
        <div class="progress">
            <div class="progress-bar"></div>
        </div>
    </div>
    
    <div class="content">
        <div class="section-header">
            <div class="section-title">Test Results (${suite.results.length} tests)</div>
        </div>
        
        ${suite.results.map(result => `
            <div class="test-item">
                <div class="test-info">
                    <h4>${result.testCase}</h4>
                    <p>${result.dataSet}</p>
                    <div class="assertions">✓ ${result.assertionsPassed} assertions${result.assertionsFailed > 0 ? ` • ✗ ${result.assertionsFailed} failed` : ''}</div>
                    ${result.error ? `<div class="error">❌ ${result.error}</div>` : ''}
                </div>
                <div class="test-meta">
                    <div class="status ${result.status.toLowerCase()}">${result.status}</div>
                    <div class="time">${formatExecutionTime(result.responseTimeMs)}</div>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="footer">
        Generated by TestFlow Pro • ${new Date().toISOString()}
    </div>
</body>
</html>`

  const generateSuiteHtmlReport = (suite: TestResultsData, successRate: number) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${suite.summary.suiteName} - Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .title { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { font-size: 16px; opacity: 0.9; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat { background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .stat-label { font-size: 14px; opacity: 0.8; }
        .progress { background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 20px; }
        .progress-bar { background: #10b981; height: 100%; width: ${successRate}%; }
        .content { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
        .section-header { background: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .section-title { font-size: 18px; font-weight: 600; color: #1e293b; }
        .test-item { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .test-item:last-child { border-bottom: none; }
        .test-info h4 { font-size: 16px; color: #1e293b; margin-bottom: 4px; }
        .test-info p { font-size: 14px; color: #64748b; }
        .test-meta { text-align: right; }
        .status { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status.pass { background: #dcfce7; color: #166534; }
        .status.fail { background: #fef2f2; color: #991b1b; }
        .time { font-size: 12px; color: #64748b; margin-top: 4px; font-family: monospace; }
        .assertions { font-size: 12px; color: #64748b; margin-top: 2px; }
        .error { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-top: 8px; font-size: 13px; color: #991b1b; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🎯 ${suite.summary.suiteName}</div>
            <div class="subtitle">Test Execution Report • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${successRate}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${suite.summary.totalDataSets}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${suite.summary.passed}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${suite.summary.failed}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatExecutionTime(suite.summary.executionTimeMs)}</div>
                    <div class="stat-label">Duration</div>
                </div>
            </div>
            
            <div class="progress">
                <div class="progress-bar"></div>
            </div>
        </div>
        
        <div class="content">
            <div class="section-header">
                <div class="section-title">Test Results (${suite.results.length} tests)</div>
            </div>
            
            ${suite.results.map(result => `
                <div class="test-item">
                    <div class="test-info">
                        <h4>${result.testCase}</h4>
                        <p>${result.dataSet}</p>
                        <div class="assertions">✓ ${result.assertionsPassed} assertions${result.assertionsFailed > 0 ? ` • ✗ ${result.assertionsFailed} failed` : ''}</div>
                        ${result.error ? `<div class="error">❌ ${result.error}</div>` : ''}
                    </div>
                    <div class="test-meta">
                        <div class="status ${result.status.toLowerCase()}">${result.status}</div>
                        <div class="time">${formatExecutionTime(result.responseTimeMs)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            Generated by TestFlow Pro • ${new Date().toISOString()}
        </div>
    </div>
</body>
</html>`

  const generateHtmlReport = (run: TestRun, successRate: number) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${run.runName}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
        .subtitle { color: #64748b; font-size: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #64748b; font-size: 14px; }
        .success { color: #059669; }
        .error { color: #dc2626; }
        .suite-section { background: white; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .suite-header { padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .suite-title { font-size: 18px; font-weight: 600; color: #1e293b; }
        .test-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .test-info { flex: 1; }
        .test-name { font-weight: 500; color: #1e293b; }
        .test-dataset { color: #64748b; font-size: 14px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-pass { background: #dcfce7; color: #166534; }
        .status-fail { background: #fef2f2; color: #991b1b; }
        .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #059669; }
        .error-details { background: #fef2f2; padding: 10px; margin-top: 8px; border-radius: 4px; font-size: 12px; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🎯 Test Completion Report</div>
            <div class="subtitle">${run.runName} • Generated ${new Date().toLocaleString()}</div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value success">${successRate}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${run.totalTests}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value success">${run.totalPassed}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value error">${run.totalFailed}</div>
                    <div class="stat-label">Failed</div>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${successRate}%"></div>
            </div>
        </div>
        
        ${run.suites.map(suite => `
            <div class="suite-section">
                <div class="suite-header">
                    <div class="suite-title">${suite.summary.suiteName}</div>
                    <div style="color: #64748b; font-size: 14px; margin-top: 5px;">
                        ${suite.summary.totalDataSets} tests • ${suite.summary.passed} passed • ${suite.summary.failed} failed
                    </div>
                </div>
                
                ${suite.results.map(result => `
                    <div class="test-row">
                        <div class="test-info">
                            <div class="test-name">${result.testCase}</div>
                            <div class="test-dataset">${result.dataSet}</div>
                            ${result.error ? `<div class="error-details">❌ ${result.error}</div>` : ''}
                        </div>
                        <div style="text-align: right;">
                            <div class="status-badge ${result.status === 'PASS' ? 'status-pass' : 'status-fail'}">
                                ${result.status}
                            </div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                                ${formatExecutionTime(result.responseTimeMs)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
</body>
</html>`

  // Calculate overall statistics
  const overallStats = allRuns.reduce(
    (acc, run) => ({
      totalRuns: acc.totalRuns + 1,
      totalSuites: acc.totalSuites + run.totalSuites,
      totalTests: acc.totalTests + run.totalTests,
      totalPassed: acc.totalPassed + run.totalPassed,
      totalFailed: acc.totalFailed + run.totalFailed,
      totalExecutionTime: acc.totalExecutionTime + run.totalExecutionTime,
    }),
    {
      totalRuns: 0,
      totalSuites: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalExecutionTime: 0,
    }
  )

  // Filter and sort runs
  const filteredRuns = allRuns
    .filter((run) => {
      if (!searchTerm) return true
      
      const searchLower = searchTerm.toLowerCase()
      
      return run.runName.toLowerCase().includes(searchLower) ||
        run.suites.some(suite => 
          suite.summary.suiteName.toLowerCase().includes(searchLower) ||
          (suite.summary.tags && Object.values(suite.summary.tags).some(tagValue => 
            tagValue && tagValue.toString().toLowerCase().includes(searchLower)
          ))
        )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.runName.localeCompare(b.runName)
        case "success":
          return calculateSuccessRate(b.totalPassed, b.totalTests) - 
                 calculateSuccessRate(a.totalPassed, a.totalTests)
        case "time":
          return b.totalExecutionTime - a.totalExecutionTime
        case "date":
        default:
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      }
    })

  // Path configuration modal
  if (isPathConfigOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Configure Results Path
            </CardTitle>
            <CardDescription>Enter the path to your test results folder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="/path/to/test-results"
              value={resultsPath}
              onChange={(e) => setResultsPath(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => handlePathSave(resultsPath)}>Save & Load</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">Loading Test Results...</p>
            <p className="text-gray-600 mt-2">Analyzing all test execution data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-medium text-red-800">Failed to Load Results</p>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="flex gap-2 mt-6 justify-center">
              <Button variant="outline" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => loadAllResults(resultsPath)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 animate-in fade-in duration-700">
      {/* Modern Glassmorphism Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="h-10 px-4 bg-white/60 hover:bg-white/80 border border-slate-200/50 hover:border-slate-300 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="animate-in slide-in-from-left duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Test Analytics Dashboard
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{overallStats.totalRuns} runs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{overallStats.totalSuites} suites</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{overallStats.totalTests} tests</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 animate-in slide-in-from-right duration-500">
              <Button 
                variant="outline" 
                onClick={() => setIsPathConfigOpen(true)}
                className="h-10 px-4 bg-white/60 hover:bg-white/80 border border-slate-200/50 hover:border-slate-300 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                onClick={() => loadAllResults(resultsPath)}
                className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white border-0 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              {selectedRun && (
                <Button 
                  onClick={() => exportHtmlReport(selectedRun)}
                  className="h-10 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 pt-32">
        {/* Breadcrumb Navigation */}
        {isDetailedView && selectedRun && (
          <div className="mb-6 animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
              <Button 
                variant="ghost" 
                onClick={() => setIsDetailedView(false)}
                className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-slate-400">/</span>
                <span className="font-medium text-indigo-700">{selectedRun.runName}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-500">{selectedRun.totalSuites} suites • {selectedRun.totalTests} tests</span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Stats Overview - Only show when not in detailed view */}
        {!isDetailedView && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-in slide-in-from-bottom duration-700">
            <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-3 relative">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <div className="text-lg font-bold text-indigo-800">
                    {overallStats.totalRuns}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">Test Runs</div>
              </CardContent>
            </Card>
            
            <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-3 relative">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <div className="text-lg font-bold text-emerald-800">
                    {calculateSuccessRate(overallStats.totalPassed, overallStats.totalTests)}%
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">Success Rate</div>
              </CardContent>
            </Card>
            
            <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-3 relative">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <div className="text-lg font-bold text-blue-800">
                    {overallStats.totalTests}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">Total Tests</div>
              </CardContent>
            </Card>
            
            <Card className="group border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-3 relative">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-purple-600" />
                  <div className="text-lg font-bold text-purple-800">
                    {formatExecutionTime(overallStats.totalExecutionTime / Math.max(overallStats.totalSuites, 1))}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">Avg Time</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={`flex gap-6 animate-in slide-in-from-bottom duration-700 delay-200 ${
          isDetailedView ? 'h-[calc(100vh-180px)]' : 'h-[calc(100vh-200px)]'
        }`}>
          {/* Enhanced Sidebar */}
          <div className="w-80 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-indigo-50/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Search className="h-3 w-3 text-white" />
                </div>
                <h3 className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Test Runs Explorer
                </h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search test runs, suites, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 bg-white/70 backdrop-blur-sm border-slate-200/50 focus:bg-white focus:border-indigo-300 transition-all duration-300 rounded-xl shadow-lg"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-3 min-w-0">
                {filteredRuns.map((run, index) => {
                  const successRate = calculateSuccessRate(run.totalPassed, run.totalTests)
                  const isSelected = selectedRun?.runId === run.runId

                  return (
                    <div key={index} className="space-y-2 animate-in slide-in-from-left duration-500" style={{animationDelay: `${index * 100}ms`}}>
                      <div
                        className={`group p-3 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${
                          isSelected 
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg" 
                            : "bg-white/60 hover:bg-white/80 border border-slate-200/50 hover:border-indigo-200 hover:shadow-lg"
                        }`}
                        onClick={() => {
                          setSelectedRun(run)
                          setIsDetailedView(true)
                          if (run.suites.length > 0) {
                            setSelectedResult(run.suites[0])
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 ${
                              isSelected 
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600" 
                                : "bg-gradient-to-br from-slate-400 to-slate-500 group-hover:from-indigo-400 group-hover:to-purple-500"
                            }`}>
                              <Activity className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`font-semibold text-sm transition-colors duration-300 truncate ${
                                isSelected ? "text-indigo-900" : "text-slate-900 group-hover:text-indigo-800"
                              }`}>
                                {run.runName}
                              </h3>
                              <div className="text-xs text-slate-500">
                                {new Date(run.lastModified).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full shadow-sm animate-pulse flex-shrink-0 ${
                            successRate === 100 ? "bg-emerald-500" :
                            successRate >= 80 ? "bg-yellow-500" : "bg-red-500"
                          }`} />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center p-1.5 bg-white/50 rounded-md">
                            <div className="text-sm font-bold text-slate-800">{run.totalSuites}</div>
                            <div className="text-xs text-slate-600">Suites</div>
                          </div>
                          <div className="text-center p-1.5 bg-white/50 rounded-md">
                            <div className="text-sm font-bold text-slate-800">{run.totalTests}</div>
                            <div className="text-xs text-slate-600">Tests</div>
                          </div>
                          <div className="text-center p-1.5 bg-white/50 rounded-md">
                            <div className={`text-sm font-bold ${
                              successRate >= 90 ? "text-emerald-600" :
                              successRate >= 70 ? "text-yellow-600" : "text-red-600"
                            }`}>{successRate}%</div>
                            <div className="text-xs text-slate-600">Pass</div>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                successRate >= 90 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                                successRate >= 70 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : 
                                "bg-gradient-to-r from-red-400 to-red-600"
                              }`}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="ml-4 mt-2 space-y-1 animate-in slide-in-from-left duration-300">
                          {run.suites.map((suite, suiteIndex) => {
                            const suiteSuccessRate = calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets)
                            const isSuiteSelected = selectedResult?.summary.suiteName === suite.summary.suiteName
                            
                            return (
                              <div
                                key={suiteIndex}
                                className={`group p-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                  isSuiteSelected 
                                    ? "bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300 shadow-md" 
                                    : "bg-white/40 hover:bg-white/70 border border-slate-200/50 hover:border-indigo-200 hover:shadow-sm"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedResult(suite)
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      suiteSuccessRate >= 90 ? "bg-emerald-500" :
                                      suiteSuccessRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                                    }`} />
                                    <span className={`text-xs font-medium truncate transition-colors duration-300 ${
                                      isSuiteSelected ? "text-indigo-900" : "text-slate-700 group-hover:text-indigo-800"
                                    }`}>
                                      {suite.summary.suiteName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className={`text-xs font-bold ${
                                      suiteSuccessRate >= 90 ? "text-emerald-600" :
                                      suiteSuccessRate >= 70 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                      {suiteSuccessRate}%
                                    </span>
                                    <div className="text-xs text-slate-500">
                                      ({suite.summary.totalDataSets})
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {filteredRuns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No runs found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 overflow-hidden">
            {isDetailedView && selectedRun ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
                <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                          {selectedRun.runName} - All Test Results
                        </h2>
                        <div className="text-sm text-slate-600">
                          {selectedRun.totalSuites} suites • {selectedRun.totalTests} tests • {calculateSuccessRate(selectedRun.totalPassed, selectedRun.totalTests)}% success
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => exportHtmlReport(selectedRun)}
                      className="h-9 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>

                {/* All Test Results from All Suites */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full px-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    <div className="space-y-6 pb-6 pt-4">
                      {selectedRun.suites.map((suite, suiteIndex) => (
                        <div key={suiteIndex} className="animate-in slide-in-from-bottom duration-500" style={{animationDelay: `${suiteIndex * 100}ms`}}>
                          {/* Suite Header */}
                          <div className="mb-4 p-4 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 rounded-xl border border-slate-200/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                                  <FileText className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800">{suite.summary.suiteName}</h3>
                                  <div className="text-sm text-slate-600">
                                    {suite.summary.totalDataSets} tests • {suite.summary.passed} passed • {suite.summary.failed} failed
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={`px-3 py-1 rounded-full font-medium ${
                                  calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets) >= 90 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets) >= 70 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {calculateSuccessRate(suite.summary.passed, suite.summary.totalDataSets)}% Success
                                </Badge>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportSuiteHtmlReport(suite)}
                                    className="h-8 px-3 text-xs"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    HTML
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportSuitePdfReport(suite)}
                                    className="h-8 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    PDF
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Suite Test Results */}
                          <div className="space-y-3 ml-4">
                            {suite.results.map((result, resultIndex) => (
                              <Card
                                key={resultIndex}
                                className={`group cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl border-0 overflow-hidden ${
                                  result.status === "PASS" 
                                    ? "bg-gradient-to-r from-emerald-50/60 to-green-50/60 hover:from-emerald-100/60 hover:to-green-100/60 border-l-4 border-l-emerald-500" 
                                    : "bg-gradient-to-r from-red-50/60 to-pink-50/60 hover:from-red-100/60 hover:to-pink-100/60 border-l-4 border-l-red-500"
                                }`}
                                onClick={() => handleTestResultClick(result)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-md ${
                                        result.status === "PASS" 
                                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600" 
                                          : "bg-gradient-to-br from-red-500 to-red-600"
                                      }`}>
                                        {result.status === "PASS" ? (
                                          <CheckCircle className="h-4 w-4 text-white" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-white" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-sm text-slate-900">
                                          {result.testCase}
                                        </div>
                                        <div className="text-xs text-slate-600">
                                          {result.dataSet}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div className="text-center">
                                        <Badge className={`${getStatusColor(result.status)} px-2 py-1 rounded-full font-bold text-xs`}>
                                          {result.status}
                                        </Badge>
                                        <div className="text-xs text-slate-500 mt-1 font-mono">
                                          {formatExecutionTime(result.responseTimeMs)}
                                        </div>
                                      </div>
                                      
                                      <div className="text-center">
                                        <div className="flex items-center gap-1">
                                          <span className="text-emerald-600 font-bold text-xs">{result.assertionsPassed}</span>
                                          {result.assertionsFailed > 0 && (
                                            <span className="text-red-500 font-bold text-xs">/{result.assertionsFailed}</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-500">Assertions</div>
                                      </div>
                                      
                                      <Eye className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                                    </div>
                                  </div>
                                  
                                  {result.error && (
                                    <div className="mt-2 pt-2 border-t border-slate-200/50">
                                      <div className="flex items-center gap-2 text-xs text-red-700 bg-red-100/60 px-3 py-2 rounded-lg">
                                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                        <span className="font-medium">Error - Click to view details</span>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : selectedResult && selectedRun ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-indigo-50/30 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                          {selectedResult.summary.suiteName}
                        </h2>
                        <div className="text-sm text-slate-600 mt-1">
                          Test Suite Analysis & Results
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => exportSuiteHtmlReport(selectedResult)} 
                        className="h-10 px-4 bg-white/60 hover:bg-white/80 border border-slate-200/50 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        HTML Report
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => exportSuitePdfReport(selectedResult)} 
                        className="h-10 px-4 bg-white/60 hover:bg-white/80 border border-slate-200/50 hover:border-red-300 hover:bg-red-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF Report
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Summary Metrics */}
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-medium text-slate-600">Success Rate</span>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        {calculateSuccessRate(selectedResult.summary.passed, selectedResult.summary.totalDataSets)}%
                      </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-slate-600">Total Tests</span>
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {selectedResult.summary.totalDataSets}
                      </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-3 w-3 text-indigo-600" />
                        <span className="text-xs font-medium text-slate-600">Assertions</span>
                      </div>
                      <div className="text-lg font-bold text-indigo-600">
                        {selectedResult.summary.totalAssertionsPassed}
                      </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-slate-600">Duration</span>
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatExecutionTime(selectedResult.summary.executionTimeMs)}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Tags and Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 px-3 py-1 rounded-full font-medium shadow-sm">
                        {selectedResult.summary.tags.serviceName}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 px-3 py-1 rounded-full font-medium shadow-sm">
                        {selectedResult.summary.tags.suiteType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(selectedResult.lastModified || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Test Results with Tabs */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="results" className="h-full flex flex-col">
                    <div className="px-4 pt-2 flex-shrink-0">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="results">
                          Test Results ({selectedResult.results.length})
                        </TabsTrigger>
                        <TabsTrigger value="summary">
                          Detailed Summary
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="results" className="flex-1 overflow-hidden mt-4">
                      <ScrollArea className="h-full px-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        <div className="space-y-4 pb-6">
                          {selectedResult.results.map((result, index) => (
                            <Card
                              key={index}
                              className={`group cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl border-0 overflow-hidden animate-in slide-in-from-bottom duration-500 ${
                                result.status === "PASS" 
                                  ? "bg-gradient-to-r from-emerald-50/80 to-green-50/80 hover:from-emerald-100/80 hover:to-green-100/80 border-l-4 border-l-emerald-500" 
                                  : "bg-gradient-to-r from-red-50/80 to-pink-50/80 hover:from-red-100/80 hover:to-pink-100/80 border-l-4 border-l-red-500"
                              }`}
                              style={{animationDelay: `${index * 50}ms`}}
                              onClick={() => handleTestResultClick(result)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 ${
                                      result.status === "PASS" 
                                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600" 
                                        : "bg-gradient-to-br from-red-500 to-red-600"
                                    }`}>
                                      {result.status === "PASS" ? (
                                        <CheckCircle className="h-4 w-4 text-white" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-base text-slate-900 group-hover:text-slate-700 transition-colors duration-300">
                                        {result.testCase}
                                      </div>
                                      <div className="text-sm text-slate-600 font-medium">
                                        {result.dataSet}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <Badge className={`${getStatusColor(result.status)} px-2 py-1 rounded-full font-bold shadow-md text-xs`}>
                                        {result.status}
                                      </Badge>
                                      <div className="text-xs text-slate-500 mt-1 font-mono bg-white/50 px-2 py-1 rounded-lg">
                                        {formatExecutionTime(result.responseTimeMs)}
                                      </div>
                                    </div>
                                    
                                    <div className="text-center">
                                      <div className="flex items-center gap-2">
                                        <div className="text-emerald-600 font-bold flex items-center gap-1 text-sm">
                                          <CheckCircle className="h-3 w-3" />
                                          {result.assertionsPassed}
                                        </div>
                                        {result.assertionsFailed > 0 && (
                                          <div className="text-red-500 font-bold flex items-center gap-1 text-sm">
                                            <XCircle className="h-3 w-3" />
                                            {result.assertionsFailed}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-500">Assertions</div>
                                    </div>
                                    
                                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shadow-md group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                                      <Eye className="h-4 w-4 text-slate-600 group-hover:text-indigo-600" />
                                    </div>
                                  </div>
                                </div>
                                
                                {result.error && (
                                  <div className="mt-3 pt-3 border-t border-slate-200/50">
                                    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-100/80 px-3 py-2 rounded-lg border border-red-200">
                                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                      <span className="font-medium">Error detected - Click to view detailed analysis</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="summary" className="flex-1 overflow-hidden mt-4">
                      <ScrollArea className="h-full px-6">
                        <div className="space-y-6 pb-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Execution Summary
                              </CardTitle>
                              <CardDescription>Detailed breakdown of test execution results</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900">Test Coverage</h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Test Cases:</span>
                                      <span className="font-medium">{selectedResult.summary.totalTestCases}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Data Sets:</span>
                                      <span className="font-medium">{selectedResult.summary.totalDataSets}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Passed:
                                      </span>
                                      <span className="font-medium text-green-600">{selectedResult.summary.passed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-red-600 flex items-center gap-1">
                                        <XCircle className="h-4 w-4" />
                                        Failed:
                                      </span>
                                      <span className="font-medium text-red-600">{selectedResult.summary.failed}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Execution Time:</span>
                                      <span className="font-medium">{formatExecutionTime(selectedResult.summary.executionTimeMs)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Average Response Time:</span>
                                      <span className="font-medium">
                                        {formatExecutionTime(
                                          selectedResult.results.reduce((acc, r) => acc + r.responseTimeMs, 0) / 
                                          Math.max(selectedResult.results.length, 1)
                                        )}
                                      </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600">Assertions Passed:</span>
                                      <span className="font-medium text-green-600">{selectedResult.summary.totalAssertionsPassed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-red-600">Assertions Failed:</span>
                                      <span className="font-medium text-red-600">{selectedResult.summary.totalAssertionsFailed}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Test Performance Chart */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Response Time Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {selectedResult.results.map((result, index) => (
                                  <div key={index} className="flex items-center gap-4">
                                    <div className="w-48 text-sm truncate">{result.testCase}</div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${
                                              result.responseTimeMs < 500 ? "bg-green-500" :
                                              result.responseTimeMs < 1000 ? "bg-yellow-500" : "bg-red-500"
                                            }`}
                                            style={{
                                              width: `${Math.min((result.responseTimeMs / Math.max(...selectedResult.results.map(r => r.responseTimeMs))) * 100, 100)}%`
                                            }}
                                          />
                                        </div>
                                        <span className="text-sm font-mono w-16 text-right">
                                          {formatExecutionTime(result.responseTimeMs)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 h-full flex items-center justify-center animate-in fade-in duration-700">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-2xl">
                    <BarChart3 className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                    Select a Test Suite
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Choose a test suite from the sidebar to explore detailed results, performance metrics, and comprehensive analysis
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <TestResultDetailModal
        isOpen={showTestResultModal}
        onClose={() => setShowTestResultModal(false)}
        testResult={selectedTestResult}
      />
    </div>
  )
}