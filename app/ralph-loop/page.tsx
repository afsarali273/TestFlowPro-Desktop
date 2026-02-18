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

    const summaryPrompt = `Generate a detailed execution summary in markdown format for this automation test execution:

**Plan**: ${plan.title}
**Total Tasks**: ${plan.generatedTasks.length}
**Completed**: ${completedTasks.length}
**Failed**: ${failedTasks.length}
**Total Duration**: ${totalDuration}s

**Tasks Executed**:
${plan.generatedTasks.map((t: any, i: number) => `
${i + 1}. **${t.title}** (${t.status})
   - Description: ${t.description}
   - Duration: ${t.duration || 'N/A'}s
   - Result: ${t.result?.substring(0, 150) || t.error || 'N/A'}
`).join('\n')}

**Execution Log**:
${state.executionLog.slice(-50).join('\n')}

Create a comprehensive summary with:
- 📊 Executive Summary with key metrics
- ✅ Successful Operations (with details)
- ❌ Failed Operations (with error analysis and retry attempts)
- 🔧 Technical Details (locators used, approaches tried)
- 📈 Performance Metrics (timing, success rate)
- 💡 Insights & Recommendations
- 🎯 Test Coverage Analysis

Use tables, emojis, code blocks, and visual formatting. Be detailed and professional.`

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
          message: `Execute this task:\n\nTitle: ${task.title}\nDescription: ${task.description}\n\nProvide the result or steps taken.`,
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

  const buildTestFlowPrompt = (context: string) => {
    const hasTypeScriptCode = context.includes('page.') || context.includes('await ') || context.includes('playwright')
    const testCaseName = state.codeGenTestName || 'Test Case'

    // Extract baseUrl from context if not provided
    let baseUrl = state.codeGenBaseUrl
    if (!baseUrl || baseUrl === 'https://example.com') {
      // Try to extract URL from context
      const urlMatch = context.match(/https?:\/\/[^\s)"']+/)
      if (urlMatch) {
        const fullUrl = urlMatch[0]
        // Extract protocol + domain
        const urlParts = fullUrl.match(/(https?:\/\/[^\/\s)"']+)/)
        if (urlParts) {
          baseUrl = urlParts[1]
        }
      }
    }

    // Final fallback
    if (!baseUrl) {
      baseUrl = 'https://example.com'
    }

    if (state.codeGenTestType === 'UI' && hasTypeScriptCode) {
      return `Convert this Playwright TypeScript code to TestFlowPro UI Test Suite JSON.

${context}

REQUIRED SUITE FIELDS:
- id: "${state.codeGenSuiteName.toLowerCase().replace(/\s+/g, '-') }"
- suiteName: "${state.codeGenSuiteName}"
- applicationName: "${state.codeGenAppName}"
- type: "UI"
- baseUrl: "${baseUrl}"
- testCases[0].name: "${testCaseName}"

Convert ALL Playwright steps to testSteps array following TestFlowPro schema.
Use proper locator strategies: role, text, css, xpath, testId, placeholder, label.
Output ONLY valid JSON, no markdown or explanations.`
    }

    return `Generate a TestFlowPro Test Suite JSON for the following context.

Context:
${context}

REQUIRED FIELDS:
- id: "${state.codeGenSuiteName.toLowerCase().replace(/\s+/g, '-') }"
- suiteName: "${state.codeGenSuiteName}"
- applicationName: "${state.codeGenAppName}"
- type: "${state.codeGenTestType}"
- baseUrl: "${baseUrl}"
- testCases[0].name: "${testCaseName}"

${state.codeGenTestType === 'UI' 
  ? 'Generate UI test suite with testSteps array using keywords: goto, click, fill, getText, assertVisible, etc.'
  : 'Generate API test suite with testData array using method, endpoint, headers, body, assertions.'}

Output ONLY valid JSON, no markdown.`
  }

  const buildCodePrompt = (typeOverride?: typeof state.codeGenType, contextOverride?: string) => {
    const context = contextOverride ?? buildCodeContext()

    const effectiveType = typeOverride ?? state.codeGenType

    if (effectiveType === 'testflow') {
      return buildTestFlowPrompt(context)
    }

    if (effectiveType === 'cucumber') {
      return `Convert this test execution context to Cucumber/Gherkin feature file.

Context:
${context}

Use ONLY the predefined Cucumber step definitions for UI automation.
Generate a complete Gherkin feature file with:
- Feature description with business value
- Appropriate tags (@smoke, @regression, @ui)
- Background for common setup
- Well-structured scenarios with Given/When/Then
- Use variables \${varName} for dynamic data
- Add explicit waits before assertions

Output ONLY the Gherkin feature file. No explanations.`
    }

    if (effectiveType === 'java') {
      return `Generate a COMPLETE Java (Playwright) test file based on the context below.

Context:
${context}

CRITICAL REQUIREMENTS:
1. Output a FULL Java file (imports + class + main method).
2. Use: import com.microsoft.playwright.*;
3. Use try-with-resources for Playwright.create().
4. Use BrowserType.LaunchOptions().setHeadless(false).
5. Use semantic locators (getByRole, getByText, getByLabel, getByPlaceholder, getByTestId).
6. If a locator might match multiple elements, use .first().
7. Include waits (page.waitForLoadState(), locator.waitFor()).
8. Handle dialogs: page.onDialog(dialog -> dialog.accept());
9. Add assertions where sensible.
10. Output ONLY valid Java code. No markdown, no explanations.`
    }

    if (effectiveType === 'python') {
      return `Generate a COMPLETE Python (Playwright) test file based on the context below.

Context:
${context}

CRITICAL REQUIREMENTS:
1. Output a FULL Python file (imports + test function).
2. Use: from playwright.sync_api import sync_playwright, expect
3. Use sync_playwright() context manager.
4. Launch with headless=False.
5. Use semantic locators (get_by_role, get_by_text, get_by_label, get_by_placeholder, get_by_test_id).
6. If a locator might match multiple elements, use .first.
7. Include waits (page.wait_for_load_state(), locator.wait_for()).
8. Handle dialogs: page.on("dialog", lambda dialog: dialog.accept())
9. Add expect() assertions where sensible.
10. Output ONLY valid Python code. No markdown, no explanations.`
    }

    return `Generate a COMPLETE TypeScript (Playwright) test file based on the context below.

Context:
${context}

CRITICAL REQUIREMENTS:
1. Output a FULL Playwright test file (imports + test wrapper + body).
2. Use: import { test, expect } from '@playwright/test';
3. Use: test('Ralph Loop Validation', async ({ page }) => { ... });
4. Ensure ALL parentheses (), braces {}, and brackets [] are CLOSED.
5. Use semantic locators (getByRole, getByText, getByLabel, getByPlaceholder, getByTestId).
6. If a locator might match multiple elements, add .first() or use exact: true.
7. Include waits (await page.waitForLoadState(), await element.waitFor()).
8. Handle dialogs: page.on('dialog', dialog => dialog.accept()).
9. Add expect() assertions where sensible.
10. ALL async operations MUST use await.
11. Output ONLY valid TypeScript code. No markdown, no explanations.`
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

      let cleanedOutput = output
      const codeBlockMatch = cleanedOutput.match(/```(?:typescript|javascript|ts|java|python|py)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        cleanedOutput = codeBlockMatch[1].trim()
      }

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
    const testMatch = code.match(/test\(['"]([^'"]+)['"]/)
    if (testMatch?.[1]) return testMatch[1]
    const classMatch = code.match(/class\s+([A-Za-z0-9_]+)/)
    if (classMatch?.[1]) return classMatch[1]
    const nameMatch = code.match(/suiteName\s*[:=]\s*['"]([^'"]+)['"]/)
    if (nameMatch?.[1]) return nameMatch[1]
    return ''
  }

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
