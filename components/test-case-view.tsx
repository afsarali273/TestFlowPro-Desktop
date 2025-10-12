"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Play, FileText, Code, Eye, Database, Zap, MousePointer, Keyboard, Camera, Globe } from "lucide-react"
import { SuiteRunnerModal } from "@/components/suite-runner-modal"
import { type TestSuite, type TestCase, type TestData, type TestStep } from "@/types/test-suite"

import dynamic from "next/dynamic"

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading JSON viewer...</div>
})

interface TestCaseViewProps {
  suite: TestSuite
  testCase: TestCase
  testCaseIndex: number
  onBack: () => void
}

export function TestCaseView({ suite, testCase, testCaseIndex, onBack }: TestCaseViewProps) {
  const [showRunnerModal, setShowRunnerModal] = useState(false)
  const [runTarget, setRunTarget] = useState<string | null>(null)

  const handleRunTestCase = async () => {
    // First, ensure the test case with parameters is saved to the suite file
    if (suite.filePath && testCase.parameters?.enabled) {
      try {
        // Update the test case in the suite with current parameter configuration
        const updatedSuite = {
          ...suite,
          testCases: suite.testCases.map((tc, index) => 
            index === testCaseIndex ? testCase : tc
          )
        }
        
        // Save the updated suite to file
        const response = await fetch('/api/test-suites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testSuite: updatedSuite,
            filePath: suite.filePath,
            forceReplace: true,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to save test case parameters')
        }
        
        console.log('Test case parameters saved successfully before execution')
      } catch (error) {
        console.error('Error saving test case parameters:', error)
        alert('Failed to save test case parameters. The test may run without parameter data.')
      }
    }
    
    const target = `${suite.id}:${suite.suiteName} > ${testCase.id || ''}:${testCase.name}`
    setRunTarget(target)
    setShowRunnerModal(true)
  }

  const handleRunTestData = async (testDataIndex: number, testData: TestData) => {
    // First, ensure the test case with parameters is saved to the suite file
    if (suite.filePath && testCase.parameters?.enabled) {
      try {
        // Update the test case in the suite with current parameter configuration
        const updatedSuite = {
          ...suite,
          testCases: suite.testCases.map((tc, index) => 
            index === testCaseIndex ? testCase : tc
          )
        }
        
        // Save the updated suite to file
        const response = await fetch('/api/test-suites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testSuite: updatedSuite,
            filePath: suite.filePath,
            forceReplace: true,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to save test case parameters')
        }
        
        console.log('Test case parameters saved successfully before execution')
      } catch (error) {
        console.error('Error saving test case parameters:', error)
        alert('Failed to save test case parameters. The test may run without parameter data.')
      }
    }
    
    const target = `${suite.id}:${suite.suiteName} > ${testCase.id || ''}:${testCase.name} > ${testDataIndex}:${testData.name}`
    setRunTarget(target)
    setShowRunnerModal(true)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Suite
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{testCase.name}</h1>
              <p className="text-gray-600">{suite.suiteName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{testCase.status}</Badge>
            <Button
              onClick={handleRunTestCase}
              disabled={!suite.filePath}
              className="bg-green-600 hover:bg-green-700"
              title={!suite.filePath ? "Save the suite first" : "Run this test case"}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Test Case
            </Button>
          </div>
        </div>

        <Tabs defaultValue={testCase.type === "UI" ? "teststeps" : "testdata"} className="space-y-6">
          <TabsList>
            {testCase.type === "UI" ? (
              <TabsTrigger value="teststeps">Test Steps ({testCase.testSteps?.length || 0})</TabsTrigger>
            ) : (
              <TabsTrigger value="testdata">Test Data ({testCase.testData?.length || 0})</TabsTrigger>
            )}
            <TabsTrigger value="json">JSON View</TabsTrigger>
          </TabsList>

          {testCase.type === "UI" && (
            <TabsContent value="teststeps">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-500" />
                    Test Steps
                  </CardTitle>
                  <CardDescription>UI automation steps for this test case</CardDescription>
                </CardHeader>
                <CardContent>
                  {testCase.testSteps && testCase.testSteps.length > 0 ? (
                    <div className="space-y-4">
                      {testCase.testSteps.map((step: TestStep, index: number) => (
                        <Card key={step.id || index} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getKeywordIcon(step.keyword)}
                                  <Badge className={getKeywordColor(step.keyword)}>{step.keyword}</Badge>
                                  <span className="text-sm text-gray-600">Step {index + 1}</span>
                                </div>
                                <span className="text-xs text-gray-500">ID: {step.id}</span>
                              </div>

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

                              {step.value && (
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Value:</span>
                                  <div className="mt-1">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 break-all">{step.value}</code>
                                  </div>
                                </div>
                              )}

                              {step.store && Object.keys(step.store).length > 0 && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <span className="text-xs font-medium text-green-700">Variable Storage:</span>
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(step.store).map(([key, value]) => (
                                      <div key={key} className="flex items-center gap-2 text-xs">
                                        <code className="bg-green-100 px-2 py-1 rounded text-green-800 font-medium">{key}</code>
                                        <span className="text-gray-400">←</span>
                                        <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">{value as string}</code>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {step.skipOnFailure && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                    ⏭️ Skip on Failure
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No test steps defined</p>
                      <p className="text-sm">This UI test case doesn't have any test steps yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {testCase.type !== "UI" && (
            <TabsContent value="testdata">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Test Data
                  </CardTitle>
                  <CardDescription>API test data for this test case</CardDescription>
                </CardHeader>
                <CardContent>
                  {testCase.testData && testCase.testData.length > 0 ? (
                    <div className="space-y-4">
                      {testCase.testData.map((testData: TestData, index: number) => (
                        <Card key={index} className="bg-gray-50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">{testData.name}</CardTitle>
                                <CardDescription>
                                  {testData.method} {testData.endpoint}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getMethodColor(testData.method)}>{testData.method}</Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('navigate-to-test-case-edit', {
                                      detail: { suite, testCase, testCaseIndex, testDataIndex: index }
                                    }))
                                  }}
                                  className="mr-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRunTestData(index, testData)}
                                  disabled={!suite.filePath}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  title={!suite.filePath ? "Save the suite first" : "Run this test data"}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Run
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {testData.preProcess && testData.preProcess.length > 0 && (
                                <div>
                                  <h6 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-purple-500" />
                                    Pre-Process Steps ({testData.preProcess.length}):
                                  </h6>
                                  <div className="space-y-2">
                                    {testData.preProcess.map((step: any, stepIndex: number) => (
                                      <div key={stepIndex} className="bg-white p-3 rounded border">
                                        <div className="flex items-center gap-2 mb-2">
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
                                        {step.args && step.args.length > 0 && (
                                          <div className="text-xs">
                                            <span className="font-medium text-gray-600">Args:</span>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                              {step.args.map((arg: string, argIndex: number) => (
                                                <code key={argIndex} className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                  {arg}
                                                </code>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

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

                              {testData.body && (
                                <div>
                                  <h6 className="text-xs font-medium text-gray-600 mb-1">Request Body:</h6>
                                  <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto max-h-32">
                                    {typeof testData.body === "string"
                                      ? testData.body
                                      : JSON.stringify(testData.body, null, 2)}
                                  </pre>
                                </div>
                              )}

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
                                        {assertion.jsonPath && (
                                          <code className="bg-gray-100 px-1 rounded break-all">
                                            {assertion.jsonPath}
                                          </code>
                                        )}
                                        {assertion.expected !== undefined && (
                                          <span className="text-gray-600 break-all">
                                            = <strong>{JSON.stringify(assertion.expected)}</strong>
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

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
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No test data defined</p>
                      <p className="text-sm">This test case doesn't have any test data yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="json">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  JSON View
                </CardTitle>
                <CardDescription>Complete JSON structure of this test case</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[400px]">
                  <ReactJson
                    src={testCase}
                    theme="rjv-default"
                    name="testCase"
                    collapsed={1}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={true}
                    indentWidth={2}
                    collapseStringsAfterLength={50}
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "13px",
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
                    }}
                  />
                </div>
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