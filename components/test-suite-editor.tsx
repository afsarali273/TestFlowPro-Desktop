"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Globe,
  Download,
  Copy,
  Code,
  TreePine,
  Eye,
  Edit3,
  ArrowRight,
  Play,
  Zap,
} from "lucide-react"
import dynamic from "next/dynamic"
import { TestCaseEditor } from "@/components/test-case-editor"
import { QuickTestBuilder } from "@/components/quick-test-builder"
import { type TestSuite, type TestCase, type Tag, validateTestSuite } from "@/types/test-suite"

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false })
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface TestSuiteEditorProps {
  suite: TestSuite & { id?: string; status?: string; filePath?: string }
  onSave: (suite: TestSuite & { id?: string; status?: string; filePath?: string }) => void
  onCancel: () => void
  onViewTestCase?: (suite: TestSuite, testCase: any, testCaseIndex: number) => void
}

export function TestSuiteEditor({ suite, onSave, onCancel, onViewTestCase }: TestSuiteEditorProps) {
  const [editedSuite, setEditedSuite] = useState<TestSuite & { id?: string; status?: string; filePath?: string }>(
      () => {
        const validated = validateTestSuite(suite)
        return {
          ...validated,
          id: suite.id,
          status: suite.status || "Not Started",
          filePath: suite.filePath,
        }
      },
  )
  const [selectedTestCase, setSelectedTestCase] = useState<(TestCase & { index?: number }) | null>(null)
  const [isEditingTestCase, setIsEditingTestCase] = useState(false)
  const [jsonViewMode, setJsonViewMode] = useState<"tree" | "code" | "raw">("tree")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [showFileConflictDialog, setShowFileConflictDialog] = useState(false)
  const [conflictFilePath, setConflictFilePath] = useState<string>("")
  const [pendingSuite, setPendingSuite] = useState<any>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showSaveBeforeViewDialog, setShowSaveBeforeViewDialog] = useState(false)
  const [pendingViewTestCase, setPendingViewTestCase] = useState<{ testCase: any; index: number } | null>(null)
  const [showQuickTestBuilder, setShowQuickTestBuilder] = useState(false)

  // Check for test data edit context on mount and update localStorage with current suite's baseUrl
  React.useEffect(() => {
    // Update localStorage with current suite's baseUrl when opening for editing
    if (editedSuite.baseUrl) {
      localStorage.setItem('suiteBaseUrl', editedSuite.baseUrl)
    } else {
      localStorage.removeItem('suiteBaseUrl')
    }
    
    const editContext = sessionStorage.getItem('editTestData')
    if (editContext) {
      const { testCaseIndex, testDataIndex } = JSON.parse(editContext)
      sessionStorage.removeItem('editTestData')
      
      // Open the specific test case for editing
      if (editedSuite.testCases[testCaseIndex]) {
        const testCase = editedSuite.testCases[testCaseIndex]
        handleEditTestCase(testCase, testCaseIndex)
        
        // Store the test data index to edit in the TestCaseEditor
        sessionStorage.setItem('editTestDataIndex', testDataIndex.toString())
      }
    }
  }, [editedSuite.baseUrl])

  const handleSuiteChange = (field: keyof TestSuite, value: any) => {
    setEditedSuite((prev) => ({
      ...prev,
      [field]: value,
    }))
    
    // Update localStorage when baseUrl changes
    if (field === 'baseUrl') {
      localStorage.setItem('suiteBaseUrl', value || '')
    }
  }

  const triggerAutoSave = () => {
    // Only auto-save if suite has a filePath (existing suite)
    if (!editedSuite.filePath) return
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    const timeout = setTimeout(() => {
      handleSaveQuietly()
    }, 2000)
    setAutoSaveTimeout(timeout)
  }

  const handleSaveQuietly = async () => {
    // Silent save for existing suites without popups
    if (!editedSuite.filePath) return
    
    try {
      const validatedSuite = validateTestSuite(editedSuite)
      const finalSuite = {
        ...validatedSuite,
        id: editedSuite.id,
        status: editedSuite.status,
        filePath: editedSuite.filePath,
      }

      const response = await fetch("/api/test-suites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testSuite: finalSuite,
          filePath: editedSuite.filePath,
          forceReplace: true,
        }),
      })

      // Don't call onSave to avoid navigation - just silent background save
    } catch (error) {
      // Silent fail for auto-save
      console.log('Auto-save failed:', error)
    }
  }

  const handleAddTag = () => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), {}],
    }))
  }

  const handleRemoveTag = (index: number) => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index),
    }))
  }

  const handleTagChange = (index: number, field: string, value: string | Tag) => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: (prev.tags || []).map((tag, i) => {
        if (i === index) {
          if (field === "replace") {
            return value as Tag // Replace entire tag object
          }
          return { ...tag, [field]: value as string }
        }
        return tag
      }),
    }))
  }

  const handleAddTestCase = () => {
    const newTestCase: TestCase = {
      testSteps: [],
      name: "New Test Case",
      status: "Not Started",
      type: "REST",
      testData: []
    }
    setSelectedTestCase(newTestCase)
    setIsEditingTestCase(true)
  }

  const handleEditTestCase = (testCase: TestCase, index: number) => {
    setSelectedTestCase({ ...testCase, index })
    setIsEditingTestCase(true)
  }

  const handleSaveTestCase = (testCase: TestCase & { index?: number }) => {
    if (typeof testCase.index === "number") {
      // Editing existing test case
      const { index, ...cleanTestCase } = testCase
      setEditedSuite((prev) => ({
        ...prev,
        testCases: prev.testCases.map((tc, i) => (i === index ? cleanTestCase : tc)),
      }))
    } else {
      // Adding new test case
      const { index, ...cleanTestCase } = testCase
      setEditedSuite((prev) => ({
        ...prev,
        testCases: [...prev.testCases, cleanTestCase],
      }))
    }
    setIsEditingTestCase(false)
    setSelectedTestCase(null)
    triggerAutoSave()
  }

  const handleSaveQuickTest = (testCase: TestCase) => {
    setEditedSuite((prev) => ({
      ...prev,
      testCases: [...prev.testCases, testCase],
    }))
    triggerAutoSave()
  }

  const handleDeleteTestCase = (index: number) => {
    setEditedSuite((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }))
    triggerAutoSave()
  }

  const handleCloneTestCase = (testCase: TestCase, index: number) => {
    const clonedTestCase: TestCase = {
      ...JSON.parse(JSON.stringify(testCase)), // Deep clone to avoid reference issues
      name: `${testCase.name} - Copy`,
      status: "Not Started", // Reset status for the cloned test case
    }

    setEditedSuite((prev) => ({
      ...prev,
      testCases: [...prev.testCases, clonedTestCase],
    }))
    triggerAutoSave()
  }

  const saveToFile = async (suiteData: any, filePath: string, forceReplace = false) => {
    try {
      const response = await fetch("/api/test-suites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testSuite: suiteData,
          filePath: filePath,
          forceReplace: forceReplace,
        }),
      })

      if (!response.ok) {
        const error = await response.json()

        if (error.code === "FILE_EXISTS" && !forceReplace) {
          setConflictFilePath(filePath)
          setPendingSuite(suiteData)
          setShowFileConflictDialog(true)
          return
        }

        throw new Error(error.error || "Failed to save test suite")
      }

      // Update the suite with the file path for future saves
      const updatedSuite = {
        ...suiteData,
        filePath: filePath,
        fileName: filePath.split("/").pop() || `${suiteData.suiteName}.json`,
      }

      onSave(updatedSuite)

      // Show success message
      console.log(`Test suite saved to: ${filePath}`)
      alert(`Test suite saved successfully to: ${filePath}`)
    } catch (error: any) {
      console.error("Error saving test suite:", error)
      alert(`Failed to save test suite: ${error.message}`)
    }
  }

  const handleSave = async () => {
    try {
      const validatedSuite = validateTestSuite(editedSuite)
      const finalSuite = {
        ...validatedSuite,
        id: editedSuite.id,
        status: editedSuite.status,
        filePath: editedSuite.filePath,
      }

      console.log("[v0] Saving validated test suite:", finalSuite)

      const suitePath = localStorage.getItem("testSuitePath")

      if (!suitePath) {
        // If no suite path is configured, just update in memory
        onSave(finalSuite)
        return
      }

      // Generate filename from suite name if not editing existing file
      let targetFilePath = finalSuite.filePath
      if (!targetFilePath) {
        const fileName = `${finalSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}.json`
        targetFilePath = `${suitePath}/${fileName}`
      }

      await saveToFile(finalSuite, targetFilePath, false)
    } catch (error: any) {
      console.error("Error saving test suite:", error)
      alert(`Failed to save test suite: ${error.message}`)
    }
  }

  const handleFileConflictReplace = async () => {
    setShowFileConflictDialog(false)
    await saveToFile(pendingSuite, conflictFilePath, true) // force replace
  }

  const handleFileConflictRename = () => {
    setShowFileConflictDialog(false)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const pathParts = conflictFilePath.split("/")
    const fileName = pathParts.pop()
    const nameWithoutExt = fileName?.replace(".json", "") || "suite"
    const newFileName = `${nameWithoutExt}_${timestamp}.json`
    const newFilePath = [...pathParts, newFileName].join("/")

    saveToFile(pendingSuite, newFilePath, false)
  }

  const handleJsonTreeEdit = (edit: any) => {
    try {
      const validated = validateTestSuite(edit.updated_src)
      setEditedSuite({
        ...validated,
        id: editedSuite.id,
        status: edit.updated_src.status || editedSuite.status,
        filePath: editedSuite.filePath,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON structure: ${error.message}`)
    }
  }

  const handleMonacoChange = (value: string | undefined) => {
    if (!value) return

    try {
      const parsed = JSON.parse(value)
      const validated = validateTestSuite(parsed)
      setEditedSuite({
        ...validated,
        id: editedSuite.id,
        status: parsed.status || editedSuite.status,
        filePath: editedSuite.filePath,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`)
    }
  }

  if (isEditingTestCase && selectedTestCase) {
    return (
        <TestCaseEditor
            testCase={selectedTestCase}
            suiteId={editedSuite.id}
            suiteName={editedSuite.suiteName}
            onSave={handleSaveTestCase}
            onCancel={() => {
              setIsEditingTestCase(false)
              setSelectedTestCase(null)
            }}
        />
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        {showFileConflictDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">File Already Exists</h3>
                <p className="text-gray-600 mb-6">
                  A file with the name "{conflictFilePath.split("/").pop()}" already exists. Would you like to replace it or
                  save with a different name?
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowFileConflictDialog(false)} className="hover:bg-gray-50">
                    Cancel
                  </Button>
                  <Button
                      variant="outline"
                      onClick={handleFileConflictRename}
                      className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 bg-transparent"
                  >
                    Rename File
                  </Button>
                  <Button onClick={handleFileConflictReplace} className="bg-red-600 hover:bg-red-700 text-white">
                    Replace File
                  </Button>
                </div>
              </div>
            </div>
        )}

        {showSaveBeforeViewDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Before Viewing</h3>
                <p className="text-gray-600 mb-6">
                  You need to save the test suite before viewing test cases. Would you like to save now?
                </p>
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSaveBeforeViewDialog(false)
                      setPendingViewTestCase(null)
                    }}
                    className="hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      try {
                        await handleSave()
                        
                        // Close dialog first
                        setShowSaveBeforeViewDialog(false)
                        
                        // Small delay to ensure modal is fully closed
                        setTimeout(() => {
                          if (pendingViewTestCase && onViewTestCase) {
                            onViewTestCase(editedSuite, pendingViewTestCase.testCase, pendingViewTestCase.index)
                          }
                          setPendingViewTestCase(null)
                        }, 100)
                      } catch (error) {
                        console.error('Error saving suite:', error)
                        // Keep dialog open on error
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save & View
                  </Button>
                </div>
              </div>
            </div>
        )}

        <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto p-6 xl:p-8 2xl:p-10">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={onCancel} 
                  className="h-10 px-4 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    Test Suite Editor
                  </h1>
                  <p className="text-slate-600 mt-1">
                    {editedSuite.suiteName || 'New Test Suite'} • {editedSuite.type || 'API'} Testing
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
              <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const exportData = {
                        ...editedSuite,
                        testCases: editedSuite.testCases.map((tc) => {
                          // TestCase doesn't have index property, so no destructuring needed
                          return tc
                        }),
                      }

                      // Create and download the file
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: "application/json",
                      })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${editedSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    } catch (error) {
                      console.error("Error exporting test suite:", error)
                    }
                  }}
                  className="hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={onCancel} className="hover:bg-white/80 bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Suite
              </Button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 rounded-xl p-1">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200"
              >
                <Globe className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="testcases" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200"
              >
                <Code className="h-4 w-4 mr-2" />
                Test Cases ({editedSuite.testCases.length})
              </TabsTrigger>
              <TabsTrigger 
                value="json" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200"
              >
                <TreePine className="h-4 w-4 mr-2" />
                JSON View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-white/20">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    Suite Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-600 ml-13">
                    Configure the essential settings and metadata for your test suite
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="suiteName" className="text-sm font-semibold text-slate-700 mb-2 block">
                        Suite Name *
                      </Label>
                      <Input
                          id="suiteName"
                          value={editedSuite.suiteName}
                          onChange={(e) => handleSuiteChange("suiteName", e.target.value)}
                          placeholder="e.g., User Management API Tests"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="applicationName" className="text-sm font-semibold text-slate-700 mb-2 block">
                        Application Name
                      </Label>
                      <Input
                          id="applicationName"
                          value={editedSuite.applicationName || ""}
                          onChange={(e) => handleSuiteChange("applicationName", e.target.value)}
                          placeholder="e.g., E-commerce Platform"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-semibold text-slate-700 mb-2 block">
                        Execution Status
                      </Label>
                      <Select
                          value={editedSuite.status}
                          onValueChange={(value) => setEditedSuite((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="Running">Running</SelectItem>
                          <SelectItem value="Passed">Passed</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div></div>
                  </div>

                  {/* Base URL Section */}
                  <div className="space-y-3">
                    <Label htmlFor="baseUrl" className="text-sm font-semibold text-slate-700">
                      Base URL
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Globe className="h-3 w-3 text-white" />
                      </div>
                      <Input
                          id="baseUrl"
                          value={editedSuite.baseUrl || ""}
                          onChange={(e) => handleSuiteChange("baseUrl", e.target.value)}
                          placeholder="https://api.example.com/v1"
                          className="h-12 pl-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      💡 The base URL will be automatically prepended to all endpoint paths in this test suite
                    </p>
                  </div>

                  {/* Suite Type Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-slate-700">Test Suite Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        editedSuite.type === "API" 
                          ? 'border-blue-300 bg-blue-50/50 shadow-md' 
                          : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}>
                        <input
                            type="radio"
                            name="suiteType"
                            value="API"
                            checked={editedSuite.type === "API"}
                            onChange={(e) => handleSuiteChange("type", "API")}
                            className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            editedSuite.type === "API" ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">API Testing</div>
                            <div className="text-xs text-slate-600">REST, SOAP, GraphQL endpoints</div>
                          </div>
                        </div>
                      </label>
                      <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        editedSuite.type === "UI" 
                          ? 'border-purple-300 bg-purple-50/50 shadow-md' 
                          : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}>
                        <input
                            type="radio"
                            name="suiteType"
                            value="UI"
                            checked={editedSuite.type === "UI"}
                            onChange={(e) => handleSuiteChange("type", "UI")}
                            className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            editedSuite.type === "UI" ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <Eye className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">UI Testing</div>
                            <div className="text-xs text-slate-600">Browser automation, E2E flows</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold text-slate-700">Tags & Labels</Label>
                        <p className="text-xs text-slate-500 mt-1">Organize and categorize your test suite</p>
                      </div>
                      <Button
                          size="sm"
                          onClick={handleAddTag}
                          className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Add Tag
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {(editedSuite.tags || []).map((tag, index) => (
                          <div
                              key={index}
                              className="flex items-center gap-4 p-5 border border-slate-200 rounded-xl bg-gradient-to-r from-white/80 to-slate-50/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {Object.entries(tag).map(([key, value], entryIndex) => (
                                <div key={entryIndex} className="flex items-center gap-2 flex-1">
                                  <Input
                                      placeholder="Key (e.g., serviceName)"
                                      value={key}
                                      onChange={(e) => {
                                        const newKey = e.target.value
                                        const newTag = { ...tag }
                                        delete newTag[key]
                                        newTag[newKey] = value
                                        handleTagChange(index, "replace", newTag)
                                      }}
                                      className="flex-1 h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200"
                                  />
                                  <div className="text-slate-400 font-medium">:</div>
                                  <Input
                                      placeholder="Value (e.g., @UserService)"
                                      value={value}
                                      onChange={(e) => handleTagChange(index, key, e.target.value)}
                                      className="flex-1 h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg bg-white/70 backdrop-blur-sm transition-all duration-200"
                                  />
                                </div>
                            ))}
                            {Object.keys(tag).length === 0 && (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                      placeholder="Key (e.g., serviceName)"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleTagChange(index, e.target.value, "")
                                        }
                                      }}
                                      className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Input
                                      placeholder="Value"
                                      disabled
                                      className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveTag(index)}
                                className="h-11 px-3 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                      {(!editedSuite.tags || editedSuite.tags.length === 0) && (
                          <div className="text-center py-12 text-slate-500 bg-gradient-to-br from-slate-50/50 to-blue-50/30 rounded-xl border-2 border-dashed border-slate-200">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                              <Plus className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium">No tags defined yet</p>
                            <p className="text-xs mt-2 text-slate-400">Add tags to organize and filter your test suites effectively</p>
                          </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t border-slate-200">
                    <Button
                        onClick={() => {
                          triggerAutoSave()
                          setActiveTab("testcases")
                        }}
                        className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium"
                    >
                      Continue to Test Cases
                      <ArrowRight className="h-4 w-4 ml-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testcases">
              <div className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-white/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Code className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Test Cases Management</CardTitle>
                          <CardDescription className="text-slate-600">
                            Create and manage individual test cases for your suite
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {editedSuite.type === "API" && (
                          <Button
                              onClick={() => setShowQuickTestBuilder(true)}
                              variant="outline"
                              className="h-10 px-4 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all duration-200"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Quick Builder
                          </Button>
                        )}
                        <Button
                            onClick={handleAddTestCase}
                            className="h-10 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Test Case
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">

                    <div className="grid gap-4">
                      {editedSuite.testCases.map((testCase, index) => (
                          <Card
                              key={index}
                              className={`bg-gradient-to-r from-white/90 to-slate-50/50 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 rounded-xl overflow-hidden ${
                                testCase.enabled === false ? "opacity-60 border-slate-300" : ""
                              }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id={`testcase-enabled-${index}`}
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      checked={testCase.enabled !== false}
                                      onChange={(e) => {
                                        setEditedSuite((prev) => ({
                                          ...prev,
                                          testCases: prev.testCases.map((tc, i) => 
                                            i === index ? { ...tc, enabled: e.target.checked } : tc
                                          ),
                                        }))
                                        triggerAutoSave()
                                      }}
                                    />
                                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                                      testCase.enabled === false ? 'bg-slate-400' : 'bg-emerald-500'
                                    }`}></div>
                                  </div>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                                    testCase.type === "UI" 
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                  }`}>
                                    {testCase.type === "UI" ? (
                                      <Eye className="h-5 w-5 text-white" />
                                    ) : (
                                      <Globe className="h-5 w-5 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <CardTitle className={`text-lg font-semibold ${
                                      testCase.enabled === false ? 'text-slate-500' : 'text-slate-900'
                                    }`}>{testCase.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-3 mt-1">
                                      <Badge variant="outline" className={`text-xs ${
                                        testCase.type === "UI" 
                                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}>
                                        {testCase.type}
                                      </Badge>
                                      <span className="text-slate-600">
                                        {testCase.type === "UI"
                                            ? `${testCase.testSteps?.length || 0} step${testCase.testSteps?.length !== 1 ? "s" : ""}`
                                            : `${testCase.testData?.length || 0} data item${testCase.testData?.length !== 1 ? "s" : ""}`}
                                      </span>
                                      {testCase.enabled === false && (
                                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                          Disabled
                                        </Badge>
                                      )}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                    {testCase.status}
                                  </Badge>
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // Check if suite has unsaved changes
                                        if (!editedSuite.filePath) {
                                          // Show save dialog first
                                          setPendingViewTestCase({ testCase, index })
                                          setShowSaveBeforeViewDialog(true)
                                        } else {
                                          // Navigate directly
                                          if (onViewTestCase) {
                                            onViewTestCase(editedSuite, testCase, index)
                                          }
                                        }
                                      }}
                                      disabled={testCase.enabled === false}
                                      className="h-9 px-3 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 rounded-lg transition-all duration-200"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>

                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditTestCase(testCase, index)}
                                      className="h-9 px-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded-lg transition-all duration-200"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCloneTestCase(testCase, index)}
                                      className="h-9 px-3 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 rounded-lg transition-all duration-200"
                                      title="Clone test case"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTestCase(index)}
                                      className="h-9 px-3 hover:bg-red-50 hover:border-red-300 hover:text-red-700 rounded-lg transition-all duration-200"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                  ))}

                      {editedSuite.testCases.length === 0 && (
                          <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-6 shadow-lg">
                              <Plus className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No test cases yet</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Start building your test suite by creating your first test case. You can add API endpoints, UI interactions, or use our quick builder.</p>
                            <div className="flex gap-4 justify-center">
                              {editedSuite.type === "API" && (
                                <Button
                                    onClick={() => setShowQuickTestBuilder(true)}
                                    variant="outline"
                                    className="h-11 px-6 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all duration-200"
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  Quick Builder
                                </Button>
                              )}
                              <Button
                                  onClick={handleAddTestCase}
                                  className="h-11 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Test Case
                              </Button>
                            </div>
                          </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="json">
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50/50 to-blue-50/50 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <Code className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">JSON Structure Editor</CardTitle>
                        <CardDescription className="text-slate-600">
                          Advanced JSON editing with multiple view modes and real-time validation
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-xl p-1 shadow-sm">
                      <Button
                          size="sm"
                          variant={jsonViewMode === "tree" ? "default" : "ghost"}
                          onClick={() => setJsonViewMode("tree")}
                          className={`h-9 px-4 rounded-lg transition-all duration-200 ${
                            jsonViewMode === "tree" 
                              ? 'bg-white shadow-md text-slate-900' 
                              : 'hover:bg-white/50 text-slate-600'
                          }`}
                      >
                        <TreePine className="h-3 w-3 mr-2" />
                        Tree View
                      </Button>
                      <Button
                          size="sm"
                          variant={jsonViewMode === "code" ? "default" : "ghost"}
                          onClick={() => setJsonViewMode("code")}
                          className={`h-9 px-4 rounded-lg transition-all duration-200 ${
                            jsonViewMode === "code" 
                              ? 'bg-white shadow-md text-slate-900' 
                              : 'hover:bg-white/50 text-slate-600'
                          }`}
                      >
                        <Edit3 className="h-3 w-3 mr-2" />
                        Code Editor
                      </Button>
                      <Button
                          size="sm"
                          variant={jsonViewMode === "raw" ? "default" : "ghost"}
                          onClick={() => setJsonViewMode("raw")}
                          className={`h-9 px-4 rounded-lg transition-all duration-200 ${
                            jsonViewMode === "raw" 
                              ? 'bg-white shadow-md text-slate-900' 
                              : 'hover:bg-white/50 text-slate-600'
                          }`}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        Raw Text
                      </Button>
                    </div>
                  </div>
                  {jsonError && (
                      <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-red-800">JSON Validation Error</p>
                            <p className="text-sm text-red-700 mt-1">{jsonError}</p>
                          </div>
                        </div>
                      </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {jsonViewMode === "tree" && (
                      <div className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-slate-50/50 to-white/50 backdrop-blur-sm min-h-[500px] shadow-inner">
                        <ReactJson
                            src={editedSuite}
                            theme="rjv-default"
                            name="testSuite"
                            collapsed={1}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            enableClipboard={true}
                            indentWidth={2}
                            collapseStringsAfterLength={50}
                            onEdit={handleJsonTreeEdit}
                            onAdd={handleJsonTreeEdit}
                            onDelete={handleJsonTreeEdit}
                            style={{
                              backgroundColor: "transparent",
                              fontSize: "13px",
                              fontFamily:
                                  'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            }}
                        />
                      </div>
                  )}

                  {jsonViewMode === "code" && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                        <MonacoEditor
                            height="500px"
                            language="json"
                            theme="vs"
                            value={JSON.stringify(editedSuite, null, 2)}
                            onChange={handleMonacoChange}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 13,
                              lineNumbers: "on",
                              roundedSelection: false,
                              scrollbar: {
                                vertical: "visible",
                                horizontal: "visible",
                              },
                              formatOnPaste: true,
                              formatOnType: true,
                              automaticLayout: true,
                              wordWrap: "on",
                              bracketPairColorization: { enabled: true },
                              folding: true,
                              foldingHighlight: true,
                              showFoldingControls: "always",
                            }}
                        />
                      </div>
                  )}

                  {jsonViewMode === "raw" && (
                      <Textarea
                          value={JSON.stringify(editedSuite, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value)
                              const validated = validateTestSuite(parsed)
                              setEditedSuite({
                                ...validated,
                                id: editedSuite.id,
                                status: parsed.status || editedSuite.status,
                                filePath: editedSuite.filePath,
                              })
                              setJsonError(null)
                            } catch (error: any) {
                              setJsonError(`Invalid JSON: ${error.message}`)
                            }
                          }}
                          className="font-mono text-sm min-h-[500px] border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-gradient-to-br from-slate-50/50 to-white/50 backdrop-blur-sm shadow-inner transition-all duration-200"
                          placeholder="Edit JSON structure directly..."
                      />
                  )}

                  <div className="mt-6 p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-3 text-blue-900">JSON Editor Guide</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-medium text-blue-900 mb-1">🌳 Tree View</p>
                            <p className="text-blue-700">Interactive tree structure with inline editing, expand/collapse nodes, and property management</p>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-medium text-blue-900 mb-1">💻 Code Editor</p>
                            <p className="text-blue-700">Full-featured Monaco editor with syntax highlighting, auto-completion, and error detection</p>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-medium text-blue-900 mb-1">📝 Raw Text</p>
                            <p className="text-blue-700">Direct JSON editing with real-time validation for quick modifications and bulk operations</p>
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
        
        <QuickTestBuilder
          isOpen={showQuickTestBuilder}
          onClose={() => setShowQuickTestBuilder(false)}
          onSave={handleSaveQuickTest}
          baseUrl={editedSuite.baseUrl}
        />
      </div>
  )
}
