"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, Copy, HelpCircle, Play, ArrowRight, Zap } from "lucide-react"
import { EnhancedLocatorBuilder } from "@/components/enhanced-locator-builder"
import { TestDataEditor } from "@/components/test-data-editor"
import { SuiteRunnerModal } from "@/components/suite-runner-modal"
import { ParameterManager } from "@/components/parameter-manager"
import { type TestCase, type TestData, type TestStep, type TestCaseParameters, validateTestCase } from "@/types/test-suite"

import dynamic from "next/dynamic"

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading JSON viewer...</div>
})
import MonacoEditor from "@monaco-editor/react"


interface TestCaseEditorProps {
  testCase: TestCase & { index?: number }
  suiteId?: string
  suiteName?: string
  onSave: (testCase: TestCase & { index?: number }) => void
  onCancel: () => void
}

export function TestCaseEditor({ testCase, suiteId, suiteName, onSave, onCancel }: TestCaseEditorProps) {
  const [editedTestCase, setEditedTestCase] = useState<TestCase & { index?: number }>(() => {
    const validated = validateTestCase(testCase)
    return {
      ...validated,
      index: testCase.index,
      // Auto-generate ID if missing for run functionality
      id: validated.id || `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  })
  const [selectedTestData, setSelectedTestData] = useState<TestData | null>(null)
  const [isEditingTestData, setIsEditingTestData] = useState(false)

  const [testType, setTestType] = useState<"API" | "UI">(editedTestCase.type === "UI" ? "UI" : "API")
  const [activeTab, setActiveTab] = useState("general")
  const [jsonViewMode, setJsonViewMode] = useState<"tree" | "code" | "raw">("tree")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [inlineEditingStepIndex, setInlineEditingStepIndex] = useState<number | null>(null)
  const [inlineEditingStep, setInlineEditingStep] = useState<TestStep | null>(null)
  const [isAddingNewStep, setIsAddingNewStep] = useState(false)
  const [keywordSearch, setKeywordSearch] = useState("")
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)
  const [showRunnerModal, setShowRunnerModal] = useState(false)
  const [runTarget, setRunTarget] = useState<string | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Check for test data edit context on mount
  React.useEffect(() => {
    const testDataIndex = sessionStorage.getItem('editTestDataIndex')
    if (testDataIndex && editedTestCase.testData) {
      const index = parseInt(testDataIndex)
      sessionStorage.removeItem('editTestDataIndex')
      
      if (editedTestCase.testData[index]) {
        handleEditTestData(editedTestCase.testData[index], index)
      }
    }
  }, [editedTestCase])

  // Handle navigation to results
  React.useEffect(() => {
    const handleNavigateToResults = (event: any) => {
      // Prevent the event from bubbling to avoid double handling
      event.stopPropagation()
      // Close the test case editor first
      onCancel()
      // Then dispatch a new event after a delay with context
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-results-from-editor', {
          detail: {
            suite: { id: suiteId, suiteName: suiteName },
            testCase: editedTestCase,
            testCaseIndex: editedTestCase.index || 0
          }
        }))
      }, 200)
    }

    window.addEventListener("navigate-to-results", handleNavigateToResults)
    return () => {
      window.removeEventListener("navigate-to-results", handleNavigateToResults)
    }
  }, [onCancel, suiteId, suiteName, editedTestCase])

  const handleTestCaseChange = (field: keyof TestCase, value: any) => {
    setEditedTestCase((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const triggerAutoSave = () => {
    // Only auto-save if we have suite context (not a new standalone test case)
    if (!suiteId) return
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    const timeout = setTimeout(() => {
      handleSaveQuietly()
    }, 2000)
    setAutoSaveTimeout(timeout)
  }

  const handleSaveQuietly = () => {
    // Silent save for existing test cases without triggering onSave callback
    if (!suiteId) return
    
    try {
      const validatedTestCase = validateTestCase(editedTestCase)
      const finalTestCase = {
        ...validatedTestCase,
        index: editedTestCase.index,
      }
      // Don't call onSave to avoid navigation - just silent background save
    } catch (error) {
      // Silent fail for auto-save
      console.log('Auto-save failed:', error)
    }
  }

  const handleTestTypeChange = (type: "API" | "UI") => {
    setTestType(type)
    if (type === "UI") {
      setEditedTestCase((prev) => ({
        ...prev,
        type: "UI" as const,
        testSteps: prev.testSteps || [],
      }))
    } else {
      setEditedTestCase((prev) => ({
        ...prev,
        type: "REST" as const,
        testData: prev.testData || [],
      }))
    }
  }

  const handleAddTestData = () => {
    const newTestData: TestData = {
      name: "New Test Data",
      method: "GET",
      endpoint: "/",
      headers: {
        "Content-Type": editedTestCase.type === "SOAP" ? "text/xml; charset=utf-8" : "application/json",
      },
      preProcess: null,
      assertions: [],
      store: {},
    }
    setSelectedTestData(newTestData)
    setIsEditingTestData(true)
  }

  const handleEditTestData = (testData: TestData, index: number) => {
    setSelectedTestData({ ...testData, index } as any)
    setIsEditingTestData(true)
  }

  const handleSaveTestData = (testData: TestData & { index?: number }) => {
    if (typeof testData.index === "number") {
      setEditedTestCase((prev) => ({
        ...prev,
        testData: prev.testData.map((td, i) =>
          i === testData.index ? ({ ...testData, index: undefined } as TestData) : td,
        ),
      }))
    } else {
      setEditedTestCase((prev) => ({
        ...prev,
        testData: [...prev.testData, testData as TestData],
      }))
    }
    setIsEditingTestData(false)
    setSelectedTestData(null)
    triggerAutoSave()
  }

  const handleDeleteTestData = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testData: prev.testData.filter((_, i) => i !== index),
    }))
    triggerAutoSave()
  }

  const handleCloneTestData = (testData: TestData, index: number) => {
    const clonedTestData: TestData = {
      ...JSON.parse(JSON.stringify(testData)),
      name: `${testData.name} - Copy`,
    }
    setEditedTestCase((prev) => ({
      ...prev,
      testData: [...prev.testData, clonedTestData],
    }))
    triggerAutoSave()
  }

  const handleAddTestStep = () => {
    const newTestStep: TestStep = {
      id: `step${(editedTestCase.testSteps?.length || 0) + 1}`,
      keyword: "openBrowser",
    }
    setInlineEditingStep(newTestStep)
    setIsAddingNewStep(true)
    setInlineEditingStepIndex(-1)
    
    // Scroll to new step after state update
    setTimeout(() => {
      const newStepElement = document.querySelector('.border-2.border-blue-200')
      if (newStepElement) {
        newStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleEditTestStep = (testStep: TestStep, index: number) => {
    setInlineEditingStep({ ...testStep })
    setInlineEditingStepIndex(index)
    setIsAddingNewStep(false)
    setKeywordSearch(testStep.keyword)
  }

  const handleDeleteTestStep = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testSteps: prev.testSteps?.filter((_, i) => i !== index) || [],
    }))
    triggerAutoSave()
  }

  const handleCloneTestStep = (testStep: TestStep, index: number) => {
    const clonedTestStep: TestStep = {
      ...JSON.parse(JSON.stringify(testStep)),
      id: `${testStep.id}_copy`,
    }
    setEditedTestCase((prev) => ({
      ...prev,
      testSteps: [...(prev.testSteps || []), clonedTestStep],
    }))
    triggerAutoSave()
  }

  const handleSave = () => {
    const validatedTestCase = validateTestCase(editedTestCase)
    const finalTestCase = {
      ...validatedTestCase,
      index: editedTestCase.index,
    }
    if (testType === "UI") {
      setActiveTab("teststeps")
    }
    onSave(finalTestCase)
  }

  const handleMonacoChange = (value: string | undefined) => {
    if (!value) return
    try {
      const parsed = JSON.parse(value)
      const validated = validateTestCase(parsed)
      setEditedTestCase({
        ...validated,
        index: editedTestCase.index,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`)
    }
  }

  const handleJsonTreeEdit = (edit: any) => {
    try {
      const updated = edit.updated_src
      const validated = validateTestCase(updated)
      setEditedTestCase({
        ...validated,
        index: editedTestCase.index,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`)
    }
  }



  // Helper function to clean step for JSON serialization
  const cleanStepForSerialization = (step: TestStep): TestStep => {
    const cleaned: any = {
      id: step.id,
      keyword: step.keyword,
    }

    // Keywords that need values
    const valueKeywords = [
      "goto", "type", "fill", "press", "select", "setChecked", "assertText", "assertValue", 
      "assertCount", "assertAttribute", "assertContainsText", "assertUrl", "assertTitle", 
      "assertHaveText", "assertHaveCount", "waitForSelector", "waitForTimeout", "waitForFunction", 
      "waitForElement", "waitForText", "setViewportSize", "scrollTo", "switchToFrame", 
      "uploadFile", "getAttribute"
    ]

    // Keywords that need locators
    const locatorKeywords = [
      "click", "dblClick", "rightClick", "type", "fill", "press", "clear", "select", "check", 
      "uncheck", "setChecked", "hover", "focus", "scrollIntoViewIfNeeded", "dragAndDrop", 
      "assertText", "assertVisible", "assertHidden", "assertEnabled", "assertDisabled", 
      "assertCount", "assertValue", "assertAttribute", "assertChecked", "assertUnchecked", 
      "assertContainsText", "uploadFile", "downloadFile", "getText", "getAttribute", 
      "getValue", "getCount"
    ]

    if (valueKeywords.includes(step.keyword) && step.value) {
      cleaned.value = step.value
    }

    if (locatorKeywords.includes(step.keyword) && step.locator) {
      const cleanedLocator: any = {
        strategy: step.locator.strategy,
        value: step.locator.value,
      }

      // Only include options if they have values
      if (step.locator.options) {
        const cleanedOptions: any = {}
        Object.entries(step.locator.options).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            cleanedOptions[key] = value
          }
        })
        if (Object.keys(cleanedOptions).length > 0) {
          cleanedLocator.options = cleanedOptions
        }
      }

      // Include filter if present
      if (step.locator.filter) {
        cleanedLocator.filter = step.locator.filter
      }

      // Include filters if present
      if (step.locator.filters) {
        cleanedLocator.filters = step.locator.filters
      }

      // Include chain if present
      if (step.locator.chain) {
        cleanedLocator.chain = step.locator.chain
      }

      // Include index if present
      if (step.locator.index !== undefined) {
        cleanedLocator.index = step.locator.index
      }

      cleaned.locator = cleanedLocator
    }

    // Include customFunction for customStep keyword
    if (step.keyword === "customStep" && step.customFunction) {
      cleaned.customFunction = step.customFunction
    }

    // Include customCode for customCode keyword
    if (step.keyword === "customCode" && step.customCode) {
      cleaned.customCode = step.customCode
    }

    // Include API fields for apiCall and soapCall keywords
    if ((step.keyword === "apiCall" || step.keyword === "soapCall")) {
      if (step.method) cleaned.method = step.method
      if (step.endpoint) cleaned.endpoint = step.endpoint
      if (step.headers) cleaned.headers = step.headers
      if (step.body) cleaned.body = step.body
    }

    // Include table operation fields for table keywords
    if (step.keyword?.startsWith("table") && step.tableOperation) {
      cleaned.tableOperation = step.tableOperation
    }

    // Include assertion fields for assertion keywords
    if (["assertEqual", "assertNotEqual", "assertContains", "assertNotContains", "assertEqualIgnoreCase", "assertStartsWith", "assertEndsWith", "assertGreaterThan", "assertLessThan", "assertEmpty", "assertNotEmpty", "assertNull", "assertNotNull"].includes(step.keyword)) {
      if (step.assertionActual) cleaned.assertionActual = step.assertionActual
      if (step.assertionExpected) cleaned.assertionExpected = step.assertionExpected
    }

    if (step.target) {
      cleaned.target = step.target
    }

    if (step.options && Object.keys(step.options).length > 0) {
      cleaned.options = step.options
    }

    // Always include store and localStore if they exist (not just for specific keywords)
    if (step.store && Object.keys(step.store).length > 0) {
      cleaned.store = step.store
    }
    if (step.localStore && Object.keys(step.localStore).length > 0) {
      cleaned.localStore = step.localStore
    }

    if (step.skipOnFailure) {
      cleaned.skipOnFailure = step.skipOnFailure
    }

    return cleaned
  }

  const handleInlineSaveTestStep = () => {
    if (!inlineEditingStep) return

    const cleanedStep = cleanStepForSerialization(inlineEditingStep)

    if (isAddingNewStep) {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: [...(prev.testSteps || []), cleanedStep],
      }))
    } else if (inlineEditingStepIndex !== null && inlineEditingStepIndex >= 0) {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: prev.testSteps?.map((ts, i) => (i === inlineEditingStepIndex ? cleanedStep : ts)) || [],
      }))
    }

    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
    triggerAutoSave()
  }

  const handleInlineCancelTestStep = () => {
    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
  }

  const handleInlineStepChange = (field: keyof TestStep, value: any) => {
    setInlineEditingStep((prev) => {
      if (!prev) return null
      
      // If changing keyword, clear incompatible fields
      if (field === 'keyword') {
        const newStep: TestStep = { ...prev, [field]: value }
        
        // Keywords that don't need locators
        const noLocatorKeywords = [
          'openBrowser', 'closeBrowser', 'closePage', 'maximize', 'minimize', 
          'switchToMainFrame', 'acceptAlert', 'dismissAlert', 'getAlertText',
          'waitForNavigation', 'reload', 'goBack', 'goForward', 'refresh',
          'screenshot', 'scrollUp', 'scrollDown', 'getTitle', 'getUrl'
        ]
        
        // Keywords that don't need values
        const noValueKeywords = [
          'openBrowser', 'closeBrowser', 'closePage', 'maximize', 'minimize',
          'switchToMainFrame', 'acceptAlert', 'dismissAlert', 'getAlertText',
          'waitForNavigation', 'reload', 'goBack', 'goForward', 'refresh',
          'click', 'dblClick', 'rightClick', 'clear', 'check', 'uncheck',
          'hover', 'focus', 'scrollIntoViewIfNeeded', 'dragAndDrop',
          'assertVisible', 'assertHidden', 'assertEnabled', 'assertDisabled',
          'screenshot', 'scrollUp', 'scrollDown', 'getText', 'getTitle', 'getUrl'
        ]
        
        // Clear locator if new keyword doesn't support it
        if (noLocatorKeywords.includes(value)) {
          delete newStep.locator
        }
        
        // Clear value if new keyword doesn't support it
        if (noValueKeywords.includes(value)) {
          delete newStep.value
        }
        
        return newStep
      }
      
      return { ...prev, [field]: value }
    })
  }

  const handleInlineLocatorChange = (field: "strategy" | "value", value: string) => {
    setInlineEditingStep((prev) =>
      prev
        ? {
          ...prev,
          locator: {
            ...prev.locator,
            strategy: prev.locator?.strategy || "css",
            value: prev.locator?.value || "",
            [field]: value,
          },
        }
        : null
    )
  }

  // Render TestDataEditor if editing test data
  if (isEditingTestData && selectedTestData) {
    return (
      <TestDataEditor
        testData={selectedTestData}
        testCaseType={editedTestCase.type || "REST"}
        onSave={handleSaveTestData}
        onCancel={() => {
          setIsEditingTestData(false)
          setSelectedTestData(null)
        }}
      />
    )
  }

  // Main TestCaseEditor render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
        {/* Modern Header with Glass Morphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="hover:bg-white/60 transition-all duration-200 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Edit Test Case
                </h1>
                <p className="text-slate-600 mt-1">Configure and manage your test case settings</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="bg-white/60 hover:bg-white/80 border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Test Case
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Modern Tab Navigation */}
          <div className="bg-white/60 backdrop-blur-xl rounded-xl p-2 shadow-xl border border-white/20">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2">
              <TabsTrigger 
                value="general"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium"
              >
                General
              </TabsTrigger>
              {testType === "API" ? (
                <>
                  <TabsTrigger 
                    value="testdata"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium"
                  >
                    Test Data ({editedTestCase.testData?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="parameters"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium"
                  >
                    Parameters {editedTestCase.parameters?.enabled ? '✓' : ''}
                  </TabsTrigger>
                </>
              ) : (
                <TabsTrigger 
                  value="teststeps"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium"
                >
                  Test Steps ({editedTestCase.testSteps?.length || 0})
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="json"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium"
              >
                JSON View
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general">
            <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                <CardTitle className="text-xl font-semibold text-slate-800">Test Case Information</CardTitle>
                <CardDescription className="text-slate-600">Configure the basic information for your test case</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Test Case Name</Label>
                    <Input
                      id="name"
                      value={editedTestCase.name}
                      onChange={(e) => handleTestCaseChange("name", e.target.value)}
                      placeholder="Enter test case name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedTestCase.status}
                      onValueChange={(value) => handleTestCaseChange("status", value)}
                    >
                      <SelectTrigger>
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
                </div>

                <div className="space-y-4">
                  <Label>Test Type</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="api-test"
                        name="testType"
                        value="API"
                        checked={testType === "API"}
                        onChange={() => handleTestTypeChange("API")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="api-test" className="font-normal">
                        API Test
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="ui-test"
                        name="testType"
                        value="UI"
                        checked={testType === "UI"}
                        onChange={() => handleTestTypeChange("UI")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="ui-test" className="font-normal">
                        UI Test
                      </Label>
                    </div>
                  </div>
                </div>

                {testType === "API" && (
                  <div className="space-y-2">
                    <Label htmlFor="type">API Type</Label>
                    <Select
                      value={editedTestCase.type || "REST"}
                      onValueChange={(value) => handleTestCaseChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REST">REST API</SelectItem>
                        <SelectItem value="SOAP">SOAP API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority (Lower = Higher Priority)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        value={editedTestCase.priority || ""}
                        onChange={(e) => handleTestCaseChange("priority", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="1, 2, 3..."
                      />
                      <div className="text-xs text-gray-500">
                        Lower numbers execute first (1 = highest priority)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dependsOn">Dependencies (Comma-separated)</Label>
                      <Input
                        id="dependsOn"
                        value={editedTestCase.dependsOn?.join(", ") || ""}
                        onChange={(e) => {
                          const deps = e.target.value
                            .split(",")
                            .map(dep => dep.trim())
                            .filter(dep => dep.length > 0)
                          handleTestCaseChange("dependsOn", deps.length > 0 ? deps : undefined)
                        }}
                        placeholder="Generate Auth Token, Create User"
                      />
                      <div className="text-xs text-gray-500">
                        Test case names this test depends on
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enabled"
                        className="h-4 w-4"
                        checked={editedTestCase.enabled !== false}
                        onChange={(e) => handleTestCaseChange("enabled", e.target.checked)}
                      />
                      <Label htmlFor="enabled" className="text-sm font-medium">
                        Enable Test Case Execution
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500">
                      When disabled, this test case will be skipped during suite execution
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-200/50">
                  <Button 
                    onClick={() => {
                      triggerAutoSave()
                      setActiveTab(testType === "API" ? "testdata" : "teststeps")
                    }} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Next: {testType === "API" ? "Test Data" : "Test Steps"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {testType === "API" && (
            <TabsContent value="testdata">
              <div className="space-y-6">
                {/* Modern Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Test Data</h3>
                      <p className="text-slate-600 mt-1">Manage test data configurations for API testing</p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          if (suiteId) {
                            setRunTarget(`${suiteId}:${suiteName || 'Suite'} > ${editedTestCase.id}:${editedTestCase.name}`)
                            setShowRunnerModal(true)
                          }
                        }}
                        disabled={!suiteId}
                        className="bg-white/60 hover:bg-white/80 border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Test Case
                      </Button>
                      <Button 
                        onClick={handleAddTestData}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Data
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                  {(editedTestCase.testData || []).map((testData: TestData, index: number) => (
                    <Card key={index} className={`${testData.enabled === false ? "opacity-60" : ""} bg-white/80 backdrop-blur-xl shadow-xl border-0 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-200`}>
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`testdata-enabled-${index}`}
                                className="h-4 w-4"
                                checked={testData.enabled !== false}
                                onChange={(e) => {
                                  setEditedTestCase((prev) => ({
                                    ...prev,
                                    testData: prev.testData.map((td, i) => 
                                      i === index ? { ...td, enabled: e.target.checked } : td
                                    ),
                                  }))
                                  triggerAutoSave()
                                }}
                              />
                              <div className={`w-2 h-2 rounded-full ${
                                testData.enabled === false ? 'bg-gray-400' : 'bg-green-500'
                              }`}></div>
                            </div>
                            <div>
                              <CardTitle className={`text-base ${
                                testData.enabled === false ? 'text-gray-500' : ''
                              }`}>{testData.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <span>{testData.method} {testData.endpoint}</span>
                                {testData.enabled === false && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Disabled
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                if (suiteId) {
                                  setRunTarget(`${suiteId}:${suiteName || 'Suite'} > ${editedTestCase.id}:${editedTestCase.name} > ${index}:${testData.name}`)
                                  setShowRunnerModal(true)
                                }
                              }}
                              disabled={!suiteId || testData.enabled === false}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditTestData(testData, index)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCloneTestData(testData, index)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteTestData(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}

                  {(!editedTestCase.testData || editedTestCase.testData.length === 0) && (
                    <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 rounded-xl overflow-hidden">
                      <CardContent className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-slate-600 mb-6 text-lg">No test data defined yet</p>
                        <Button 
                          onClick={handleAddTestData}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Test Data
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {testType === "UI" && (
            <TabsContent value="teststeps">
              <div className="space-y-6">
                {/* Modern Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Test Steps</h3>
                      <p className="text-slate-600 mt-1">Define UI automation steps and interactions</p>
                    </div>
                    <Button 
                      onClick={handleAddTestStep}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Step
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6">
                  {(editedTestCase.testSteps || []).map((testStep: TestStep, index: number) => (
                    <Card key={testStep.id || `step-${index}`} className="bg-white/80 backdrop-blur-xl shadow-xl border-0 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-200">
                      {inlineEditingStepIndex === index ? (
                        <CardContent className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Step ID</Label>
                                <Input
                                  value={inlineEditingStep?.id || ""}
                                  onChange={(e) => handleInlineStepChange("id", e.target.value)}
                                  placeholder="Enter step ID"
                                />
                              </div>
                              <div className="space-y-2 relative">
                                <Label>Keyword</Label>
                                <Input
                                  value={keywordSearch || (inlineEditingStep?.keyword || "")}
                                  onChange={(e) => {
                                    setKeywordSearch(e.target.value)
                                    setShowKeywordDropdown(true)
                                  }}
                                  onFocus={() => setShowKeywordDropdown(true)}
                                  onBlur={() => setTimeout(() => setShowKeywordDropdown(false), 200)}
                                  placeholder="Search keywords..."
                                />
                                {showKeywordDropdown && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {[
                                      { value: "openBrowser", label: "[Browser] Open Browser" },
                                      { value: "closeBrowser", label: "[Browser] Close Browser" },
                                      { value: "closePage", label: "[Browser] Close Page" },
                                      { value: "maximize", label: "[Browser] Maximize Window" },
                                      { value: "minimize", label: "[Browser] Minimize Window" },
                                      { value: "setViewportSize", label: "[Browser] Set Viewport Size" },
                                      { value: "switchToFrame", label: "[Browser] Switch To Frame" },
                                      { value: "switchToMainFrame", label: "[Browser] Switch To Main Frame" },
                                      { value: "acceptAlert", label: "[Browser] Accept Alert" },
                                      { value: "dismissAlert", label: "[Browser] Dismiss Alert" },
                                      { value: "getAlertText", label: "[Browser] Get Alert Text" },
                                      { value: "goto", label: "[Navigation] Go To URL" },
                                      { value: "waitForNavigation", label: "[Navigation] Wait For Navigation" },
                                      { value: "reload", label: "[Navigation] Reload Page" },
                                      { value: "goBack", label: "[Navigation] Go Back" },
                                      { value: "goForward", label: "[Navigation] Go Forward" },
                                      { value: "refresh", label: "[Navigation] Refresh Page" },
                                      { value: "click", label: "[Actions] Click" },
                                      { value: "dblClick", label: "[Actions] Double Click" },
                                      { value: "rightClick", label: "[Actions] Right Click" },
                                      { value: "type", label: "[Actions] Type Text" },
                                      { value: "fill", label: "[Actions] Fill Input" },
                                      { value: "press", label: "[Actions] Press Key" },
                                      { value: "clear", label: "[Actions] Clear Input" },
                                      { value: "select", label: "[Actions] Select Option" },
                                      { value: "check", label: "[Actions] Check Checkbox" },
                                      { value: "uncheck", label: "[Actions] Uncheck Checkbox" },
                                      { value: "setChecked", label: "[Actions] Set Checked State" },
                                      { value: "hover", label: "[Actions] Hover" },
                                      { value: "focus", label: "[Actions] Focus Element" },
                                      { value: "scrollIntoViewIfNeeded", label: "[Actions] Scroll Into View" },
                                      { value: "dragAndDrop", label: "[Actions] Drag and Drop" },
                                      { value: "uploadFile", label: "[Actions] Upload File" },
                                      { value: "downloadFile", label: "[Actions] Download File" },
                                      { value: "waitForSelector", label: "[Wait] Wait For Selector" },
                                      { value: "waitForTimeout", label: "[Wait] Wait For Timeout" },
                                      { value: "waitForFunction", label: "[Wait] Wait For Function" },
                                      { value: "assertText", label: "[UI Assert] Assert Text" },
                                      { value: "assertVisible", label: "[UI Assert] Assert Visible" },
                                      { value: "assertHidden", label: "[UI Assert] Assert Hidden" },
                                      { value: "assertEnabled", label: "[UI Assert] Assert Enabled" },
                                      { value: "assertDisabled", label: "[UI Assert] Assert Disabled" },
                                      { value: "assertCount", label: "[UI Assert] Assert Count" },
                                      { value: "assertValue", label: "[UI Assert] Assert Value" },
                                      { value: "assertAttribute", label: "[UI Assert] Assert Attribute" },
                                      { value: "screenshot", label: "[Utilities] Take Screenshot" },
                                      { value: "scrollTo", label: "[Utilities] Scroll To Position" },
                                      { value: "scrollUp", label: "[Utilities] Scroll Up" },
                                      { value: "scrollDown", label: "[Utilities] Scroll Down" },
                                      { value: "getText", label: "[Utilities] Get Text" },
                                      { value: "getAttribute", label: "[Utilities] Get Attribute" },
                                      { value: "getTitle", label: "[Utilities] Get Page Title" },
                                      { value: "getUrl", label: "[Utilities] Get Current URL" },
                                      { value: "getValue", label: "[Utilities] Get Input Value" },
                                      { value: "getCount", label: "[Utilities] Get Element Count" },
                                      { value: "assertChecked", label: "[UI Assert] Assert Checked" },
                                      { value: "assertUnchecked", label: "[UI Assert] Assert Unchecked" },
                                      { value: "assertContainsText", label: "[UI Assert] Assert Contains Text" },
                                      { value: "assertUrl", label: "[UI Assert] Assert URL" },
                                      { value: "assertTitle", label: "[UI Assert] Assert Title" },
                                      { value: "assertHaveText", label: "[UI Assert] Assert Have Text" },
                                      { value: "assertHaveCount", label: "[UI Assert] Assert Have Count" },
                                      { value: "waitForElement", label: "[Wait] Wait For Element" },
                                      { value: "waitForText", label: "[Wait] Wait For Text" },
                                      { value: "apiCall", label: "[API] REST API Call" },
                                      { value: "soapCall", label: "[API] SOAP API Call" },
                                      { value: "tableClick", label: "[Table] Click Cell" },
                                      { value: "tableGetText", label: "[Table] Get Cell Text" },
                                      { value: "tableAssertText", label: "[Table] Assert Cell Text" },
                                      { value: "tableAssertCount", label: "[Table] Assert Row Count" },
                                      { value: "tableGetRowCount", label: "[Table] Get Row Count" },
                                      { value: "tableGetColumnCount", label: "[Table] Get Column Count" },
                                      { value: "tableFindRow", label: "[Table] Find Row" },
                                      { value: "tableSelectRow", label: "[Table] Select Row" },
                                      { value: "tableSortColumn", label: "[Table] Sort Column" },
                                      { value: "tableFilterRows", label: "[Table] Filter Rows" },
                                      { value: "assertEqual", label: "[Generic] Assert Equal" },
                                      { value: "assertNotEqual", label: "[Generic] Assert Not Equal" },
                                      { value: "assertContains", label: "[Generic] Assert Contains" },
                                      { value: "assertNotContains", label: "[Generic] Assert Not Contains" },
                                      { value: "assertEqualIgnoreCase", label: "[Generic] Assert Equal Ignore Case" },
                                      { value: "assertStartsWith", label: "[Generic] Assert Starts With" },
                                      { value: "assertEndsWith", label: "[Generic] Assert Ends With" },
                                      { value: "assertGreaterThan", label: "[Generic] Assert Greater Than" },
                                      { value: "assertLessThan", label: "[Generic] Assert Less Than" },
                                      { value: "assertEmpty", label: "[Generic] Assert Empty" },
                                      { value: "assertNotEmpty", label: "[Generic] Assert Not Empty" },
                                      { value: "assertNull", label: "[Generic] Assert Null" },
                                      { value: "assertNotNull", label: "[Generic] Assert Not Null" },
                                      { value: "customStep", label: "[Custom] Custom Function" },
                                      { value: "customCode", label: "[Custom] Raw Playwright Code" }
                                    ].filter(item => 
                                      keywordSearch === "" || 
                                      item.label.toLowerCase().includes(keywordSearch.toLowerCase()) ||
                                      item.value.toLowerCase().includes(keywordSearch.toLowerCase())
                                    ).map((item) => (
                                      <div
                                        key={item.value}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                          handleInlineStepChange("keyword", item.value)
                                          setKeywordSearch(item.value)
                                          setShowKeywordDropdown(false)
                                        }}
                                      >
                                        {item.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {["goto", "type", "fill", "press", "select", "setChecked", "assertText", "assertValue", "assertCount", "assertAttribute", "assertContainsText", "assertUrl", "assertTitle", "assertHaveText", "assertHaveCount", "waitForSelector", "waitForTimeout", "waitForFunction", "waitForElement", "waitForText", "setViewportSize", "scrollTo", "switchToFrame", "uploadFile", "getAttribute"].includes(inlineEditingStep?.keyword || "") && (
                              <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                  value={inlineEditingStep?.value || ""}
                                  onChange={(e) => handleInlineStepChange("value", e.target.value)}
                                  placeholder={
                                    inlineEditingStep?.keyword === "goto" ? "Enter URL" :
                                    ["type", "fill"].includes(inlineEditingStep?.keyword || "") ? "Enter text to type" :
                                    inlineEditingStep?.keyword === "press" ? "Enter key (e.g., Enter, Tab, Escape)" :
                                    "Enter value"
                                  }
                                />
                              </div>
                            )}

                            {["click", "dblClick", "rightClick", "type", "fill", "press", "clear", "select", "check", "uncheck", "setChecked", "hover", "focus", "scrollIntoViewIfNeeded", "dragAndDrop", "assertText", "assertVisible", "assertHidden", "assertEnabled", "assertDisabled", "assertCount", "assertValue", "assertAttribute", "assertChecked", "assertUnchecked", "assertContainsText", "uploadFile", "downloadFile", "getText", "getAttribute", "getValue", "getCount"].includes(inlineEditingStep?.keyword || "") && (
                              <EnhancedLocatorBuilder
                                locator={inlineEditingStep?.locator}
                                onChange={(locator) => handleInlineStepChange("locator", locator)}
                                className="border-t pt-4"
                              />
                            )}

                            {/* Variable Storage for data extraction keywords */}
                            {(["getText", "getAttribute", "getTitle", "getUrl", "getValue", "getCount"].includes(inlineEditingStep?.keyword || "")) && (
                              <div className="space-y-4 border-t pt-4 bg-green-50 p-4 rounded-lg">
                                <Label className="text-sm font-semibold text-green-700">Variable Storage</Label>
                                <div className="text-xs text-green-600 mb-2">
                                  Store the extracted value in a variable for later use
                                </div>
                                
                                <div className="space-y-4">
                                  {/* Global Variable Section */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-green-700">Global Variable (store)</h4>
                                    <p className="text-xs text-green-600">Available across all test cases</p>
                                    <Input
                                      value={inlineEditingStep?.store ? Object.keys(inlineEditingStep.store)[0] || "" : ""}
                                      onChange={(e) => {
                                        const varName = e.target.value
                                        if (varName) {
                                          let path = "$text"
                                          switch (inlineEditingStep?.keyword) {
                                            case "getAttribute": path = "$attribute"; break;
                                            case "getTitle": path = "$title"; break;
                                            case "getUrl": path = "$url"; break;
                                            case "getValue": path = "$value"; break;
                                            case "getCount": path = "$count"; break;
                                            default: path = "$text"; break;
                                          }
                                          handleInlineStepChange("store", { [varName]: path })
                                        } else {
                                          handleInlineStepChange("store", undefined)
                                        }
                                      }}
                                      placeholder="globalUserId, pageTitle, etc."
                                    />
                                  </div>
                                  
                                  {/* Local Variable Section with Checkbox */}
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="use-local-store-edit"
                                        className="h-4 w-4"
                                        checked={!!inlineEditingStep?.localStore}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleInlineStepChange("localStore", {})
                                          } else {
                                            handleInlineStepChange("localStore", undefined)
                                          }
                                        }}
                                      />
                                      <Label htmlFor="use-local-store-edit" className="text-sm font-medium text-blue-700">
                                        Use Local Variable (localStore)
                                      </Label>
                                    </div>
                                    <p className="text-xs text-blue-600 ml-6">Only within current test case</p>
                                    
                                    {inlineEditingStep?.localStore && (
                                      <div className="ml-6">
                                        <Input
                                          value={Object.keys(inlineEditingStep.localStore)[0] || ""}
                                          onChange={(e) => {
                                            const varName = e.target.value
                                            if (varName) {
                                              let path = "$text"
                                              switch (inlineEditingStep?.keyword) {
                                                case "getAttribute": path = "$attribute"; break;
                                                case "getTitle": path = "$title"; break;
                                                case "getUrl": path = "$url"; break;
                                                case "getValue": path = "$value"; break;
                                                case "getCount": path = "$count"; break;
                                                default: path = "$text"; break;
                                              }
                                              handleInlineStepChange("localStore", { [varName]: path })
                                            } else {
                                              handleInlineStepChange("localStore", {})
                                            }
                                          }}
                                          placeholder="tempUserId, localData, etc."
                                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                                  💡 Use variables later with {"{{variableName}}"} syntax. Local variables take precedence over global variables.
                                </div>
                              </div>
                            )}

                            {inlineEditingStep?.keyword === "customStep" && (
                              <div className="space-y-4 border-t pt-4">
                                <Label className="text-sm font-semibold">Custom Function Configuration</Label>
                                
                                <div className="space-y-2">
                                  <Label>Function Name</Label>
                                  <Input
                                    value={inlineEditingStep?.customFunction?.function || ""}
                                    onChange={(e) => {
                                      if (!inlineEditingStep) return
                                      const newStep: TestStep = { ...inlineEditingStep }
                                      if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                      newStep.customFunction.function = e.target.value
                                      handleInlineStepChange("customFunction", newStep.customFunction)
                                    }}
                                    placeholder="loginUser, LoginPage.login, UserManagementPage.createUser"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Arguments (JSON Array)</Label>
                                  <Input
                                    value={inlineEditingStep?.customFunction?.args ? JSON.stringify(inlineEditingStep.customFunction.args) : ""}
                                    onChange={(e) => {
                                      if (!inlineEditingStep) return
                                      try {
                                        const args = e.target.value ? JSON.parse(e.target.value) : undefined
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                        newStep.customFunction.args = args
                                        handleInlineStepChange("customFunction", newStep.customFunction)
                                      } catch {
                                        // Invalid JSON, don't update
                                      }
                                    }}
                                    placeholder='["admin", "password123"] or [{"firstName": "John"}]'
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Variable Mapping (JSON Object)</Label>
                                  <Input
                                    value={inlineEditingStep?.customFunction?.mapTo ? JSON.stringify(inlineEditingStep.customFunction.mapTo) : ""}
                                    onChange={(e) => {
                                      if (!inlineEditingStep) return
                                      try {
                                        const mapTo = e.target.value ? JSON.parse(e.target.value) : undefined
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                        newStep.customFunction.mapTo = mapTo
                                        handleInlineStepChange("customFunction", newStep.customFunction)
                                      } catch {
                                        // Invalid JSON, don't update
                                      }
                                    }}
                                    placeholder='{"userId": "userId", "loginSuccess": "success"}'
                                  />
                                  <div className="text-xs text-gray-500">
                                    Maps function result to variables: {'{ "variableName": "resultProperty" }'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(inlineEditingStep?.keyword === "apiCall" || inlineEditingStep?.keyword === "soapCall") && (
                              <div className="space-y-4 border-t pt-4">
                                <Label className="text-sm font-semibold">{inlineEditingStep.keyword === "soapCall" ? "SOAP" : "REST"} API Configuration</Label>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>HTTP Method</Label>
                                    <Select
                                      value={inlineEditingStep?.method || "GET"}
                                      onValueChange={(value) => handleInlineStepChange("method", value)}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Endpoint</Label>
                                    <Input
                                      value={inlineEditingStep?.endpoint || ""}
                                      onChange={(e) => handleInlineStepChange("endpoint", e.target.value)}
                                      placeholder="/api/users or https://api.example.com/users"
                                      className="h-9"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Headers (JSON)</Label>
                                  <Textarea
                                    value={inlineEditingStep?.headers ? JSON.stringify(inlineEditingStep.headers, null, 2) : '{"Content-Type": "application/json"}'}
                                    onChange={(e) => {
                                      try {
                                        const headers = JSON.parse(e.target.value)
                                        handleInlineStepChange("headers", headers)
                                      } catch {
                                        // Invalid JSON, don't update
                                      }
                                    }}
                                    className="font-mono text-sm min-h-[80px]"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Request Body (JSON)</Label>
                                  <Textarea
                                    value={inlineEditingStep?.body ? (typeof inlineEditingStep.body === 'string' ? inlineEditingStep.body : JSON.stringify(inlineEditingStep.body, null, 2)) : ""}
                                    onChange={(e) => {
                                      try {
                                        const body = JSON.parse(e.target.value)
                                        handleInlineStepChange("body", body)
                                      } catch {
                                        // Keep as string if not valid JSON
                                        handleInlineStepChange("body", e.target.value)
                                      }
                                    }}
                                    placeholder={inlineEditingStep.keyword === "soapCall" ? 
                                      `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <!-- SOAP request body -->
  </soap:Body>
</soap:Envelope>` : 
                                      `{
  "name": "{{userName}}",
  "email": "user@example.com"
}`}
                                    className="font-mono text-sm min-h-[120px]"
                                  />
                                </div>
                              </div>
                            )}

                            {inlineEditingStep?.keyword === "customCode" && (
                              <div className="space-y-4 border-t pt-4">
                                <Label className="text-sm font-semibold">Raw Playwright Code</Label>
                                <div className="text-xs text-gray-600 mb-2">
                                  Write raw Playwright code. Available variables: page, browser, expect, console
                                </div>
                                
                                <div className="space-y-2">
                                  <Textarea
                                    value={inlineEditingStep?.customCode || ""}
                                    onChange={(e) => handleInlineStepChange("customCode", e.target.value)}
                                    placeholder={`// Example: Click multiple elements
await page.locator('.item').nth(0).click();
await page.locator('.item').nth(1).click();

// Example: Complex assertion
const count = await page.locator('.product').count();
expect(count).toBeGreaterThan(5);

// Example: Custom wait
await page.waitForFunction(() => {
  return document.querySelectorAll('.loaded').length > 3;
});`}
                                    className="font-mono text-sm min-h-[200px]"
                                  />
                                </div>
                                
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>💡 <strong>Tips:</strong></div>
                                  <div>• Use <code>page</code> for page interactions</div>
                                  <div>• Use <code>expect</code> for assertions</div>
                                  <div>• Use <code>console.log()</code> for debugging</div>
                                  <div>• Code runs in async context - no need to wrap in async function</div>
                                </div>
                              </div>
                            )}

                            {/* Skip on Failure Option */}
                            <div className="space-y-4 border-t pt-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="skip-on-failure-edit"
                                  className="h-4 w-4"
                                  checked={!!inlineEditingStep?.skipOnFailure}
                                  onChange={(e) => handleInlineStepChange("skipOnFailure", e.target.checked)}
                                />
                                <Label htmlFor="skip-on-failure-edit" className="text-sm">
                                  Skip this step if any previous step fails
                                </Label>
                              </div>
                              <div className="text-xs text-gray-500">
                                When enabled, this step will be skipped if any previous step in the test case fails
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={handleInlineCancelTestStep}>
                                Cancel
                              </Button>
                              <Button onClick={handleInlineSaveTestStep}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Step
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      ) : (
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Step {index + 1}: {testStep.keyword}
                              </CardTitle>
                              <CardDescription>
                                {testStep.keyword === "customStep" && testStep.customFunction
                                  ? (
                                    <>
                                      Function: {testStep.customFunction.function}
                                      {testStep.customFunction.args && (
                                        <> | Args: {JSON.stringify(testStep.customFunction.args)}</>
                                      )}
                                    </>
                                  )
                                  : testStep.keyword === "customCode" && testStep.customCode
                                  ? (
                                    <>
                                      Code: {testStep.customCode.substring(0, 100)}{testStep.customCode.length > 100 ? '...' : ''}
                                    </>
                                  )
                                  : (
                                    <>
                                      {testStep.value && <>Value: {testStep.value}</>}
                                      {testStep.locator && <> | Locator: {testStep.locator.strategy} = "{testStep.locator.value}"</>}
                                    </>
                                  )
                                }
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {testStep.skipOnFailure && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                      ⏭️ Skip on Failure
                                    </span>
                                  )}
                                  {testStep.locator?.filters && testStep.locator.filters.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                      🔍 {testStep.locator.filters.length} Filter{testStep.locator.filters.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {testStep.locator?.chain && testStep.locator.chain.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      🔗 {testStep.locator.chain.length} Chain{testStep.locator.chain.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditTestStep(testStep, index)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleCloneTestStep(testStep, index)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteTestStep(index)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      )}
                    </Card>
                  ))}

                  {isAddingNewStep && inlineEditingStep && (
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-xl shadow-2xl border-2 border-blue-200/50 rounded-xl overflow-hidden">
                      <CardContent className="p-8">
                        <div className="space-y-4">
                          <h4 className="font-medium text-blue-900">Add New Test Step</h4>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Step ID</Label>
                              <Input
                                value={inlineEditingStep.id}
                                onChange={(e) => handleInlineStepChange("id", e.target.value)}
                                placeholder="Enter step ID"
                              />
                            </div>
                            <div className="space-y-2 relative">
                              <Label>Keyword</Label>
                              <Input
                                value={keywordSearch}
                                onChange={(e) => {
                                  setKeywordSearch(e.target.value)
                                  setShowKeywordDropdown(true)
                                }}
                                onFocus={() => setShowKeywordDropdown(true)}
                                onBlur={() => setTimeout(() => setShowKeywordDropdown(false), 200)}
                                placeholder="Search keywords..."
                              />
                              {showKeywordDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                  {[
                                    { value: "openBrowser", label: "[Browser] Open Browser" },
                                    { value: "closeBrowser", label: "[Browser] Close Browser" },
                                    { value: "closePage", label: "[Browser] Close Page" },
                                    { value: "maximize", label: "[Browser] Maximize Window" },
                                    { value: "minimize", label: "[Browser] Minimize Window" },
                                    { value: "setViewportSize", label: "[Browser] Set Viewport Size" },
                                    { value: "switchToFrame", label: "[Browser] Switch To Frame" },
                                    { value: "switchToMainFrame", label: "[Browser] Switch To Main Frame" },
                                    { value: "acceptAlert", label: "[Browser] Accept Alert" },
                                    { value: "dismissAlert", label: "[Browser] Dismiss Alert" },
                                    { value: "getAlertText", label: "[Browser] Get Alert Text" },
                                    { value: "goto", label: "[Navigation] Go To URL" },
                                    { value: "waitForNavigation", label: "[Navigation] Wait For Navigation" },
                                    { value: "reload", label: "[Navigation] Reload Page" },
                                    { value: "goBack", label: "[Navigation] Go Back" },
                                    { value: "goForward", label: "[Navigation] Go Forward" },
                                    { value: "refresh", label: "[Navigation] Refresh Page" },
                                    { value: "click", label: "[Actions] Click" },
                                    { value: "dblClick", label: "[Actions] Double Click" },
                                    { value: "rightClick", label: "[Actions] Right Click" },
                                    { value: "type", label: "[Actions] Type Text" },
                                    { value: "fill", label: "[Actions] Fill Input" },
                                    { value: "press", label: "[Actions] Press Key" },
                                    { value: "clear", label: "[Actions] Clear Input" },
                                    { value: "select", label: "[Actions] Select Option" },
                                    { value: "check", label: "[Actions] Check Checkbox" },
                                    { value: "uncheck", label: "[Actions] Uncheck Checkbox" },
                                    { value: "setChecked", label: "[Actions] Set Checked State" },
                                    { value: "hover", label: "[Actions] Hover" },
                                    { value: "focus", label: "[Actions] Focus Element" },
                                    { value: "scrollIntoViewIfNeeded", label: "[Actions] Scroll Into View" },
                                    { value: "dragAndDrop", label: "[Actions] Drag and Drop" },
                                    { value: "uploadFile", label: "[Actions] Upload File" },
                                    { value: "downloadFile", label: "[Actions] Download File" },
                                    { value: "waitForSelector", label: "[Wait] Wait For Selector" },
                                    { value: "waitForTimeout", label: "[Wait] Wait For Timeout" },
                                    { value: "waitForFunction", label: "[Wait] Wait For Function" },
                                    { value: "assertText", label: "[UI Assert] Assert Text" },
                                    { value: "assertVisible", label: "[UI Assert] Assert Visible" },
                                    { value: "assertHidden", label: "[UI Assert] Assert Hidden" },
                                    { value: "assertEnabled", label: "[UI Assert] Assert Enabled" },
                                    { value: "assertDisabled", label: "[UI Assert] Assert Disabled" },
                                    { value: "assertCount", label: "[UI Assert] Assert Count" },
                                    { value: "assertValue", label: "[UI Assert] Assert Value" },
                                    { value: "assertAttribute", label: "[UI Assert] Assert Attribute" },
                                    { value: "screenshot", label: "[Utilities] Take Screenshot" },
                                    { value: "scrollTo", label: "[Utilities] Scroll To Position" },
                                    { value: "scrollUp", label: "[Utilities] Scroll Up" },
                                    { value: "scrollDown", label: "[Utilities] Scroll Down" },
                                    { value: "getText", label: "[Utilities] Get Text" },
                                    { value: "getAttribute", label: "[Utilities] Get Attribute" },
                                    { value: "getTitle", label: "[Utilities] Get Page Title" },
                                    { value: "getUrl", label: "[Utilities] Get Current URL" },
                                    { value: "getValue", label: "[Utilities] Get Input Value" },
                                    { value: "getCount", label: "[Utilities] Get Element Count" },
                                    { value: "assertChecked", label: "[UI Assert] Assert Checked" },
                                    { value: "assertUnchecked", label: "[UI Assert] Assert Unchecked" },
                                    { value: "assertContainsText", label: "[UI Assert] Assert Contains Text" },
                                    { value: "assertUrl", label: "[UI Assert] Assert URL" },
                                    { value: "assertTitle", label: "[UI Assert] Assert Title" },
                                    { value: "assertHaveText", label: "[UI Assert] Assert Have Text" },
                                    { value: "assertHaveCount", label: "[UI Assert] Assert Have Count" },
                                    { value: "waitForElement", label: "[Wait] Wait For Element" },
                                    { value: "waitForText", label: "[Wait] Wait For Text" },
                                    { value: "apiCall", label: "[API] REST API Call" },
                                    { value: "soapCall", label: "[API] SOAP API Call" },
                                    { value: "tableClick", label: "[Table] Click Cell" },
                                    { value: "tableGetText", label: "[Table] Get Cell Text" },
                                    { value: "tableAssertText", label: "[Table] Assert Cell Text" },
                                    { value: "tableAssertCount", label: "[Table] Assert Row Count" },
                                    { value: "tableGetRowCount", label: "[Table] Get Row Count" },
                                    { value: "tableGetColumnCount", label: "[Table] Get Column Count" },
                                    { value: "tableFindRow", label: "[Table] Find Row" },
                                    { value: "tableSelectRow", label: "[Table] Select Row" },
                                    { value: "tableSortColumn", label: "[Table] Sort Column" },
                                    { value: "tableFilterRows", label: "[Table] Filter Rows" },
                                    { value: "assertEqual", label: "[Generic] Assert Equal" },
                                    { value: "assertNotEqual", label: "[Generic] Assert Not Equal" },
                                    { value: "assertContains", label: "[Generic] Assert Contains" },
                                    { value: "assertNotContains", label: "[Generic] Assert Not Contains" },
                                    { value: "assertEqualIgnoreCase", label: "[Generic] Assert Equal Ignore Case" },
                                    { value: "assertStartsWith", label: "[Generic] Assert Starts With" },
                                    { value: "assertEndsWith", label: "[Generic] Assert Ends With" },
                                    { value: "assertGreaterThan", label: "[Generic] Assert Greater Than" },
                                    { value: "assertLessThan", label: "[Generic] Assert Less Than" },
                                    { value: "assertEmpty", label: "[Generic] Assert Empty" },
                                    { value: "assertNotEmpty", label: "[Generic] Assert Not Empty" },
                                    { value: "assertNull", label: "[Generic] Assert Null" },
                                    { value: "assertNotNull", label: "[Generic] Assert Not Null" },
                                    { value: "customStep", label: "[Custom] Custom Function" },
                                    { value: "customCode", label: "[Custom] Raw Playwright Code" }
                                  ].filter(item => 
                                    keywordSearch === "" || 
                                    item.label.toLowerCase().includes(keywordSearch.toLowerCase()) ||
                                    item.value.toLowerCase().includes(keywordSearch.toLowerCase())
                                  ).map((item) => (
                                    <div
                                      key={item.value}
                                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                      onClick={() => {
                                        handleInlineStepChange("keyword", item.value)
                                        setKeywordSearch(item.value)
                                        setShowKeywordDropdown(false)
                                      }}
                                    >
                                      {item.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {["goto", "type", "fill", "press", "select", "setChecked", "assertText", "assertValue", "assertCount", "assertAttribute", "assertContainsText", "assertUrl", "assertTitle", "assertHaveText", "assertHaveCount", "waitForSelector", "waitForTimeout", "waitForFunction", "waitForElement", "waitForText", "setViewportSize", "scrollTo", "switchToFrame", "uploadFile", "getAttribute"].includes(inlineEditingStep.keyword) && (
                            <div className="space-y-2">
                              <Label>Value</Label>
                              <Input
                                value={inlineEditingStep.value || ""}
                                onChange={(e) => handleInlineStepChange("value", e.target.value)}
                                placeholder={
                                  inlineEditingStep.keyword === "goto" ? "Enter URL" :
                                  ["type", "fill"].includes(inlineEditingStep.keyword) ? "Enter text to type" :
                                  inlineEditingStep.keyword === "press" ? "Enter key (e.g., Enter, Tab, Escape)" :
                                  "Enter value"
                                }
                              />
                            </div>
                          )}

                          {["click", "dblClick", "rightClick", "type", "fill", "press", "clear", "select", "check", "uncheck", "setChecked", "hover", "focus", "scrollIntoViewIfNeeded", "dragAndDrop", "assertText", "assertVisible", "assertHidden", "assertEnabled", "assertDisabled", "assertCount", "assertValue", "assertAttribute", "assertChecked", "assertUnchecked", "assertContainsText", "uploadFile", "downloadFile", "getText", "getAttribute", "getValue", "getCount"].includes(inlineEditingStep.keyword) && (
                            <EnhancedLocatorBuilder
                              locator={inlineEditingStep.locator}
                              onChange={(locator) => handleInlineStepChange("locator", locator)}
                              className="border-t pt-4"
                            />
                          )}

                          {/* Variable Storage for data extraction keywords */}
                          {(["getText", "getAttribute", "getTitle", "getUrl", "getValue", "getCount"].includes(inlineEditingStep?.keyword || "")) && (
                            <div className="space-y-4 border-t pt-4 bg-green-50 p-4 rounded-lg">
                              <Label className="text-sm font-semibold text-green-700">Variable Storage</Label>
                              <div className="text-xs text-green-600 mb-2">
                                Store the extracted value in a variable for later use
                              </div>
                              
                              <div className="space-y-4">
                                {/* Global Variable Section */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-green-700">Global Variable (store)</h4>
                                  <p className="text-xs text-green-600">Available across all test cases</p>
                                  <Input
                                    value={inlineEditingStep?.store ? Object.keys(inlineEditingStep.store)[0] || "" : ""}
                                    onChange={(e) => {
                                      const varName = e.target.value
                                      if (varName) {
                                        let path = "$text"
                                        switch (inlineEditingStep?.keyword) {
                                          case "getAttribute": path = "$attribute"; break;
                                          case "getTitle": path = "$title"; break;
                                          case "getUrl": path = "$url"; break;
                                          case "getValue": path = "$value"; break;
                                          case "getCount": path = "$count"; break;
                                          default: path = "$text"; break;
                                        }
                                        handleInlineStepChange("store", { [varName]: path })
                                      } else {
                                        handleInlineStepChange("store", undefined)
                                      }
                                    }}
                                    placeholder="globalUserId, pageTitle, etc."
                                  />
                                </div>
                                
                                {/* Local Variable Section with Checkbox */}
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="use-local-store-add"
                                      className="h-4 w-4"
                                      checked={!!inlineEditingStep?.localStore}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleInlineStepChange("localStore", {})
                                        } else {
                                          handleInlineStepChange("localStore", undefined)
                                        }
                                      }}
                                    />
                                    <Label htmlFor="use-local-store-add" className="text-sm font-medium text-blue-700">
                                      Use Local Variable (localStore)
                                    </Label>
                                  </div>
                                  <p className="text-xs text-blue-600 ml-6">Only within current test case</p>
                                  
                                  {inlineEditingStep?.localStore && (
                                    <div className="ml-6">
                                      <Input
                                        value={Object.keys(inlineEditingStep.localStore)[0] || ""}
                                        onChange={(e) => {
                                          const varName = e.target.value
                                          if (varName) {
                                            let path = "$text"
                                            switch (inlineEditingStep?.keyword) {
                                              case "getAttribute": path = "$attribute"; break;
                                              case "getTitle": path = "$title"; break;
                                              case "getUrl": path = "$url"; break;
                                              case "getValue": path = "$value"; break;
                                              case "getCount": path = "$count"; break;
                                              default: path = "$text"; break;
                                            }
                                            handleInlineStepChange("localStore", { [varName]: path })
                                          } else {
                                            handleInlineStepChange("localStore", {})
                                          }
                                        }}
                                        placeholder="tempUserId, localData, etc."
                                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                                💡 Use variables later with {"{{variableName}}"} syntax. Local variables take precedence over global variables.
                              </div>
                            </div>
                          )}

                          {inlineEditingStep?.keyword === "customStep" && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">Custom Function Configuration</Label>
                              
                              <div className="space-y-2">
                                <Label>Function Name</Label>
                                <Input
                                  value={inlineEditingStep?.customFunction?.function || ""}
                                  onChange={(e) => {
                                    if (!inlineEditingStep) return
                                    const newStep: TestStep = { ...inlineEditingStep }
                                    if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                    newStep.customFunction.function = e.target.value
                                    handleInlineStepChange("customFunction", newStep.customFunction)
                                  }}
                                  placeholder="loginUser, LoginPage.login, UserManagementPage.createUser"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Arguments (JSON Array)</Label>
                                <Input
                                  value={inlineEditingStep?.customFunction?.args ? JSON.stringify(inlineEditingStep.customFunction.args) : ""}
                                  onChange={(e) => {
                                    if (!inlineEditingStep) return
                                    try {
                                      const args = e.target.value ? JSON.parse(e.target.value) : undefined
                                      const newStep: TestStep = { ...inlineEditingStep }
                                      if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                      newStep.customFunction.args = args
                                      handleInlineStepChange("customFunction", newStep.customFunction)
                                    } catch {
                                      // Invalid JSON, don't update
                                    }
                                  }}
                                  placeholder='["admin", "password123"] or [{"firstName": "John"}]'
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Variable Mapping (JSON Object)</Label>
                                <Input
                                  value={inlineEditingStep?.customFunction?.mapTo ? JSON.stringify(inlineEditingStep.customFunction.mapTo) : ""}
                                  onChange={(e) => {
                                    if (!inlineEditingStep) return
                                    try {
                                      const mapTo = e.target.value ? JSON.parse(e.target.value) : undefined
                                      const newStep: TestStep = { ...inlineEditingStep }
                                      if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                      newStep.customFunction.mapTo = mapTo
                                      handleInlineStepChange("customFunction", newStep.customFunction)
                                    } catch {
                                      // Invalid JSON, don't update
                                    }
                                  }}
                                  placeholder='{"userId": "userId", "loginSuccess": "success"}'
                                />
                                <div className="text-xs text-gray-500">
                                  Maps function result to variables: {'{ "variableName": "resultProperty" }'}
                                </div>
                              </div>
                            </div>
                          )}

                          {(inlineEditingStep?.keyword === "apiCall" || inlineEditingStep?.keyword === "soapCall") && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">{inlineEditingStep.keyword === "soapCall" ? "SOAP" : "REST"} API Configuration</Label>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>HTTP Method</Label>
                                  <Select
                                    value={inlineEditingStep?.method || "GET"}
                                    onValueChange={(value) => handleInlineStepChange("method", value)}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GET">GET</SelectItem>
                                      <SelectItem value="POST">POST</SelectItem>
                                      <SelectItem value="PUT">PUT</SelectItem>
                                      <SelectItem value="DELETE">DELETE</SelectItem>
                                      <SelectItem value="PATCH">PATCH</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Endpoint</Label>
                                  <Input
                                    value={inlineEditingStep?.endpoint || ""}
                                    onChange={(e) => handleInlineStepChange("endpoint", e.target.value)}
                                    placeholder="/api/users or https://api.example.com/users"
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Headers (JSON)</Label>
                                <Textarea
                                  value={inlineEditingStep?.headers ? JSON.stringify(inlineEditingStep.headers, null, 2) : '{"Content-Type": "application/json"}'}
                                  onChange={(e) => {
                                    try {
                                      const headers = JSON.parse(e.target.value)
                                      handleInlineStepChange("headers", headers)
                                    } catch {
                                      // Invalid JSON, don't update
                                    }
                                  }}
                                  className="font-mono text-sm min-h-[80px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Request Body (JSON)</Label>
                                <Textarea
                                  value={inlineEditingStep?.body ? (typeof inlineEditingStep.body === 'string' ? inlineEditingStep.body : JSON.stringify(inlineEditingStep.body, null, 2)) : ""}
                                  onChange={(e) => {
                                    try {
                                      const body = JSON.parse(e.target.value)
                                      handleInlineStepChange("body", body)
                                    } catch {
                                      // Keep as string if not valid JSON
                                      handleInlineStepChange("body", e.target.value)
                                    }
                                  }}
                                  placeholder={inlineEditingStep.keyword === "soapCall" ? 
                                    `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <!-- SOAP request body -->
  </soap:Body>
</soap:Envelope>` : 
                                    `{
  "name": "{{userName}}",
  "email": "user@example.com"
}`}
                                  className="font-mono text-sm min-h-[120px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Response Variables (JSON)</Label>
                                <Textarea
                                  value={inlineEditingStep?.store ? JSON.stringify(inlineEditingStep.store, null, 2) : ""}
                                  onChange={(e) => {
                                    try {
                                      const store = e.target.value ? JSON.parse(e.target.value) : {}
                                      handleInlineStepChange("store", Object.keys(store).length > 0 ? store : undefined)
                                    } catch {
                                      // Invalid JSON, don't update
                                    }
                                  }}
                                  placeholder={`{
  "userId": "$.id",
  "authToken": "$.token",
  "userName": "$.user.name"
}`}
                                  className="font-mono text-sm min-h-[80px]"
                                />
                                <div className="text-xs text-gray-500">
                                  💡 Use JSONPath syntax ($.field) to extract values from API response
                                </div>
                              </div>
                            </div>
                          )}

                          {["assertEqual", "assertNotEqual", "assertContains", "assertNotContains", "assertEqualIgnoreCase", "assertStartsWith", "assertEndsWith", "assertGreaterThan", "assertLessThan", "assertEmpty", "assertNotEmpty", "assertNull", "assertNotNull"].includes(inlineEditingStep?.keyword || "") && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">Assertion Configuration</Label>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Actual Value (Variable or Value)</Label>
                                  <Input
                                    value={inlineEditingStep?.assertionActual || ""}
                                    onChange={(e) => handleInlineStepChange("assertionActual", e.target.value)}
                                    placeholder="{{storedVariable}} or direct value"
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Expected Value</Label>
                                  <Input
                                    value={inlineEditingStep?.assertionExpected || ""}
                                    onChange={(e) => handleInlineStepChange("assertionExpected", e.target.value)}
                                    placeholder="Expected value to compare"
                                    className="h-9"
                                  />
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>💡 <strong>Tips:</strong></div>
                                <div>• Use {'{{'} variableName {'}}'}  syntax to reference stored variables</div>
                                <div>• Actual: The value you want to test (from variables or direct input)</div>
                                <div>• Expected: The value you expect it to match</div>
                                <div>• For numeric comparisons (greater/less than), both values will be converted to numbers</div>
                              </div>
                            </div>
                          )}

                          {inlineEditingStep?.keyword?.startsWith("table") && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">Table Operation Configuration</Label>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Row (Index or "header")</Label>
                                  <Input
                                    value={inlineEditingStep?.tableOperation?.row?.toString() || ""}
                                    onChange={(e) => {
                                      const tableOp = inlineEditingStep?.tableOperation || {}
                                      const value = e.target.value
                                      const row = isNaN(parseInt(value)) ? value : parseInt(value)
                                      handleInlineStepChange("tableOperation", { ...tableOp, row })
                                    }}
                                    placeholder="0, 1, 2 or 'header'"
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Column (Index or Name)</Label>
                                  <Input
                                    value={inlineEditingStep?.tableOperation?.column?.toString() || ""}
                                    onChange={(e) => {
                                      const tableOp = inlineEditingStep?.tableOperation || {}
                                      const value = e.target.value
                                      const column = isNaN(parseInt(value)) ? value : parseInt(value)
                                      handleInlineStepChange("tableOperation", { ...tableOp, column })
                                    }}
                                    placeholder="0, 1, 2 or 'Name', 'Email'"
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              {["tableAssertText", "tableFindRow", "tableFilterRows", "tableAssertCount"].includes(inlineEditingStep?.keyword || "") && (
                                <div className="space-y-2">
                                  <Label>Cell Value / Search Text</Label>
                                  <Input
                                    value={inlineEditingStep?.tableOperation?.cellValue || ""}
                                    onChange={(e) => {
                                      const tableOp = inlineEditingStep?.tableOperation || {}
                                      handleInlineStepChange("tableOperation", { ...tableOp, cellValue: e.target.value })
                                    }}
                                    placeholder="Expected text or search value"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>💡 <strong>Tips:</strong></div>
                                <div>• Row: Use 0-based index (0, 1, 2) or "header" for header row</div>
                                <div>• Column: Use 0-based index (0, 1, 2) or column name ("Name", "Email")</div>
                                <div>• Variables: Use {'{{'} variableName {'}}'}  syntax in cell values</div>
                              </div>
                            </div>
                          )}

                          {inlineEditingStep?.keyword === "customCode" && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">Raw Playwright Code</Label>
                              <div className="text-xs text-gray-600 mb-2">
                                Write raw Playwright code. Available variables: page, browser, expect, console
                              </div>
                              
                              <div className="space-y-2">
                                <Textarea
                                  value={inlineEditingStep?.customCode || ""}
                                  onChange={(e) => handleInlineStepChange("customCode", e.target.value)}
                                  placeholder={`// Example: Click multiple elements
await page.locator('.item').nth(0).click();
await page.locator('.item').nth(1).click();

// Example: Complex assertion
const count = await page.locator('.product').count();
expect(count).toBeGreaterThan(5);

// Example: Custom wait
await page.waitForFunction(() => {
  return document.querySelectorAll('.loaded').length > 3;
});`}
                                  className="font-mono text-sm min-h-[200px]"
                                />
                              </div>
                              
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>💡 <strong>Tips:</strong></div>
                                <div>• Use <code>page</code> for page interactions</div>
                                <div>• Use <code>expect</code> for assertions</div>
                                <div>• Use <code>console.log()</code> for debugging</div>
                                <div>• Code runs in async context - no need to wrap in async function</div>
                              </div>
                            </div>
                          )}

                          {/* Skip on Failure Option */}
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="skip-on-failure-add"
                                className="h-4 w-4"
                                checked={!!inlineEditingStep?.skipOnFailure}
                                onChange={(e) => handleInlineStepChange("skipOnFailure", e.target.checked)}
                              />
                              <Label htmlFor="skip-on-failure-add" className="text-sm">
                                Skip this step if any previous step fails
                              </Label>
                            </div>
                            <div className="text-xs text-gray-500">
                              When enabled, this step will be skipped if any previous step in the test case fails
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleInlineCancelTestStep}>
                              Cancel
                            </Button>
                            <Button onClick={handleInlineSaveTestStep}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Step
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(!editedTestCase.testSteps || editedTestCase.testSteps.length === 0) && !isAddingNewStep && (
                    <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 rounded-xl overflow-hidden">
                      <CardContent className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="text-slate-600 mb-6 text-lg">No test steps defined yet</p>
                        <Button 
                          onClick={handleAddTestStep}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Test Step
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {(editedTestCase.testSteps?.length || 0) > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
                    <div className="flex justify-between items-center">
                      <Button 
                        onClick={handleAddTestStep}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Step
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save All Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {testType === "API" && (
            <TabsContent value="parameters">
              <ParameterManager
                parameters={editedTestCase.parameters}
                onParametersChange={(parameters) => {
                  handleTestCaseChange("parameters", parameters)
                  triggerAutoSave()
                }}
                testCaseName={editedTestCase.name}
              />
            </TabsContent>
          )}

          <TabsContent value="json">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">JSON View</CardTitle>
                    <CardDescription>View and edit the test case structure with rich JSON editors</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={jsonViewMode === "tree" ? "default" : "outline"}
                      onClick={() => setJsonViewMode("tree")}
                      className="h-8"
                    >
                      Tree
                    </Button>
                    <Button
                      size="sm"
                      variant={jsonViewMode === "code" ? "default" : "outline"}
                      onClick={() => setJsonViewMode("code")}
                      className="h-8"
                    >
                      Editor
                    </Button>
                    <Button
                      size="sm"
                      variant={jsonViewMode === "raw" ? "default" : "outline"}
                      onClick={() => setJsonViewMode("raw")}
                      className="h-8"
                    >
                      Raw
                    </Button>
                  </div>
                </div>
                {jsonError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{jsonError}</p>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {jsonViewMode === "tree" && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 min-h-[500px]">
                    <ReactJson
                      src={editedTestCase}
                      theme="rjv-default"
                      name="testCase"
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
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
                      }}
                    />
                  </div>
                )}

                {jsonViewMode === "code" && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <MonacoEditor
                      height="500px"
                      language="json"
                      theme="vs"
                      value={JSON.stringify(editedTestCase, null, 2)}
                      onChange={handleMonacoChange}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        lineNumbers: "on",
                        roundedSelection: false,
                        formatOnPaste: true,
                        formatOnType: true,
                        automaticLayout: true,
                        wordWrap: "on",
                      }}
                    />
                  </div>
                )}

                {jsonViewMode === "raw" && (
                  <Textarea
                    value={JSON.stringify(editedTestCase, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        const validated = validateTestCase(parsed)
                        setEditedTestCase({
                          ...validated,
                          index: editedTestCase.index,
                        })
                        setJsonError(null)
                      } catch (error: any) {
                        setJsonError(`Invalid JSON: ${error.message}`)
                      }
                    }}
                    className="font-mono text-sm min-h-[500px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      

      
      {showRunnerModal && runTarget && (
        <SuiteRunnerModal
          isOpen={showRunnerModal}
          onClose={() => {
            setShowRunnerModal(false)
            setRunTarget(null)
          }}
          target={runTarget}
        />
      )}
    </div>
  )
}