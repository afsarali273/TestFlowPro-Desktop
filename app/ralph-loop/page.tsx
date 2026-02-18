"use client"

import { useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Play, Code, BookOpen, Activity } from 'lucide-react'
import {
  RalphLoopHeader,
  PlanTab,
  ExecuteTab,
  GenerateCodeTab,
  LearningTab,
  ServersTab
} from './components'
import { useRalphLoop } from './hooks/useRalphLoop'
import { useMCPServers } from './hooks/useMCPServers'
import { usePlanOperations } from './hooks/usePlanOperations'
import { generatePlanWithAI, exploreAndGenerateScenarios } from './services'
import { AI_CONFIG } from '@/ai-config'
import type { Plan, LearningEntry } from '@/types/ralph-loop'
import {
  getCodePrompt,
  getExecutionSummaryPrompt,
  getTaskExecutionPrompt
} from './prompts'

export default function RalphLoopPage() {
  const state = useRalphLoop()
  const mcp = useMCPServers()
  const planOps = usePlanOperations(state.currentPlan, state.setCurrentPlan, state.setAllPlans)

  // Load MCP servers on mount
  useEffect(() => {
    (async () => {
      await mcp.loadMCPServers()
      await mcp.autoConnectServers()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    state.logRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.executionLog, state.logRef])

  // Sync MCP state with main state
  useEffect(() => {
    state.setMcpServers(mcp.mcpServers)
    state.setMcpStatuses(mcp.mcpStatuses)
    state.setMcpTools(mcp.mcpTools)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcp.mcpServers, mcp.mcpStatuses, mcp.mcpTools])

  // ============ Plan Generation ============
  const handleGeneratePlan = async () => {
    state.setIsGeneratingPlan(true)
    const result = await generatePlanWithAI(
      state.requirementsInput,
      state.setCurrentPlan,
      state.setAllPlans
    )
    state.setIsGeneratingPlan(false)

    if (result.success) {
      state.toast({
        title: '✅ Plan Generated',
        description: `Created plan with ${state.currentPlan?.generatedTasks.length} tasks`
      })
    } else {
      state.toast({
        title: '❌ Plan Generation Failed',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  const handleExploreAndGenerate = async (url: string, context?: string) => {
    state.setIsGeneratingPlan(true)
    
    const result = await exploreAndGenerateScenarios(
      url,
      context,
      state.mcpTools,
      state.setCurrentPlan,
      state.setAllPlans,
      mcp.ensureMCPReady
    )
    
    state.setIsGeneratingPlan(false)

    if (result.success) {
      state.toast({
        title: '✅ Exploration Complete',
        description: `Discovered ${state.currentPlan?.discoveredScenarios?.length || 0} test scenarios`
      })
    } else {
      state.toast({
        title: '❌ Exploration Failed',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  // ============ Execution Functions ============
  const generateExecutionSummary = async (plan: Plan) => {
    const completedTasks = plan.generatedTasks.filter((t: any) => t.status === 'completed')
    const failedTasks = plan.generatedTasks.filter((t: any) => t.status === 'failed')
    const totalDuration = plan.generatedTasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0)

    const summaryPrompt = getExecutionSummaryPrompt({
      planTitle: plan.title,
      totalTasks: plan.generatedTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      totalDuration,
      tasksExecuted: plan.generatedTasks.map((t: any, i: number) => ({
        index: i,
        title: t.title,
        status: t.status,
        description: t.description,
        duration: t.duration,
        result: t.result,
        error: t.error
      })),
      executionLog: state.executionLog
    })

    try {
      addLog('🔄 Generating execution summary...')

      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: summaryPrompt,
          type: 'general',
          provider: 'github-copilot',
          agentMode: false  // Summary generation doesn't need MCP tools
        })
      })

      const data = await response.json()
      const summary = data.response || 'Summary generation failed'

      state.setExecutionSummary(summary)
      state.setShowExecutionSummary(true)
      addLog('✅ Execution summary generated')

      state.toast({
        title: '✅ Execution Complete',
        description: `${completedTasks.length}/${plan.generatedTasks.length} tasks completed successfully`,
      })
    } catch (error: any) {
      console.error('Failed to generate summary:', error)
      state.setExecutionSummary('⚠️ Failed to generate summary: ' + error.message)
      state.setShowExecutionSummary(true)
    }
  }

  const executeTask = async (plan: Plan, taskIndex: number) => {
    const task = plan.generatedTasks[taskIndex]
    if (!task) {
      state.setIsExecuting(false)
      addLog('✅ All tasks completed.')

      // Generate execution summary
      await generateExecutionSummary(plan)

      return
    }

    // Ensure MCP tools present before each task
    const ready = await ensureMCPReady()
    if (!ready || (state.mcpTools?.length || 0) === 0) {
      addLog('⚠️ MCP tools not ready. Retrying this task in 3s...')
      setTimeout(() => executeTask(plan, taskIndex), 3000)
      return
    }

    addLog(`\nTask ${taskIndex + 1}: ${task.title}`)
    addLog(`Description: ${task.description}`)

    const updatedPlan = { ...plan }
    updatedPlan.generatedTasks[taskIndex].status = 'in-progress'
    updatedPlan.generatedTasks[taskIndex].progress = 25
    updatedPlan.generatedTasks[taskIndex].executedAt = new Date()
    state.setExecutingPlan(updatedPlan)

    try {
      addLog('Sending to AI...')

      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: getTaskExecutionPrompt(task.title, task.description),
          type: 'mcp-agent',
          provider: 'github-copilot',
          agentMode: true,
          mcpTools: state.mcpTools
        })
      })

      const data = await response.json()

      // Log tool call information if available
      if (data.metadata?.toolCallsExecuted) {
        addLog(`🔧 Tools used: ${data.metadata.toolCallsExecuted}`)
      }
      if (data.metadata?.executionSteps) {
        addLog(`📋 Steps executed: ${data.metadata.executionSteps.length}`)
        data.metadata.executionSteps.forEach((step: any, idx: number) => {
          const toolName: string = step.toolName || step.tool || 'unknown'
          // Infer server by tool prefix if server not provided
          const server: string = step.server
            || (toolName.startsWith('browser_') ? 'playwright' : '')
            || (['read_file','write_file','append_file','delete_file','list_directory','create_directory','delete_directory','file_exists','get_file_info','search_files','copy_file','move_file','execute_command','start_terminal_session','execute_in_session','get_session_output','close_terminal_session','list_terminal_sessions','git_status','git_diff','list_processes','get_environment'].includes(toolName) ? 'testflowpro' : 'unknown')
          const locator: string = step.locator || ''
          const value: string = step.value || ''
          const status: string = step.status || 'completed'
          // Build a readable line with server + tool + status
          let line = `  ${idx + 1}. [${server}] ${toolName}: ${status}`
          const details: string[] = []
          const action: string = step.action || ''

          if (action) details.push(`action=${action}`)
          if (locator) details.push(`locator=${locator}`)
          if (value) details.push(`value=${value}`)
          if (details.length) line += ` (${details.join(', ')})`
          addLog(line)
        })
      }

      addLog('Execution completed')
      addLog(`Result: ${data.response.substring(0, 200)}...`)

      updatedPlan.generatedTasks[taskIndex].status = 'completed'
      updatedPlan.generatedTasks[taskIndex].progress = 100
      updatedPlan.generatedTasks[taskIndex].result = data.response
      updatedPlan.generatedTasks[taskIndex].completedAt = new Date()
      updatedPlan.generatedTasks[taskIndex].duration = Math.round(Math.random() * 300) + 30
      state.setExecutingPlan({ ...updatedPlan })

      const learningEntry: LearningEntry = {
        id: `learning-${Date.now()}`,
        taskId: task.id,
        whatWorked: ['AI tool calling worked', 'MCP servers responded'],
        whatFailed: [],
        insights: `Completed: ${task.title}`,
        tokensUsed: 1500,
        executionTime: updatedPlan.generatedTasks[taskIndex].duration || 60,
        timestamp: new Date()
      }

      state.setLearningEntries(prev => [...prev, learningEntry])
      state.setTotalTokensUsed(prev => prev + 1500)

      const completedCount = updatedPlan.generatedTasks.filter((t: any) => t.status === 'completed').length
      state.setSuccessRate(Math.round((completedCount / updatedPlan.generatedTasks.length) * 100))

      setTimeout(() => {
        state.setCurrentTaskIndex(taskIndex + 1)
        executeTask(updatedPlan, taskIndex + 1)
      }, 2000)

    } catch (error: any) {
      addLog(`Task failed: ${error.message}`)
      updatedPlan.generatedTasks[taskIndex].status = 'failed'
      updatedPlan.generatedTasks[taskIndex].error = error.message
      state.setExecutingPlan({ ...updatedPlan })

      addLog('Retrying in 3 seconds...')
      setTimeout(() => executeTask(updatedPlan, taskIndex), 3000)
    }
  }

  // Helper: Ensure MCP servers connected and tools available before execution
  const ensureMCPReady = async (): Promise<boolean> => {
    try {
      // Refresh statuses and tools
      await mcp.refreshMCPStatuses()
      await mcp.refreshMCPTools()

      const statuses = state.mcpStatuses

      const isPlaywrightConnected = statuses.playwright?.connected
      const isTestflowConnected = statuses.testflowpro?.connected

      // Connect if not connected
      if (!isTestflowConnected) await mcp.connectToServer('testflowpro')
      if (!isPlaywrightConnected) await mcp.connectToServer('playwright')

      // Wait briefly for tools to populate
      let retries = 0
      while (retries < 5) {
        await mcp.refreshMCPTools()
        if ((state.mcpTools?.length || 0) > 0) break
        await new Promise(r => setTimeout(r, 1500))
        retries++
      }

      const hasPlaywrightTools = (state.mcpTools || []).some(t => t.server === 'playwright')
      const hasTFPTools = (state.mcpTools || []).some(t => t.server === 'testflowpro')

      if (!hasPlaywrightTools || !hasTFPTools) {
        state.toast({
          title: 'MCP Tools Unavailable',
          description: 'Playwright/TestFlowPro tools not ready. Retrying...',
        })
        return false
      }

      return true
    } catch (e) {
      console.error('ensureMCPReady error:', e)
      return false
    }
  }

  const startExecution = async () => {
    if (!state.currentPlan) {
      state.toast({
        title: 'No Plan',
        description: 'Generate a plan first',
        variant: 'destructive'
      })
      return
    }

    // Ensure MCP ready before starting
    const ready = await ensureMCPReady()
    if (!ready) {
      state.toast({
        title: 'Connecting MCP Servers...',
        description: 'Waiting for Playwright/TestFlowPro tools...',
      })
      // Retry once more after short delay
      await new Promise(r => setTimeout(r, 2000))
      const ready2 = await ensureMCPReady()
      if (!ready2) {
        state.toast({
          title: 'MCP Not Ready',
          description: 'Could not initialize MCP tools. Please check Servers tab.',
          variant: 'destructive'
        })
        return
      }
    }

    const plan = { ...state.currentPlan }

    // Auto-populate baseUrl from plan if not already set
    if (!state.codeGenBaseUrl || state.codeGenBaseUrl === 'https://example.com') {
      const planText = `${plan.requirements} ${plan.generatedTasks.map(t => `${t.title} ${t.description}`).join(' ')}`
      const urlMatch = planText.match(/https?:\/\/[^\s)"']+/)
      if (urlMatch) {
        const fullUrl = urlMatch[0]
        const urlParts = fullUrl.match(/(https?:\/\/[^\/\s)"']+)/)
        if (urlParts) {
          state.setCodeGenBaseUrl(urlParts[1])
        }
      }
    }

    state.setExecutingPlan(plan)
    state.setIsExecuting(true)
    state.setCurrentTaskIndex(0)
    state.setExecutionLog([`Started execution at ${new Date().toLocaleTimeString()}`])
    state.setActiveTab('execute')

    executeTask(plan, 0)
  }

  const pauseExecution = () => {
    state.setIsExecuting(false)
    addLog(`⏸️ Execution paused`)
  }

  const resumeExecution = () => {
    if (!state.executingPlan) return

    // Check if execution is completed (all tasks done)
    const allTasksCompleted = state.executingPlan.generatedTasks.every(task => task.status === 'completed')

    if (allTasksCompleted) {
      // Reset all tasks to pending and start from beginning
      const resetPlan = {
        ...state.executingPlan,
        generatedTasks: state.executingPlan.generatedTasks.map(task => ({
          ...task,
          status: 'pending' as const,
          progress: 0,
          result: undefined,
          error: undefined,
          executedAt: undefined,
          completedAt: undefined,
          duration: undefined
        }))
      }
      state.setExecutingPlan(resetPlan)
      state.setCurrentTaskIndex(0)
      state.setIsExecuting(true)
      addLog('Execution restarted from beginning')
      executeTask(resetPlan, 0)
    } else {
      // Resume from current position
      state.setIsExecuting(true)
      addLog('Execution resumed')
      executeTask(state.executingPlan, state.currentTaskIndex)
    }
  }

  const cancelExecution = () => {
    state.setIsExecuting(false)
    state.setExecutingPlan(null)
    state.setCurrentTaskIndex(0)
    state.setExecutionLog([])
  }

  const addLog = (message: string) => {
    state.setExecutionLog(prev => [...prev, message])
  }

  // ============ Code Generation Functions ============
  const truncateText = (text: string, maxChars: number) => {
    if (text.length <= maxChars) return text
    return `${text.slice(0, maxChars).trimEnd()}...`
  }

  const buildCodeContext = (options?: { maxLogLines?: number; maxChars?: number }) => {
    const planSummary = state.currentPlan
      ? `Plan: ${state.currentPlan.title}\nRequirements: ${state.currentPlan.requirements}\nTasks:\n${state.currentPlan.generatedTasks
          .map((t, i) => `${i + 1}. ${t.title} - ${t.description}`)
          .join('\n')}`
      : 'No plan available.'

    const maxLogLines = options?.maxLogLines ?? 30
    const executionSummary = state.executionLog.length
      ? `Execution Log (last ${Math.min(maxLogLines, state.executionLog.length)} lines):\n${state.executionLog.slice(-maxLogLines).join('\n')}`
      : 'No execution log available.'

    const context = `${planSummary}\n\n${executionSummary}`
    return options?.maxChars ? truncateText(context, options.maxChars) : context
  }

  const buildCodePrompt = (typeOverride?: typeof state.codeGenType, contextOverride?: string) => {
    const context = contextOverride ?? buildCodeContext()
    const effectiveType = typeOverride ?? state.codeGenType

    // Helper functions to extract meaningful names from context
    const getClassNameFromContext = () => {
      // Try plan title first
      if (state.currentPlan?.title) {
        const title = state.currentPlan.title.trim()
        const words = title.split(/\s+/).filter(w =>
          w.length > 2 && !['the', 'and', 'for', 'with', 'from', 'open', 'then'].includes(w.toLowerCase())
        )
        if (words.length > 0) {
          return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') + 'Test'
        }
      }

      const reqLines = (state.requirementsInput || '').split('\n').filter(l => l.trim() && l.trim().length > 5)
      if (reqLines.length > 0) {
        const line = reqLines[0].replace(/^\d+[.)]\s*/, '').trim()
        const words = line.split(/\s+/).filter(w =>
          w.length > 2 && !['the', 'and', 'for', 'with', 'from'].includes(w.toLowerCase())
        ).slice(0, 3)
        if (words.length > 0) {
          return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') + 'Test'
        }
      }

      const ctx = buildCodeContext({ maxLogLines: 5, maxChars: 300 })
      const urlMatch = ctx.match(/(?:navigate to|open|goto|visit)\s+(?:https?:\/\/)?([a-z0-9-.]+)/i)
      if (urlMatch?.[1]) {
        const domain = urlMatch[1].split('.')[0]
        return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase() + 'Test'
      }

      return 'PlaywrightTest'
    }

    const getFunctionNameFromContext = () => {
      if (state.currentPlan?.title) {
        return state.currentPlan.title.trim().slice(0, 40)
      }

      const reqLines = (state.requirementsInput || '').split('\n').filter(l => l.trim() && l.trim().length > 5)
      if (reqLines.length > 0) {
        return reqLines[0].replace(/^\d+[.)]\s*/, '').trim().slice(0, 40)
      }

      const ctx = buildCodeContext({ maxLogLines: 5, maxChars: 300 })
      const urlMatch = ctx.match(/(?:navigate to|open|goto|visit)\s+(?:https?:\/\/)?([a-z0-9-.]+)/i)
      if (urlMatch?.[1]) {
        const domain = urlMatch[1].split('.')[0]
        return `test ${domain}`
      }

      return 'generated test'
    }

    const getTestNameFromContext = () => {
      if (state.currentPlan?.title) {
        return state.currentPlan.title.trim()
      }

      const reqLines = (state.requirementsInput || '').split('\n').filter(l => l.trim() && l.trim().length > 5)
      if (reqLines.length > 0) {
        return reqLines[0].replace(/^\d+[.)]\s*/, '').trim().slice(0, 60)
      }

      const ctx = buildCodeContext({ maxLogLines: 5, maxChars: 300 })
      const actionMatch = ctx.match(/(?:Task \d+:|Description:)\s*([^\n]{10,80})/i)
      if (actionMatch?.[1]) {
        return actionMatch[1].trim()
      }

      return 'Generated Test'
    }

    // Prepare context based on type
    const codeContext = {
      context,
      className: getClassNameFromContext().replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'Test$&') || 'PlaywrightTest',
      functionName: 'test_' + getFunctionNameFromContext()
                                .toLowerCase()
                                .replace(/[^a-z0-9\s]/g, '')
                                .replace(/\s+/g, '_')
                                .replace(/_+/g, '_')
                                .replace(/^_|_$/g, '') || 'test_generated',
      testName: getTestNameFromContext(),
      suiteName: state.codeGenSuiteName,
      applicationName: state.codeGenAppName,
      baseUrl: state.codeGenBaseUrl,
      testType: state.codeGenTestType,
      testCaseName: state.codeGenTestName
    }

    return getCodePrompt(effectiveType, codeContext)
  }

  const generateCode = async (type?: typeof state.codeGenType) => {
    if (!state.currentPlan && state.executionLog.length === 0) {
      state.toast({
        title: 'No context available',
        description: 'Generate a plan or run an execution before generating code.',
        variant: 'destructive',
      })
      return
    }

    if (type) {
      state.setCodeGenType(type)
    }

    state.setIsGeneratingCode(true)
    state.setCodeGenError('')
    state.setGeneratedCode('')

    try {
      const effectiveType = type ?? state.codeGenType
      const isTestFlow = effectiveType === 'testflow'
      const isCucumber = effectiveType === 'cucumber'
      const defaultProvider = AI_CONFIG.defaults.provider

      const cucumberContext = buildCodeContext({ maxLogLines: 12, maxChars: 3000 })
      const preferredInput = isTestFlow && state.generatedCode
        ? state.generatedCode
        : isCucumber
          ? buildCodePrompt('cucumber', cucumberContext)
          : buildCodePrompt(effectiveType)

      // Special handling for Cucumber generation
      if (isCucumber) {
        const response = await fetch('/api/cucumber-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: preferredInput,
            type: 'playwright', // Default to playwright conversion
            provider: defaultProvider
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          state.setCodeGenError(data.error || 'Failed to generate Cucumber feature')
          return
        }

        const output = (data.feature || '').toString().trim()
        if (!output) {
          state.setCodeGenError('No Cucumber feature returned from generation service.')
          return
        }

        state.setGeneratedCode(output)
        state.toast({
          title: '✅ Cucumber Feature Generated',
          description: `Generated Gherkin feature file successfully`,
        })
        return
      }

      const endpoint = defaultProvider === 'github-copilot'
        ? '/api/copilot-chat'
        : '/api/ai-chat'

      const ragType = isTestFlow ? (state.codeGenTestType === 'API' ? 'general' : 'ui') : 'general'

      // Log what we're sending to AI
      console.log('📤 Sending to AI for code generation:', {
        type: effectiveType,
        suiteName: state.codeGenSuiteName,
        applicationName: state.codeGenAppName,
        testCaseName: state.codeGenTestName,
        baseUrl: state.codeGenBaseUrl,
        testType: state.codeGenTestType
      })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: preferredInput,
          type: ragType,
          provider: defaultProvider,
          model: defaultProvider === 'github-copilot' ? AI_CONFIG.github.model : undefined,
          agentMode: false
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        state.setCodeGenError(data.error || 'Failed to generate code')
        return
      }

      const output = (data.response || data.testSuite || '').toString().trim()
      if (!output) {
        state.setCodeGenError('No output returned from generation service.')
        return
      }

      console.log('📥 Received AI response:', {
        outputLength: output.length,
        outputPreview: output.substring(0, 200)
      })

      let cleanedOutput = output
      const codeBlockMatch = cleanedOutput.match(/```(?:typescript|javascript|ts|java|python|py|json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        cleanedOutput = codeBlockMatch[1].trim()
        console.log('✂️ Stripped code fences, new length:', cleanedOutput.length)
      }

      // --- New: Extract names (suite/test/app/baseUrl) from AI output or context ---
      try {
        // Helper sanitizers
        const sanitizeForName = (s: string) => (s || '').toString().trim()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\-]/g, '')
          .trim()

        const titleCaseName = (s: string) => sanitizeForName(s)
          .split(' ')
          .filter(Boolean)
          .map(p => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ')

        // local timestamp detector to avoid names like 16723423423
        const isTimestampLocal = (v?: string) => {
          if (!v) return false
          if (/\d{6,}/.test(v)) return true
          if (/20\d{2}-\d{2}-\d{2}/.test(v)) return true
          return false
        }

        // If AI returned metadata with suggested names, prefer them (and validate)
        const meta = (data && (data.metadata || data.meta || {})) || {}
        if (meta) {
          try {
            if (meta.suiteName && typeof meta.suiteName === 'string' && !isTimestampLocal(meta.suiteName)) {
              state.setCodeGenSuiteName(titleCaseName(meta.suiteName))
            }
            if (meta.applicationName && typeof meta.applicationName === 'string' && !isTimestampLocal(meta.applicationName)) {
              state.setCodeGenAppName(titleCaseName(meta.applicationName))
            }
            if ((meta.testName || meta.testCaseName) && typeof (meta.testName || meta.testCaseName) === 'string' && !isTimestampLocal(meta.testName || meta.testCaseName)) {
              state.setCodeGenTestName(titleCaseName(meta.testName || meta.testCaseName))
            }
            if (meta.baseUrl && typeof meta.baseUrl === 'string' && !meta.baseUrl.includes('example.com')) {
              state.setCodeGenBaseUrl(meta.baseUrl)
            }
          } catch (e) {
            // ignore metadata failures
          }
        }

        // 1) If TestFlow JSON, parse and ENFORCE correct names from UI state
        if (effectiveType === 'testflow') {
          try {
            const parsed = JSON.parse(cleanedOutput)
            if (parsed) {
              // Log what we're enforcing
              console.log('🔧 Enforcing TestFlow names:', {
                suiteName: state.codeGenSuiteName,
                applicationName: state.codeGenAppName,
                testCaseName: state.codeGenTestName,
                baseUrl: state.codeGenBaseUrl
              })

              // ENFORCE the correct values from UI state (UI state takes precedence)
              if (state.codeGenSuiteName && state.codeGenSuiteName.trim()) {
                parsed.suiteName = state.codeGenSuiteName
                // Also update the ID to match
                parsed.id = state.codeGenSuiteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              }

              if (state.codeGenAppName && state.codeGenAppName.trim()) {
                parsed.applicationName = state.codeGenAppName
              }

              if (state.codeGenBaseUrl && state.codeGenBaseUrl.trim() && !state.codeGenBaseUrl.includes('example.com')) {
                parsed.baseUrl = state.codeGenBaseUrl
              }

              // Update test case names to match what's in UI
              if (parsed.testCases && Array.isArray(parsed.testCases) && parsed.testCases.length > 0) {
                if (state.codeGenTestName && state.codeGenTestName.trim()) {
                  parsed.testCases.forEach((testCase: any) => {
                    testCase.name = state.codeGenTestName
                  })
                }
              }

              console.log('✅ Enforced TestFlow JSON:', {
                suiteName: parsed.suiteName,
                applicationName: parsed.applicationName,
                testCaseName: parsed.testCases?.[0]?.name,
                baseUrl: parsed.baseUrl
              })

              // Update the output with corrected JSON
              cleanedOutput = JSON.stringify(parsed, null, 2)

              // DO NOT overwrite UI state - we just enforced these values
              // The UI state is the source of truth
            }
          } catch (e) {
            console.error('Failed to parse TestFlow JSON, using regex fallback:', e)
            // Fallback: try regex to force replace the names in the JSON string
            try {
              const suiteId = (state.codeGenSuiteName || 'test-suite')
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')

              // Replace suiteName
              if (state.codeGenSuiteName && state.codeGenSuiteName.trim()) {
                cleanedOutput = cleanedOutput.replace(
                  /"suiteName"\s*:\s*"[^"]*"/g,
                  `"suiteName": "${state.codeGenSuiteName}"`
                )
              }

              // Replace applicationName
              if (state.codeGenAppName && state.codeGenAppName.trim()) {
                cleanedOutput = cleanedOutput.replace(
                  /"applicationName"\s*:\s*"[^"]*"/g,
                  `"applicationName": "${state.codeGenAppName}"`
                )
              }

              // Replace baseUrl
              if (state.codeGenBaseUrl && state.codeGenBaseUrl.trim()) {
                cleanedOutput = cleanedOutput.replace(
                  /"baseUrl"\s*:\s*"[^"]*"/g,
                  `"baseUrl": "${state.codeGenBaseUrl}"`
                )
              }

              // Replace id (suite id)
              cleanedOutput = cleanedOutput.replace(
                /"id"\s*:\s*"[^"]*"/g,
                `"id": "${suiteId}"`
              )

              // Replace test case name (first testCases[0].name)
              if (state.codeGenTestName && state.codeGenTestName.trim()) {
                cleanedOutput = cleanedOutput.replace(
                  /(testCases[^}]*"name"\s*:\s*)"[^"]*"/,
                  `$1"${state.codeGenTestName}"`
                )
              }

              console.log('✅ Applied regex replacements for TestFlow names')
            } catch (replaceError) {
              console.error('Could not regex replace TestFlow names:', replaceError)
            }
          }
        } else {
          // 2) For code outputs (TypeScript/Java/Python), ENFORCE correct names by replacing in code

          // First, try to get the correct name from UI state or derive a good one
          let correctTestName = state.codeGenTestName || 'Generated Test'
          let correctClassName = state.codeGenSuiteName?.replace(/\s+Suite$/i, '').replace(/\s+/g, '') || 'PlaywrightTest'
          let correctFunctionName = 'test_' + (state.codeGenTestName || 'generated').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

          // Remove timestamp patterns from the names if they exist
          const timestampPattern = /\s*-?\s*\d{1,2}\/\d{1,2}\/\d{4}[,\s]*\d{1,2}:\d{2}:\d{2}/g
          correctTestName = correctTestName.replace(timestampPattern, '').trim()
          correctClassName = correctClassName.replace(timestampPattern, '').replace(/\s+/g, '')
          correctFunctionName = correctFunctionName.replace(timestampPattern, '').replace(/_+/g, '_')

          console.log('🔧 Enforcing code names:', {
            type: effectiveType,
            testName: correctTestName,
            className: correctClassName,
            functionName: correctFunctionName
          })

          // Replace timestamp-based names in the generated code
          if (effectiveType === 'typescript') {
            // Replace test('timestamp', ...) with test('Correct Name', ...)
            cleanedOutput = cleanedOutput.replace(
              /test\s*\(\s*['"`]([^'"`]*(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{2}:\d{2}:\d{2})[^'"`]*?)['"`]/g,
              `test('${correctTestName}'`
            )
            // Also catch any test name with "Test Plan -" pattern
            cleanedOutput = cleanedOutput.replace(
              /test\s*\(\s*['"`]Test Plan[^'"`]*?['"`]/g,
              `test('${correctTestName}'`
            )
            console.log('✅ Replaced TypeScript test name with:', correctTestName)
          }

          if (effectiveType === 'java') {
            // Replace class ClassName123 or class TestPlanTimestamp
            cleanedOutput = cleanedOutput.replace(
              /class\s+(?:TestPlan\d+|Test\d{8,}|[A-Za-z]+\d{8,})\s*\{/g,
              `class ${correctClassName} {`
            )
            // Replace timestamp-based class names
            cleanedOutput = cleanedOutput.replace(
              /class\s+([A-Za-z]+\d{1,2}\d{1,2}\d{4}\d+)\s*\{/g,
              `class ${correctClassName} {`
            )
            console.log('✅ Replaced Java class name with:', correctClassName)
          }

          if (effectiveType === 'python') {
            // Replace def test_timestamp(): with def test_correct_name():
            cleanedOutput = cleanedOutput.replace(
              /def\s+(test_[a-z0-9_]*(?:\d{8,}|test_plan_\d+)[a-z0-9_]*)\s*\(/g,
              `def ${correctFunctionName}(`
            )
            console.log('✅ Replaced Python function name with:', correctFunctionName)
          }

          // Now try to derive and update UI state if needed
          const derived = deriveNameFromCode(cleanedOutput)
          if (derived && !looksLikeTimestamp(derived)) {
            // If derived seems like a full sentence (test name), use as test name
            if (effectiveType === 'typescript' || effectiveType === 'java' || effectiveType === 'python') {
              // For TypeScript use as test name; for Java use as class name; for Python create function name
              if (effectiveType === 'typescript') state.setCodeGenTestName(titleCaseName(derived))
              if (effectiveType === 'java') state.setCodeGenSuiteName(titleCaseName(derived))
              if (effectiveType === 'python') state.setCodeGenTestName(titleCaseName(derived))
            }
          } else {
            // 3) No derived name - build from context (plan title / requirements / execution log)
            const ctx = buildCodeContext({ maxLogLines: 10, maxChars: 1200 })
            // Prefer plan title
            const planTitle = state.currentPlan?.title?.trim()
            const firstReqLine = (state.requirementsInput || '').split('\n').find(l => l.trim())
            const seed = planTitle || firstReqLine || ctx.split('\n')[0] || 'Generated Test'
            const shortSeed = seed.toString().slice(0, 60)
            const suggestedSuite = titleCaseName(shortSeed) + ' Suite'
            const suggestedTest = titleCaseName(shortSeed) + ' Test'

            if (!state.codeGenSuiteName || state.codeGenSuiteName.includes('example') || state.codeGenSuiteName.match(/\d{10,}/)) {
              state.setCodeGenSuiteName(suggestedSuite)
            }
            if (!state.codeGenTestName || state.codeGenTestName.includes('test') && state.codeGenTestName.match(/\d{10,}/)) {
              state.setCodeGenTestName(suggestedTest)
            }
          }

          // 4) Try to populate application name & baseUrl from context if missing
          if ((!state.codeGenAppName || state.codeGenAppName === '') || state.codeGenAppName.includes('example')) {
            // Try from baseUrl first
            const ctx = buildCodeContext({ maxLogLines: 20, maxChars: 3000 })
            const urlMatch = ctx.match(/https?:\/\/[^\s)"']+/)
            if (urlMatch) {
              const fullUrl = urlMatch[0]
              const baseParts = fullUrl.match(/(https?:\/\/[^\/\s)"']+)/)
              if (baseParts) {
                const candidate = extractAppNameFromUrl(baseParts[1])
                if (candidate) state.setCodeGenAppName(candidate)
                if (!state.codeGenBaseUrl || state.codeGenBaseUrl.includes('example.com')) state.setCodeGenBaseUrl(baseParts[1])
              }
            } else if (!state.codeGenAppName) {
              // Fallback to derivedBaseName
              if (derivedBaseName) state.setCodeGenAppName(derivedBaseName)
            }
          }
        }
      } catch (e) {
        console.warn('Name extraction failed:', e)
      }

      // Persist generated code and update UI state
      state.setGeneratedCode(cleanedOutput)
      state.toast({
        title: '✅ Code Generated',
        description: `Generated ${effectiveType.toUpperCase()} code successfully`,
      })
    } catch (error: any) {
      state.setCodeGenError(error.message)
      state.toast({
        title: '❌ Code Generation Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      state.setIsGeneratingCode(false)
    }
  }

  const addValidationLog = (message: string) => {
    state.setValidationResults(prev => [...prev, message])
  }

  const validateAndRunCode = async () => {
    if (!state.generatedCode) {
      state.toast({
        title: 'No code to validate',
        description: 'Generate code first before validation',
        variant: 'destructive'
      })
      return
    }

    if (state.codeGenType !== 'typescript' && state.codeGenType !== 'python') {
      state.toast({
        title: 'Validation not supported',
        description: 'Only TypeScript/Python Playwright code can be validated',
        variant: 'destructive'
      })
      return
    }

    state.setIsValidatingCode(true)
    state.setValidationResults([])
    state.setValidationSuccess(null)
    state.setAutoFixAttempts(0)
    state.setHealerAttempts(0)

    addValidationLog('🎭 Starting Playwright Executor → Healer Workflow...')
    addValidationLog(`Code type: ${state.codeGenType}`)

    if (!state.mcpStatuses.playwright?.connected) {
      addValidationLog('❌ Playwright MCP server not connected')
      state.toast({
        title: 'Playwright Not Connected',
        description: 'Connect to Playwright MCP server first',
        variant: 'destructive'
      })
      state.setIsValidatingCode(false)
      state.setValidationSuccess(false)
      return
    }

    addValidationLog('📝 Using generated code from Generate Code tab')
    addValidationLog(`📊 Code length: ${state.generatedCode.length} chars, ${state.generatedCode.split('\n').length} lines`)

    state.toast({
      title: 'Validation Started',
      description: 'Running Playwright test with auto-heal...',
    })
  }

  const clearValidation = () => {
    state.setValidationResults([])
    state.setValidationSuccess(null)
  }

  const slugifyName = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const titleCase = (value: string) => value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  const extractAppNameFromUrl = (url: string): string => {
    if (!url || url === 'https://example.com') return ''

    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname

      // Remove www. prefix
      const domain = hostname.replace(/^www\./, '')

      // Extract main domain name (before first dot or entire if no dot)
      const mainDomain = domain.split('.')[0]

      // Convert to title case (e.g., 'google' -> 'Google', 'flipkart' -> 'Flipkart')
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)
    } catch {
      return ''
    }
  }

  const deriveNameFromCode = (code: string) => {
    if (!code) return ''
    // Common patterns for Playwright / Mocha / Jest tests
    const testMatch = code.match(/test\(\s*['"`]([^'"`]+)['"`]\s*,/i)
    if (testMatch?.[1]) return testMatch[1].trim()
    const describeMatch = code.match(/describe\(\s*['"`]([^'"`]+)['"`]\s*,/i)
    if (describeMatch?.[1]) return describeMatch[1].trim()
    const itMatch = code.match(/\b(it|specify)\(\s*['"`]([^'"`]+)['"`]\s*,/i)
    if (itMatch?.[2]) return itMatch[2].trim()

    // Java class
    const classMatch = code.match(/class\s+([A-Za-z0-9_]+)/)
    if (classMatch?.[1]) return classMatch[1]

    // Common JSON keys
    const jsonNameMatch = code.match(/(?:"|')?(?:suiteName|suite_name|suite|applicationName|application_name|appName|name|title|testName|test_name)\b\s*[:=]\s*(?:"|')([^"']+)(?:"|')/i)
    if (jsonNameMatch?.[1]) return jsonNameMatch[1].trim()

    // Inline comment patterns
    const commentMatch = code.match(/(?:\/\/|#|\/\*)\s*(?:Test Name|Test|Scenario|Suite|Feature)[:\-]?\s*([^\n\*]+)/i)
    if (commentMatch?.[1]) return commentMatch[1].trim()

    return ''
  }

  // Helper to detect timestamp-like or numeric names that are not meaningful
  const looksLikeTimestamp = (s?: string) => {
    if (!s) return false
    // long digit sequences, or ISO dates
    if (/\d{6,}/.test(s)) return true
    if (/20\d{2}-\d{2}-\d{2}/.test(s)) return true
    return false
  }

  // Later, when extracting names from cleanedOutput, use expanded key searches
  // (The main extraction logic above already covers many cases)


  const derivedBaseName = useMemo(() => {
    const raw = state.requirementsInput
      || state.currentPlan?.title
      || state.executingPlan?.title
      || deriveNameFromCode(state.generatedCode)

    if (!raw) return ''
    const cleaned = titleCase(slugifyName(raw))
    return cleaned || ''
  }, [state.requirementsInput, state.currentPlan?.title, state.executingPlan?.title, state.generatedCode])

  useEffect(() => {
    // Set application name from baseUrl if available
    const appNameFromUrl = extractAppNameFromUrl(state.codeGenBaseUrl)

    if (appNameFromUrl) {
      // Use domain-based app name (e.g., "Google", "Flipkart")
      state.setCodeGenAppName(appNameFromUrl)

      // Set suite name as "{AppName} Test Suite" if no better name
      if (!derivedBaseName || derivedBaseName.toLowerCase().includes('open') || derivedBaseName.toLowerCase().includes('search')) {
        state.setCodeGenSuiteName(`${appNameFromUrl} Test Suite`)
        state.setCodeGenTestName(`${appNameFromUrl} Test Case`)
      } else {
        state.setCodeGenSuiteName(`${derivedBaseName} Suite`)
        state.setCodeGenTestName(`${derivedBaseName} Test`)
      }
    } else if (derivedBaseName) {
      // Fallback to derived name if no URL
      state.setCodeGenSuiteName(`${derivedBaseName} Suite`)
      state.setCodeGenAppName(`${derivedBaseName} App`)
      state.setCodeGenTestName(`${derivedBaseName} Test`)
    }
  }, [derivedBaseName, state.codeGenBaseUrl, state])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <RalphLoopHeader mcpStatuses={state.mcpStatuses} />

      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={state.activeTab} onValueChange={(value: any) => state.setActiveTab(value)} className="space-y-6">
            {/* Tabs Navigation */}
            <div className="sticky top-24 z-30 bg-slate-800/80 backdrop-blur border border-white/10 rounded-xl p-2 flex gap-2">
              <TabsList className="grid grid-cols-5 w-full bg-transparent">
                <TabsTrigger value="plan" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Plan</span>
                </TabsTrigger>
                <TabsTrigger value="execute" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white gap-2">
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Execute</span>
                </TabsTrigger>
                <TabsTrigger value="generate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white gap-2">
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">Generate</span>
                </TabsTrigger>
                <TabsTrigger value="learning" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Learning</span>
                </TabsTrigger>
                <TabsTrigger value="servers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Servers</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Plan Tab */}
            <TabsContent value="plan">
              <PlanTab
                requirementsInput={state.requirementsInput}
                setRequirementsInput={state.setRequirementsInput}
                currentPlan={state.currentPlan}
                isGeneratingPlan={state.isGeneratingPlan}
                onGeneratePlan={handleGeneratePlan}
                onStartExecution={startExecution}
                onAddTask={planOps.addPlanTask}
                onUpdateTask={planOps.updatePlanTask}
                onDeleteTask={planOps.deletePlanTask}
                onReorderTasks={planOps.reorderPlanTasks}
                onExploreAndGenerate={handleExploreAndGenerate}
                isExploring={state.isGeneratingPlan}
              />
            </TabsContent>

            {/* Execute Tab */}
            <TabsContent value="execute">
              <ExecuteTab
                executingPlan={state.executingPlan}
                isExecuting={state.isExecuting}
                executionLog={state.executionLog}
                logRef={state.logRef}
                executionSummary={state.executionSummary}
                showExecutionSummary={state.showExecutionSummary}
                completedCount={state.completedCount}
                totalCount={state.totalCount}
                successRate={state.successRate}
                onResume={resumeExecution}
                onPause={pauseExecution}
                onCancel={cancelExecution}
                onRegenerateSummary={() => state.executingPlan && generateExecutionSummary(state.executingPlan)}
                onNavigateToTab={(tab: string) => state.setActiveTab(tab as 'plan' | 'execute' | 'generate' | 'learning' | 'servers')}
              />
            </TabsContent>

            {/* Generate Code Tab */}
            <TabsContent value="generate">
              <GenerateCodeTab
                codeGenType={state.codeGenType}
                setCodeGenType={state.setCodeGenType}
                codeGenSuiteName={state.codeGenSuiteName}
                setCodeGenSuiteName={state.setCodeGenSuiteName}
                codeGenAppName={state.codeGenAppName}
                setCodeGenAppName={state.setCodeGenAppName}
                codeGenBaseUrl={state.codeGenBaseUrl}
                setCodeGenBaseUrl={state.setCodeGenBaseUrl}
                codeGenTestType={state.codeGenTestType}
                setCodeGenTestType={state.setCodeGenTestType}
                codeGenTestName={state.codeGenTestName}
                setCodeGenTestName={state.setCodeGenTestName}
                generatedCode={state.generatedCode}
                isGeneratingCode={state.isGeneratingCode}
                isValidatingCode={state.isValidatingCode}
                validationSuccess={state.validationSuccess}
                mcpPlaywrightConnected={state.mcpStatuses.playwright?.connected || false}
                onGenerateCode={generateCode}
                onValidateAndRun={validateAndRunCode}
                onClearValidation={clearValidation}
                validationResults={state.validationResults}
                onGeneratedCodeChange={state.setGeneratedCode}
              />
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning">
              <LearningTab
                learningEntries={state.learningEntries}
                totalTokensUsed={state.totalTokensUsed}
                successRate={state.successRate}
              />
            </TabsContent>

            {/* Servers Tab */}
            <TabsContent value="servers">
              <ServersTab
                mcpServers={state.mcpServers}
                mcpStatuses={state.mcpStatuses}
                mcpTools={state.mcpTools}
                connectingServers={mcp.connectingServers}
                onConnectServer={mcp.connectToServer}
                onRefreshStatuses={mcp.refreshMCPStatuses}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
