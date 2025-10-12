"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Plus,
  FileText,
  Play,
  Edit,
  Trash2,
  BarChart3,
  Eye,
  Settings,
  Upload,
  Zap,
  Globe,
  PlayCircle,
  MousePointer,
  ChevronDown,
  ChevronRight,
  List,
  Grid3X3,
  Folder,
  FolderOpen,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { TestSuiteEditor } from "@/components/test-suite-editor"
import { TestSuiteRunner } from "@/components/test-suite-runner"
import { TestResultsDashboard } from "@/components/test-results-dashboard"
import { TestCasesModal } from "@/components/test-cases-modal"
import { PathConfigModal } from "@/components/path-config-modal"
import { FrameworkConfigModal } from "@/components/framework-config-modal"
import { SuiteRunnerModal } from "@/components/suite-runner-modal"
import { RunAllSuitesModal } from "@/components/run-all-suites-modal"
import { FolderTreeSidebar } from "@/components/folder-tree-sidebar"
import { AIChat } from "@/components/ai-chat"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { TestCaseView } from "@/components/test-case-view"
import { CurlImportModal } from "@/components/CurlImportModal"
import { SwaggerImportModal } from "@/components/SwaggerImportModal"
import { PostmanImportModal } from "@/components/PostmanImportModal"
import BrunoImportModal from "@/components/BrunoImportModal"
import EnvVariablesModal from "@/components/EnvVariablesModal"
import { SoapImportModal } from "@/components/SoapImportModal"
import { PlaywrightImportModal } from "@/components/PlaywrightImportModal"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import type { TestSuite } from "@/types/test-suite"

