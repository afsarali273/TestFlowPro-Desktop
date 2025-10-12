"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, Copy, HelpCircle, GripVertical } from "lucide-react"
import { TestDataEditor } from "@/components/test-data-editor"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { type TestCase, type TestData, type TestStep, validateTestCase } from "@/types/test-suite"

interface SortableTestStepProps {
  testStep: TestStep
  index: number
  inlineEditingStepIndex: number | null
  inlineEditingStep: TestStep | null
  onEdit: (testStep: TestStep, index: number) => void
  onClone: (testStep: TestStep, index: number) => void
  onDelete: (index: number) => void
  onInlineSave: () => void
  onInlineCancel: () => void
  onInlineStepChange: (field: keyof TestStep, value: any) => void
  onInlineLocatorChange: (field: "strategy" | "value", value: string) => void
}

function SortableTestStep({
  testStep,
  index,
  inlineEditingStepIndex,
  inlineEditingStep,
  onEdit,
  onClone,
  onDelete,
  onInlineSave,
  onInlineCancel,
  onInlineStepChange,
  onInlineLocatorChange,
}: SortableTestStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testStep.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg' : ''}>
      {inlineEditingStepIndex === index ? (
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Step ID</Label>
                <Input
                  value={inlineEditingStep?.id || ""}
                  onChange={(e) => onInlineStepChange("id", e.target.value)}
                  placeholder="Enter step ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Keyword</Label>
                <Select
                  value={inlineEditingStep?.keyword || "openBrowser"}
                  onValueChange={(value) => onInlineStepChange("keyword", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="openBrowser">[Browser] Open Browser</SelectItem>
                    <SelectItem value="closeBrowser">[Browser] Close Browser</SelectItem>
                    <SelectItem value="closePage">[Browser] Close Page</SelectItem>
                    <SelectItem value="maximize">[Browser] Maximize Window</SelectItem>
                    <SelectItem value="minimize">[Browser] Minimize Window</SelectItem>
                    <SelectItem value="setViewportSize">[Browser] Set Viewport Size</SelectItem>
                    <SelectItem value="switchToFrame">[Browser] Switch To Frame</SelectItem>
                    <SelectItem value="switchToMainFrame">[Browser] Switch To Main Frame</SelectItem>
                    <SelectItem value="acceptAlert">[Browser] Accept Alert</SelectItem>
                    <SelectItem value="dismissAlert">[Browser] Dismiss Alert</SelectItem>
                    <SelectItem value="getAlertText">[Browser] Get Alert Text</SelectItem>
                    <SelectItem value="goto">[Navigation] Go To URL</SelectItem>
                    <SelectItem value="waitForNavigation">[Navigation] Wait For Navigation</SelectItem>
                    <SelectItem value="reload">[Navigation] Reload Page</SelectItem>
                    <SelectItem value="goBack">[Navigation] Go Back</SelectItem>
                    <SelectItem value="goForward">[Navigation] Go Forward</SelectItem>
                    <SelectItem value="refresh">[Navigation] Refresh Page</SelectItem>
                    <SelectItem value="click">[Actions] Click</SelectItem>
                    <SelectItem value="dblClick">[Actions] Double Click</SelectItem>
                    <SelectItem value="rightClick">[Actions] Right Click</SelectItem>
                    <SelectItem value="type">[Actions] Type Text</SelectItem>
                    <SelectItem value="fill">[Actions] Fill Input</SelectItem>
                    <SelectItem value="press">[Actions] Press Key</SelectItem>
                    <SelectItem value="clear">[Actions] Clear Input</SelectItem>
                    <SelectItem value="select">[Actions] Select Option</SelectItem>
                    <SelectItem value="check">[Actions] Check Checkbox</SelectItem>
                    <SelectItem value="uncheck">[Actions] Uncheck Checkbox</SelectItem>
                    <SelectItem value="setChecked">[Actions] Set Checked State</SelectItem>
                    <SelectItem value="hover">[Actions] Hover</SelectItem>
                    <SelectItem value="focus">[Actions] Focus Element</SelectItem>
                    <SelectItem value="scrollIntoViewIfNeeded">[Actions] Scroll Into View</SelectItem>
                    <SelectItem value="dragAndDrop">[Actions] Drag and Drop</SelectItem>
                    <SelectItem value="uploadFile">[Actions] Upload File</SelectItem>
                    <SelectItem value="downloadFile">[Actions] Download File</SelectItem>
                    <SelectItem value="waitForSelector">[Wait] Wait For Selector</SelectItem>
                    <SelectItem value="waitForTimeout">[Wait] Wait For Timeout</SelectItem>
                    <SelectItem value="waitForFunction">[Wait] Wait For Function</SelectItem>
                    <SelectItem value="assertText">[Assertions] Assert Text</SelectItem>
                    <SelectItem value="assertVisible">[Assertions] Assert Visible</SelectItem>
                    <SelectItem value="assertHidden">[Assertions] Assert Hidden</SelectItem>
                    <SelectItem value="assertEnabled">[Assertions] Assert Enabled</SelectItem>
                    <SelectItem value="assertDisabled">[Assertions] Assert Disabled</SelectItem>
                    <SelectItem value="assertCount">[Assertions] Assert Count</SelectItem>
                    <SelectItem value="assertValue">[Assertions] Assert Value</SelectItem>
                    <SelectItem value="assertAttribute">[Assertions] Assert Attribute</SelectItem>
                    <SelectItem value="screenshot">[Utilities] Take Screenshot</SelectItem>
                    <SelectItem value="scrollTo">[Utilities] Scroll To Position</SelectItem>
                    <SelectItem value="scrollUp">[Utilities] Scroll Up</SelectItem>
                    <SelectItem value="scrollDown">[Utilities] Scroll Down</SelectItem>
                    <SelectItem value="getText">[Utilities] Get Text</SelectItem>
                    <SelectItem value="getAttribute">[Utilities] Get Attribute</SelectItem>
                    <SelectItem value="getTitle">[Utilities] Get Page Title</SelectItem>
                    <SelectItem value="getUrl">[Utilities] Get Current URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onInlineCancel}>
                Cancel
              </Button>
              <Button onClick={onInlineSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Step
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Step {index + 1}: {testStep.keyword}
                </CardTitle>
                <CardDescription>
                  {testStep.value && `Value: ${testStep.value}`}
                  {testStep.locator && ` | Locator: ${testStep.locator.strategy} = "${testStep.locator.value}"`}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(testStep, index)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onClone(testStep, index)}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
    </Card>
  )
}

import dynamic from "next/dynamic"

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading JSON viewer...</div>
})
import MonacoEditor from "@monaco-editor/react"

