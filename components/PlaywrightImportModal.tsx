"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { PlaywrightParser } from '@/lib/ai/playwright-parser'
import { MousePointer, Code, FileText, Upload, AlertCircle, CheckCircle, Copy, Save, Plus, Download, ExternalLink } from 'lucide-react'
import type { TestSuite } from '@/types/test-suite'

interface PlaywrightImportModalProps {
  isOpen: boolean
  onClose: () => void
  existingSuites: TestSuite[]
  onSave: (testSuite: TestSuite) => void
  onAddToExisting: (suiteId: string, testCase: any) => void
}

export function PlaywrightImportModal({
  isOpen,
  onClose,
  existingSuites,
  onSave,
  onAddToExisting
}: PlaywrightImportModalProps) {
  const [playwrightCode, setPlaywrightCode] = useState('')
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [generatedSuite, setGeneratedSuite] = useState<any>(null)
  const [suiteName, setSuiteName] = useState('')
  const [applicationName, setApplicationName] = useState('')
  const [selectedExistingSuite, setSelectedExistingSuite] = useState('')
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleParse = () => {
    if (!playwrightCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter Playwright code to parse',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      const parsed = PlaywrightParser.parse(playwrightCode)
      setParsedResult(parsed)
      
      const suite = PlaywrightParser.generateTestSuite(
        parsed,
        suiteName || undefined,
        applicationName || undefined
      )
      setGeneratedSuite(suite)
      
      if (!suiteName) setSuiteName(suite.suiteName)
      if (!applicationName) setApplicationName(suite.applicationName)
      
      toast({
        title: 'Success',
        description: `Parsed ${parsed.testSteps.length} test steps successfully`
      })
    } catch (error: any) {
      toast({
        title: 'Parse Error',
        description: error.message || 'Failed to parse Playwright code',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (!generatedSuite) return

    if (importMode === 'new') {
      const finalSuite = {
        ...generatedSuite,
        suiteName: suiteName || generatedSuite.suiteName,
        applicationName: applicationName || generatedSuite.applicationName
      }
      
      // Update localStorage with new suite's baseUrl
      if (finalSuite.baseUrl) {
        localStorage.setItem('suiteBaseUrl', finalSuite.baseUrl)
      } else {
        localStorage.removeItem('suiteBaseUrl')
      }
      
      onSave(finalSuite)
    } else {
      if (!selectedExistingSuite) {
        toast({
          title: 'Error',
          description: 'Please select an existing suite',
          variant: 'destructive'
        })
        return
      }
      onAddToExisting(selectedExistingSuite, generatedSuite.testCases[0])
    }
    
    handleClose()
  }

  const handleClose = () => {
    setPlaywrightCode('')
    setParsedResult(null)
    setGeneratedSuite(null)
    setSuiteName('')
    setApplicationName('')
    setSelectedExistingSuite('')
    setImportMode('new')
    onClose()
  }

  const uiSuites = existingSuites.filter(suite => suite.type === 'UI')

  const handleCopy = async () => {
    if (generatedSuite) {
      await navigator.clipboard.writeText(JSON.stringify(generatedSuite, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: 'Copied', description: 'JSON copied to clipboard' })
    }
  }

  const handleDownload = () => {
    if (generatedSuite) {
      const blob = new Blob([JSON.stringify(generatedSuite, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `playwright-import-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 border-0 shadow-2xl" style={{zIndex: 9999}}>
        <DialogHeader className="pb-6 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Playwright Test Importer
              </div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Convert Playwright tests to TestFlow Pro UI test suites
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden pt-6">
          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-indigo-600" />
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Import Playwright Code
                </label>
              </div>

              <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-medium text-slate-700">
                    Playwright TypeScript Code
                  </label>
                </div>
                <Textarea
                  placeholder="import { test, expect } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n  await page.goto('https://example.com');\n  await expect(page.getByRole('button')).toBeVisible();\n});"
                  value={playwrightCode}
                  onChange={(e) => setPlaywrightCode(e.target.value)}
                  className="min-h-[300px] font-mono text-sm bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300 resize-none"
                />
              </div>

              <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-medium text-slate-700">Test Configuration</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Suite Name (Optional)</label>
                    <Input
                      placeholder="Auto-generated from test name"
                      value={suiteName}
                      onChange={(e) => setSuiteName(e.target.value)}
                      className="mt-2 bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Application Name (Optional)</label>
                    <Input
                      placeholder="Auto-generated from URL"
                      value={applicationName}
                      onChange={(e) => setApplicationName(e.target.value)}
                      className="mt-2 bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleParse} 
                disabled={!playwrightCode.trim() || isLoading}
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Code className="h-4 w-4 mr-2" />
                {isLoading ? 'Parsing...' : 'Parse Playwright Code'}
              </Button>

              {parsedResult && (
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">
                        Code Parsed Successfully!
                      </h4>
                      <p className="text-sm text-emerald-600">Ready to import into TestFlow Pro</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/60 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800">{parsedResult.testSteps?.length || 0}</div>
                      <div className="text-xs text-slate-600">Test Steps</div>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800">{parsedResult.baseUrl ? '1' : '0'}</div>
                      <div className="text-xs text-slate-600">Base URL</div>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800">UI</div>
                      <div className="text-xs text-slate-600">Suite Type</div>
                    </div>
                  </div>
                </div>
              )}

              {generatedSuite && (
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
                        ? 'border-indigo-300 bg-indigo-50 shadow-lg' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="new"
                        checked={importMode === 'new'}
                        onChange={(e) => setImportMode(e.target.value as 'new')}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-indigo-600" />
                        <div>
                          <div className="font-medium text-slate-800">Create New Suite</div>
                          <div className="text-xs text-slate-600">Start fresh with a new UI test suite</div>
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
                        name="importMode"
                        value="existing"
                        checked={importMode === 'existing'}
                        onChange={(e) => setImportMode(e.target.value as 'existing')}
                        className="w-5 h-5 text-emerald-600"
                      />
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-medium text-slate-800">Add to Existing</div>
                          <div className="text-xs text-slate-600">Extend an existing UI test suite</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {importMode === 'new' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Suite Name:</label>
                        <Input
                          value={suiteName}
                          onChange={(e) => setSuiteName(e.target.value)}
                          placeholder="Enter suite name"
                          className="text-sm bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Application Name:</label>
                        <Input
                          value={applicationName}
                          onChange={(e) => setApplicationName(e.target.value)}
                          placeholder="Enter application name"
                          className="text-sm bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}
                  
                  {importMode === 'existing' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Select Existing UI Suite:</label>
                      <Select value={selectedExistingSuite} onValueChange={setSelectedExistingSuite}>
                        <SelectTrigger className="text-sm bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300">
                          <SelectValue placeholder="Choose a UI test suite" />
                        </SelectTrigger>
                        <SelectContent>
                          {uiSuites.map((suite) => (
                            <SelectItem key={suite.id} value={suite.id}>
                              {suite.suiteName} ({suite.testCases.length} cases)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {uiSuites.length === 0 && (
                        <p className="text-sm text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg">
                          No UI test suites available. Create a new suite instead.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Code className="h-4 w-4 text-slate-600" />
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Generated Test Suite
                </label>
              </div>
              {generatedSuite && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2 h-10 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2 h-10 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={
                      (importMode === 'new' && !onSave) ||
                      (importMode === 'existing' && (!onAddToExisting || !selectedExistingSuite))
                    }
                    className="flex items-center gap-2 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <Save className="h-4 w-4" />
                    {importMode === 'new' ? 'Create Suite' : 'Add Test Case'}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm">
              <div className="h-8 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center text-white text-xs font-medium">TestFlow Pro JSON</div>
              </div>
              <pre className="h-full overflow-auto p-6 text-sm font-mono bg-slate-900 text-green-400 leading-relaxed">
                {generatedSuite ? JSON.stringify(generatedSuite, null, 2) : '// Generated TestFlow Pro JSON will appear here...\n// Paste Playwright code and click "Parse Playwright Code" to convert! 🚀'}
              </pre>
            </div>

            {isLoading && (
              <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-700 font-medium">Parsing Playwright code...</p>
                <p className="text-slate-500 text-sm mt-1">Converting to TestFlow Pro format</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}