export default function APITestFramework() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showResultsDashboard, setShowResultsDashboard] = useState(false)
  const [showTestCasesModal, setShowTestCasesModal] = useState(false)
  const [showSuiteRunnerModal, setShowSuiteRunnerModal] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)
  const [showRunAllSuitesModal, setShowRunAllSuitesModal] = useState(false)
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'all' | 'ui' | 'api'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTestCaseView, setShowTestCaseView] = useState(false)
  const [viewTestCase, setViewTestCase] = useState<{ suite: TestSuite; testCase: any; testCaseIndex: number } | null>(null)
  const [viewTestCaseSource, setViewTestCaseSource] = useState<'dashboard' | 'editor'>('dashboard')
  const [resultsSource, setResultsSource] = useState<'dashboard' | 'editor'>('dashboard')
  const [resultsContext, setResultsContext] = useState<{ suite: TestSuite; testCase: any; testCaseIndex: number } | null>(null)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [sidebarViewMode, setSidebarViewMode] = useState<'application' | 'folder'>('application')
  const [showCurlImportModal, setShowCurlImportModal] = useState(false)
  const [showSwaggerImportModal, setShowSwaggerImportModal] = useState(false)
  const [showPostmanImportModal, setShowPostmanImportModal] = useState(false)
  const [showBrunoImportModal, setShowBrunoImportModal] = useState(false)
  const [showSoapImportModal, setShowSoapImportModal] = useState(false)
  const [showPlaywrightImportModal, setShowPlaywrightImportModal] = useState(false)
  const [showEnvVariablesModal, setShowEnvVariablesModal] = useState(false)



  // Add path configuration states
  const [testSuitePath, setTestSuitePath] = useState<string>("")
  const [frameworkPath, setFrameworkPath] = useState<string>("")
  const [isPathConfigOpen, setIsPathConfigOpen] = useState(false)
  const [isFrameworkConfigOpen, setIsFrameworkConfigOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  // Fallback function to load test suites directly from filesystem
  const loadTestSuitesDirectly = async (dirPath: string) => {
    console.log('📁 [Fallback] Loading test suites directly from:', dirPath)
    try {
      // Use File API to read directory (only works in modern browsers)
      if ('showDirectoryPicker' in window) {
        toast({
          title: "Server Unavailable",
          description: "API server not running. Please start the development server with 'npm run dev'.",
          variant: "destructive",
        })
        return
      }
      
      // For now, show error message
      throw new Error('Cannot access filesystem directly from browser')
    } catch (error) {
      console.error('❌ [Fallback] Direct loading failed:', error)
      toast({
        title: "Server Required",
        description: "The development server must be running to load test suites. Please run 'npm run dev' in the TestEditor directory.",
        variant: "destructive",
      })
    }
  }

  // Load paths and test suites on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const savedPath = localStorage.getItem("testSuitePath")
    const savedFrameworkPath = localStorage.getItem("frameworkPath")

    if (savedPath) {
      setTestSuitePath(savedPath)
      setTimeout(() => {
        loadTestSuitesFromPath(savedPath)
      }, 100)
    } else {
      setIsPathConfigOpen(true)
    }

    if (savedFrameworkPath) {
      setFrameworkPath(savedFrameworkPath)
    }
  }, [])

  // Add event listeners for navigation
  useEffect(() => {
    const handleNavigateToResults = () => {
      setResultsSource('dashboard')
      setResultsContext(null)
      setShowResultsDashboard(true)
    }

    const handleNavigateToResultsFromEditor = (event: any) => {
      // Store context for back navigation from event detail
      setResultsSource('editor')
      
      // Capture and enhance context from the event detail
      if (event.detail) {
        // Find the complete suite from testSuites array
        const fullSuite = testSuites.find(s => s.id === event.detail.suite.id) || event.detail.suite
        
        setResultsContext({
          ...event.detail,
          suite: fullSuite
        })
      }
      
      // Clear all states and show results
      setIsEditing(false)
      setSelectedSuite(null)
      setShowTestCaseView(false)
      setViewTestCase(null)
      setShowResultsDashboard(true)
    }

    const handleNavigateToTestCaseView = (event: any) => {
      console.log('handleNavigateToTestCaseView called', event.detail)
      const { suite, testCase, testCaseIndex } = event.detail
      setViewTestCase({ suite, testCase, testCaseIndex })
      setShowTestCaseView(true)
    }

    const handleRunTestCase = (event: any) => {
      const { target, suite, testCase } = event.detail
      // Clear all modal states first
      setShowTestCasesModal(false)
      setShowTestCaseView(false)
      setShowRunAllSuitesModal(false)
      setIsPathConfigOpen(false)
      setIsFrameworkConfigOpen(false)
      setViewTestCase(null)
      
      // Then set the run state
      setSelectedSuite(suite)
      setSelectedTestCase(testCase)
      setShowSuiteRunnerModal(true)
    }

    const handleNavigateToTestCaseEdit = (event: any) => {
      const { suite, testCase, testCaseIndex, testDataIndex } = event.detail
      // Clear view states
      setShowTestCaseView(false)
      setViewTestCase(null)
      
      // Navigate to test suite editor and trigger test data editing
      setSelectedSuite(suite)
      setIsEditing(true)
      
      // Store the edit context for the TestSuiteEditor to handle
      sessionStorage.setItem('editTestData', JSON.stringify({ testCaseIndex, testDataIndex }))
    }

    window.addEventListener("navigate-to-results", handleNavigateToResults)
    window.addEventListener("navigate-to-results-from-editor", handleNavigateToResultsFromEditor)
    window.addEventListener("navigate-to-test-case-view", handleNavigateToTestCaseView)
    window.addEventListener("run-test-case", handleRunTestCase)
    window.addEventListener("navigate-to-test-case-edit", handleNavigateToTestCaseEdit)

    return () => {
      window.removeEventListener("navigate-to-results", handleNavigateToResults)
      window.removeEventListener("navigate-to-results-from-editor", handleNavigateToResultsFromEditor)
      window.removeEventListener("navigate-to-test-case-view", handleNavigateToTestCaseView)
      window.removeEventListener("run-test-case", handleRunTestCase)
      window.removeEventListener("navigate-to-test-case-edit", handleNavigateToTestCaseEdit)
    }
  }, [testSuites])

  const loadTestSuitesFromPath = async (path: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/test-suites?path=${encodeURIComponent(path)}`)
      
      if (response.ok) {
        const suites = await response.json()
        const uniqueSuites = suites.map((suite: TestSuite, index: number) => ({
          ...suite,
          id: suite.id || `suite_${suite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}_${index}`,
        }))

        setTestSuites(uniqueSuites)
        toast({
          title: "Test Suites Loaded",
          description: `Loaded ${uniqueSuites.length} test suites from ${path}`,
        })
      } else {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} ${errorText}`)
      }
    } catch (error) {
      toast({
        title: "Error Loading Test Suites",
        description: `Failed to load test suites. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePathSave = (path: string) => {
    setTestSuitePath(path)
    localStorage.setItem("testSuitePath", path)
    setIsPathConfigOpen(false)
    loadTestSuitesFromPath(path)
  }

  const handleFrameworkPathSave = (path: string) => {
    setFrameworkPath(path)
    localStorage.setItem("frameworkPath", path)
    setIsFrameworkConfigOpen(false)
  }

  // Update the handleImportSuite function
  const handleImportSuite = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSuite = JSON.parse(e.target?.result as string)
          
          // Update localStorage with new suite's baseUrl
          if (importedSuite.baseUrl) {
            localStorage.setItem('suiteBaseUrl', importedSuite.baseUrl)
          } else {
            localStorage.removeItem('suiteBaseUrl')
          }
          
          // Generate deterministic ID for imported suite
          const timestamp = Date.now()
          importedSuite.id = `imported_${importedSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}`
          setTestSuites((prev) => [...prev, importedSuite])
          toast({
            title: "Test Suite Imported",
            description: "The test suite has been successfully imported.",
          })
        } catch (error) {
          toast({
            title: "Import Error",
            description: "Failed to import test suite. Please check the JSON format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  /* --------------------------- helpers ------------------------------ */
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      passed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      running: "bg-blue-100 text-blue-800",
    }
    return map[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const toggleSuiteExpansion = (suiteId: string) => {
    setExpandedSuites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(suiteId)) {
        newSet.delete(suiteId)
      } else {
        newSet.add(suiteId)
      }
      return newSet
    })
  }

  /* --------------------------- handlers ----------------------------- */
  // Update the handleCreateSuite function to use a more deterministic ID
  const handleCreateSuite = () => {
    // Clear existing baseUrl from localStorage when creating new suite
    localStorage.removeItem('suiteBaseUrl')
    
    const timestamp = Date.now()
    const newId = `new_suite_${timestamp}`
    setSelectedSuite({
      id: newId,
      suiteName: "New Suite",
      applicationName: "New Application",
      baseUrl: "",
      status: "Not Started",
      tags: [],
      testCases: [],
    })
    setIsEditing(true)
  }

  const handleSaveSuite = async (suite: TestSuite & { id?: string; status?: string; filePath?: string }) => {
    // Update the local state
    setTestSuites((prev) => {
      const exists = prev.find((s) => s.id === suite.id)
      return exists ? prev.map((s) => (s.id === suite.id ? suite : s)) : [...prev, suite]
    })

    setIsEditing(false)
    setSelectedSuite(null)

    // Refresh the test suites from the file system to ensure consistency
    if (testSuitePath) {
      await loadTestSuitesFromPath(testSuitePath)
    }

    toast({
      title: "Test Suite Saved",
      description: suite.filePath
          ? `Test suite saved to ${suite.fileName || "file"}`
          : "Test suite has been successfully saved.",
    })
  }

  const handleDeleteSuite = (suite: TestSuite) => {
    setSuiteToDelete(suite)
  }

  const confirmDeleteSuite = async () => {
    if (!suiteToDelete) return
    
    setIsDeleting(true)
    try {
      // Delete the file if it exists
      if (suiteToDelete.filePath) {
        const response = await fetch('/api/test-suites/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: suiteToDelete.filePath })
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete file')
        }
      }
      
      // Remove from local state
      setTestSuites((prev) => prev.filter((s) => s.id !== suiteToDelete.id))
      
      toast({
        title: "Test Suite Deleted",
        description: `Test suite "${suiteToDelete.suiteName}" and its JSON file have been permanently deleted.`,
      })
      
      setSuiteToDelete(null)
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the test suite file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRunSuite = (suite: TestSuite) => {
    // Clear all modal states first
    setShowTestCasesModal(false)
    setShowTestCaseView(false)
    setShowRunAllSuitesModal(false)
    setIsPathConfigOpen(false)
    setIsFrameworkConfigOpen(false)
    setViewTestCase(null)
    
    // Then set the run state
    setSelectedSuite(suite)
    setSelectedTestCase(null)
    setShowSuiteRunnerModal(true)
  }

  const handleRunTestCase = (suite: TestSuite, testCase: any) => {
    // Clear all modal states first
    setShowTestCasesModal(false)
    setShowTestCaseView(false)
    setShowRunAllSuitesModal(false)
    setIsPathConfigOpen(false)
    setIsFrameworkConfigOpen(false)
    setViewTestCase(null)
    
    // Then set the run state
    setSelectedSuite(suite)
    setSelectedTestCase(testCase)
    setShowSuiteRunnerModal(true)
  }

  const handleViewTestCase = (suite: TestSuite, testCase: any, testCaseIndex: number) => {
    // Clear all modal states first
    setShowTestCasesModal(false)
    setShowSuiteRunnerModal(false)
    setShowRunAllSuitesModal(false)
    setIsPathConfigOpen(false)
    setIsFrameworkConfigOpen(false)
    setSelectedSuite(null)
    setSelectedTestCase(null)
    
    // Determine source - if we're currently editing, it's from editor
    const source = isEditing ? 'editor' : 'dashboard'
    setViewTestCaseSource(source)
    
    // Then set the view state
    setViewTestCase({ suite, testCase, testCaseIndex })
    setShowTestCaseView(true)
  }



  // Filter suites with unique check
  const filteredSuites = testSuites
      .filter((suite) => {
        // Search term filter (suite name, tags, test names)
        const matchesSearch = !searchTerm || 
          suite.suiteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (suite.tags && suite.tags.some(tag => 
            Object.values(tag).some(value => 
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
          )) ||
          suite.testCases.some(tc => 
            tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tc.testData && tc.testData.some(td => td.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
            (tc.testSteps && tc.testSteps.some(ts => ts.keyword.toLowerCase().includes(searchTerm.toLowerCase())))
          )
        
        // Tab filter
        const matchesTab = activeTab === 'all' || 
          (activeTab === 'ui' && suite.type === 'UI') ||
          (activeTab === 'api' && suite.type === 'API')
        
        // Application filter
        const matchesApp = !selectedApp || (suite.applicationName || 'Uncategorized') === selectedApp
        
        // Folder filter
        const matchesFolder = !selectedFolder || (suite.filePath && suite.filePath.includes(selectedFolder))
        
        return matchesSearch && matchesTab && matchesApp && matchesFolder
      })
      .filter(
          (suite, index, self) => index === self.findIndex((s) => s.id === suite.id), // Remove any remaining duplicates
      )

  /* ------------------------------------------------------------------ */



  // Render results dashboard
  const renderResultsDashboard = () => (
    <TestResultsDashboard 
      onClose={() => {
        setShowResultsDashboard(false)
        
        // Navigate back to appropriate component
        if (resultsSource === 'editor' && resultsContext) {
          // Navigate back to TestCaseView component
          setViewTestCase(resultsContext)
          setViewTestCaseSource('editor')
          setShowTestCaseView(true)
        }
        setResultsSource('dashboard')
        setResultsContext(null)
      }} 
    />
  )

  // All conditional returns after all hooks are declared
  if (isEditing && selectedSuite) {
    return (
      <TestSuiteEditor 
        suite={selectedSuite} 
        onSave={handleSaveSuite} 
        onCancel={() => setIsEditing(false)}
        onViewTestCase={handleViewTestCase}
      />
    )
  }

  if (isRunning && selectedSuite) {
    return <TestSuiteRunner suite={selectedSuite} onClose={() => setIsRunning(false)} />
  }

  if (showTestCaseView && viewTestCase) {
    return (
      <TestCaseView
        suite={viewTestCase.suite}
        testCase={viewTestCase.testCase}
        testCaseIndex={viewTestCase.testCaseIndex}
        onBack={() => {
          setShowTestCaseView(false)
          setViewTestCase(null)
          
          // Navigate back to appropriate component
          if (viewTestCaseSource === 'editor' && viewTestCase) {
            setSelectedSuite(viewTestCase.suite)
            setIsEditing(true)
          }
          setViewTestCaseSource('dashboard')
        }}
      />
    )
  }

  if (showResultsDashboard) {
    return renderResultsDashboard()
  }



  return (
      <>
        {/* ------------ Main Page ------------- */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          {/* Header Section */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl">
            <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 lg:px-8 xl:px-10 py-6">
              <div className="flex items-center justify-between">
                {/* Logo and Title Section */}
                <div className="flex items-center space-x-4">
                  {/* Company Logo */}
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-2xl">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      TestFlow Pro
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-slate-600 font-medium">Advanced Test Automation Platform</p>
                      {testSuitePath && (
                          <Badge variant="outline" className="text-xs bg-blue-100/80 text-blue-700 border-blue-200/50 backdrop-blur-sm">
                            📁 {testSuitePath.split(/[\/\\]/).pop() || testSuitePath}
                          </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dashboard Toggle */}
                <div className="flex items-center space-x-4">

                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button
                      variant="outline"
                      onClick={() => setShowResultsDashboard(true)}
                      className="h-10 px-4 bg-white/60 hover:bg-white/80 border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Test Reports
                  </Button>

                  <div className="h-6 w-px bg-slate-300/50"></div>

                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 px-4 bg-white/60 hover:bg-white/80 border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setIsFrameworkConfigOpen(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Framework Path
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsPathConfigOpen(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Suites Path
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => document.getElementById("import-file")?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Import JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowSwaggerImportModal(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Import Swagger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowPostmanImportModal(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Postman
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowBrunoImportModal(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Import Bruno
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowSoapImportModal(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Import SOAP
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowPlaywrightImportModal(true)}>
                          <MousePointer className="h-4 w-4 mr-2" />
                          Import Playwright
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowEnvVariablesModal(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Environment Variables
                        </DropdownMenuItem>

                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                        variant="outline"
                        onClick={() => setShowCurlImportModal(true)}
                        className="h-10 px-4 bg-white/60 hover:bg-white/80 border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      cURL
                    </Button>
                  </div>
                  
                  <Input type="file" accept=".json" onChange={handleImportSuite} className="hidden" id="import-file" />

                  <Button
                      onClick={handleCreateSuite}
                      className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Test Suite
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 lg:px-8 xl:px-10 py-8 pt-32">
            {/* Search and Stats Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                      placeholder="Search suites, tags, test cases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-80 xl:w-96 2xl:w-[420px] h-11 pl-4 pr-4 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-lg rounded-xl"
                  />
                </div>
                {filteredSuites.length > 0 && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-slate-500 rounded-full mr-2"></div>
                    {filteredSuites.length} suite{filteredSuites.length !== 1 ? "s" : ""}
                  </span>
                      <span className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                        {filteredSuites.reduce((acc, suite) => acc + suite.testCases.length, 0)} test cases
                  </span>
                    </div>
                )}
              </div>

              {/* Run All Suites Button */}
              <Button
                  variant="outline"
                  onClick={() => setShowRunAllSuitesModal(true)}
                  disabled={!frameworkPath}
                  className="h-11 px-6 bg-white/60 hover:bg-white/80 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-lg rounded-xl"
                  title={!frameworkPath ? "Configure framework path first" : "Run all test suites"}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Run All Suites
              </Button>
            </div>

            {/* Filter Tabs and View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'ui' | 'api')}>
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    All ({testSuites.length})
                  </TabsTrigger>
                  <TabsTrigger value="ui" className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    UI ({testSuites.filter(s => s.type === 'UI').length})
                  </TabsTrigger>
                  <TabsTrigger value="api" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    API ({testSuites.filter(s => s.type === 'API').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
                <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Grid
                </Button>
              </div>
            </div>



            {/* Loading state */}
            {isLoading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading test suites...</p>
                </div>
            )}

            {/* Main Content Area */}
              <div className="flex gap-6 xl:gap-8">
                {/* Navigation Sidebar */}
                <div className="w-80 xl:w-96 2xl:w-[400px] bg-white/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
                  <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                          {sidebarViewMode === 'application' ? (
                            <Folder className="h-3 w-3 text-white" />
                          ) : (
                            <FolderOpen className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {sidebarViewMode === 'application' ? 'Applications' : 'Folder Structure'}
                      </h3>
                      <button
                        onClick={handleCreateSuite}
                        className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        title="Create New Test Suite"
                      >
                        <Plus className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-slate-200/50">
                      <button
                        onClick={() => setSidebarViewMode('application')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          sidebarViewMode === 'application'
                            ? 'bg-slate-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Folder className="h-3 w-3" />
                        Apps
                      </button>
                      <button
                        onClick={() => {
                          setSidebarViewMode('folder')
                          setSelectedApp(null) // Reset app selection when switching to folder view
                          setSelectedFolder(null) // Reset folder selection
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          sidebarViewMode === 'folder'
                            ? 'bg-slate-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <FolderOpen className="h-3 w-3" />
                        Folders
                      </button>
                    </div>
                  </div>
                  <div className="p-3 max-h-[calc(100vh-340px)] xl:max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    {sidebarViewMode === 'application' ? (
                      // Application-wise grouping
                      (() => {
                        const groupedSuites = filteredSuites.reduce((acc, suite) => {
                          const appName = suite.applicationName || 'Uncategorized'
                          if (!acc[appName]) {
                            acc[appName] = []
                          }
                          acc[appName].push(suite)
                          return acc
                        }, {} as Record<string, typeof filteredSuites>)
                        
                        return (
                          <div className="space-y-2">
                            {Object.entries(groupedSuites).map(([appName, suites]) => {
                              const isSelected = selectedApp === appName
                              const uiCount = suites.filter(s => s.type === 'UI').length
                              const apiCount = suites.filter(s => s.type === 'API').length
                              
                              return (
                                <div key={appName} className="group">
                                  <button
                                    onClick={() => setSelectedApp(isSelected ? null : appName)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] ${
                                      isSelected 
                                        ? 'bg-slate-50 text-slate-700 border border-slate-300 subtle-shadow-lg' 
                                        : 'hover:bg-slate-50/50 text-slate-700 hover:shadow-md hover:border-slate-300/50 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                        isSelected 
                                          ? 'bg-slate-600 subtle-shadow-lg' 
                                          : 'bg-slate-100 group-hover:bg-slate-200 group-hover:shadow-md'
                                      }`}>
                                        <Folder className={`h-4 w-4 transition-all duration-300 ${
                                          isSelected ? 'text-white' : 'text-slate-600 group-hover:text-slate-700'
                                        }`} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className={`font-semibold text-sm transition-colors duration-300 mb-1 ${
                                          isSelected ? 'text-slate-800' : 'text-slate-900 group-hover:text-slate-700'
                                        }`}>{appName}</div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className={`text-xs transition-colors duration-300 ${
                                            isSelected ? 'text-slate-600' : 'text-slate-500 group-hover:text-slate-500'
                                          }`}>
                                            {suites.length} suite{suites.length !== 1 ? 's' : ''}
                                          </div>
                                          {uiCount > 0 && (
                                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 transition-all duration-300 ${
                                              isSelected 
                                                ? 'bg-violet-100 text-violet-800 border-violet-300 subtle-shadow' 
                                                : 'bg-violet-50 text-violet-700 border-violet-200 group-hover:bg-violet-100 group-hover:shadow-sm'
                                            }`}>
                                              UI {uiCount}
                                            </Badge>
                                          )}
                                          {apiCount > 0 && (
                                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 transition-all duration-300 ${
                                              isSelected 
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 subtle-shadow' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100 group-hover:shadow-sm'
                                            }`}>
                                              API {apiCount}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 ml-2">
                                      <div className={`transition-all duration-300 ${
                                        isSelected ? 'rotate-180' : 'group-hover:rotate-12'
                                      }`}>
                                        {isSelected ? (
                                          <ChevronDown className="h-4 w-4 text-slate-500" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-500" />
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                  
                                  {isSelected && (
                                    <div className="ml-4 mt-3 space-y-2 border-l-2 border-slate-300 pl-4 animate-slideDown">
                                      {suites.map((suite) => {
                                        const isUISuite = suite.type === 'UI'
                                        return (
                                          <button
                                            key={suite.id}
                                            onClick={() => {
                                              setSelectedSuite(suite)
                                              setShowTestCasesModal(true)
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300 transform hover:scale-[1.02] hover:bg-slate-50 hover:shadow-md hover:border-slate-200 border border-transparent group/suite"
                                          >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                              isUISuite 
                                                ? 'bg-violet-100 group-hover/suite:bg-violet-200 group-hover/suite:shadow-md' 
                                                : 'bg-slate-100 group-hover/suite:bg-slate-200 group-hover/suite:shadow-md'
                                            }`}>
                                              {isUISuite ? (
                                                <MousePointer className="h-3 w-3 text-violet-600 group-hover/suite:text-violet-700 transition-colors duration-300" />
                                              ) : (
                                                <Globe className="h-3 w-3 text-slate-600 group-hover/suite:text-slate-700 transition-colors duration-300" />
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="text-sm font-medium text-slate-900 truncate group-hover/suite:text-slate-800 transition-colors duration-300">
                                                {suite.suiteName}
                                              </div>
                                              <div className="text-xs text-slate-500 group-hover/suite:text-slate-600 transition-colors duration-300">
                                                {suite.testCases.length} cases
                                              </div>
                                            </div>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            
                            {Object.keys(groupedSuites).length === 0 && (
                              <div className="text-center py-12 text-gray-500">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                                  <Folder className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No applications found</p>
                                <p className="text-xs text-slate-400 mt-1">Create test suites to see them here</p>
                              </div>
                            )}
                          </div>
                        )
                      })()
                    ) : (
                      // Folder-wise grouping
                      <FolderTreeSidebar
                        testSuites={filteredSuites}
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                        onSuiteSelect={(suite) => {
                          setSelectedSuite(suite)
                          setShowTestCasesModal(true)
                        }}
                        onFolderSelect={(folderPath) => {
                          setSelectedFolder(folderPath === selectedFolder ? null : folderPath)
                        }}
                        selectedFolder={selectedFolder}
                      />
                    )}
                  </div>
                </div>
                
                {/* Suite Cards Area */}
                <div className={`flex-1 h-full overflow-y-auto ${viewMode === 'grid' 
                  ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-6 content-start" 
                  : "space-y-4"
                }`}>
                {filteredSuites.map((suite) => {
                const isUISuite = suite.type === "UI"
                const totalSteps = isUISuite 
                  ? suite.testCases.reduce((acc, tc) => acc + (tc.testSteps?.length || 0), 0)
                  : suite.testCases.reduce((acc, tc) => acc + (tc.testData?.length || 0), 0)
                
                return (
                  <Card
                      key={suite.id}
                      className={`group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl overflow-hidden ${
                        isUISuite ? 'border-l-4 border-l-violet-500' : 'border-l-4 border-l-slate-500'
                      } ${viewMode === 'list' ? 'flex flex-row' : ''}`}
                  >
                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                      {/* Title Row - Full Width */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors duration-200 flex-1">
                            {suite.suiteName}
                          </CardTitle>
                          <Badge className={`${getStatusBadge(suite.status || "Not Started")} font-medium px-3 py-1 flex-shrink-0`}>
                            {suite.status}
                          </Badge>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium ${
                            isUISuite 
                              ? 'bg-violet-50 text-violet-700 border-violet-200' 
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isUISuite ? '🖱️ UI Tests' : '🌐 API Tests'}
                        </Badge>
                      </div>
                      
                      {/* Details Row */}
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300 ${
                          isUISuite 
                            ? 'bg-gradient-to-br from-violet-600 to-purple-600' 
                            : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }`}>
                          {isUISuite ? (
                            <MousePointer className="h-6 w-6 text-white" />
                          ) : (
                            <Globe className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardDescription className="text-sm text-slate-600">
                            <div className="space-y-1">
                              <div className="flex items-center gap-4">
                                <span>{suite.testCases.length} test case{suite.testCases.length !== 1 ? "s" : ""}</span>
                                <span className="text-gray-400">•</span>
                                <span>{totalSteps} {isUISuite ? 'step' : 'data item'}{totalSteps !== 1 ? 's' : ''}</span>
                              </div>
                              {suite.fileName && (
                                  <span className="block text-xs text-slate-500">
                                    📄 <span className="truncate inline-block max-w-[200px] align-bottom">{suite.fileName}</span>
                                  </span>
                              )}
                              {suite.baseUrl && (
                                  <span className="flex items-center text-xs text-slate-600">
                                <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate inline-block max-w-[200px]">{suite.baseUrl}</span>
                              </span>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className={`pt-0 ${viewMode === 'list' ? 'flex-1 flex flex-col' : ''}`}>
                      <div className={`space-y-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        {/* Test Cases Section */}
                        <div className="bg-gray-50 rounded-lg">
                          <button
                            onClick={() => toggleSuiteExpansion(suite.id)}
                            className="w-full p-3 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1">
                              {isUISuite ? (
                                <><MousePointer className="h-3 w-3" /> UI Test Cases ({suite.testCases.length})</>
                              ) : (
                                <><FileText className="h-3 w-3" /> API Test Cases ({suite.testCases.length})</>
                              )}
                            </h4>
                            {expandedSuites.has(suite.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          
                          {expandedSuites.has(suite.id) && (
                            <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                              {suite.testCases.map((testCase, idx) => {
                                const caseSteps = isUISuite ? testCase.testSteps?.length || 0 : testCase.testData?.length || 0
                                return (
                                  <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-800 truncate flex-1 mr-2">
                                        {testCase.name}
                                      </span>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {testCase.type && (
                                          <Badge variant="outline" className="text-xs px-1 py-0">
                                            {testCase.type}
                                          </Badge>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {caseSteps} {isUISuite ? 'steps' : 'items'}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Test Case Details */}
                                    {isUISuite && testCase.testSteps && testCase.testSteps.length > 0 && (
                                      <div className="space-y-1">
                                        {testCase.testSteps.slice(0, 3).map((step, stepIdx) => (
                                          <div key={stepIdx} className="text-xs text-gray-600 flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs px-1 py-0">
                                              {step.keyword}
                                            </Badge>
                                            <span className="truncate">
                                              {step.value || step.locator?.value || step.target || 'No target'}
                                            </span>
                                          </div>
                                        ))}
                                        {testCase.testSteps.length > 3 && (
                                          <div className="text-xs text-gray-500 italic">+{testCase.testSteps.length - 3} more steps...</div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {!isUISuite && testCase.testData && testCase.testData.length > 0 && (
                                      <div className="space-y-1">
                                        {testCase.testData.slice(0, 2).map((data, dataIdx) => (
                                          <div key={dataIdx} className="text-xs text-gray-600 flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs px-1 py-0">
                                              {data.method}
                                            </Badge>
                                            <span className="truncate font-mono">{data.endpoint}</span>
                                          </div>
                                        ))}
                                        {testCase.testData.length > 2 && (
                                          <div className="text-xs text-gray-500 italic">+{testCase.testData.length - 2} more data items...</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {suite.tags && suite.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {suite.tags.map((tag, index) => (
                                <div key={index} className="flex gap-1">
                                  {Object.entries(tag).map(([key, value]) => (
                                      <Badge
                                          key={key}
                                          variant="secondary"
                                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                                      >
                                        {key}: {value}
                                      </Badge>
                                  ))}
                                </div>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className={`flex items-center ${viewMode === 'list' ? 'justify-end gap-2 pt-4 border-t border-gray-100' : 'justify-between pt-4 border-t border-gray-100'} min-w-0`}>
                          {viewMode === 'grid' && (
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSuite(suite)
                                    setIsEditing(true)
                                  }}
                                  className="h-8 px-3 bg-white/60 hover:bg-white/80 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex-shrink-0"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedSuite(suite)
                                    setShowTestCasesModal(true)
                                  }}
                                  className={`h-8 px-3 bg-white/60 hover:bg-white/80 border-slate-200 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex-shrink-0 ${
                                    isUISuite 
                                      ? 'hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700'
                                      : 'hover:border-green-400 hover:bg-green-50 hover:text-green-700'
                                  }`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {viewMode === 'list' && (
                              <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSuite(suite)
                                      setIsEditing(true)
                                    }}
                                    className="h-8 px-3 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex-shrink-0"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSuite(suite)
                                      setShowTestCasesModal(true)
                                    }}
                                    className={`h-8 px-3 border-gray-300 transition-all duration-200 flex-shrink-0 ${
                                      isUISuite 
                                        ? 'hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700'
                                        : 'hover:border-green-400 hover:bg-green-50 hover:text-green-700'
                                    }`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                              </>
                            )}
                            <Button
                                size="sm"
                                onClick={() => handleRunSuite(suite)}
                                disabled={!frameworkPath || !suite.filePath}
                                className={`h-8 px-3 text-white transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl flex-shrink-0 ${
                                  isUISuite
                                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                }`}
                                title={
                                  !frameworkPath
                                      ? "Configure framework path first"
                                      : !suite.filePath
                                          ? "Save the suite first"
                                          : "Run test suite"
                                }
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteSuite(suite)}
                                className="h-8 px-2 bg-white/60 hover:bg-white/80 border-red-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
                })}
                </div>
              </div>

            {/* Empty state */}
            {!isLoading && filteredSuites.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100/80 to-indigo-100/80 backdrop-blur-sm rounded-2xl mb-6 shadow-xl">
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                    {searchTerm ? "No matching test suites" : "No test suites found"}
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    {searchTerm
                        ? "Try adjusting your search criteria or browse all available test suites."
                        : "Get started by creating your first test suite or configuring a test suite path to load existing suites."}
                  </p>
                  {!searchTerm && (
                      <div className="flex items-center justify-center space-x-4">
                        <Button
                            onClick={handleCreateSuite}
                            className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Test Suite
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsPathConfigOpen(true)}
                            className="h-11 px-6 bg-white/60 hover:bg-white/80 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure Path
                        </Button>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>

        {/* ------------ Test-cases modal ------------- */}
        {selectedSuite && (
            <TestCasesModal
                suite={selectedSuite}
                isOpen={showTestCasesModal}
                onClose={() => {
                  setShowTestCasesModal(false)
                  setSelectedSuite(null)
                }}
                onRunTestCase={handleRunTestCase}
            />
        )}

        {/* ------------ Suite Runner Modal ------------- */}
        {selectedSuite && (
            <SuiteRunnerModal
                suite={selectedSuite}
                isOpen={showSuiteRunnerModal}
                onClose={() => {
                  setShowSuiteRunnerModal(false)
                  setSelectedSuite(null)
                }}
            />
        )}

        {/* ------------ Run All Suites Modal ------------- */}
        <RunAllSuitesModal isOpen={showRunAllSuitesModal} onClose={() => setShowRunAllSuitesModal(false)} />

        {/* ------------ Path Configuration Modals ------------- */}
        {isPathConfigOpen && (
            <PathConfigModal
                onSave={handlePathSave}
                onCancel={() => setIsPathConfigOpen(false)}
                currentPath={testSuitePath}
            />
        )}

        {isFrameworkConfigOpen && (
            <FrameworkConfigModal
                onSave={handleFrameworkPathSave}
                onCancel={() => setIsFrameworkConfigOpen(false)}
                currentPath={frameworkPath}
            />
        )}
        
        {/* AI Chat Component */}
        <AIChat />
        
        {/* Delete Confirmation Dialog */}
        {suiteToDelete && (
          <DeleteConfirmationDialog
            isOpen={!!suiteToDelete}
            onClose={() => setSuiteToDelete(null)}
            onConfirm={confirmDeleteSuite}
            suiteName={suiteToDelete.suiteName}
            isDeleting={isDeleting}
          />
        )}
        
        {/* cURL Import Modal */}
        <CurlImportModal
          isOpen={showCurlImportModal}
          onClose={() => setShowCurlImportModal(false)}
          existingSuites={testSuites.map(suite => ({ ...suite, type: suite.type || 'API' })) as any}
          onSave={(testSuite) => {
            // Add the imported suite to the list
            setTestSuites((prev) => [...prev, testSuite as any]);
            // Close the modal
            setShowCurlImportModal(false);
            // Show success message
            toast({
              title: "cURL Imported",
              description: "Test suite created from cURL command successfully.",
            });
            // Open the editor with the new suite
            setSelectedSuite(testSuite as any);
            setIsEditing(true);
          }}
          onAddToExisting={(suiteId, testCase) => {
            // Add test case to existing suite
            setTestSuites((prev) => prev.map(suite => 
              suite.id === suiteId 
                ? { ...suite, testCases: [...suite.testCases, testCase as any] }
                : suite
            ));
            // Show success message
            toast({
              title: "Test Case Added",
              description: "Test case added to existing suite successfully.",
            });
          }}
        />
        
        {/* Swagger Import Modal */}
        <SwaggerImportModal
          isOpen={showSwaggerImportModal}
          onClose={() => setShowSwaggerImportModal(false)}
          existingSuites={testSuites}
          onSave={(testSuite) => {
            // Add the imported suite to the list
            setTestSuites((prev) => [...prev, testSuite]);
            // Close the modal
            setShowSwaggerImportModal(false);
            // Show success message
            toast({
              title: "Swagger Imported",
              description: "Test suite created from Swagger specification successfully.",
            });
            // Open the editor with the new suite
            setSelectedSuite(testSuite);
            setIsEditing(true);
          }}
          onAddToExisting={(suiteId, testCase) => {
            // Add test case to existing suite
            setTestSuites((prev) => prev.map(suite => 
              suite.id === suiteId 
                ? { ...suite, testCases: [...suite.testCases, testCase] }
                : suite
            ));
            // Show success message
            toast({
              title: "Test Cases Added",
              description: "Test cases added to existing suite successfully.",
            });
          }}
        />
        
        {/* Postman Import Modal */}
        <PostmanImportModal
          isOpen={showPostmanImportModal}
          onClose={() => setShowPostmanImportModal(false)}
          existingSuites={testSuites.map(suite => ({ ...suite, type: suite.type || 'API' })) as any}
          onSave={(testSuite) => {
            // Add the imported suite to the list
            setTestSuites((prev) => [...prev, testSuite as any]);
            // Close the modal
            setShowPostmanImportModal(false);
            // Show success message
            toast({
              title: "Postman Collection Imported",
              description: "Test suite created from Postman collection successfully.",
            });
            // Open the editor with the new suite
            setSelectedSuite(testSuite as any);
            setIsEditing(true);
          }}
          onAddToExisting={(suiteId, testCase) => {
            // Add test cases to existing suite
            setTestSuites((prev) => prev.map(suite => 
              suite.id === suiteId 
                ? { ...suite, testCases: [...suite.testCases, testCase as any] }
                : suite
            ));
            // Show success message
            toast({
              title: "Test Cases Added",
              description: "Test cases from Postman collection added successfully.",
            });
          }}
        />
        
        {/* Bruno Import Modal */}
        <BrunoImportModal
          isOpen={showBrunoImportModal}
          onClose={() => setShowBrunoImportModal(false)}
          onSave={(testSuite) => {
            // Add the imported suite to the list
            setTestSuites((prev) => [...prev, testSuite as any]);
            // Show success message
            toast({
              title: "Bruno Collection Imported",
              description: "Test suite created from Bruno collection successfully.",
            });
            // Open the editor with the new suite
            setSelectedSuite(testSuite as any);
            setIsEditing(true);
          }}
        />
        
        {/* SOAP Import Modal */}
        <SoapImportModal
          isOpen={showSoapImportModal}
          onClose={() => setShowSoapImportModal(false)}
          existingSuites={testSuites.map(suite => ({ ...suite, type: suite.type || 'API' })) as any}
          onSave={(testSuite) => {
            setTestSuites((prev) => [...prev, testSuite as any]);
            setShowSoapImportModal(false);
            toast({
              title: "SOAP Imported",
              description: "Test suite created from SOAP specification successfully.",
            });
            setSelectedSuite(testSuite as any);
            setIsEditing(true);
          }}
          onAddToExisting={(suiteId, testCase) => {
            setTestSuites((prev) => prev.map(suite => 
              suite.id === suiteId 
                ? { ...suite, testCases: [...suite.testCases, testCase as any] }
                : suite
            ));
            toast({
              title: "Test Case Added",
              description: "SOAP test case added to existing suite successfully.",
            });
          }}
        />
        
        {/* Playwright Import Modal */}
        <PlaywrightImportModal
          isOpen={showPlaywrightImportModal}
          onClose={() => setShowPlaywrightImportModal(false)}
          existingSuites={testSuites}
          onSave={(testSuite) => {
            setTestSuites((prev) => [...prev, testSuite]);
            setShowPlaywrightImportModal(false);
            toast({
              title: "Playwright Imported",
              description: "Test suite created from Playwright code successfully.",
            });
            setSelectedSuite(testSuite);
            setIsEditing(true);
          }}
          onAddToExisting={(suiteId, testCase) => {
            setTestSuites((prev) => prev.map(suite => 
              suite.id === suiteId 
                ? { ...suite, testCases: [...suite.testCases, testCase] }
                : suite
            ));
            toast({
              title: "Test Case Added",
              description: "Playwright test case added to existing suite successfully.",
            });
          }}
        />
        
        {/* Environment Variables Modal */}
        <EnvVariablesModal
          isOpen={showEnvVariablesModal}
          onClose={() => setShowEnvVariablesModal(false)}
        />
      </>
  )
}
