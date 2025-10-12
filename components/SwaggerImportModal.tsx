"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, Save, Upload, FileText, Globe, Zap, Code, CheckCircle, Folder, Plus, Link } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SwaggerParser } from '@/lib/swaggerParser'
import type { TestSuite } from '@/types/test-suite'

interface SwaggerImportModalProps {
  isOpen: boolean
  onClose: () => void
  existingSuites: TestSuite[]
  onSave: (testSuite: TestSuite) => void
  onAddToExisting: (suiteId: string, testCase: any) => void
}

export function SwaggerImportModal({ 
  isOpen, 
  onClose, 
  existingSuites, 
  onSave, 
  onAddToExisting 
}: SwaggerImportModalProps) {
  const [swaggerInput, setSwaggerInput] = useState('')
  const [swaggerUrl, setSwaggerUrl] = useState('')
  const [generatedJson, setGeneratedJson] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [activeTab, setActiveTab] = useState('input')
  const [selectedSuite, setSelectedSuite] = useState<string>('')
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  
  const { toast } = useToast()
  const parser = new SwaggerParser()

  const parseYaml = async (yamlString: string): Promise<any> => {
    try {
      // Use dynamic import for js-yaml
      const { load } = await import('js-yaml')
      return load(yamlString)
    } catch (error) {
      // Fallback: try to detect if it's actually JSON
      try {
        return JSON.parse(yamlString)
      } catch {
        throw new Error('Invalid YAML format. Please check your OpenAPI specification.')
      }
    }
  }

  const handleConvert = async () => {
    if (!swaggerInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide Swagger/OpenAPI specification",
        variant: "destructive"
      })
      return
    }

    setIsConverting(true)
    try {
      let swaggerSpec: any
      
      // Try JSON first
      try {
        swaggerSpec = JSON.parse(swaggerInput)
      } catch {
        // Try YAML parsing
        try {
          swaggerSpec = await parseYaml(swaggerInput)
        } catch {
          throw new Error('Invalid JSON or YAML format')
        }
      }
      
      // Validate OpenAPI/Swagger spec
      if (!swaggerSpec.openapi && !swaggerSpec.swagger) {
        throw new Error('Not a valid OpenAPI/Swagger specification. Missing openapi or swagger field.')
      }
      
      if (!swaggerSpec.paths) {
        throw new Error('Not a valid OpenAPI/Swagger specification. Missing paths field.')
      }
      
      const testSuite = parser.parseSwagger(swaggerSpec)
      setGeneratedJson(JSON.stringify(testSuite, null, 2))
      setActiveTab('output')
      
      toast({
        title: "Conversion Successful",
        description: "OpenAPI specification converted to TestFlow Pro format"
      })
    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error.message || "Invalid OpenAPI specification or conversion error",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleUrlImport = async () => {
    if (!swaggerUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please provide Swagger/OpenAPI URL",
        variant: "destructive"
      })
      return
    }

    setIsConverting(true)
    try {
      const response = await fetch(swaggerUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type') || ''
      let swaggerSpec: any
      
      if (contentType.includes('application/json')) {
        swaggerSpec = await response.json()
      } else {
        const text = await response.text()
        try {
          swaggerSpec = JSON.parse(text)
        } catch {
          // Try YAML parsing
          try {
            swaggerSpec = await parseYaml(text)
          } catch {
            throw new Error('Invalid JSON or YAML format from URL')
          }
        }
      }
      
      if (!swaggerSpec.swagger && !swaggerSpec.openapi) {
        throw new Error('Not a valid Swagger/OpenAPI specification. Missing swagger or openapi field.')
      }
      
      if (!swaggerSpec.paths) {
        throw new Error('Not a valid Swagger/OpenAPI specification. Missing paths field.')
      }
      
      setSwaggerInput(JSON.stringify(swaggerSpec, null, 2))
      
      const testSuite = parser.parseSwagger(swaggerSpec)
      setGeneratedJson(JSON.stringify(testSuite, null, 2))
      setActiveTab('output')
      
      toast({
        title: "Import Successful",
        description: "Swagger specification imported and converted"
      })
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to fetch or parse Swagger specification from URL",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setSwaggerInput(content)
      }
      reader.readAsText(file)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJson)
    toast({
      title: "Copied",
      description: "Test suite JSON copied to clipboard"
    })
  }

  const handleDownload = () => {
    const testSuite = JSON.parse(generatedJson)
    const blob = new Blob([generatedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${testSuite.suiteName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSave = () => {
    if (!generatedJson) return

    try {
      const testSuite = JSON.parse(generatedJson)
      
      if (importMode === 'existing' && selectedSuite) {
        testSuite.testCases.forEach((testCase: any) => {
          onAddToExisting(selectedSuite, testCase)
        })
        toast({
          title: "Test Cases Added",
          description: `Added ${testSuite.testCases.length} test cases to existing suite`
        })
      } else {
        // Update localStorage with new suite's baseUrl
        if (testSuite.baseUrl) {
          localStorage.setItem('suiteBaseUrl', testSuite.baseUrl)
        } else {
          localStorage.removeItem('suiteBaseUrl')
        }
        onSave(testSuite)
      }
      
      onClose()
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Invalid JSON format",
        variant: "destructive"
      })
    }
  }

  const handleReset = () => {
    setSwaggerInput('')
    setSwaggerUrl('')
    setGeneratedJson('')
    setActiveTab('input')
    setSelectedSuite('')
    setImportMode('new')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-green-50/30 border-0 shadow-2xl overflow-hidden" style={{zIndex: 9999}}>
        <DialogHeader className="pb-6 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Swagger/OpenAPI Importer
              </div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Convert OpenAPI specifications to TestFlow Pro test suites
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col pt-6 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm border border-slate-200 shadow-lg mb-6">
            <TabsTrigger value="input" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Input Specification</TabsTrigger>
            <TabsTrigger value="output" disabled={!generatedJson} className="data-[state=active]:bg-white data-[state=active]:shadow-md">Generated Test Suite</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="flex-1 space-y-6 overflow-y-auto pr-2 pb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-green-600" />
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Import OpenAPI Specification
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-slate-600" />
                    <Label className="text-sm font-medium text-slate-700">Import from URL</Label>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="https://petstore.swagger.io/v2/swagger.json"
                      value={swaggerUrl}
                      onChange={(e) => setSwaggerUrl(e.target.value)}
                      className="bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                    />
                    <Button 
                      onClick={handleUrlImport} 
                      disabled={isConverting}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-lg">
                    <span className="font-medium">Examples:</span> Swagger Petstore, your API docs URL
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-slate-600" />
                    <Label className="text-sm font-medium text-slate-700">Upload Specification File</Label>
                  </div>
                  <div className="border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-300">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-slate-800 mb-2">
                      Drop your OpenAPI file here
                    </p>
                    <input
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="swagger-file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('swagger-file-upload')?.click()}
                      className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-white hover:border-green-300 hover:scale-105 transition-all duration-300"
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-slate-600" />
                <Label className="text-sm font-medium text-slate-700">Paste Specification (JSON/YAML)</Label>
              </div>
              <Textarea
                placeholder="Paste your Swagger/OpenAPI specification here..."
                value={swaggerInput}
                onChange={(e) => setSwaggerInput(e.target.value)}
                className="min-h-[300px] font-mono text-sm bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300 resize-none"
              />
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Supports OpenAPI 3.0+ and Swagger 2.0 specifications</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="h-11 px-6 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
              >
                Clear All
              </Button>
              <Button 
                onClick={handleConvert} 
                disabled={isConverting}
                className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isConverting ? 'Converting...' : 'Convert to TestFlow Pro'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="output" className="flex-1 space-y-6 overflow-y-auto pr-2 pb-6">
            {generatedJson && (
              <>
                <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <Download className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-lg text-slate-800">Import Options</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      importMode === 'new' 
                        ? 'border-green-300 bg-green-50 shadow-lg' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="radio"
                        name="import-mode"
                        checked={importMode === 'new'}
                        onChange={() => setImportMode('new')}
                        className="w-5 h-5 text-green-600"
                      />
                      <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-slate-800">Create New Suite</div>
                          <div className="text-xs text-slate-600">Start fresh with a new test suite</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      importMode === 'existing' 
                        ? 'border-emerald-300 bg-emerald-50 shadow-lg' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="radio"
                        name="import-mode"
                        checked={importMode === 'existing'}
                        onChange={() => setImportMode('existing')}
                        className="w-5 h-5 text-emerald-600"
                      />
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-medium text-slate-800">Add to Existing</div>
                          <div className="text-xs text-slate-600">Extend an existing test suite</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {importMode === 'existing' && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">Select Target Suite</Label>
                      <select
                        value={selectedSuite}
                        onChange={(e) => setSelectedSuite(e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-300 transition-all duration-300"
                      >
                        <option value="">Choose an existing API test suite...</option>
                        {existingSuites.filter(s => s.type === 'API').map(suite => (
                          <option key={suite.id} value={suite.id}>
                            {suite.suiteName} ({suite.testCases.length} cases)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Code className="h-4 w-4 text-slate-600" />
                      </div>
                      <Label className="text-lg font-semibold text-slate-800">Generated Test Suite</Label>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCopy}
                        className="flex items-center gap-2 h-10 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDownload}
                        className="flex items-center gap-2 h-10 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm">
                    <div className="h-8 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 text-center text-white text-xs font-medium">TestFlow Pro JSON</div>
                    </div>
                    <Textarea
                      value={generatedJson}
                      onChange={(e) => setGeneratedJson(e.target.value)}
                      className="min-h-[400px] font-mono text-sm bg-slate-900 text-green-400 border-0 rounded-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {(() => {
                  try {
                    const suite = JSON.parse(generatedJson)
                    return (
                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-emerald-800">
                              Specification Converted Successfully!
                            </h4>
                            <p className="text-sm text-emerald-600">Ready to import into TestFlow Pro</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-white/60 rounded-xl">
                            <div className="text-2xl font-bold text-slate-800">{suite.testCases.length}</div>
                            <div className="text-xs text-slate-600">Test Cases</div>
                          </div>
                          <div className="text-center p-3 bg-white/60 rounded-xl">
                            <div className="text-2xl font-bold text-slate-800">
                              {suite.testCases.reduce((acc: number, tc: any) => acc + tc.testData.length, 0)}
                            </div>
                            <div className="text-xs text-slate-600">Test Scenarios</div>
                          </div>
                          <div className="text-center p-3 bg-white/60 rounded-xl">
                            <div className="text-2xl font-bold text-slate-800">API</div>
                            <div className="text-xs text-slate-600">Suite Type</div>
                          </div>
                        </div>
                      </div>
                    )
                  } catch {
                    return null
                  }
                })()}

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('input')}
                    className="h-11 px-6 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                  >
                    Back to Input
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={importMode === 'existing' && !selectedSuite}
                    className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {importMode === 'existing' ? 'Add to Suite' : 'Create Test Suite'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}