import { useMemo, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Sparkles, Code, Copy, Rocket, CheckCircle2, XCircle, Download, Edit } from 'lucide-react'
import { CodeGenType, TestType } from '../types'
import { useToast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface GenerateCodeTabProps {
  codeGenType: CodeGenType
  setCodeGenType: (type: CodeGenType) => void
  codeGenSuiteName: string
  setCodeGenSuiteName: (value: string) => void
  codeGenAppName: string
  setCodeGenAppName: (value: string) => void
  codeGenBaseUrl: string
  setCodeGenBaseUrl: (value: string) => void
  codeGenTestType: TestType
  setCodeGenTestType: (type: TestType) => void
  codeGenTestName: string
  setCodeGenTestName: (value: string) => void
  generatedCode: string
  isGeneratingCode: boolean
  isValidatingCode: boolean
  validationSuccess: boolean | null
  mcpPlaywrightConnected: boolean
  onGenerateCode: (type?: CodeGenType) => void
  onValidateAndRun: () => void
  onClearValidation: () => void
  validationResults: string[]
  onGeneratedCodeChange?: (value: string) => void
}

export function GenerateCodeTab({
  codeGenType,
  setCodeGenType,
  codeGenSuiteName,
  setCodeGenSuiteName,
  codeGenAppName,
  setCodeGenAppName,
  codeGenBaseUrl,
  setCodeGenBaseUrl,
  codeGenTestType,
  setCodeGenTestType,
  codeGenTestName,
  setCodeGenTestName,
  generatedCode,
  isGeneratingCode,
  isValidatingCode,
  validationSuccess,
  mcpPlaywrightConnected,
  onGenerateCode,
  onValidateAndRun,
  onClearValidation,
  validationResults,
  onGeneratedCodeChange
}: GenerateCodeTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [editorValue, setEditorValue] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveLocation, setSaveLocation] = useState('')
  const [fileName, setFileName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const languageLabel = useMemo(() => {
    switch (codeGenType) {
      case 'java':
        return 'Java (Playwright)'
      case 'python':
        return 'Python (Playwright)'
      case 'testflow':
        return 'TestFlowPro JSON'
      case 'cucumber':
        return 'Cucumber (Gherkin)'
      default:
        return 'TypeScript (Playwright)'
    }
  }, [codeGenType])

  const stripCodeFences = useCallback((value: string) => {
    const match = value.match(/```(?:gherkin|cucumber)?\s*([\s\S]*?)```/i)
    return match ? match[1].trim() : value
  }, [])

  const formattedCode = useMemo(() => {
    if (!generatedCode) return ''
    if (codeGenType === 'testflow') {
      try {
        const parsed = JSON.parse(generatedCode)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return generatedCode
      }
    }

    if (codeGenType === 'cucumber') {
      return stripCodeFences(generatedCode)
    }

    return generatedCode
  }, [generatedCode, codeGenType, stripCodeFences])

  useEffect(() => {
    setEditorValue(formattedCode)
  }, [formattedCode])

  const editorLanguage = useMemo(() => {
    switch (codeGenType) {
      case 'testflow':
        return 'json'
      case 'python':
        return 'python'
      case 'java':
        return 'java'
      case 'cucumber':
        return 'gherkin'
      default:
        return 'typescript'
    }
  }, [codeGenType])

  const editorTheme = useMemo(() => {
    return codeGenType === 'cucumber' ? 'gherkin-dark' : 'vs-dark'
  }, [codeGenType])

  const handleBeforeMount = useCallback((monaco: any) => {
    const languageId = 'gherkin'
    const existing = monaco.languages.getLanguages().some((lang: any) => lang.id === languageId)

    if (!existing) {
      monaco.languages.register({ id: languageId })
      monaco.languages.setMonarchTokensProvider(languageId, {
        tokenizer: {
          root: [
            [/^\s*(@[\w-]+)/, 'gherkin-tag'],
            [/^\s*(Feature|Background|Scenario Outline|Scenario|Examples):/, 'gherkin-keyword'],
            [/^\s*(Given|When|Then|And|But)\b/, 'gherkin-step'],
            [/#.*$/, 'comment'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/'([^'\\]|\\.)*'/, 'string']
          ]
        }
      })
    }

    try {
      monaco.editor.defineTheme('gherkin-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'gherkin-keyword', foreground: 'c678dd', fontStyle: 'bold' },
          { token: 'gherkin-step', foreground: '61afef' },
          { token: 'gherkin-tag', foreground: '98c379', fontStyle: 'bold' },
          { token: 'string', foreground: 'e5c07b' },
          { token: 'comment', foreground: '5c6370', fontStyle: 'italic' }
        ],
        colors: {}
      })
    } catch {
      // Ignore theme redefinition errors in Monaco.
    }
  }, [])

  const handleSaveSuite = useCallback(() => {
    if (!generatedCode || codeGenType !== 'testflow') {
      toast({
        title: 'Cannot save',
        description: 'Only TestFlowPro JSON suites can be saved',
        variant: 'destructive'
      })
      return
    }

    try {
      const parsed = JSON.parse(editorValue)
      const defaultLocation = typeof window !== 'undefined'
        ? localStorage.getItem('testSuitePath') || '/Users/afsarali/Repository/TestFlowPro/testSuites'
        : '/Users/afsarali/Repository/TestFlowPro/testSuites'

      const defaultFileName = `${(parsed.suiteName || 'test-suite').replace(/[^a-zA-Z0-9]/g, '_')}.json`

      setSaveLocation(defaultLocation)
      setFileName(defaultFileName)
      setShowSaveDialog(true)
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'The generated code is not valid JSON',
        variant: 'destructive'
      })
    }
  }, [generatedCode, codeGenType, editorValue, toast])

  const handleConfirmSave = useCallback(async () => {
    if (!editorValue || !saveLocation || !fileName) {
      return
    }

    setIsSaving(true)

    try {
      const testSuite = JSON.parse(editorValue)

      const response = await fetch('/api/save-test-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSuite,
          location: saveLocation,
          fileName: fileName
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test suite saved successfully'
        })
        setShowSaveDialog(false)
        // Trigger refresh of test suites in main app
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refresh-suites'))
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save test suite',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Error',
        description: 'Failed to save test suite',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }, [editorValue, saveLocation, fileName, toast])

  const handleEditSuite = useCallback(() => {
    if (!generatedCode || codeGenType !== 'testflow') {
      toast({
        title: 'Cannot edit',
        description: 'Only TestFlowPro JSON suites can be edited',
        variant: 'destructive'
      })
      return
    }

    try {
      const testSuite = JSON.parse(editorValue)

      // Store the suite in sessionStorage for the main page to pick up
      sessionStorage.setItem('ralph-suite-to-edit', JSON.stringify(testSuite))

      toast({
        title: 'Opening Editor',
        description: 'Navigating to test suite editor...'
      })

      // Navigate to main page
      router.push('/')
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'The generated code is not valid JSON',
        variant: 'destructive'
      })
    }
  }, [generatedCode, codeGenType, editorValue, toast, router])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Options Panel */}
      <div className="xl:col-span-1 space-y-4">
        <div className="border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Code Generator</h3>
              <p className="text-xs text-white/60">Choose a target format and generate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {([
              { id: 'typescript', label: 'TypeScript', sub: 'Playwright' },
              { id: 'java', label: 'Java', sub: 'Playwright' },
              { id: 'python', label: 'Python', sub: 'Playwright' },
              { id: 'cucumber', label: 'Cucumber', sub: 'Gherkin Feature' },
              { id: 'testflow', label: 'TestFlowPro', sub: 'JSON Suite' }
            ] as const).map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setCodeGenType(option.id)
                  onGenerateCode(option.id)
                }}
                className={`group w-full px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                  codeGenType === option.id
                    ? 'border-indigo-400/40 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                    : 'border-white/10 bg-slate-900/40 text-white/80 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="text-xs text-white/50">{option.sub}</div>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${codeGenType === option.id ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur shadow-xl">
          <h3 className="text-sm font-semibold text-white mb-4">TestFlowPro Fields</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/60">Suite Name</label>
              <Input
                value={codeGenSuiteName}
                onChange={(e) => setCodeGenSuiteName(e.target.value)}
                className="bg-slate-900/40 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Application Name</label>
              <Input
                value={codeGenAppName}
                onChange={(e) => setCodeGenAppName(e.target.value)}
                className="bg-slate-900/40 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Base URL</label>
              <Input
                value={codeGenBaseUrl}
                onChange={(e) => setCodeGenBaseUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-slate-900/40 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Test Case Name</label>
              <Input
                value={codeGenTestName}
                onChange={(e) => setCodeGenTestName(e.target.value)}
                className="bg-slate-900/40 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={codeGenTestType === 'UI' ? 'default' : 'outline'}
                onClick={() => setCodeGenTestType('UI')}
                className="w-full"
              >
                UI
              </Button>
              <Button
                size="sm"
                variant={codeGenTestType === 'API' ? 'default' : 'outline'}
                onClick={() => setCodeGenTestType('API')}
                className="w-full"
              >
                API
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={() => onGenerateCode()}
          disabled={isGeneratingCode}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          {isGeneratingCode ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Code
            </>
          )}
        </Button>

        {/* Validation Controls */}
        {generatedCode && (codeGenType === 'typescript' || codeGenType === 'python') && (
          <div className="border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Playwright Agents
            </h3>
            <p className="text-xs text-white/60 mb-3">
              🎭 Executor → Healer workflow (auto-heals up to 10 times)
            </p>
            <div className="space-y-2">
              <Button
                onClick={onValidateAndRun}
                disabled={isValidatingCode || !mcpPlaywrightConnected}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {isValidatingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running & Healing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Run & Auto-Heal
                  </>
                )}
              </Button>
              {validationSuccess !== null && (
                <Button
                  onClick={onClearValidation}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Clear Results
                </Button>
              )}
            </div>

            {validationSuccess !== null && (
              <div className={`mt-3 p-3 rounded-lg ${
                validationSuccess 
                  ? 'bg-green-900/20 border border-green-400/30' 
                  : 'bg-red-900/20 border border-red-400/30'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {validationSuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    validationSuccess ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validationSuccess ? '✅ Tests Passed!' : '❌ Tests Failed'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Display Panel */}
      <div className="xl:col-span-2 space-y-4">
        <div className="border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg">
                <Code className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Generated Code</h3>
                <p className="text-xs text-white/60">{languageLabel}</p>
              </div>
            </div>
            {generatedCode && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(editorValue)
                    toast({ title: 'Code copied to clipboard!' })
                  }}
                  className="text-white hover:bg-white/10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                {codeGenType === 'testflow' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditSuite}
                      className="text-white hover:bg-white/10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveSuite}
                      className="text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Save Suite
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-white/10 overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-900/60">
              <span className="text-xs text-white/60">{editorValue.split('\n').length} lines</span>
              <span className="text-xs text-white/60">{languageLabel}</span>
            </div>
            <MonacoEditor
              height="520px"
              language={editorLanguage}
              theme={editorTheme}
              beforeMount={handleBeforeMount}
              value={editorValue}
              onChange={(value) => {
                const nextValue = value ?? ''
                setEditorValue(nextValue)
                onGeneratedCodeChange?.(nextValue)
              }}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                roundedSelection: false,
                formatOnPaste: true,
                formatOnType: true,
                automaticLayout: true,
                wordWrap: 'on',
                readOnly: false
              }}
            />
            {!generatedCode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Code className="h-16 w-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/60 mb-2">No code generated yet</p>
                  <p className="text-sm text-white/40">Select a code type and click "Generate Code"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Log */}
        {validationResults.length > 0 && (
          <div className="border border-white/10 rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-4">Validation Log</h3>
            <ScrollArea className="h-[300px] rounded-lg bg-slate-900/50 border border-white/5 p-4">
              <div className="space-y-1 font-mono text-xs">
                {validationResults.map((log, idx) => (
                  <div key={idx} className="text-white/70">{log}</div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Save Suite Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Test Suite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Save Location</label>
              <Input
                value={saveLocation}
                onChange={(e) => setSaveLocation(e.target.value)}
                placeholder="/path/to/testSuites"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">File Name</label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="test-suite.json"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSave}
                disabled={isSaving || !saveLocation || !fileName}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
