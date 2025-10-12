"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, FileText, Upload, Code, Database, Copy, ArrowRight, Zap } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AssertionGenerator } from "./assertion-generator"
import { VariableGenerator } from "./variable-generator"

interface TestDataEditorProps {
  testData: any
  onSave: (testData: any) => void
  onCancel: () => void
  testCaseType?: string
  baseUrl?: string
  suite?: any
}

const commonHeaders = [
  "Accept",
  "Accept-Encoding",
  "Accept-Language",
  "Authorization",
  "Cache-Control",
  "Content-Type",
  "Cookie",
  "Host",
  "Origin",
  "Referer",
  "User-Agent",
  "X-API-Key",
  "X-Auth-Token",
  "X-Requested-With",
  "X-CSRF-Token",
]

export function TestDataEditor({ testData, onSave, onCancel, testCaseType = "REST", baseUrl = "", suite }: TestDataEditorProps) {
  // Use suite baseUrl if available, otherwise use passed baseUrl
  const effectiveBaseUrl = suite?.baseUrl || baseUrl || ""
  
  // Debug logging
  console.log("TestDataEditor - suite:", suite)
  console.log("TestDataEditor - suite.baseUrl:", suite?.baseUrl)
  console.log("TestDataEditor - baseUrl prop:", baseUrl)
  console.log("TestDataEditor - effectiveBaseUrl:", effectiveBaseUrl)
  const [editedTestData, setEditedTestData] = useState(JSON.parse(JSON.stringify(testData)))
  const [rawBodyJson, setRawBodyJson] = useState("")
  const [rawSchemaJson, setRawSchemaJson] = useState("")
  const [bodyJsonError, setBodyJsonError] = useState("")
  const [schemaJsonError, setSchemaJsonError] = useState("")
  const [showAssertionGenerator, setShowAssertionGenerator] = useState(false)
  const [showVariableGenerator, setShowVariableGenerator] = useState(false)

  const [activeTab, setActiveTab] = useState("general")

  const tabSequence = ["general", "headers", "cookies", "preprocess", "body", "assertions", "store", "schema", "json"]

  const getNextTab = (currentTab: string) => {
    const currentIndex = tabSequence.indexOf(currentTab)
    return currentIndex < tabSequence.length - 1 ? tabSequence[currentIndex + 1] : null
  }

  const silentSave = () => {
    // Clean the test data for silent save (same logic as handleSave but without calling onSave)
    const cleanedTestData = {
      ...editedTestData,
      assertions: (editedTestData.assertions || []).map(cleanAssertionData),
      preProcess: (editedTestData.preProcess || []).filter((process: any) => process.function).map(cleanPreProcessData),
    }
    // Store the cleaned data but don't call onSave to avoid navigation
    setEditedTestData(cleanedTestData)
  }

  const handleNextTab = () => {
    // Auto-save silently before moving to next section (without navigation)
    if (testData && testData.name && testData.name !== "New Test Data") {
      silentSave()
    }
    
    const nextTab = getNextTab(activeTab)
    if (nextTab) {
      setActiveTab(nextTab)
    }
  }

  useEffect(() => {
    if (testData) {
      setRawBodyJson(JSON.stringify(testData.body || {}, null, 2))
      setRawSchemaJson(JSON.stringify(testData.responseSchema || {}, null, 2))
    }
  }, [testData])

  const applyJsonChanges = (field: "body" | "responseSchema", rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson)
      handleChange(field, parsed)
      if (field === "body") {
        setBodyJsonError("")
      } else {
        setSchemaJsonError("")
      }
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Invalid JSON"
      if (field === "body") {
        setBodyJsonError(errorMsg)
      } else {
        setSchemaJsonError(errorMsg)
      }
      return false
    }
  }

  const handleChange = (field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }



  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }))
  }

  const handleAddHeader = () => {
    const newHeaders = { ...editedTestData.headers }
    let newKey = ""
    let counter = 1

    // Find next available empty key
    while (newHeaders[newKey] !== undefined) {
      newKey = `header_${counter}`
      counter++
    }

    newHeaders[newKey] = ""
    setEditedTestData((prev: any) => ({
      ...prev,
      headers: newHeaders,
    }))
  }

  const handleAddCookie = () => {
    const newCookies = { ...editedTestData.cookies }
    let newKey = ""
    let counter = 1

    // Find next available empty key
    while (newCookies[newKey] !== undefined) {
      newKey = `cookie_${counter}`
      counter++
    }

    newCookies[newKey] = ""
    setEditedTestData((prev: any) => ({
      ...prev,
      cookies: newCookies,
    }))
  }

  const handleUpdateCookieKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return

    setEditedTestData((prev: any) => {
      const newCookies = { ...prev.cookies }
      const value = newCookies[oldKey]
      delete newCookies[oldKey]
      newCookies[newKey] = value
      return { ...prev, cookies: newCookies }
    })
  }

  const handleRemoveCookie = (key: string) => {
    setEditedTestData((prev: any) => {
      const newCookies = { ...prev.cookies }
      delete newCookies[key]
      return { ...prev, cookies: newCookies }
    })
  }

  const handleCloneCookie = (key: string, value: string) => {
    const newKey = `${key}_copy`
    let finalKey = newKey
    let counter = 1

    while (editedTestData.cookies && editedTestData.cookies[finalKey]) {
      finalKey = `${newKey}_${counter}`
      counter++
    }

    setEditedTestData((prev: any) => ({
      ...prev,
      cookies: {
        ...prev.cookies,
        [finalKey]: value,
      },
    }))
  }

  const handleUpdateHeaderKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return

    const newHeaders = { ...editedTestData.headers }
    const value = newHeaders[oldKey]
    delete newHeaders[oldKey]

    // Avoid duplicate keys
    let finalKey = newKey
    let counter = 1
    while (newHeaders[finalKey] !== undefined && finalKey !== newKey) {
      finalKey = `${newKey}_${counter}`
      counter++
    }

    newHeaders[finalKey] = value
    setEditedTestData((prev: any) => ({
      ...prev,
      headers: newHeaders,
    }))
  }

  const handleRemoveHeader = (key: string) => {
    setEditedTestData((prev: any) => {
      const newHeaders = { ...prev.headers }
      delete newHeaders[key]
      return { ...prev, headers: newHeaders }
    })
  }

  const handleCloneHeader = (key: string, value: string) => {
    const newKey = `${key}_copy`
    let finalKey = newKey
    let counter = 1

    while (editedTestData.headers && editedTestData.headers[finalKey]) {
      finalKey = `${newKey}_${counter}`
      counter++
    }

    setEditedTestData((prev: any) => ({
      ...prev,
      headers: {
        ...prev.headers,
        [finalKey]: value,
      },
    }))
  }

  const handleAddAssertion = () => {
    const newAssertion = {
      id: `assertion_${Date.now()}`,
      type: "equals",
      ...(testCaseType === "SOAP" ? { xpathExpression: "//*[local-name()='']" } : { jsonPath: "$." }),
      expected: "",
    }
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: [...(prev.assertions || []), newAssertion],
    }))
  }

  const handleUpdateAssertion = (index: number, field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: prev.assertions.map((assertion: any, i: number) =>
          i === index ? { ...assertion, [field]: value } : assertion,
      ),
    }))
  }

  const handleRemoveAssertion = (index: number) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: prev.assertions.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleCloneAssertion = (index: number) => {
    const assertion = editedTestData.assertions[index]
    const clonedAssertion = {
      ...assertion,
      id: `${assertion.id || "assertion"}_copy_${Date.now()}`,
    }

    const newAssertions = [...(editedTestData.assertions || [])]
    newAssertions.splice(index + 1, 0, clonedAssertion)
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: newAssertions,
    }))
  }

  const handleAddGeneratedAssertions = (assertions: any[]) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: [...(prev.assertions || []), ...assertions],
    }))
  }

  const handleAddGeneratedVariables = (variables: Record<string, string>) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      localStore: {
        ...prev.localStore,
        ...variables
      }
    }))
  }

  const handleAddPreProcess = () => {
    const newPreProcess = {
      id: `preprocess_${Date.now()}`,
      function: "",
      var: "",
      variableMode: "single", // single or multiple
      isDbQuery: false,
      db: "",
      args: [],
      mapTo: {},
    }
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: [...(prev.preProcess || []), newPreProcess],
    }))
  }

  const handleUpdatePreProcess = (index: number, field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) => {
        if (i === index) {
          const updated = { ...process, [field]: value }

          // Reset relevant fields when changing modes
          if (field === "variableMode") {
            if (value === "single") {
              updated.mapTo = {}
            } else {
              updated.var = ""
            }
          }

          // Reset DB-related fields when unchecking DB query
          if (field === "isDbQuery" && !value) {
            updated.db = ""
          }

          return updated
        }
        return process
      }),
    }))
  }

  const handleUpdatePreProcessMapTo = (index: number, key: string, value: string) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) =>
          i === index
              ? {
                ...process,
                mapTo: {
                  ...process.mapTo,
                  [key]: value,
                },
              }
              : process,
      ),
    }))
  }

  const handleRemovePreProcessMapTo = (index: number, key: string) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) => {
        if (i === index) {
          const newMapTo = { ...process.mapTo }
          delete newMapTo[key]
          return { ...process, mapTo: newMapTo }
        }
        return process
      }),
    }))
  }

  const handleAddPreProcessMapTo = (index: number) => {
    const key = prompt("Enter variable name:")
    const value = prompt("Enter property/column name:")
    if (key && value) {
      handleUpdatePreProcessMapTo(index, key, value)
    }
  }

  const handleRemovePreProcess = (index: number) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleAddStoreVariable = () => {
    const newStore = { ...editedTestData.store }
    let newKey = ""
    let counter = 1

    // Find next available empty key
    while (newStore[newKey] !== undefined) {
      newKey = `variable_${counter}`
      counter++
    }

    newStore[newKey] = ""
    setEditedTestData((prev: any) => ({
      ...prev,
      store: newStore,
    }))
  }

  const handleUpdateStoreKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return

    const newStore = { ...editedTestData.store }
    const value = newStore[oldKey]
    delete newStore[oldKey]

    // Avoid duplicate keys
    let finalKey = newKey
    let counter = 1
    while (newStore[finalKey] !== undefined && finalKey !== newKey) {
      finalKey = `${newKey}_${counter}`
      counter++
    }

    newStore[finalKey] = value
    setEditedTestData((prev: any) => ({
      ...prev,
      store: newStore,
    }))
  }

  const handleCloneStoreVariable = (key: string, value: string) => {
    const newKey = `${key}_copy`
    let finalKey = newKey
    let counter = 1

    while (editedTestData.store && editedTestData.store[finalKey]) {
      finalKey = `${newKey}_${counter}`
      counter++
    }

    setEditedTestData((prev: any) => ({
      ...prev,
      store: {
        ...prev.store,
        [finalKey]: value,
      },
    }))
  }

  const handleRemoveStoreVariable = (key: string) => {
    setEditedTestData((prev: any) => {
      const newStore = { ...prev.store }
      delete newStore[key]
      return { ...prev, store: newStore }
    })
  }

  const handleFileUpload = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real implementation, you would upload the file to your server
      // For now, we'll just store the filename
      handleChange(field, file.name)
    }
  }

  // Function to clean assertion data based on type
  const cleanAssertionData = (assertion: any) => {
    const baseAssertion: BaseAssertion= {
      id: assertion.id,
      type: assertion.type,
    }

    // Add path field based on test case type and assertion type
    if (assertion.type !== "statusCode") {
      if (testCaseType === "SOAP") {
        baseAssertion.xpathExpression = assertion.xpathExpression || "//*[local-name()='']"
      } else {
        baseAssertion.jsonPath = assertion.jsonPath || "$."
      }
    }

    // Add expected field for most assertion types
    if (assertion.type !== "exists") {
      if (assertion.type === "statusCode") {
        baseAssertion.expected = Number(assertion.expected) || 200
      } else {
        baseAssertion.expected = assertion.expected || ""
      }
    }

    // Add special fields for arrayObjectMatch
    if (assertion.type === "arrayObjectMatch") {
      baseAssertion.matchField = assertion.matchField || ""
      baseAssertion.matchValue = assertion.matchValue || ""
      baseAssertion.assertField = assertion.assertField || ""
    }

    return baseAssertion
  }

  // Function to clean pre-process data
  const cleanPreProcessData = (process: any) => {
    const cleaned: any = {
      function: process.function,
    }

    // Handle database queries
    if (process.isDbQuery) {
      cleaned.db = process.db
      // For DB queries, args should be an array with the SQL query
      cleaned.args = Array.isArray(process.args) ? process.args : [process.args || ""]
    } else {
      // For non-DB queries, handle args as before
      if (process.args && process.args.length > 0) {
        cleaned.args = Array.isArray(process.args)
            ? process.args
            : process.args
                .split(",")
                .map((arg: string) => arg.trim())
                .filter(Boolean)
      }
    }

    // Handle variable assignment
    if (process.variableMode === "single" && process.var) {
      cleaned.var = process.var
    } else if (process.variableMode === "multiple" && process.mapTo && Object.keys(process.mapTo).length > 0) {
      cleaned.mapTo = process.mapTo
    }

    return cleaned
  }

  const handleSave = () => {
    // Clean the test data before saving
    const cleanedTestData = {
      ...editedTestData,
      // Clean assertions to remove unnecessary fields
      assertions: (editedTestData.assertions || []).map(cleanAssertionData),
      // Clean preProcess to remove UI-specific fields and empty entries
      preProcess: (editedTestData.preProcess || []).filter((process: any) => process.function).map(cleanPreProcessData),
      // Include localStore if it exists and has content
      ...(editedTestData.localStore && Object.keys(editedTestData.localStore).length > 0 && {
        localStore: editedTestData.localStore
      })
    }

    onSave(cleanedTestData)
  }

  return (
    <>
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
                    Edit Test Data ({testCaseType})
                  </h1>
                  <p className="text-slate-600 mt-1">Configure and manage your test data settings</p>
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
                  Save Test Data
                </Button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {/* Modern Tab Navigation */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-2 shadow-xl border border-white/20">
              <TabsList className="grid w-full grid-cols-9 bg-transparent gap-1">
                <TabsTrigger 
                  value="general"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="headers"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  Headers
                </TabsTrigger>
                <TabsTrigger 
                  value="cookies"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  Cookies
                </TabsTrigger>
                <TabsTrigger 
                  value="preprocess"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  Pre-Process
                </TabsTrigger>
                <TabsTrigger 
                  value="body"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  {testCaseType === "SOAP" ? "XML Body" : "JSON Body"}
                </TabsTrigger>
                <TabsTrigger 
                  value="assertions"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  Assertions
                </TabsTrigger>
                <TabsTrigger 
                  value="store"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  Store
                </TabsTrigger>
                <TabsTrigger 
                  value="schema"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  Schema
                </TabsTrigger>
                <TabsTrigger 
                  value="json"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60 transition-all duration-200 rounded-lg font-medium text-xs"
                >
                  JSON
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general">
              <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                    <Code className="h-5 w-5 text-blue-600" />
                    General Information
                  </CardTitle>
                  <CardDescription className="text-slate-600">Configure the basic request information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Test Data Name
                    </Label>
                    <Input
                        id="name"
                        value={editedTestData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter test data name"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="method" className="text-sm font-medium text-gray-700">
                        HTTP Method
                      </Label>
                      <Select value={editedTestData.method} onValueChange={(value) => handleChange("method", value)}>
                        <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endpoint" className="text-sm font-medium text-gray-700">
                        Endpoint
                      </Label>
                      <Input
                          id="endpoint"
                          value={editedTestData.endpoint}
                          onChange={(e) => handleChange("endpoint", e.target.value)}
                          placeholder="/api/endpoint"
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enabled"
                        className="h-4 w-4"
                        checked={editedTestData.enabled !== false}
                        onChange={(e) => handleChange("enabled", e.target.checked)}
                      />
                      <Label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                        Enable Test Data Execution
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500">
                      When disabled, this test data will be skipped during test case execution
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: Headers
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="headers">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Headers</CardTitle>
                      <CardDescription>Configure request headers</CardDescription>
                    </div>
                    <Button
                        onClick={handleAddHeader}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Header
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(editedTestData.headers || {}).map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                        >
                          <div className="flex-1 relative">
                            <Input
                                value={key}
                                onChange={(e) => handleUpdateHeaderKey(key, e.target.value)}
                                placeholder="Header key"
                                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                list={`headers-${key}`}
                            />
                            <datalist id={`headers-${key}`}>
                              {commonHeaders.map((header) => (
                                  <option key={header} value={header} />
                              ))}
                            </datalist>
                          </div>
                          <Input
                              value={value as string}
                              onChange={(e) => handleNestedChange("headers", key, e.target.value)}
                              placeholder="Header value"
                              className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCloneHeader(key, value as string)}
                              className="h-10 px-3 border-blue-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                              title="Clone header"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveHeader(key)}
                              className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                    ))}

                    <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 relative">
                        <Input
                            placeholder="Enter header key..."
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            list="common-headers"
                            onKeyDown={(e) => {
                              if (e.key === "Tab" || e.key === "Enter") {
                                const key = e.currentTarget.value.trim()
                                if (key) {
                                  handleNestedChange("headers", key, "")
                                  e.currentTarget.value = ""
                                  // Focus next input (value field)
                                  const nextInput = e.currentTarget.parentElement?.parentElement?.querySelector(
                                      "input:nth-child(2)",
                                  ) as HTMLInputElement
                                  if (nextInput) nextInput.focus()
                                }
                              }
                            }}
                        />
                        <datalist id="common-headers">
                          {commonHeaders.map((header) => (
                              <option key={header} value={header} />
                          ))}
                        </datalist>
                      </div>
                      <Input
                          placeholder="Enter header value..."
                          className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === "Tab" || e.key === "Enter") {
                              const value = e.currentTarget.value.trim()
                              const keyInput = e.currentTarget.parentElement?.querySelector(
                                  "input:first-child",
                              ) as HTMLInputElement
                              const key = keyInput?.value.trim()

                              if (key && value) {
                                handleNestedChange("headers", key, value)
                                keyInput.value = ""
                                e.currentTarget.value = ""
                                keyInput.focus()
                              }
                            }
                          }}
                      />
                      <div className="h-10 px-3 flex items-center text-gray-400">
                        <Plus className="h-3 w-3" />
                      </div>
                      <div className="h-10 px-3 flex items-center text-gray-400">
                        <span className="text-xs">Tab/Enter to add</span>
                      </div>
                    </div>

                    {(!editedTestData.headers || Object.keys(editedTestData.headers).length === 0) && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-sm">No headers defined yet</p>
                          <p className="text-xs mt-1">Use the row above to add headers quickly</p>
                        </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: Pre-Process
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cookies">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cookies</CardTitle>
                      <CardDescription>Configure request cookies</CardDescription>
                    </div>
                    <Button
                        onClick={handleAddCookie}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cookie
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(editedTestData.cookies || {}).map(([key, value], index) => (
                        <div
                            key={`cookie-${index}-${key}`}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                        >
                          <div className="flex-1 relative">
                            <Input
                                value={key}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setEditedTestData((prev: any) => {
                                    const newCookies = { ...prev.cookies }
                                    const cookieValue = newCookies[key]
                                    delete newCookies[key]
                                    newCookies[newValue] = cookieValue
                                    return { ...prev, cookies: newCookies }
                                  })
                                }}
                                placeholder="Cookie name"
                                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <Input
                              value={value as string}
                              onChange={(e) => handleNestedChange("cookies", key, e.target.value)}
                              placeholder="Cookie value"
                              className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCloneCookie(key, value as string)}
                              className="h-10 px-3 border-blue-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                              title="Clone cookie"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveCookie(key)}
                              className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                    ))}

                    <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 relative">
                        <Input
                            placeholder="Enter cookie name..."
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                const key = e.currentTarget.value.trim()
                                if (key) {
                                  handleNestedChange("cookies", key, "")
                                  e.currentTarget.value = ""
                                  // Focus next input (value field)
                                  const nextInput = e.currentTarget.parentElement?.parentElement?.querySelector(
                                      "input:nth-child(2)",
                                  ) as HTMLInputElement
                                  if (nextInput) nextInput.focus()
                                }
                              }
                            }}
                        />
                      </div>
                      <Input
                          placeholder="Enter cookie value..."
                          className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const value = e.currentTarget.value.trim()
                              const keyInput = e.currentTarget.parentElement?.querySelector(
                                  "input:first-child",
                              ) as HTMLInputElement
                              const key = keyInput?.value.trim()

                              if (key && value) {
                                handleNestedChange("cookies", key, value)
                                keyInput.value = ""
                                e.currentTarget.value = ""
                                keyInput.focus()
                              }
                            }
                          }}
                      />
                      <div className="h-10 px-3 flex items-center text-gray-400">
                        <Plus className="h-3 w-3" />
                      </div>
                      <div className="h-10 px-3 flex items-center text-gray-400">
                        <span className="text-xs">Enter to add</span>
                      </div>
                    </div>

                    {(!editedTestData.cookies || Object.keys(editedTestData.cookies).length === 0) && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-sm">No cookies defined yet</p>
                          <p className="text-xs mt-1">Use the row above to add cookies quickly</p>
                        </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: Pre-Process
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="body">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Request Body
                  </CardTitle>
                  <CardDescription>
                    Configure the request body ({testCaseType === "SOAP" ? "XML format" : "JSON format"}) or upload from
                    file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Body File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="bodyFile" className="text-sm font-medium text-gray-700">
                      Body File
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                          id="bodyFile"
                          value={editedTestData.bodyFile || ""}
                          onChange={(e) => handleChange("bodyFile", e.target.value)}
                          placeholder={`Path to body file (e.g., ./data/request-body.${testCaseType === "SOAP" ? "xml" : "json"})`}
                          className="flex-1 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="relative">
                        <Input
                            type="file"
                            accept={testCaseType === "SOAP" ? ".xml,.txt" : ".json,.txt"}
                            onChange={(e) => handleFileUpload("bodyFile", e)}
                            className="hidden"
                            id="body-file-upload"
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById("body-file-upload")?.click()}
                            className="h-11 px-4 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Browse
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Specify a file path for the request body. This will override the inline body content.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">
                        Inline Body ({testCaseType === "SOAP" ? "XML" : "JSON"})
                      </Label>
                      {testCaseType !== "SOAP" && (
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                try {
                                  const formatted = JSON.stringify(
                                      JSON.parse(JSON.stringify(editedTestData.body || {}, null, 2)),
                                      null,
                                      2,
                                  )
                                  handleChange("body", JSON.parse(formatted))
                                } catch (error) {
                                  // Invalid JSON, ignore
                                }
                              }}
                              className="text-xs px-2 py-1 h-7"
                          >
                            Format JSON
                          </Button>
                      )}
                    </div>
                    {testCaseType === "SOAP" ? (
                        <div className="relative">
                          <Textarea
                              value={editedTestData.body || ""}
                              onChange={(e) => handleChange("body", e.target.value)}
                              className="font-mono text-sm min-h-[300px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 whitespace-pre-wrap resize-y"
                              placeholder={`Enter XML body
Example:
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <NumberToWords xmlns="http://www.dataaccess.com/webservicesserver/">
      <ubiNum>100</ubiNum>
    </NumberToWords>
  </soap:Body>
</soap:Envelope>`}
                          />
                        </div>
                    ) : (
                        <div className="space-y-2">
                          <div className="relative">
                            <Textarea
                                value={rawBodyJson}
                                onChange={(e) => {
                                  setRawBodyJson(e.target.value)
                                  setBodyJsonError("") // Clear error while typing
                                }}
                                onBlur={() => applyJsonChanges("body", rawBodyJson)}
                                className={`font-mono text-sm min-h-[300px] resize-y ${
                                    bodyJsonError
                                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                }`}
                                placeholder={`{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`}
                                style={{
                                  background: "linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%)",
                                }}
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-2">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => applyJsonChanges("body", rawBodyJson)}
                                  className="text-xs px-2 py-1 h-7"
                              >
                                Apply JSON
                              </Button>
                              <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded border">JSON Editor</div>
                            </div>
                          </div>
                          {bodyJsonError && (
                              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                <strong>JSON Error:</strong> {bodyJsonError}
                              </div>
                          )}
                        </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Enter the request body in {testCaseType === "SOAP" ? "XML" : "JSON"} format. This will be ignored if
                      a body file is specified.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: Assertions
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assertions">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Assertions</CardTitle>
                      <CardDescription>Define response validation rules</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                          onClick={() => setShowAssertionGenerator(true)}
                          variant="outline"
                          className="border-purple-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Auto-Generate
                      </Button>
                      <Button
                          onClick={handleAddAssertion}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assertion
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(editedTestData.assertions || []).map((assertion: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50/50">
                          <div className="grid grid-cols-3 gap-3">
                            <Select
                                value={assertion.type}
                                onValueChange={(value) => handleUpdateAssertion(index, "type", value)}
                            >
                              <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="notEquals">Not Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="startsWith">Starts With</SelectItem>
                                <SelectItem value="endsWith">Ends With</SelectItem>
                                <SelectItem value="greaterThan">Greater Than</SelectItem>
                                <SelectItem value="lessThan">Less Than</SelectItem>
                                <SelectItem value="in">In Array</SelectItem>
                                <SelectItem value="notIn">Not In Array</SelectItem>
                                <SelectItem value="includesAll">Includes All</SelectItem>
                                <SelectItem value="length">Length</SelectItem>
                                <SelectItem value="size">Size</SelectItem>
                                <SelectItem value="statusCode">Status Code</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                                <SelectItem value="exists">Exists</SelectItem>
                                <SelectItem value="regex">Regex</SelectItem>
                                <SelectItem value="arrayObjectMatch">Array Object Match</SelectItem>
                              </SelectContent>
                            </Select>

                            {assertion.type !== "statusCode" && (
                                <Input
                                    placeholder={testCaseType === "SOAP" ? "XPath Expression" : "JSON Path"}
                                    value={assertion.xpathExpression || assertion.jsonPath || ""}
                                    onChange={(e) =>
                                        handleUpdateAssertion(
                                            index,
                                            testCaseType === "SOAP" ? "xpathExpression" : "jsonPath",
                                            e.target.value,
                                        )
                                    }
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            )}

                            {assertion.type === "statusCode" ? (
                                <Input
                                    type="number"
                                    placeholder="Status Code (e.g., 200)"
                                    value={assertion.expected || ""}
                                    onChange={(e) =>
                                        handleUpdateAssertion(index, "expected", Number.parseInt(e.target.value) || "")
                                    }
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            ) : assertion.type !== "exists" ? (
                                <Input
                                    placeholder="Expected Value"
                                    value={assertion.expected || ""}
                                    onChange={(e) => handleUpdateAssertion(index, "expected", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            ) : (
                                <div></div>
                            )}
                          </div>

                          {assertion.type === "arrayObjectMatch" && (
                              <div className="grid grid-cols-3 gap-3 mt-3">
                                <Input
                                    placeholder="Match Field"
                                    value={assertion.matchField || ""}
                                    onChange={(e) => handleUpdateAssertion(index, "matchField", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                                <Input
                                    placeholder="Match Value"
                                    value={assertion.matchValue || ""}
                                    onChange={(e) => handleUpdateAssertion(index, "matchValue", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                                <Input
                                    placeholder="Assert Field"
                                    value={assertion.assertField || ""}
                                    onChange={(e) => handleUpdateAssertion(index, "assertField", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCloneAssertion(index)}
                                className="border-blue-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                                title="Clone assertion"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Clone
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveAssertion(index)}
                                className="border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                    ))}
                    {(!editedTestData.assertions || editedTestData.assertions.length === 0) && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-sm">No assertions defined yet</p>
                          <p className="text-xs mt-1">Add assertions to validate your API responses</p>
                        </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: Pre-Process
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preprocess">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pre-Process</CardTitle>
                      <CardDescription>Define variables and functions to execute before the request</CardDescription>
                    </div>
                    <Button
                        onClick={handleAddPreProcess}
                        className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pre-Process
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(editedTestData.preProcess || []).map((process: any, index: number) => (
                        <div key={index} className="p-6 border border-gray-200 rounded-lg space-y-4 bg-gray-50/50">
                          {/* Function Name */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Function Name</Label>
                            <Input
                                placeholder="e.g., faker.email, generateUser, encrypt"
                                value={process.function || ""}
                                onChange={(e) => handleUpdatePreProcess(index, "function", e.target.value)}
                                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Database Query Checkbox */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`db-query-${index}`}
                                checked={process.isDbQuery || false}
                                onCheckedChange={(checked) => handleUpdatePreProcess(index, "isDbQuery", checked)}
                            />
                            <Label
                                htmlFor={`db-query-${index}`}
                                className="text-sm font-medium text-gray-700 flex items-center gap-2"
                            >
                              <Database className="h-4 w-4 text-blue-600" />
                              Database Query
                            </Label>
                          </div>

                          {/* Database Configuration (only show if DB query is checked) */}
                          {process.isDbQuery && (
                              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-blue-800">Database Name</Label>
                                  <Input
                                      placeholder="e.g., userDb, mainDb"
                                      value={process.db || ""}
                                      onChange={(e) => handleUpdatePreProcess(index, "db", e.target.value)}
                                      className="h-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-blue-800">SQL Query</Label>
                                  <Textarea
                                      placeholder="SELECT id, email FROM users WHERE id = 1"
                                      value={Array.isArray(process.args) ? process.args[0] || "" : process.args || ""}
                                      onChange={(e) => handleUpdatePreProcess(index, "args", [e.target.value])}
                                      className="font-mono text-sm min-h-[100px] border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-blue-600">
                                    Write your SQL query here. The result will be mapped to variables based on your selection
                                    below.
                                  </p>
                                </div>
                              </div>
                          )}

                          {/* Arguments (only show if NOT a DB query) */}
                          {!process.isDbQuery && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Arguments (comma separated)</Label>
                                <Input
                                    placeholder="arg1, arg2, arg3"
                                    value={Array.isArray(process.args) ? process.args.join(", ") : process.args || ""}
                                    onChange={(e) =>
                                        handleUpdatePreProcess(
                                            index,
                                            "args",
                                            e.target.value
                                                .split(",")
                                                .map((arg) => arg.trim())
                                                .filter(Boolean),
                                        )
                                    }
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                          )}

                          {/* Variable Mode Selection */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Variable Assignment</Label>
                            <RadioGroup
                                value={process.variableMode || "single"}
                                onValueChange={(value) => handleUpdatePreProcess(index, "variableMode", value)}
                                className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single" id={`single-${index}`} />
                                <Label htmlFor={`single-${index}`} className="text-sm">
                                  Single Variable
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="multiple" id={`multiple-${index}`} />
                                <Label htmlFor={`multiple-${index}`} className="text-sm">
                                  Multiple Variables (mapTo)
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Single Variable Input */}
                          {process.variableMode === "single" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Variable Name</Label>
                                <Input
                                    placeholder="variableName"
                                    value={process.var || ""}
                                    onChange={(e) => handleUpdatePreProcess(index, "var", e.target.value)}
                                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                          )}

                          {/* Multiple Variables (mapTo) */}
                          {process.variableMode === "multiple" && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Variable Mapping {process.isDbQuery ? "(Column → Variable)" : "(Property → Variable)"}
                                  </Label>
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAddPreProcessMapTo(index)}
                                      className="h-8 px-3 border-green-300 hover:border-green-400 hover:bg-green-50"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Mapping
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {Object.entries(process.mapTo || {}).map(([varName, propName]) => (
                                      <div
                                          key={varName}
                                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                                      >
                                        <Input
                                            value={varName}
                                            readOnly
                                            className="flex-1 h-9 bg-gray-100 text-sm"
                                            placeholder="Variable Name"
                                        />
                                        <span className="text-gray-400">←</span>
                                        <Input
                                            value={propName as string}
                                            onChange={(e) => handleUpdatePreProcessMapTo(index, varName, e.target.value)}
                                            className="flex-1 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                            placeholder={process.isDbQuery ? "Column Name" : "Property Name"}
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRemovePreProcessMapTo(index, varName)}
                                            className="h-9 px-2 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                  ))}

                                  {(!process.mapTo || Object.keys(process.mapTo).length === 0) && (
                                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <p className="text-sm">No variable mappings defined</p>
                                        <p className="text-xs mt-1">
                                          Add mappings to store {process.isDbQuery ? "database columns" : "response properties"}{" "}
                                          in variables
                                        </p>
                                      </div>
                                  )}
                                </div>
                              </div>
                          )}

                          {/* Remove Button */}
                          <div className="flex justify-end pt-2 border-t border-gray-200">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemovePreProcess(index)}
                                className="border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove Pre-Process
                            </Button>
                          </div>
                        </div>
                    ))}

                    {(!editedTestData.preProcess || editedTestData.preProcess.length === 0) && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-sm">No pre-process steps defined yet</p>
                          <p className="text-xs mt-1">Add pre-process steps to prepare data before requests</p>
                        </div>
                    )}
                  </div>

                  {/* Examples Section */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-3 text-blue-800">Examples:</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-blue-700">Single Variable:</p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block mt-1">
                          {`{ "function": "faker.email", "var": "userEmail" }`}
                        </code>
                      </div>
                      <div>
                        <p className="font-medium text-blue-700">Multiple Variables:</p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block mt-1">
                          {`{ "function": "generateUser", "mapTo": { "userName": "username", "userEmail": "email" } }`}
                        </code>
                      </div>
                      <div>
                        <p className="font-medium text-blue-700">Database Query:</p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block mt-1">
                          {`{ "function": "dbQuery", "db": "userDb", "args": ["SELECT id, email FROM users WHERE id = 1"], "mapTo": { "userId": "id", "userEmail": "email" } }`}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: {testCaseType === "SOAP" ? "XML Body" : "JSON Body"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="store">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Store Variables</CardTitle>
                      <CardDescription>Store response values for later use in subsequent requests</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                          onClick={() => setShowVariableGenerator(true)}
                          variant="outline"
                          className="border-purple-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Auto-Generate
                      </Button>
                      <Button
                          onClick={handleAddStoreVariable}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variable
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Local Variables Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Local Variables</h3>
                        <p className="text-sm text-gray-600">Only available within this test case (shared among testData)</p>
                      </div>
                      <Button
                          onClick={() => {
                            const newLocalStore = { ...editedTestData.localStore }
                            let newKey = ""
                            let counter = 1
                            while (newLocalStore[newKey] !== undefined) {
                              newKey = `local_variable_${counter}`
                              counter++
                            }
                            newLocalStore[newKey] = ""
                            setEditedTestData((prev: any) => ({ ...prev, localStore: newLocalStore }))
                          }}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Local Variable
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(editedTestData.localStore || {}).map(([key, value], index) => (
                          <div
                              key={`local-var-${index}`}
                              className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50/50"
                          >
                            <div className="flex-1 relative">
                              <Label className="text-xs font-medium text-blue-700 mb-1 block">Local Variable Name</Label>
                              <Input
                                  value={key}
                                  onChange={(e) => {
                                    const newKey = e.target.value
                                    const newLocalStore = { ...editedTestData.localStore }
                                    const currentValue = newLocalStore[key]
                                    delete newLocalStore[key]
                                    newLocalStore[newKey] = currentValue
                                    setEditedTestData((prev: any) => ({ ...prev, localStore: newLocalStore }))
                                  }}
                                  placeholder="localVariableName"
                                  className="h-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1 relative">
                              <Label className="text-xs font-medium text-blue-700 mb-1 block">
                                {testCaseType === "SOAP" ? "XPath Expression" : "JSON Path"}
                              </Label>
                              <Input
                                  value={value as string}
                                  onChange={(e) => {
                                    const newLocalStore = { ...editedTestData.localStore }
                                    newLocalStore[key] = e.target.value
                                    setEditedTestData((prev: any) => ({ ...prev, localStore: newLocalStore }))
                                  }}
                                  className="h-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder={testCaseType === "SOAP" ? "//*[local-name()='id']" : "$.id"}
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newKey = `${key}_copy`
                                    let finalKey = newKey
                                    let counter = 1
                                    while (editedTestData.localStore && editedTestData.localStore[finalKey]) {
                                      finalKey = `${newKey}_${counter}`
                                      counter++
                                    }
                                    const newLocalStore = { ...editedTestData.localStore }
                                    newLocalStore[finalKey] = value as string
                                    setEditedTestData((prev: any) => ({ ...prev, localStore: newLocalStore }))
                                  }}
                                  className="h-10 px-3 border-blue-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                                  title="Clone local variable"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newLocalStore = { ...editedTestData.localStore }
                                    delete newLocalStore[key]
                                    setEditedTestData((prev: any) => ({ ...prev, localStore: newLocalStore }))
                                  }}
                                  className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                      ))}

                      {(!editedTestData.localStore || Object.keys(editedTestData.localStore).length === 0) && (
                          <div className="text-center py-6 text-gray-500 bg-blue-50/50 rounded-lg border-2 border-dashed border-blue-200">
                            <p className="text-sm">No local variables defined yet</p>
                            <p className="text-xs mt-1">Local variables are only available within this test case</p>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Global Variables Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Global Variables</h3>
                        <p className="text-sm text-gray-600">Available across all test cases in the suite</p>
                      </div>

                    </div>
                    <div className="space-y-3">
                      {Object.entries(editedTestData.store || {}).map(([key, value]) => (
                          <div
                              key={key}
                              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                          >
                            <div className="flex-1 relative">
                              <Label className="text-xs font-medium text-gray-600 mb-1 block">Variable Name</Label>
                              <Input
                                  value={key}
                                  onChange={(e) => handleUpdateStoreKey(key, e.target.value)}
                                  placeholder="variableName"
                                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1 relative">
                              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                                {testCaseType === "SOAP" ? "XPath Expression" : "JSON Path"}
                              </Label>
                              <Input
                                  value={value as string}
                                  onChange={(e) => handleNestedChange("store", key, e.target.value)}
                                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder={testCaseType === "SOAP" ? "//*[local-name()='id']" : "$.id"}
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCloneStoreVariable(key, value as string)}
                                  className="h-10 px-3 border-blue-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                                  title="Clone variable"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveStoreVariable(key)}
                                  className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                      ))}

                    {/* Quick Add Row */}
                    <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 relative">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Variable Name</Label>
                        <Input
                            placeholder="Enter variable name..."
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === "Tab" || e.key === "Enter") {
                                const key = e.currentTarget.value.trim()
                                if (key) {
                                  handleNestedChange("store", key, "")
                                  e.currentTarget.value = ""
                                  // Focus next input (path field)
                                  const nextInput = e.currentTarget.parentElement?.parentElement?.querySelector(
                                      "div:nth-child(2) input",
                                  ) as HTMLInputElement
                                  if (nextInput) nextInput.focus()
                                }
                              }
                            }}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">
                          {testCaseType === "SOAP" ? "XPath Expression" : "JSON Path"}
                        </Label>
                        <Input
                            placeholder={testCaseType === "SOAP" ? "Enter XPath expression..." : "Enter JSON path..."}
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === "Tab" || e.key === "Enter") {
                                const value = e.currentTarget.value.trim()
                                const keyInput = e.currentTarget.parentElement?.parentElement?.querySelector(
                                    "div:first-child input",
                                ) as HTMLInputElement
                                const key = keyInput?.value.trim()

                                if (key && value) {
                                  handleNestedChange("store", key, value)
                                  keyInput.value = ""
                                  e.currentTarget.value = ""
                                  keyInput.focus()
                                }
                              }
                            }}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="h-10 px-3 flex items-center text-gray-400">
                          <Plus className="h-3 w-3" />
                        </div>
                        <div className="h-10 px-3 flex items-center text-gray-400">
                          <span className="text-xs">Tab/Enter to add</span>
                        </div>
                      </div>
                    </div>

                      {(!editedTestData.store || Object.keys(editedTestData.store).length === 0) && (
                          <div className="text-center py-6 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-sm">No global variables defined yet</p>
                            <p className="text-xs mt-1">Global variables are available across all test cases</p>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Examples Section */}
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-3 text-gray-800">Variable Storage Examples:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-medium text-orange-700">Response Body:</p>
                        <code className="text-xs bg-orange-100 px-2 py-1 rounded block">
                          {testCaseType === "SOAP" ? "userId: //*[local-name()='UserId']/text()" : "userId: $.id"}
                        </code>
                        <code className="text-xs bg-orange-100 px-2 py-1 rounded block">
                          {testCaseType === "SOAP" ? "email: //*[local-name()='Email']/text()" : "email: $.user.email"}
                        </code>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-green-700">Response Cookies:</p>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded block">
                          sessionId: $cookies.JSESSIONID
                        </code>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded block">
                          allCookies: $cookies
                        </code>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-blue-700">Variable Scope:</p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block">
                          Global: Available across all test cases
                        </code>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block">
                          Local: Only within current test case
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: Schema
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schema">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-green-600" />
                    Response Schema Validation
                  </CardTitle>
                  <CardDescription>Define response schema validation using JSON Schema or file reference</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Response Schema File */}
                  <div className="space-y-2">
                    <Label htmlFor="responseSchemaFile" className="text-sm font-medium text-gray-700">
                      Response Schema File
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                          id="responseSchemaFile"
                          value={editedTestData.responseSchemaFile || ""}
                          onChange={(e) => handleChange("responseSchemaFile", e.target.value)}
                          placeholder="Path to schema file (e.g., ./schemas/user-response.json)"
                          className="flex-1 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="relative">
                        <Input
                            type="file"
                            accept=".json"
                            onChange={(e) => handleFileUpload("responseSchemaFile", e)}
                            className="hidden"
                            id="schema-file-upload"
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById("schema-file-upload")?.click()}
                            className="h-11 px-4 border-gray-300 hover:border-green-400 hover:bg-green-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Browse
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Specify a file path for the JSON Schema. This will override the inline schema content.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Inline Response Schema (JSON Schema)</Label>
                      <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                const formatted = JSON.stringify(
                                    JSON.parse(JSON.stringify(editedTestData.responseSchema || {}, null, 2)),
                                    null,
                                    2,
                                )
                                handleChange("responseSchema", JSON.parse(formatted))
                              } catch (error) {
                                // Invalid JSON, ignore
                              }
                            }}
                            className="text-xs px-2 py-1 h-7"
                        >
                          Format JSON
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const sampleSchema = {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  email: { type: "string", format: "email" },
                                  age: { type: "number", minimum: 0 },
                                },
                                required: ["id", "name", "email"],
                              }
                              handleChange("responseSchema", sampleSchema)
                            }}
                            className="text-xs px-2 py-1 h-7"
                        >
                          Sample Schema
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <Textarea
                            value={rawSchemaJson}
                            onChange={(e) => {
                              setRawSchemaJson(e.target.value)
                              setSchemaJsonError("") // Clear error while typing
                            }}
                            onBlur={() => applyJsonChanges("responseSchema", rawSchemaJson)}
                            className={`font-mono text-sm min-h-[400px] resize-y ${
                                schemaJsonError
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                            placeholder={`{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["id", "name"]
}`}
                            style={{
                              background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                              lineHeight: "1.6",
                            }}
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyJsonChanges("responseSchema", rawSchemaJson)}
                              className="text-xs px-2 py-1 h-7"
                          >
                            Apply Schema
                          </Button>
                          <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded border shadow-sm">
                            Schema Editor
                          </div>
                        </div>
                      </div>
                      {schemaJsonError && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            <strong>Schema Error:</strong> {schemaJsonError}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Schema Info */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-800">JSON Schema Validation</h4>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• Use JSON Schema Draft 7 format for response validation</li>
                      <li>• Schema validation runs after assertions but before storing variables</li>
                      <li>• File-based schemas take precedence over inline schemas</li>
                      <li>• Validation failures will mark the test as failed</li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Button
                          onClick={handleNextTab}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Next: JSON
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>JSON View</CardTitle>
                      <CardDescription>View and edit the raw JSON structure with syntax highlighting</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              const formatted = JSON.stringify(JSON.parse(JSON.stringify(editedTestData, null, 2)), null, 2)
                              setEditedTestData(JSON.parse(formatted))
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="text-xs px-3 py-1 h-8"
                      >
                        Format JSON
                      </Button>
                      <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(editedTestData, null, 2))
                          }}
                          className="text-xs px-3 py-1 h-8"
                      >
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Textarea
                        value={JSON.stringify(editedTestData, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value)
                            setEditedTestData(parsed)
                          } catch (error) {
                            // Invalid JSON, don't update but allow typing
                          }
                        }}
                        className="font-mono text-sm min-h-[500px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-y"
                        style={{
                          background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                          lineHeight: "1.6",
                        }}
                    />
                    <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded border shadow-sm">
                      Raw JSON Editor
                    </div>
                    {/* JSON syntax highlighting overlay effect */}
                    <div className="absolute inset-0 pointer-events-none rounded border-2 border-transparent bg-gradient-to-r from-blue-500/5 via-transparent to-green-500/5"></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <AssertionGenerator
        isOpen={showAssertionGenerator}
        onClose={() => setShowAssertionGenerator(false)}
        onAddAssertions={handleAddGeneratedAssertions}
        testCaseType={testCaseType}
        baseUrl={effectiveBaseUrl}
        initialData={{
          method: editedTestData.method,
          endpoint: editedTestData.endpoint,
          headers: editedTestData.headers,
          body: editedTestData.body
        }}
      />
      
      <VariableGenerator
        isOpen={showVariableGenerator}
        onClose={() => setShowVariableGenerator(false)}
        onAddVariables={handleAddGeneratedVariables}
        testCaseType={testCaseType}
        baseUrl={effectiveBaseUrl}
        initialData={{
          method: editedTestData.method,
          endpoint: editedTestData.endpoint,
          headers: editedTestData.headers,
          body: editedTestData.body
        }}
      />
    </>
  )
}

interface BaseAssertion {
  id: string;
  type: AssertionType;
  xpathExpression?: string;
  jsonPath?: string;
  expected?: number | string;
  path?: string;
  value?: string;
  matchField?: string;
  matchValue?: string;
  matchOperator?: string;
  assertField?: string;
}

type AssertionType =
    | "equals"
    | "contains"
    | "regex"
    | "statusCode"
    | "arrayObjectMatch"
    | "exists";