interface TestCaseEditorProps {
  testCase: TestCase & { index?: number }
  onSave: (testCase: TestCase & { index?: number }) => void
  onCancel: () => void
}

export function TestCaseEditor({ testCase, onSave, onCancel }: TestCaseEditorProps) {
  const [editedTestCase, setEditedTestCase] = useState<TestCase & { index?: number }>(() => {
    const validated = validateTestCase(testCase)
    return {
      ...validated,
      index: testCase.index,
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setEditedTestCase((prev) => {
        const testSteps = prev.testSteps || []
        const oldIndex = testSteps.findIndex((step) => step.id === active.id)
        const newIndex = testSteps.findIndex((step) => step.id === over?.id)

        return {
          ...prev,
          testSteps: arrayMove(testSteps, oldIndex, newIndex),
        }
      })
    }
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
            strategy: prev.locator?.strategy || "css",
            value: prev.locator?.value || "",
            [field]: value,
          },
        }
        : null
    )
  }

  const handleAddTestStep = () => {
    const newTestStep: TestStep = {
      id: `step${(editedTestCase.testSteps?.length || 0) + 1}`,
      keyword: "openBrowser",
    }
    setInlineEditingStep(newTestStep)
    setIsAddingNewStep(true)
    setInlineEditingStepIndex(-1)
  }

  const handleEditTestStep = (testStep: TestStep, index: number) => {
    setInlineEditingStep({ ...testStep })
    setInlineEditingStepIndex(index)
    setIsAddingNewStep(false)
  }

  const handleDeleteTestStep = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testSteps: prev.testSteps?.filter((_, i) => i !== index) || [],
    }))
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
  }

  const handleInlineSaveTestStep = () => {
    if (!inlineEditingStep) return

    if (isAddingNewStep) {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: [...(prev.testSteps || []), inlineEditingStep],
      }))
    } else if (inlineEditingStepIndex !== null && inlineEditingStepIndex >= 0) {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: prev.testSteps?.map((ts, i) => (i === inlineEditingStepIndex ? inlineEditingStep : ts)) || [],
      }))
    }

    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
  }

  const handleInlineCancelTestStep = () => {
    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Test Case</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Test Case
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            {testType === "UI" && (
              <TabsTrigger value="teststeps">Test Steps ({editedTestCase.testSteps?.length || 0})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Test Case Information</CardTitle>
                <CardDescription>Configure the basic information for your test case</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Test Case Name</Label>
                    <Input
                      id="name"
                      value={editedTestCase.name}
                      onChange={(e) => setEditedTestCase(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter test case name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {testType === "UI" && (
            <TabsContent value="teststeps">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Test Steps</h3>
                  <Button onClick={handleAddTestStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Step
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={(editedTestCase.testSteps || []).map(step => step.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-4">
                      {(editedTestCase.testSteps || []).map((testStep: TestStep, index: number) => (
                        <SortableTestStep
                          key={testStep.id}
                          testStep={testStep}
                          index={index}
                          inlineEditingStepIndex={inlineEditingStepIndex}
                          inlineEditingStep={inlineEditingStep}
                          onEdit={handleEditTestStep}
                          onClone={handleCloneTestStep}
                          onDelete={handleDeleteTestStep}
                          onInlineSave={handleInlineSaveTestStep}
                          onInlineCancel={handleInlineCancelTestStep}
                          onInlineStepChange={handleInlineStepChange}
                          onInlineLocatorChange={handleInlineLocatorChange}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {isAddingNewStep && inlineEditingStep && (
                  <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardContent className="p-6">
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
                          <div className="space-y-2">
                            <Label>Keyword</Label>
                            <Select
                              value={inlineEditingStep.keyword}
                              onValueChange={(value) => handleInlineStepChange("keyword", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                <SelectItem value="openBrowser">[Browser] Open Browser</SelectItem>
                                <SelectItem value="closeBrowser">[Browser] Close Browser</SelectItem>
                                <SelectItem value="goto">[Navigation] Go To URL</SelectItem>
                                <SelectItem value="click">[Actions] Click</SelectItem>
                                <SelectItem value="fill">[Actions] Fill Input</SelectItem>
                                <SelectItem value="refresh">[Navigation] Refresh Page</SelectItem>
                              </SelectContent>
                            </Select>
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
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 mb-4">No test steps defined yet</p>
                      <Button onClick={handleAddTestStep}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Test Step
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}