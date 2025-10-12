"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface VariableGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onAddVariables: (variables: Record<string, string>) => void
  testCaseType?: string
  baseUrl?: string
  initialData?: {
    method?: string
    endpoint?: string
    headers?: Record<string, string>
    body?: any
  }
}

export function VariableGenerator({ 
  isOpen, 
  onClose, 
  onAddVariables, 
  testCaseType = "REST",
  baseUrl = "",
  initialData 
}: VariableGeneratorProps) {
  const [method, setMethod] = useState(initialData?.method || "GET")
  const [currentBaseUrl, setCurrentBaseUrl] = useState(baseUrl || "")
  const [endpoint, setEndpoint] = useState(initialData?.endpoint || "")
  const [headers, setHeaders] = useState(initialData?.headers || {})
  const [body, setBody] = useState(JSON.stringify(initialData?.body || {}, null, 2))
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [pathFilter, setPathFilter] = useState("")
  const [pathVariables, setPathVariables] = useState<Record<string, string>>({})

  // Update baseUrl when prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Try to get base URL from local storage first, then fall back to prop
      const storedBaseUrl = localStorage.getItem('suiteBaseUrl')
      const effectiveBaseUrl = storedBaseUrl || baseUrl || ""
      console.log("VariableGenerator - stored baseUrl:", storedBaseUrl)
      console.log("VariableGenerator - prop baseUrl:", baseUrl)
      console.log("VariableGenerator - using baseUrl:", effectiveBaseUrl)
      setCurrentBaseUrl(effectiveBaseUrl)
    }
  }, [baseUrl, isOpen])

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
    } catch (error) {
      console.error("API test failed:", error)
      setResponse({ error: "Failed to test API" })
    } finally {
      setIsLoading(false)
    }
  }

  const extractJsonPaths = (obj: any, prefix = "$"): string[] => {
    const paths: string[] = []
    
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj)) {
        paths.push(prefix)
        if (obj.length > 0) {
          const itemPaths = extractJsonPaths(obj[0], `${prefix}[0]`)
          paths.push(...itemPaths)
        }
      } else {
        Object.keys(obj).forEach(key => {
          const newPath = `${prefix}.${key}`
          paths.push(newPath)
          const nestedPaths = extractJsonPaths(obj[key], newPath)
          paths.push(...nestedPaths)
        })
      }
    } else {
      paths.push(prefix)
    }
    
    return [...new Set(paths)]
  }

  const generateVariables = () => {
    const variables: Record<string, string> = {}
    
    selectedPaths.forEach(path => {
      const varName = pathVariables[path]
      if (varName && varName.trim()) {
        variables[varName.trim()] = path
      }
    })

    onAddVariables(variables)
    onClose()
  }

  const getValueByPath = (obj: any, path: string): any => {
    try {
      const keys = path.replace("$.", "").split(".")
      let current = obj
      for (const key of keys) {
        if (key.includes("[") && key.includes("]")) {
          const [arrayKey, indexStr] = key.split("[")
          const index = parseInt(indexStr.replace("]", ""))
          current = current[arrayKey]?.[index]
        } else {
          current = current?.[key]
        }
      }
      return current
    } catch {
      return undefined
    }
  }

  const togglePath = (path: string) => {
    const newSelected = new Set(selectedPaths)
    if (newSelected.has(path)) {
      newSelected.delete(path)
      const newVariables = { ...pathVariables }
      delete newVariables[path]
      setPathVariables(newVariables)
    } else {
      newSelected.add(path)
      // Auto-suggest variable name based on path
      const suggestedName = suggestVariableName(path)
      setPathVariables(prev => ({
        ...prev,
        [path]: suggestedName
      }))
    }
    setSelectedPaths(newSelected)
  }

  const suggestVariableName = (path: string): string => {
    // Extract meaningful variable name from JSONPath
    const parts = path.split(".")
    const lastPart = parts[parts.length - 1]
    
    if (lastPart.includes("[")) {
      const arrayPart = lastPart.split("[")[0]
      return arrayPart || "value"
    }
    
    return lastPart || "value"
  }

  const updateVariableName = (path: string, varName: string) => {
    setPathVariables(prev => ({
      ...prev,
      [path]: varName
    }))
  }

  const jsonPaths = response?.data ? extractJsonPaths(response.data) : []
  const filteredPaths = jsonPaths.filter(path => 
    path.toLowerCase().includes(pathFilter.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-xl">
        <DialogHeader className="bg-gradient-to-r from-slate-50 to-blue-50 -m-6 mb-6 p-6 border-b border-slate-200/50">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Auto-Generate Store Variables
          </DialogTitle>
          <p className="text-slate-600 mt-1">Test your API and automatically generate response variables for storage</p>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Base URL</Label>
              <Input 
                value={currentBaseUrl} 
                onChange={(e) => setCurrentBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-slate-700">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
              <div>
                <Label className="text-sm font-medium text-slate-700">Endpoint</Label>
                <Input 
                  value={endpoint} 
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/endpoint"
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            {method !== "GET" && (
              <div>
                <Label className="text-sm font-medium text-slate-700">Request Body (JSON)</Label>
                <Textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="{}"
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl font-mono text-sm"
                />
              </div>
            )}

            <Button 
              onClick={handleTestApi} 
              disabled={isLoading || !endpoint}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-11"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Test API
            </Button>
          </div>

          <div className="space-y-4">
            {response && (
              <>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Response Status: {response.status}</Label>
                  <Textarea 
                    value={JSON.stringify(response.data, null, 2)}
                    readOnly
                    rows={8}
                    className="font-mono text-sm border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>

                {jsonPaths.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Select Paths to Store as Variables</Label>
                    <Input 
                      placeholder="Filter paths (e.g., id, user, email)..."
                      value={pathFilter}
                      onChange={(e) => setPathFilter(e.target.value)}
                      className="mb-2 text-sm h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      {filteredPaths.map((path, index) => {
                        const value = getValueByPath(response.data, path)
                        const isSelected = selectedPaths.has(path)
                        const varName = pathVariables[path]
                        
                        return (
                          <div key={`${path}-${index}`} className="border border-slate-200 rounded-lg p-3 bg-white/80 backdrop-blur-sm shadow-sm">
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => togglePath(path)}
                              />
                              <span className="text-sm font-mono flex-1">{path}</span>
                              <span className="text-xs text-gray-500">
                                {JSON.stringify(value)}
                              </span>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-6">
                                <Input 
                                  placeholder="Variable name"
                                  value={varName || ""}
                                  onChange={(e) => updateVariableName(path, e.target.value)}
                                  className="h-8 text-xs border-slate-300 rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {filteredPaths.length === 0 && pathFilter && (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          No paths match "{pathFilter}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200/50">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white/60 hover:bg-white/80 border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
          >
            Cancel
          </Button>
          <Button 
            onClick={generateVariables} 
            disabled={!response || selectedPaths.size === 0}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {selectedPaths.size} Variable{selectedPaths.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}