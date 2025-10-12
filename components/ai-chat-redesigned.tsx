"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Upload, FileText, Code, Globe, Sparkles, Copy, Check, RotateCcw, Play, Square, Download, Settings, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { AI_CONFIG } from '../ai-config'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface GeneratedSuite {
  suiteName: string
  baseUrl?: string
  type: 'API' | 'UI'
  tags: Array<{ [key: string]: string }>
  testCases: any[]
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [curlCommand, setCurlCommand] = useState('')
  const [curlResponse, setCurlResponse] = useState<any>(null)
  const [jsonPath, setJsonPath] = useState('')
  const [filteredResult, setFilteredResult] = useState<any>(null)
  const [swaggerContent, setSwaggerContent] = useState('')
  const [uiSteps, setUiSteps] = useState('')
  const [recordUrl, setRecordUrl] = useState('')
  const [generatedSuite, setGeneratedSuite] = useState<GeneratedSuite | null>(null)
  const [saveLocation, setSaveLocation] = useState('')
  const [fileName, setFileName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [generateTestCaseOnly, setGenerateTestCaseOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const [aiProvider, setAiProvider] = useState<'ollama' | 'github-copilot'>(AI_CONFIG.defaults.provider)
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [githubAuthStatus, setGithubAuthStatus] = useState<'unknown' | 'authenticated' | 'not-authenticated'>('unknown')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [deviceFlow, setDeviceFlow] = useState<{ userCode: string; verificationUri: string; deviceCode: string } | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Check GitHub auth status when provider changes
    if (aiProvider === 'github-copilot') {
      checkGitHubAuth()
    }
  }, [aiProvider])
  
  // Clear device flow when switching away from GitHub Copilot
  useEffect(() => {
    if (aiProvider !== 'github-copilot') {
      setDeviceFlow(null)
      setIsPolling(false)
    }
  }, [aiProvider])
  
  const checkGitHubAuth = async () => {
    try {
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      const status = await authService.checkAuthStatus()
      const isAuthenticated = status.hasToken && status.isValid
      setGithubAuthStatus(isAuthenticated ? 'authenticated' : 'not-authenticated')
      
      // Clear device flow only if already authenticated
      if (isAuthenticated && deviceFlow) {
        setDeviceFlow(null)
        setIsPolling(false)
      }
    } catch (error) {
      setGithubAuthStatus('not-authenticated')
    }
  }
  
  const handleGitHubAuth = async () => {
    try {
      setIsLoading(true)
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      const flow = await authService.startDeviceFlow()
      
      console.log('Device flow response:', flow)
      setDeviceFlow(flow)
      
      toast({ 
        title: 'GitHub Authentication Started', 
        description: `Code: ${flow.userCode} - Opening GitHub...` 
      })
      
      // Open GitHub auth page after a short delay to ensure state is set
      setTimeout(() => {
        window.open(flow.verificationUri, '_blank')
      }, 500)
      
      // Start polling for token
      startPolling(authService, flow.deviceCode, flow.interval)
    } catch (error: any) {
      console.error('GitHub auth error:', error)
      toast({ title: 'Error', description: error.message || 'Authentication failed', variant: 'destructive' })
      setIsLoading(false)
    }
  }
  
  const startPolling = async (authService: any, deviceCode: string, interval: number) => {
    setIsPolling(true)
    setIsLoading(false) // Allow UI to show device code while polling
    
    const poll = async () => {
      try {
        console.log('Polling for token...')
        const result = await authService.pollForToken(deviceCode)
        
        if (result.success) {
          console.log('Authentication successful!')
          setGithubAuthStatus('authenticated')
          setDeviceFlow(null)
          setIsPolling(false)
          toast({ title: '✅ Success', description: 'GitHub authentication successful!' })
          return
        }
        
        if (result.pending) {
          console.log('Still pending, polling again...')
          setTimeout(poll, interval * 1000)
        }
      } catch (error: any) {
        console.error('Polling error:', error)
        // Don't clear device flow on polling errors - keep showing the code
        if (error.message?.includes('Body is unusable') || error.message?.includes('authorization_pending')) {
          console.log('Continuing to poll despite error...')
          setTimeout(poll, interval * 1000)
        } else {
          setIsPolling(false)
          setDeviceFlow(null)
          toast({ title: 'Error', description: error.message || 'Authentication failed', variant: 'destructive' })
        }
      }
    }
    
    // Start polling immediately, then continue at intervals
    setTimeout(poll, 2000) // Start after 2 seconds
  }
  
  const handleReAuth = async () => {
    try {
      setIsLoading(true)
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      await authService.clearTokens()
      setGithubAuthStatus('not-authenticated')
      setDeviceFlow(null)
      setIsPolling(false)
      toast({ title: 'Cleared', description: 'Please authenticate again with new permissions' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to clear tokens', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleManualTokenSubmit = async () => {
    if (!githubToken.trim()) {
      toast({ title: 'Error', description: 'Please enter a valid GitHub token', variant: 'destructive' })
      return
    }
    
    try {
      setIsLoading(true)
      const { GitHubAuthService } = await import('@/lib/services/githubAuth')
      const authService = new GitHubAuthService()
      await authService.setToken(githubToken)
      setGithubAuthStatus('authenticated')
      setShowTokenInput(false)
      setGithubToken('')
      toast({ title: 'Success', description: 'GitHub token saved successfully' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save token', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const addMessage = (content: string, type: 'user' | 'ai', isTestSuiteGeneration = false, isUITest = false) => {
    let displayContent = content
    
    // If it's a test suite generation response, show generic steps instead of full JSON
    if (type === 'ai' && isTestSuiteGeneration) {
      if (isUITest) {
        displayContent = `✅ UI test suite generated successfully!

🎭 Generated UI components:
• Browser automation steps
• Element selectors and interactions
• Page navigation flows
• UI assertions and validations
• Local variable storage

👀 View the complete UI test suite in the "Test Suite" section below.`
      } else {
        displayContent = `✅ Test suite generated successfully!

📋 Generated components:
• Suite configuration
• Test cases with endpoints
• Request/response validation
• Assertions and test data

👀 View the complete test suite in the "Test Suite" section below.`
      }
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content: displayContent,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    addMessage(inputMessage, 'user')
    setIsLoading(true)
    
    try {
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          type: 'general',
          provider: aiProvider
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = 'Sorry, I encountered an error. Please try again.'
        
        if (response.status === 402) {
          errorMessage = '💳 GitHub Copilot quota exceeded. You have no remaining quota. Please check your subscription or switch to Ollama provider.'
        } else if (errorData.error) {
          errorMessage = `❌ API Error (${response.status}): ${errorData.error}`
        }
        
        addMessage(errorMessage, 'ai')
        setIsLoading(false)
        setInputMessage('')
        return
      }
      
      const data = await response.json()
      
      if (aiProvider === 'github-copilot') {
        // Try to extract JSON if it looks like a test suite
        let hasTestSuite = false
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch && jsonMatch[0].includes('testCases')) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
            hasTestSuite = true
          }
        } catch (parseError) {
          // Ignore parsing errors for general chat
        }
        
        addMessage(data.response, 'ai', hasTestSuite)
      } else {
        if (data.testSuite) {
          setGeneratedSuite(data.testSuite)
          const isUITest = data.testSuite.type === 'UI'
          addMessage('', 'ai', true, isUITest) // Use generic message for test suite generation
        } else {
          addMessage(data.response, 'ai')
        }
      }
    } catch (error: any) {
      const errorResponse = await error.response?.json?.() || {}
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      if (error.response?.status === 402) {
        errorMessage = '💳 GitHub Copilot quota exceeded. Please check your subscription or switch to Ollama provider.'
      } else if (errorResponse.error) {
        errorMessage = `❌ ${errorResponse.error}`
      }
      
      addMessage(errorMessage, 'ai')
    } finally {
      setIsLoading(false)
      setInputMessage('')
    }
  }

  const handleCurlGeneration = async () => {
    if (!curlCommand.trim()) return

    setIsLoading(true)
    try {
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: curlCommand,
          type: 'curl',
          provider: aiProvider
        })
      })

      const data = await response.json()
      if (aiProvider === 'github-copilot') {
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
            const isUITest = parsedSuite.type === 'UI'
            addMessage('', 'ai', true, isUITest) // Add generic success message to chat
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.error('Failed to parse GitHub Copilot response:', parseError)
          toast({ title: 'Error', description: 'Failed to parse AI response', variant: 'destructive' })
          return
        }
      } else {
        setGeneratedSuite(data.testSuite)
        const isUITest = data.testSuite.type === 'UI'
        addMessage('', 'ai', true, isUITest) // Add generic success message to chat
      }
      toast({ title: 'Test Suite Generated', description: 'Generated from cURL command' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestCurl = async () => {
    if (!curlCommand.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/test-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curlCommand })
      })

      const data = await response.json()
      setCurlResponse(data)
      toast({ title: 'cURL Executed', description: 'Response received successfully' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to execute cURL', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJsonPathFilter = () => {
    if (!curlResponse || !jsonPath.trim()) {
      setFilteredResult(null)
      return
    }

    try {
      // Simple JSONPath implementation for basic queries
      const data = curlResponse.data
      let result = data
      
      if (jsonPath === '$') {
        result = data
      } else if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2)
        const parts = path.split('.')
        
        for (const part of parts) {
          if (part.includes('[') && part.includes(']')) {
            const [key, indexStr] = part.split('[')
            const index = parseInt(indexStr.replace(']', ''))
            result = key ? result[key][index] : result[index]
          } else {
            result = result[part]
          }
          if (result === undefined) break
        }
      }
      
      setFilteredResult(result)
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid JSONPath expression', variant: 'destructive' })
      setFilteredResult(null)
    }
  }

  const handleSwaggerGeneration = async () => {
    if (!swaggerContent.trim()) return

    setIsLoading(true)
    try {
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: swaggerContent,
          type: 'swagger',
          provider: aiProvider
        })
      })

      const data = await response.json()
      if (aiProvider === 'github-copilot') {
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
            const isUITest = parsedSuite.type === 'UI'
            addMessage('', 'ai', true, isUITest) // Add generic success message to chat
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.error('Failed to parse GitHub Copilot response:', parseError)
          toast({ title: 'Error', description: 'Failed to parse AI response', variant: 'destructive' })
          return
        }
      } else {
        setGeneratedSuite(data.testSuite)
        const isUITest = data.testSuite.type === 'UI'
        addMessage('', 'ai', true, isUITest) // Add generic success message to chat
      }
      toast({ title: 'Test Suite Generated', description: 'Generated from Swagger specification' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUIStepsGeneration = async () => {
    if (!uiSteps.trim()) return

    setIsLoading(true)
    try {
      const endpoint = aiProvider === 'github-copilot' ? '/api/copilot-chat' : '/api/ai-chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: uiSteps,
          type: 'ui',
          provider: aiProvider
        })
      })

      const data = await response.json()
      if (aiProvider === 'github-copilot') {
        // Parse GitHub Copilot response
        try {
          const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/) || data.response.match(/{[\s\S]*}/)
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedSuite = JSON.parse(jsonStr)
            setGeneratedSuite(parsedSuite)
            const isUITest = parsedSuite.type === 'UI'
            addMessage('', 'ai', true, isUITest) // Add generic success message to chat
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.error('Failed to parse GitHub Copilot response:', parseError)
          toast({ title: 'Error', description: 'Failed to parse AI response', variant: 'destructive' })
          return
        }
      } else {
        setGeneratedSuite(data.testSuite)
        const isUITest = data.testSuite.type === 'UI'
        addMessage('', 'ai', true, isUITest) // Add generic success message to chat
      }
      toast({ title: 'UI Test Suite Generated', description: 'Generated from test steps' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate UI test suite', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          setSwaggerContent(content)
          setActiveTab('swagger')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleSaveSuite = () => {
    if (!generatedSuite) {
      console.log('No generated suite to save')
      return
    }
    
    console.log('Opening save dialog for:', generatedSuite.suiteName)
    
    const defaultLocation = typeof window !== 'undefined' 
      ? localStorage.getItem('testSuitePath') || '/Users/afsarali/Repository/TestFlowPro/testData'
      : '/Users/afsarali/Repository/TestFlowPro/testData'
    const defaultFileName = `${generatedSuite.suiteName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    
    setSaveLocation(defaultLocation)
    setFileName(defaultFileName)
    setShowSaveDialog(true)
  }

  const handleConfirmSave = async () => {
    if (!generatedSuite || !saveLocation || !fileName) {
      console.log('Missing data:', { generatedSuite: !!generatedSuite, saveLocation, fileName })
      return
    }

    console.log('Saving suite to:', saveLocation, fileName)

    try {
      const response = await fetch('/api/save-test-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSuite: generatedSuite,
          location: saveLocation,
          fileName: fileName
        })
      })

      const result = await response.json()
      console.log('Save response:', result)

      if (response.ok) {
        toast({ title: 'Success', description: 'Test suite saved successfully' })
        setGeneratedSuite(null)
        setShowSaveDialog(false)
        window.dispatchEvent(new CustomEvent('refresh-suites'))
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save test suite', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Failed to save test suite', variant: 'destructive' })
    }
  }

  const handleCopyTestCases = async () => {
    if (!generatedSuite) return
    
    const contentToCopy = generateTestCaseOnly 
      ? JSON.stringify(generatedSuite.testCases, null, 2)
      : JSON.stringify(generatedSuite, null, 2)
    
    try {
      await navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      toast({ 
        title: 'Copied!', 
        description: generateTestCaseOnly ? 'Test cases copied to clipboard' : 'Complete test suite copied to clipboard'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy to clipboard', variant: 'destructive' })
    }
  }

  const handleReset = () => {
    setMessages([])
    setInputMessage('')
    setCurlCommand('')
    setSwaggerContent('')
    setUiSteps('')
    setRecordUrl('')
    setGeneratedSuite(null)
    setCopied(false)
    toast({ title: 'Reset', description: 'Chat cleared successfully' })
  }

  const handleStartRecording = async () => {
    if (!recordUrl) return

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/mcp-standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recordUrl })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Playwright Codegen Started',
          description: result.message
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Start Recording',
        description: error.message || 'Could not start Playwright codegen',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Chat Icon */}
      {AI_CONFIG.ui.showChatIcon && (
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Ripple Animation Background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse opacity-30 animation-delay-75"></div>
        
        {/* Main Button */}
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-800 border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-purple-500/25 animate-float"
          size="icon"
        >
          {/* Sparkle Effect */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce opacity-80"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse opacity-60"></div>
          
          {/* Bot Icon with Animation */}
          <div className="relative">
            <Sparkles className="absolute -top-2 -right-2 h-3 w-3 text-yellow-300 animate-spin opacity-70" />
            <Bot className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-200" />
          </div>
          
          {/* Notification Badge */}
          {messages.length === 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          )}
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none transform translate-y-1 group-hover:translate-y-0">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-yellow-400" />
            <span className="font-medium">AI Test Generator</span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/90"></div>
        </div>
      </div>
      )}

      {/* Modern Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-blue-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* Modern Header with Gradient */}
            <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-6 border-b border-white/10">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12 animate-pulse animation-delay-300"></div>
                <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white rounded-full animate-bounce animation-delay-700"></div>
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                      <Bot className="h-6 w-6 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-2 w-2 text-yellow-900" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      AI Test Suite Generator
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-150"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animation-delay-300"></div>
                      </div>
                    </h1>
                    <p className="text-white/80 text-sm mt-1">Transform your ideas into comprehensive test suites</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowProviderSettings(!showProviderSettings)} 
                    className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 hover:scale-105"
                    title="AI Provider Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleReset} 
                    className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 hover:scale-105"
                    title="Reset Chat"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="h-10 w-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 text-white hover:text-red-200 transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar - Tools & Settings */}
              <div className="w-80 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/50 flex flex-col">
                {/* Provider Settings */}
                <div className="p-4 border-b border-slate-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-purple-600" />
                      AI Provider
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowProviderSettings(!showProviderSettings)}
                      className="h-8 w-8 p-0 hover:bg-purple-100 rounded-lg"
                    >
                      <div className={`transform transition-transform duration-200 ${showProviderSettings ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </Button>
                  </div>
                  
                  {showProviderSettings && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 gap-2">
                        <label className={`relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          aiProvider === 'ollama' 
                            ? 'border-purple-300 bg-purple-50 shadow-md' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="aiProvider"
                            value="ollama"
                            checked={aiProvider === 'ollama'}
                            onChange={(e) => setAiProvider(e.target.value as 'ollama')}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              aiProvider === 'ollama' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              🏠
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">Ollama</div>
                              <div className="text-xs text-slate-600">Local AI instance</div>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          aiProvider === 'github-copilot' 
                            ? 'border-blue-300 bg-blue-50 shadow-md' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="aiProvider"
                            value="github-copilot"
                            checked={aiProvider === 'github-copilot'}
                            onChange={(e) => setAiProvider(e.target.value as 'github-copilot')}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              aiProvider === 'github-copilot' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              🔗
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm flex items-center gap-2">
                                GitHub Copilot
                                {githubAuthStatus === 'authenticated' && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <div className="text-xs text-slate-600">Cloud AI service</div>
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {aiProvider === 'github-copilot' && githubAuthStatus !== 'authenticated' && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 animate-in slide-in-from-top-2 duration-300">
                          <div className="text-sm font-medium text-blue-900 mb-3">🔐 Authentication Required</div>
                          <div className="space-y-2">
                            <Button size="sm" onClick={handleGitHubAuth} disabled={isLoading || isPolling} className="w-full h-8 text-xs">
                              {isLoading ? 'Starting...' : isPolling ? 'Waiting...' : '🚀 OAuth Login'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowTokenInput(true)} className="w-full h-8 text-xs">
                              🔑 Manual Token
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {deviceFlow && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 animate-in slide-in-from-top-2 duration-300">
                          <div className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            🔐 GitHub Authentication
                            {isPolling && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>}
                          </div>
                          <div className="bg-white p-3 rounded-lg border mb-3">
                            <div className="text-xs text-gray-600 mb-1">Enter this code:</div>
                            <div className="text-lg font-mono font-bold text-center bg-gray-100 p-2 rounded border-2 border-dashed">
                              {deviceFlow.userCode}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => window.open(deviceFlow.verificationUri, '_blank')}
                            className="w-full text-xs h-8"
                          >
                            🔗 Open GitHub
                          </Button>
                        </div>
                      )}
                      
                      {showTokenInput && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-3">
                            <label className="text-xs font-medium text-slate-700">Personal Access Token</label>
                            <Input
                              type="password"
                              value={githubToken}
                              onChange={(e) => setGithubToken(e.target.value)}
                              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                              className="text-xs h-8"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleManualTokenSubmit} disabled={isLoading} className="flex-1 text-xs h-7">
                                {isLoading ? 'Saving...' : 'Save'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowTokenInput(false)} className="flex-1 text-xs h-7">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Generation Options */}
                <div className="p-4 border-b border-slate-200/50">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    Options
                  </h3>
                  <label className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 cursor-pointer hover:from-emerald-100 hover:to-green-100 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={generateTestCaseOnly}
                      onChange={(e) => setGenerateTestCaseOnly(e.target.checked)}
                      className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-emerald-900">Test Cases Only</div>
                      <div className="text-xs text-emerald-700">Generate without suite wrapper</div>
                    </div>
                  </label>
                </div>

                {/* Navigation Tabs */}
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-600" />
                    Generation Tools
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'chat', label: 'AI Chat', icon: '💬', desc: 'Natural language' },
                      { id: 'curl', label: 'cURL', icon: '🔗', desc: 'Import commands' },
                      { id: 'swagger', label: 'Swagger', icon: '📋', desc: 'API specifications' },
                      { id: 'ui', label: 'UI Steps', icon: '🎭', desc: 'Browser automation' },
                      { id: 'record', label: 'Record', icon: '🎬', desc: 'Playwright codegen' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                            : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tab.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{tab.label}</div>
                            <div className={`text-xs ${
                              activeTab === tab.id ? 'text-white/80' : 'text-slate-500'
                            }`}>{tab.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                {activeTab === 'chat' && (
                  <div className="flex-1 flex flex-col p-6">
                    {/* Chat Messages Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white rounded-2xl border border-slate-200/50 p-6 mb-6 space-y-4 shadow-inner">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mb-4 animate-bounce">
                            <Bot className="h-10 w-10 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Welcome to AI Test Generator!</h3>
                          <p className="text-slate-600 max-w-md">
                            Describe your API endpoints, UI flows, or paste cURL commands. I'll help you create comprehensive test suites.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {[
                              "Create API tests for user login",
                              "Generate UI tests for checkout flow",
                              "Test REST endpoints with validation"
                            ].map((example, i) => (
                              <button
                                key={i}
                                onClick={() => setInputMessage(example)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 hover:scale-105"
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {messages.map((message, index) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`} style={{animationDelay: `${index * 50}ms`}}>
                          <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                            message.type === 'user' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                              : 'bg-white border border-slate-200 text-slate-900'
                          }`}>
                            {message.type === 'ai' && (
                              <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                                <Bot className="h-3 w-3" />
                                <span>AI Assistant</span>
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                            <div className={`text-xs mt-2 opacity-60 ${
                              message.type === 'user' ? 'text-white/70' : 'text-slate-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-200/50 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Bot className="h-5 w-5 text-purple-600 animate-spin" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                              </div>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                              <span className="text-sm text-purple-700 font-medium animate-pulse">AI is crafting your test suite...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Enhanced Input Area */}
                    <div className="flex gap-3 flex-shrink-0">
                      <div className="flex-1 relative">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Describe your API endpoints, UI flows, or test requirements..."
                          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                          className="h-12 pr-12 rounded-xl border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white/80 backdrop-blur-sm transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">
                          {inputMessage.length}/500
                        </div>
                      </div>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={isLoading || !inputMessage.trim()}
                        className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'curl' && (
                  <div className="flex-1 flex flex-col p-6">
                    <div className="flex-1 flex flex-col space-y-4">
                      <Textarea
                        value={curlCommand}
                        onChange={(e) => setCurlCommand(e.target.value)}
                        placeholder="Paste your cURL command here..."
                        className="h-24 rounded-xl border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      
                      <div className="flex gap-2">
                        <Button onClick={handleTestCurl} disabled={isLoading} variant="outline" className="flex-1 rounded-xl">
                          {isLoading ? 'Testing...' : 'Test cURL'}
                        </Button>
                        <Button onClick={handleCurlGeneration} disabled={isLoading} className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          {isLoading ? (
                            <>
                              <Bot className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Code className="h-4 w-4 mr-2" />
                              Generate Test Suite
                            </>
                          )}
                        </Button>
                      </div>

                      {curlResponse && (
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-medium text-sm mb-2">API Response</h4>
                            <div className="text-xs text-slate-600 mb-1">
                              Status: {curlResponse.status} | Time: {curlResponse.time}ms
                            </div>
                            <div className="bg-white p-3 rounded-lg border max-h-32 overflow-y-auto">
                              <pre className="text-xs">{JSON.stringify(curlResponse.data, null, 2)}</pre>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <h4 className="font-medium text-sm mb-2">JSONPath Filter</h4>
                            <div className="flex gap-2 mb-2">
                              <Input
                                value={jsonPath}
                                onChange={(e) => setJsonPath(e.target.value)}
                                placeholder="$.data[0].name or $..id"
                                className="text-xs h-8 rounded-lg"
                              />
                              <Button size="sm" onClick={handleJsonPathFilter} className="text-xs h-8 rounded-lg">
                                Filter
                              </Button>
                            </div>
                            {filteredResult !== null && (
                              <div className="bg-white p-3 rounded-lg border">
                                <pre className="text-xs">{JSON.stringify(filteredResult, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'swagger' && (
                  <div className="flex-1 flex flex-col p-6">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Swagger/OpenAPI Import
                        </h3>
                        <p className="text-sm text-blue-700">Upload or paste your API specification to generate comprehensive test suites</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json,.yaml,.yml"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </Button>
                      </div>
                      
                      <Textarea
                        value={swaggerContent}
                        onChange={(e) => setSwaggerContent(e.target.value)}
                        placeholder="Paste your Swagger/OpenAPI specification here (JSON or YAML format)..."
                        className="flex-1 min-h-[300px] rounded-xl border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono text-sm"
                      />
                      
                      <Button 
                        onClick={handleSwaggerGeneration} 
                        disabled={isLoading || !swaggerContent.trim()} 
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <Bot className="h-4 w-4 mr-2 animate-spin" />
                            Generating Test Suite...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Test Suite from Swagger
                          </>
                        )}
                      </Button>
                      
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                        <h4 className="font-medium text-emerald-900 mb-2">💡 Tips</h4>
                        <div className="text-sm text-emerald-700 space-y-1">
                          <p>• Supports both JSON and YAML formats</p>
                          <p>• Generates positive and negative test scenarios</p>
                          <p>• Includes request/response schema validation</p>
                          <p>• Creates comprehensive endpoint coverage</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ui' && (
                  <div className="flex-1 flex flex-col p-6">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          UI Test Steps Generator
                        </h3>
                        <p className="text-sm text-purple-700">Describe your UI interactions and we'll create automated browser tests</p>
                      </div>
                      
                      <Textarea
                        value={uiSteps}
                        onChange={(e) => setUiSteps(e.target.value)}
                        placeholder={`Describe your UI test steps, for example:

1. Navigate to login page
2. Enter username and password
3. Click login button
4. Verify dashboard is displayed
5. Check user profile information
6. Logout and verify redirect

Be as detailed as possible for better test generation.`}
                        className="flex-1 min-h-[300px] rounded-xl border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      
                      <Button 
                        onClick={handleUIStepsGeneration} 
                        disabled={isLoading || !uiSteps.trim()} 
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <Bot className="h-4 w-4 mr-2 animate-spin" />
                            Generating UI Test Suite...
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" />
                            Generate UI Test Suite
                          </>
                        )}
                      </Button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">🎯 Best Practices</h4>
                          <div className="text-sm text-blue-700 space-y-1">
                            <p>• Use specific element descriptions</p>
                            <p>• Include expected outcomes</p>
                            <p>• Mention data to enter</p>
                            <p>• Describe validation steps</p>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">✨ Generated Features</h4>
                          <div className="text-sm text-green-700 space-y-1">
                            <p>• Playwright automation steps</p>
                            <p>• Element selectors</p>
                            <p>• Assertions and validations</p>
                            <p>• Variable storage</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'record' && (
                  <div className="flex-1 flex flex-col p-6">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Playwright Code Generator
                        </h3>
                        <p className="text-sm text-green-700">Record your browser interactions and generate test code automatically</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            🌐 Target URL
                          </label>
                          <Input
                            value={recordUrl}
                            onChange={(e) => setRecordUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="h-12 rounded-xl border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>
                        
                        <Button
                          onClick={handleStartRecording}
                          disabled={!recordUrl || isLoading}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Starting Playwright...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start Playwright Codegen
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          🎬 How it Works
                        </h4>
                        <div className="text-sm text-blue-700 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                            <p>Enter the URL you want to test and click "Start Playwright Codegen"</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                            <p>Browser opens with Playwright Inspector for recording</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                            <p>Perform your test actions - clicks, typing, navigation</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                            <p>Copy generated code from Playwright Inspector</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</div>
                            <p>Convert to TestFlow Pro format using UI Steps tab</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                          <h4 className="font-medium text-yellow-900 mb-2">💡 Pro Tips</h4>
                          <div className="text-sm text-yellow-700 space-y-1">
                            <p>• Record multiple scenarios</p>
                            <p>• Use assertions for validation</p>
                            <p>• Test different user flows</p>
                            <p>• Include error scenarios</p>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <h4 className="font-medium text-purple-900 mb-2">🔧 Features</h4>
                          <div className="text-sm text-purple-700 space-y-1">
                            <p>• Visual element selection</p>
                            <p>• Auto-generated selectors</p>
                            <p>• Network request capture</p>
                            <p>• Screenshot comparisons</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                </div>
                
                {/* Generated Suite Preview - Always visible */}
                {generatedSuite && (
                  <div className="border-t border-slate-200/50 bg-gradient-to-r from-emerald-50/50 to-green-50/50 p-6 animate-in slide-in-from-bottom-4 duration-500 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">
                            {generateTestCaseOnly ? '🎯 Generated Test Cases' : '✨ Generated Test Suite'}
                          </h3>
                          <p className="text-xs text-slate-600">Ready to use in your testing workflow</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={generatedSuite.type === 'API' ? 'default' : 'secondary'} 
                          className={`text-xs px-3 py-1 ${
                            generatedSuite.type === 'API' 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {generatedSuite.type === 'API' ? '🔗 API' : '🎭 UI'} Testing
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCopyTestCases} 
                          className="h-8 px-3 text-xs hover:bg-slate-100 border-slate-300 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy JSON
                            </>
                          )}
                        </Button>
                        {!generateTestCaseOnly && (
                          <Button 
                            size="sm" 
                            onClick={handleSaveSuite} 
                            className="h-8 px-4 text-xs bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Save Suite
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 shadow-inner">
                      <div className="h-40 overflow-y-auto">
                        <pre className="text-xs text-slate-700 leading-relaxed">
                          {generateTestCaseOnly 
                            ? JSON.stringify(generatedSuite.testCases, null, 2)
                            : JSON.stringify(generatedSuite, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Test Suite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Save Location</label>
                <Input
                  value={saveLocation}
                  onChange={(e) => setSaveLocation(e.target.value)}
                  placeholder="/path/to/testData"
                />
              </div>
              <div>
                <label className="text-sm font-medium">File Name</label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="test-suite.json"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmSave} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}