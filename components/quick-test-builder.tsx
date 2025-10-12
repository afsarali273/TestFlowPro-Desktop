"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Play, Save, Loader2, Zap } from "lucide-react"

interface QuickTestBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSave: (testCase: any) => void
  baseUrl?: string
}

export function QuickTestBuilder({ isOpen, onClose, onSave, baseUrl = "" }: QuickTestBuilderProps) {
  const [testName, setTestName] = useState("")
  const [method, setMethod] = useState("GET")
  const [endpoint, setEndpoint] = useState("")
  const [currentBaseUrl, setCurrentBaseUrl] = useState("")
  const [headers, setHeaders] = useState<Record<string, string>>({
    "Content-Type": "application/json"
  })
  const [body, setBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("request")

  useEffect(() => {
    if (isOpen) {
      // Always read fresh from localStorage when modal opens
      const storedBaseUrl = localStorage.getItem('suiteBaseUrl')
      setCurrentBaseUrl(storedBaseUrl || baseUrl || "")
      
      // Reset form when modal opens
      setTestName("")
      setMethod("GET")
      setEndpoint("")
      setHeaders({ "Content-Type": "application/json" })
      setBody("")
      setResponse(null)
      setActiveTab("request")
    }
  }, [isOpen])

  const handleAddHeader = () => {
    const newHeaders = { ...headers }
    let newKey = ""
    let counter = 1
    while (newHeaders[newKey] !== undefined) {
      newKey = `header_${counter}`
      counter++
    }
    newHeaders[newKey] = ""
    setHeaders(newHeaders)
  }

  const handleUpdateHeader = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...headers }
    if (oldKey !== newKey) {
      delete newHeaders[oldKey]
    }
    newHeaders[newKey] = value
    setHeaders(newHeaders)
  }

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...headers }
    delete newHeaders[key]
    setHeaders(newHeaders)
  }

  const handleTestApi = async () => {
    setIsLoading(true)
    try {
      const testBody = method !== "GET" ? JSON.parse(body || "{}") : undefined
      
      const res = await fetch("/api/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          endpoint: currentBaseUrl + endpoint,
          headers,
          body: testBody
        })
      })

      const result = await res.json()
      setResponse(result)
      setActiveTab("response")
    } catch (error) {
      console.error("API test failed:", error)
      setResponse({ error: "Failed to test API" })
      setActiveTab("response")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!testName.trim()) {
      alert("Please enter a test name")
      return
    }

    if (!endpoint.trim()) {
      alert("Please enter an endpoint")
      return
    }

    // Create test case in TestFlow Pro format
    const testCase = {
      name: testName,
      type: "REST",
      status: "Not Started",
      testData: [{
        name: testName,
        method,
        endpoint,
        headers,
        ...(method !== "GET" && body ? { body: JSON.parse(body) } : {}),
        assertions: [],
        store: {}
      }]
    }

    onSave(testCase)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Test Builder
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Input
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Enter test name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    value={currentBaseUrl}
                    onChange={(e) => setCurrentBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/endpoint"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Headers</CardTitle>
                  <Button size="sm" onClick={handleAddHeader}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Header
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Input
                      value={key}
                      onChange={(e) => handleUpdateHeader(key, e.target.value, value)}
                      placeholder="Header key"
                      className="flex-1"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleUpdateHeader(key, key, e.target.value)}
                      placeholder="Header value"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveHeader(key)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {method !== "GET" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Body</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono min-h-[200px]"
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                onClick={handleTestApi}
                disabled={isLoading || !endpoint}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Test API
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Test Case
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            {response ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Response {response.status && `(${response.status})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {response.error ? (
                    <div className="text-red-600 p-4 bg-red-50 rounded">
                      Error: {response.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Status Code</Label>
                        <div className={`inline-block px-2 py-1 rounded text-sm font-mono ${
                          response.status >= 200 && response.status < 300 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {response.status}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Response Body</Label>
                        <Textarea
                          value={JSON.stringify(response.data, null, 2)}
                          readOnly
                          className="font-mono min-h-[300px] bg-gray-50"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No response yet. Test your API to see results here.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                onClick={() => setActiveTab("request")}
                variant="outline"
              >
                Back to Request
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Test Case
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}