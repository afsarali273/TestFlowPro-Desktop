"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  X,
  FileText,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  Upload,
  Globe,
  Zap,
  MousePointer,
  Keyboard,
  Eye,
  Camera,
  Play,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface TestCasesModalProps {
  suite: any
  isOpen: boolean
  onClose: () => void
  onRunTestCase?: (suite: any, testCase: any) => void
}

export function TestCasesModal({ suite, isOpen, onClose, onRunTestCase }: TestCasesModalProps) {
  const { toast } = useToast()

  const handleRunTestCase = (testCase: any) => {
    if (!suite.filePath) {
      toast({
        title: "Cannot Run Test Case",
        description: "Please save the test suite first before running individual test cases.",
        variant: "destructive",
      })
      return
    }

    // Create a temporary suite with only the selected test case
    const tempSuite = {
      ...suite,
      testCases: [testCase],
      suiteName: `${suite.suiteName} > ${testCase.name}`,
      _executionTarget: {
        type: 'testcase',
        suiteId: suite.id,
        suiteName: suite.suiteName,
        testCaseId: testCase.id,
        testCaseName: testCase.name
      }
    }

    // Close this modal and open the suite runner modal
    onClose()
    if (onRunTestCase) {
      onRunTestCase(tempSuite, testCase)
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-green-100 text-green-800"
      case "POST":
        return "bg-blue-100 text-blue-800"
      case "PUT":
        return "bg-yellow-100 text-yellow-800"
      case "PATCH":
        return "bg-orange-100 text-orange-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getKeywordIcon = (keyword: string) => {
    switch (keyword?.toLowerCase()) {
      case "click":
        return <MousePointer className="h-3 w-3 text-blue-500" />
      case "type":
        return <Keyboard className="h-3 w-3 text-green-500" />
      case "asserttext":
      case "assertvisible":
        return <Eye className="h-3 w-3 text-purple-500" />
      case "screenshot":
        return <Camera className="h-3 w-3 text-orange-500" />
      case "openbrowser":
      case "goto":
        return <Globe className="h-3 w-3 text-indigo-500" />
      case "select":
      case "waitfor":
        return <Play className="h-3 w-3 text-teal-500" />
      default:
        return <Zap className="h-3 w-3 text-gray-500" />
    }
  }

  const getKeywordColor = (keyword: string) => {
    switch (keyword?.toLowerCase()) {
      case "click":
        return "bg-blue-100 text-blue-800"
      case "type":
        return "bg-green-100 text-green-800"
      case "asserttext":
      case "assertvisible":
        return "bg-purple-100 text-purple-800"
      case "screenshot":
        return "bg-orange-100 text-orange-800"
      case "openbrowser":
      case "goto":
        return "bg-indigo-100 text-indigo-800"
      case "select":
      case "waitfor":
        return "bg-teal-100 text-teal-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderPreProcessSteps = (preProcess: any[]) => {
    if (!preProcess || preProcess.length === 0) {
      return (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Zap className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pre-process steps defined</p>
          </div>
      )
    }

    return (
        <div className="space-y-3">
          {preProcess.map((step: any, stepIndex: number) => (
              <div key={stepIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  {/* Function Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.db ? (
                          <Database className="h-4 w-4 text-blue-500" />
                      ) : (
                          <Zap className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="font-medium text-gray-900">{step.function}</span>
                      {step.db && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            DB Query
                          </Badge>
                      )}
                    </div>
                  </div>

                  {/* Database Information */}
                  {step.db && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-blue-700">Database:</span>
                            <code className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">{step.db}</code>
                          </div>
                          {step.args && step.args.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-blue-700">SQL Query:</span>
                                <pre className="mt-1 text-xs bg-blue-100 p-2 rounded text-blue-800 font-mono whitespace-pre-wrap break-words">
                          {step.args[0]}
                        </pre>
                              </div>
                          )}
                        </div>
                      </div>
                  )}

                  {/* Arguments (for non-DB functions) */}
                  {!step.db && step.args && step.args.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Arguments:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {step.args.map((arg: string, argIndex: number) => (
                              <code key={argIndex} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                {arg}
                              </code>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Variable Assignment */}
                  <div>
                    <span className="text-xs font-medium text-gray-600">Variable Assignment:</span>
                    <div className="mt-1">
                      {/* Single Variable */}
                      {step.var && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Single Variable
                            </Badge>
                            <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">{step.var}</code>
                          </div>
                      )}

                      {/* Multiple Variables (mapTo) */}
                      {step.mapTo && Object.keys(step.mapTo).length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                Multiple Variables
                              </Badge>
                              <span className="text-xs text-gray-500">
                          ({Object.keys(step.mapTo).length} mapping{Object.keys(step.mapTo).length !== 1 ? "s" : ""})
                        </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(step.mapTo).map(([varName, propName]) => (
                                  <div key={varName} className="flex items-center gap-2 text-xs">
                                    <code className="bg-purple-100 px-2 py-1 rounded text-purple-800 font-medium">
                                      {varName}
                                    </code>
                                    <span className="text-gray-400">←</span>
                                    <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">{propName as string}</code>
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* No variables defined */}
                      {!step.var && (!step.mapTo || Object.keys(step.mapTo).length === 0) && (
                          <span className="text-xs text-gray-500 italic">No variables will be stored</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>
    )
  }

  const renderTestSteps = (testSteps: any[]) => {
    if (!testSteps || testSteps.length === 0) {
      return (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Play className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No test steps defined</p>
          </div>
      )
    }

    return (
        <div className="space-y-3">
          {testSteps.map((step: any, stepIndex: number) => (
              <div key={stepIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getKeywordIcon(step.keyword)}
                      <Badge className={getKeywordColor(step.keyword)}>{step.keyword}</Badge>
                      <span className="text-sm text-gray-600">Step {stepIndex + 1}</span>
                    </div>
                    <span className="text-xs text-gray-500">ID: {step.id}</span>
                  </div>

                  {/* Locator Information */}
                  {step.locator && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-700">Locator Strategy:</span>
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                              {step.locator.strategy}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-blue-700">Locator Value:</span>
                            <code className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded text-blue-800 break-all">
                              {step.locator.value}
                            </code>
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Step Value */}
                  {step.value && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Value:</span>
                        <div className="mt-1">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 break-all">{step.value}</code>
                        </div>
                      </div>
                  )}

                  {/* Step Preview */}
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic">
                    {step.keyword === "openBrowser" && "Opens a new browser instance"}
                    {step.keyword === "goto" && step.value && `Navigate to: ${step.value}`}
                    {step.keyword === "click" &&
                        step.locator &&
                        `Click on element: ${step.locator.strategy}="${step.locator.value}"`}
                    {step.keyword === "type" &&
                        step.locator &&
                        step.value &&
                        `Type "${step.value}" into element: ${step.locator.strategy}="${step.locator.value}"`}
                    {step.keyword === "select" &&
                        step.locator &&
                        step.value &&
                        `Select "${step.value}" from element: ${step.locator.strategy}="${step.locator.value}"`}
                    {step.keyword === "assertText" &&
                        step.locator &&
                        step.value &&
                        `Assert text "${step.value}" in element: ${step.locator.strategy}="${step.locator.value}"`}
                    {step.keyword === "assertVisible" &&
                        step.locator &&
                        `Assert element is visible: ${step.locator.strategy}="${step.locator.value}"`}
                    {step.keyword === "waitFor" && step.value && `Wait for ${step.value} milliseconds`}
                    {step.keyword === "screenshot" && "Take a screenshot"}
                  </div>
                </div>
              </div>
          ))}
        </div>
    )
  }

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[85vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-blue-50/50 -m-6 mb-6 p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  suite.type === 'UI' 
                    ? 'bg-gradient-to-br from-violet-600 to-purple-600' 
                    : 'bg-gradient-to-br from-slate-600 to-slate-700'
                }`}>
                  {suite.type === 'UI' ? (
                    <MousePointer className="h-5 w-5 text-white" />
                  ) : (
                    <Globe className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {suite.suiteName}
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <DialogDescription className="text-slate-600">
                      {suite.testCases?.length || 0} test case{(suite.testCases?.length || 0) !== 1 ? 's' : ''}
                    </DialogDescription>
                    <Badge className={`text-xs ${
                      suite.type === 'UI' 
                        ? 'bg-violet-100 text-violet-700 border-violet-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {suite.type === 'UI' ? '🖱️ UI Tests' : '🌐 API Tests'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {suite.baseUrl && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="h-4 w-4" />
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded truncate max-w-xs">{suite.baseUrl}</span>
                  </div>
                )}
                {suite.applicationName && (
                  <div className="text-xs text-slate-500 mt-1">📁 {suite.applicationName}</div>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6">
              {suite.testCases && suite.testCases.length > 0 ? (
                  suite.testCases.map((testCase: any, testCaseIndex: number) => (
                      <Card key={testCaseIndex} className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-xl hover:bg-white/90 rounded-xl overflow-hidden ${
                        testCase.type === 'UI' ? 'border-l-4 border-l-violet-500' : 'border-l-4 border-l-slate-500'
                      }`}>
                        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/30 to-blue-50/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 ${
                                testCase.type === 'UI' 
                                  ? 'bg-gradient-to-br from-violet-600 to-purple-600' 
                                  : 'bg-gradient-to-br from-slate-600 to-slate-700'
                              }`}>
                                {testCase.type === 'UI' ? (
                                  <MousePointer className="h-5 w-5 text-white" />
                                ) : (
                                  <Globe className="h-5 w-5 text-white" />
                                )}
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors duration-200 flex items-center gap-2">
                                  {getStatusIcon(testCase.status)}
                                  {testCase.name}
                                  {testCase.type && (
                                      <Badge variant="outline" className={`text-xs ${
                                        testCase.type === 'UI' 
                                          ? 'bg-violet-50 text-violet-700 border-violet-200' 
                                          : 'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}>
                                        {testCase.type}
                                      </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-slate-600">
                                  {testCase.type === "UI"
                                      ? `${testCase.testSteps?.length || 0} test step${testCase.testSteps?.length !== 1 ? "s" : ""}`
                                      : `${testCase.testData?.length || 0} test data item${testCase.testData?.length !== 1 ? "s" : ""}`}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${getStatusColor(testCase.status)} font-medium px-3 py-1`}>
                                {testCase.status || 'Not Started'}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleRunTestCase(testCase)}
                                disabled={!suite.filePath}
                                className={`h-9 px-4 text-white transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl ${
                                  testCase.type === 'UI'
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                                    : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                                }`}
                                title={!suite.filePath ? "Save the suite first" : "Run this test case"}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Run
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {testCase.type === "UI" && testCase.testSteps && testCase.testSteps.length > 0 && (
                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                                    <Play className="h-3 w-3 text-violet-600" />
                                  </div>
                                  <h4 className="font-semibold text-sm text-slate-700">
                                    Test Steps ({testCase.testSteps.length})
                                  </h4>
                                </div>
                                {renderTestSteps(testCase.testSteps)}
                              </div>
                            </CardContent>
                        )}

                        {testCase.type !== "UI" && testCase.testData && testCase.testData.length > 0 && (
                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                {/* Parameters Section */}
                                {testCase.parameters?.enabled && (
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Database className="h-3 w-3 text-blue-600" />
                                      </div>
                                      <h4 className="font-semibold text-sm text-blue-800">
                                        Parameters Enabled
                                      </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-700 font-medium">Data Source:</span>
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                          {testCase.parameters.dataSource.type.toUpperCase()}
                                        </Badge>
                                        {testCase.parameters.dataSource.filePath && (
                                          <span className="text-blue-600 text-xs font-mono">
                                            {testCase.parameters.dataSource.filePath}
                                          </span>
                                        )}
                                      </div>
                                      {testCase.parameters.dataSource.data && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-blue-700 font-medium">Parameter Sets:</span>
                                          <span className="text-blue-600">{testCase.parameters.dataSource.data.length}</span>
                                        </div>
                                      )}
                                      {testCase.parameters.parameterMapping && Object.keys(testCase.parameters.parameterMapping).length > 0 && (
                                        <div>
                                          <span className="text-blue-700 font-medium block mb-1">Parameter Mappings:</span>
                                          <div className="flex flex-wrap gap-1">
                                            {Object.entries(testCase.parameters.parameterMapping).map(([key, value]) => (
                                              <Badge key={key} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                {key} → {value}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Database className="h-3 w-3 text-slate-600" />
                                  </div>
                                  <h4 className="font-semibold text-sm text-slate-700">
                                    Test Data ({testCase.testData.length})
                                    {testCase.parameters?.enabled && testCase.parameters.dataSource.data && (
                                      <span className="ml-2 text-xs text-blue-600">
                                        × {testCase.parameters.dataSource.data.length} parameter sets = {testCase.testData.length * testCase.parameters.dataSource.data.length} executions
                                      </span>
                                    )}
                                  </h4>
                                </div>
                                {testCase.testData.map((testData: any, dataIndex: number) => (
                                    <Card key={dataIndex} className="bg-gradient-to-r from-slate-50/50 to-blue-50/50 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                                      <CardContent className="p-4">
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between">
                                            <h5 className="font-medium text-sm">{testData.name}</h5>
                                            <div className="flex items-center gap-2">
                                              <Badge className={getMethodColor(testData.method)}>{testData.method}</Badge>
                                              <code className="text-xs bg-gray-200 px-2 py-1 rounded break-all max-w-xs">
                                                {testData.endpoint}
                                              </code>
                                            </div>
                                          </div>

                                          {/* Pre-Process Section */}
                                          {testData.preProcess && testData.preProcess.length > 0 && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                                  <Zap className="h-3 w-3 text-purple-500" />
                                                  Pre-Process Steps ({testData.preProcess.length}):
                                                </h6>
                                                {renderPreProcessSteps(testData.preProcess)}
                                              </div>
                                          )}

                                          {/* File References */}
                                          {(testData.bodyFile || testData.responseSchemaFile) && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-600 mb-1">File References:</h6>
                                                <div className="space-y-1">
                                                  {testData.bodyFile && (
                                                      <div className="flex items-center gap-2 text-xs">
                                                        <Upload className="h-3 w-3 text-blue-500" />
                                                        <span className="font-medium text-gray-700">Body File:</span>
                                                        <code className="bg-blue-100 px-1 rounded text-blue-700 break-all">
                                                          {testData.bodyFile}
                                                        </code>
                                                      </div>
                                                  )}
                                                  {testData.responseSchemaFile && (
                                                      <div className="flex items-center gap-2 text-xs">
                                                        <Code className="h-3 w-3 text-green-500" />
                                                        <span className="font-medium text-gray-700">Schema File:</span>
                                                        <code className="bg-green-100 px-1 rounded text-green-700 break-all">
                                                          {testData.responseSchemaFile}
                                                        </code>
                                                      </div>
                                                  )}
                                                </div>
                                              </div>
                                          )}

                                          {/* Headers */}
                                          {testData.headers && Object.keys(testData.headers).length > 0 && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-600 mb-1">Headers:</h6>
                                                <div className="grid grid-cols-1 gap-1 text-xs">
                                                  {Object.entries(testData.headers).map(([key, value]) => (
                                                      <div key={key} className="flex flex-wrap">
                                                        <span className="font-medium text-gray-700 mr-1">{key}:</span>
                                                        <span className="text-gray-600 break-all">{value as string}</span>
                                                      </div>
                                                  ))}
                                                </div>
                                              </div>
                                          )}

                                          {/* Body (only show if no bodyFile) */}
                                          {!testData.bodyFile && testData.body && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-600 mb-1">Request Body:</h6>
                                                {testCase.type === "SOAP" ? (
                                                    <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto max-h-32 whitespace-pre-wrap break-words">
                                        {testData.body}
                                      </pre>
                                                ) : (
                                                    <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto max-h-32">
                                        {typeof testData.body === "string"
                                            ? testData.body
                                            : JSON.stringify(testData.body, null, 2)}
                                      </pre>
                                                )}
                                              </div>
                                          )}

                                          {/* Response Schema (only show if no responseSchemaFile) */}
                                          {!testData.responseSchemaFile &&
                                              testData.responseSchema &&
                                              Object.keys(testData.responseSchema).length > 0 && (
                                                  <div>
                                                    <h6 className="text-xs font-medium text-gray-600 mb-1">Response Schema:</h6>
                                                    <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto max-h-32 border border-green-200">
                                        {JSON.stringify(testData.responseSchema, null, 2)}
                                      </pre>
                                                  </div>
                                              )}

                                          {/* Assertions */}
                                          {testData.assertions && testData.assertions.length > 0 && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-600 mb-1">
                                                  Assertions ({testData.assertions.length}):
                                                </h6>
                                                <div className="space-y-1">
                                                  {testData.assertions.map((assertion: any, assertionIndex: number) => (
                                                      <div
                                                          key={assertionIndex}
                                                          className="text-xs bg-white p-2 rounded border flex items-center gap-2 flex-wrap"
                                                      >
                                                        <Badge variant="outline" className="text-xs">
                                                          {assertion.type}
                                                        </Badge>
                                                        {(assertion.jsonPath || assertion.xpathExpression) && (
                                                            <code className="bg-gray-100 px-1 rounded break-all">
                                                              {assertion.jsonPath || assertion.xpathExpression}
                                                            </code>
                                                        )}
                                                        {assertion.expected !== undefined && (
                                                            <span className="text-gray-600 break-all">
                                              = <strong>{JSON.stringify(assertion.expected)}</strong>
                                            </span>
                                                        )}
                                                        {assertion.type === "arrayObjectMatch" && (
                                                            <span className="text-gray-600 text-xs break-all">
                                              [{assertion.matchField}={assertion.matchValue} → {assertion.assertField}]
                                            </span>
                                                        )}
                                                      </div>
                                                  ))}
                                                </div>
                                              </div>
                                          )}

                                          {/* Store Variables */}
                                          {testData.store && Object.keys(testData.store).length > 0 && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-600 mb-1">Store Variables:</h6>
                                                <div className="grid grid-cols-1 gap-1 text-xs">
                                                  {Object.entries(testData.store).map(([key, value]) => (
                                                      <div key={key} className="flex flex-wrap">
                                                        <span className="font-medium text-gray-700 mr-1">{key}:</span>
                                                        <code className="text-gray-600 bg-gray-100 px-1 rounded break-all">
                                                          {value as string}
                                                        </code>
                                                      </div>
                                                  ))}
                                                </div>
                                              </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                ))}
                              </div>
                            </CardContent>
                        )}

                        {((testCase.type === "UI" && (!testCase.testSteps || testCase.testSteps.length === 0)) ||
                            (testCase.type !== "UI" && (!testCase.testData || testCase.testData.length === 0))) && (
                            <CardContent>
                              <div className="text-center py-4 text-gray-500">
                                {testCase.type === "UI" ? (
                                    <>
                                      <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">No test steps defined for this UI test case</p>
                                    </>
                                ) : (
                                    <>
                                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">No test data defined for this test case</p>
                                    </>
                                )}
                              </div>
                            </CardContent>
                        )}
                      </Card>
                  ))
              ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No test cases found</p>
                    <p className="text-sm">This test suite doesn't have any test cases defined yet.</p>
                  </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50/30 to-blue-50/30 -m-6 mt-6 p-6 rounded-b-lg">
            <div className="text-sm text-slate-600">
              {suite.testCases?.length || 0} test case{(suite.testCases?.length || 0) !== 1 ? 's' : ''} • 
              {suite.testCases?.reduce((acc: number, tc: any) => 
                acc + (tc.type === 'UI' ? (tc.testSteps?.length || 0) : (tc.testData?.length || 0)), 0
              ) || 0} total {suite.type === 'UI' ? 'steps' : 'data items'}
            </div>
            <Button 
              onClick={onClose}
              className="h-10 px-6 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}
