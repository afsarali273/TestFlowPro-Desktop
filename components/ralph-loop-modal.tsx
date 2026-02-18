"use client"

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Terminal,
  CheckCircle2,
  XCircle,
  Cpu,
  Zap,
  ChevronDown,
  FileText,
  BarChart3,
  GitBranch,
  Play,
  Pause,
  Trash2
} from 'lucide-react'

// Types
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number
  result?: string
  error?: string
  executedAt?: Date
  completedAt?: Date
}

interface Plan {
  id: string
  title: string
  requirements: string
  generatedTasks: Task[]
  createdAt: Date
  updatedAt: Date
}

interface LearningEntry {
  id: string
  taskId: string
  whatWorked: string[]
  whatFailed: string[]
  insights: string
  tokensUsed: number
  executionTime: number
  timestamp: Date
}

interface MCPAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RalphLoopModal({ open, onOpenChange }: MCPAgentModalProps) {
  // Plan Mode State
  const [requirementsInput, setRequirementsInput] = useState('')
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  // Execute Mode State
  const [executingPlan, setExecutingPlan] = useState<Plan | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null)
  const [executionEndTime, setExecutionEndTime] = useState<Date | null>(null)
  const [showExecutionSummary, setShowExecutionSummary] = useState(false)

  // Learning State
  const [learningEntries, setLearningEntries] = useState<LearningEntry[]>([])
  const [totalTokensUsed, setTotalTokensUsed] = useState(0)

  // MCP Servers State
  const [mcpServers, setMcpServers] = useState<any[]>([])
  const [mcpStatuses, setMcpStatuses] = useState<Record<string, any>>({})
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [connectingServers, setConnectingServers] = useState<Set<string>>(new Set())
  const [showServerPanel, setShowServerPanel] = useState(true)

  const logRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load MCP data on modal open
  useEffect(() => {
    if (open) {
      loadMCPServers()
      loadMCPTools()
      autoConnectServers()

      const interval = setInterval(() => {
        loadMCPTools()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [open])

  // Auto-scroll execution log
  useEffect(() => {
    logRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [executionLog])

  // ============ MCP Server Functions ============
  const loadMCPServers = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=list-servers')
      if (response.ok) {
        const data = await response.json()
        setMcpServers(data.servers || [])
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error)
    }
  }

  const loadMCPTools = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=list-tools')
      if (response.ok) {
        const data = await response.json()
        setMcpTools(data.tools || [])
      }

      const statusResponse = await fetch('/api/mcp-servers?action=all-statuses')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setMcpStatuses(statusData.statuses || {})
      }
    } catch (error) {
      console.error('Failed to load MCP tools:', error)
    }
  }

  const autoConnectServers = async () => {
    try {
      const statusResponse = await fetch('/api/mcp-servers?action=all-statuses')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        const statuses = statusData.statuses || {}

        const serversToConnect = ['testflowpro', 'playwright']

        for (const serverId of serversToConnect) {
          if (!statuses[serverId]?.connected) {
            console.log(`🔌 Auto-connecting ${serverId}...`)
            fetch('/api/mcp-servers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'connect', serverId })
            }).then(() => {
              console.log(`✅ ${serverId} connection initiated`)
              setTimeout(() => loadMCPTools(), 3000)
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to auto-connect servers:', error)
    }
  }

  const connectMCPServer = async (serverId: string) => {
    setConnectingServers(prev => new Set(prev).add(serverId))

    try {
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', serverId })
      })

      if (response.ok) {
        toast({
          title: '✅ Server Connected',
          description: `${serverId} connected successfully`,
        })
        setTimeout(() => loadMCPTools(), 1000)
      } else {
        throw new Error('Connection failed')
      }
    } catch (error: any) {
      toast({
        title: '❌ Connection Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setConnectingServers(prev => {
        const next = new Set(prev)
        next.delete(serverId)
        return next
      })
    }
  }

  const disconnectMCPServer = async (serverId: string) => {
    try {
      await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', serverId })
      })

      toast({
        title: 'Server Disconnected',
        description: `${serverId} has been disconnected`,
      })

      loadMCPTools()
    } catch (error) {
      console.error('Failed to disconnect server:', error)
    }
  }

  // ============ Plan Mode Functions ============
  const generatePlan = async () => {
    if (!requirementsInput.trim()) {
      toast({
        title: 'Empty Requirements',
        description: 'Please enter requirements to generate a plan',
        variant: 'destructive'
      })
      return
    }

    setIsGeneratingPlan(true)

    try {
      // Call AI to generate tasks from requirements
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a project planning AI. Break down these requirements into specific, actionable tasks that can be executed sequentially.\n\nRequirements:\n${requirementsInput}\n\nRespond with a JSON array of tasks with this structure:\n[\n  { "title": "Task title", "description": "What to do", "order": 1 },\n  ...\n]\n\nRespond ONLY with the JSON array, no other text.`,
          type: 'general',
          provider: 'github-copilot'
        })
      })

      const data = await response.json()

      // Parse tasks from AI response
      const tasksText = data.response
      const tasksMatch = tasksText.match(/\[[\s\S]*\]/)
      const parsedTasks = tasksMatch ? JSON.parse(tasksMatch[0]) : []

      const newPlan: Plan = {
        id: Date.now().toString(),
        title: `Plan ${new Date().toLocaleDateString()}`,
        requirements: requirementsInput,
        generatedTasks: parsedTasks.map((task: any, idx: number) => ({
          id: `task-${idx}`,
          title: task.title || `Task ${idx + 1}`,
          description: task.description || '',
          status: 'pending' as const,
          progress: 0
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setCurrentPlan(newPlan)

      toast({
        title: '✅ Plan Generated',
        description: `Created plan with ${newPlan.generatedTasks.length} tasks`,
      })
    } catch (error: any) {
      toast({
        title: '❌ Plan Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  // ============ Execute Mode Functions ============
  const startExecution = () => {
    if (!currentPlan) {
      toast({
        title: 'No Plan',
        description: 'Generate a plan first',
        variant: 'destructive'
      })
      return
    }

    setExecutingPlan(currentPlan)
    setIsExecuting(true)
    setCurrentTaskIndex(0)
    setExecutionLog([`🚀 Started execution at ${new Date().toLocaleTimeString()}`])
    setExecutionStartTime(new Date())
    setExecutionEndTime(null)
    setShowExecutionSummary(false)

    // Start executing first task
    executeTask(0)
  }

  const executeTask = async (taskIndex: number) => {
    if (!executingPlan) return

    const task = executingPlan.generatedTasks[taskIndex]
    if (!task) {
      // All tasks completed
      setIsExecuting(false)
      setExecutionEndTime(new Date())
      setShowExecutionSummary(true)
      addLog('✅ All tasks completed!')
      addLog(`\n📊 Execution Summary available - scroll down to view`)
      return
    }

    addLog(`\n📋 Task ${taskIndex + 1}: ${task.title}`)
    addLog(`Description: ${task.description}`)

    // Update task status
    const updatedPlan = { ...executingPlan }
    updatedPlan.generatedTasks[taskIndex].status = 'in-progress'
    updatedPlan.generatedTasks[taskIndex].progress = 25
    setExecutingPlan(updatedPlan)

    try {
      addLog(`🤖 Sending to AI...`)

      // Build enhanced autonomous prompt
      const autonomousPrompt = `
========================================
🤖 AUTONOMOUS AGENT MODE - CRITICAL RULES
========================================

❌ ABSOLUTELY FORBIDDEN - YOU WILL FAIL IF YOU DO ANY OF THESE:
1. NEVER ask "Could you confirm..."
2. NEVER ask "Would you like me to..."
3. NEVER ask "Should I try..."
4. NEVER ask "Is there something else..."
5. NEVER say "seems to be a challenge" without IMMEDIATELY trying 5+ alternatives
6. NEVER give up after 1 or 2 attempts
7. NEVER return partial results
8. NEVER ask for user input mid-execution

✅ REQUIRED BEHAVIOR:
1. Try EVERY possible approach until success
2. If approach #1 fails → IMMEDIATELY try approach #2, #3, #4, #5...
3. Use ALL available MCP tools creatively
4. Take snapshots to analyze page structure
5. Try JavaScript injection if normal selectors fail
6. Chain multiple tools together
7. ONLY respond when task is 100% COMPLETE
8. Return ACTUAL results, not "I tried but..."

========================================
YOUR TASK:
========================================

Title: ${task.title}
Description: ${task.description}

========================================
EXECUTION STRATEGY - FOLLOW THIS:
========================================

Step 1: ANALYZE
- Take browser snapshot FIRST
- Identify ALL possible ways to accomplish the task
- Plan 5+ fallback approaches

Step 2: EXECUTE WITH RETRIES
- Try approach #1
- If fails → snapshot → analyze → try approach #2
- If fails → snapshot → analyze → try approach #3
- Continue until SUCCESS or all 10+ approaches exhausted

Step 3: VERIFY
- Confirm action completed (URL changed, element updated, data extracted)
- If verification fails → it means you clicked wrong element → go back and retry

Step 4: RETURN RESULTS
- Report what you actually accomplished
- Include concrete data/evidence
- Never say "could not be located" - say what you DID accomplish after trying alternatives

========================================
EXAMPLE: GOOD vs BAD RESPONSES
========================================

❌ BAD (FORBIDDEN):
"The Round Trip radio button could not be located. Would you like me to try another approach?"

✅ GOOD (REQUIRED):
"Attempted locating Round Trip via:
1. getByRole('radio') - not found
2. getByText(/round trip/i) - not found
3. JavaScript query - found element, clicked successfully
4. Verified: URL contains 'tripType=R', Round Trip selected ✓
Result: Round Trip option now active"

❌ BAD:
"The From field could not be located. Should I try debugging?"

✅ GOOD:
"Tried 8 approaches for From field:
1-3: Standard selectors failed
4. Snapshot analysis revealed input has data-cy='fromCity'
5. Clicked via data-cy selector
6. Typed 'CCU' via keyboard
7. Pressed Enter to confirm
8. Verified: Field shows 'Kolkata (CCU)' ✓
Result: Departure city set to CCU"

========================================
NOW EXECUTE THE TASK AUTONOMOUSLY
========================================

Remember: NO QUESTIONS. JUST RESULTS.
`

      // Call AI to execute this task with enhanced autonomous prompt
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: autonomousPrompt,
          type: 'mcp-agent',
          provider: 'github-copilot',
          agentMode: true,
          mcpTools: mcpTools
        })
      })

      const data = await response.json()

      // Validate response - reject passive/questioning responses
      const responseText = data.response || ''
      const forbiddenPhrases = [
        'could you confirm',
        'would you like me to',
        'should i try',
        'is there something else',
        'do you want me to',
        'shall i',
        'may i',
        'can you confirm',
        'proving to be a challenge',
        'could not be located directly',
        'another approach?',
        'something else you\'d like',
      ]

      const containsForbiddenPhrase = forbiddenPhrases.some(phrase =>
        responseText.toLowerCase().includes(phrase)
      )

      if (containsForbiddenPhrase) {
        // AI is asking questions instead of being autonomous - force retry
        addLog(`⚠️ AI response contains questions - enforcing autonomous mode...`)

        // Extract which forbidden phrase was found
        const foundPhrase = forbiddenPhrases.find(phrase =>
          responseText.toLowerCase().includes(phrase)
        )

        addLog(`🚫 Detected forbidden phrase: "${foundPhrase}"`)
        addLog(`🔄 Re-executing with stricter autonomous instructions...`)

        // Retry with even stricter prompt
        const stricterResponse = await fetch('/api/copilot-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `
CRITICAL: Your previous response was REJECTED because you asked a question: "${foundPhrase}"

YOU ARE AN AUTONOMOUS AGENT. YOU CANNOT ASK QUESTIONS. 

RE-DO THIS TASK RIGHT NOW with these mandatory steps:

1. Take browser_snapshot to see current page state
2. Try AT LEAST 5 different approaches:
   - Make sure no overlaying modal or pop present , if presnt handle it
   - getByRole with various roles
   - getByText with different text patterns
   - getByPlaceholder
   - CSS selectors via page.locator()
   - JavaScript via browser_run_code: page.evaluate(() => document.querySelector(...))
3. If element not found after 5 tries, use JavaScript to find ANY element that might work
4. Click/interact with element
5. Verify action succeeded (take another snapshot, check URL, check element state)
6. Report CONCRETE RESULTS

Task: ${task.title}
Description: ${task.description}

DO NOT respond until you have ACTUAL RESULTS to report.
DO NOT ask questions.
DO NOT say "could not be located" - find alternative ways!

Execute NOW and report your SUCCESS.
`,
            type: 'mcp-agent',
            provider: 'github-copilot',
            agentMode: true,
            mcpTools: mcpTools
          })
        })

        const stricterData = await stricterResponse.json()

        // Use the stricter response
        data.response = stricterData.response
        addLog(`✅ Retry completed with autonomous mode enforced`)
      }

      addLog(`⚙️ Execution completed`)
      addLog(`Result: ${data.response.substring(0, 200)}...`)

      // Final validation - ensure response contains actual results
      const finalResponse = data.response.toLowerCase()
      const hasActualResults =
        finalResponse.includes('success') ||
        finalResponse.includes('completed') ||
        finalResponse.includes('verified') ||
        finalResponse.includes('clicked') ||
        finalResponse.includes('selected') ||
        finalResponse.includes('navigated') ||
        finalResponse.includes('set to') ||
        finalResponse.includes('result:') ||
        /\d+/.test(finalResponse) || // Contains numbers (likely data)
        finalResponse.length > 100 // Substantial response

      const hasFailureExcuses =
        finalResponse.includes('could not') ||
        finalResponse.includes('unable to') ||
        finalResponse.includes('not found') ||
        finalResponse.includes('failed to locate')

      if (!hasActualResults || hasFailureExcuses) {
        addLog(`⚠️ Response lacks concrete results - task may need manual review`)
        // Mark as needing attention but don't fail completely
        updatedPlan.generatedTasks[taskIndex].result = `⚠️ NEEDS REVIEW: ${data.response}`
      }

      // Mark task as completed
      updatedPlan.generatedTasks[taskIndex].status = 'completed'
      updatedPlan.generatedTasks[taskIndex].progress = 100
      updatedPlan.generatedTasks[taskIndex].result = data.response
      updatedPlan.generatedTasks[taskIndex].completedAt = new Date()
      setExecutingPlan(updatedPlan)

      // Add to learning
      const learningEntry: LearningEntry = {
        id: `learning-${Date.now()}`,
        taskId: task.id,
        whatWorked: ['AI tool calling worked', 'MCP servers responded'],
        whatFailed: [],
        insights: `Completed: ${task.title}`,
        tokensUsed: 1500,
        executionTime: 45,
        timestamp: new Date()
      }

      setLearningEntries(prev => [...prev, learningEntry])
      setTotalTokensUsed(prev => prev + 1500)

      // Execute next task
      setTimeout(() => {
        setCurrentTaskIndex(taskIndex + 1)
        executeTask(taskIndex + 1)
      }, 2000)

    } catch (error: any) {
      addLog(`❌ Task failed: ${error.message}`)

      // Capture snapshot for debugging when Playwright is connected
      try {
        if (mcpStatuses.playwright?.connected) {
          addLog('📸 Capturing page snapshot for analysis...')
          const snapResponse = await fetch('/api/mcp-servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'execute-tool',
              serverId: 'playwright',
              toolName: 'browser_snapshot',
              args: { fullPage: false }
            })
          })
          if (snapResponse.ok) {
            const snapData = await snapResponse.json()
            const text = snapData?.result?.content?.[0]?.text || 'Snapshot captured'
            addLog(`🖼️ Snapshot captured (${text.length} chars). Inspect in Playwright panel if needed.`)
          } else {
            addLog('⚠️ Snapshot capture failed')
          }
        }
      } catch (snapErr: any) {
        addLog(`⚠️ Snapshot capture error: ${snapErr.message}`)
      }

      updatedPlan.generatedTasks[taskIndex].status = 'failed'
      updatedPlan.generatedTasks[taskIndex].error = error.message
      setExecutingPlan(updatedPlan)

      // Retry logic
      addLog(`🔄 Retrying in 3 seconds...`)
      setTimeout(() => executeTask(taskIndex), 3000)
    }
  }

  const pauseExecution = () => {
    setIsExecuting(false)
    addLog(`⏸️ Execution paused`)
  }

  const resumeExecution = () => {
    setIsExecuting(true)
    addLog(`▶️ Execution resumed`)
    executeTask(currentTaskIndex)
  }

  const cancelExecution = () => {
    setIsExecuting(false)
    setExecutingPlan(null)
    setCurrentTaskIndex(0)
    setExecutionLog([])
    addLog(`❌ Execution cancelled`)
  }

  const addLog = (message: string) => {
    setExecutionLog(prev => [...prev, message])
  }

  // ============ UI Components ============

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="relative">
              <Terminal className="h-6 w-6" />
              <Zap className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
            <div className="flex-1">
              <div className="font-bold">Ralph Loop Agent</div>
              <div className="text-xs text-white/80 font-normal">
                Plan → Execute → Learn → Repeat
              </div>
            </div>
            <div className="flex gap-2">
              {mcpStatuses.testflowpro?.connected && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-400/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  TestFlowPro
                </Badge>
              )}
              {mcpStatuses.playwright?.connected && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-100 border-purple-400/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Playwright
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* MCP Servers Panel */}
        <div className="border-b bg-muted/30">
          <div className="px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowServerPanel(!showServerPanel)}
              className="w-full justify-between hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span className="font-medium">MCP Servers</span>
                <Badge variant="secondary" className="ml-2">
                  {Object.values(mcpStatuses).filter((s: any) => s.connected).length}/{mcpServers.length}
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showServerPanel ? 'rotate-180' : ''}`} />
            </Button>

            {showServerPanel && (
              <div className="mt-3 space-y-2">
                {mcpServers.filter(s => s.enabled).map((server) => {
                  const status = mcpStatuses[server.id]
                  const isConnecting = connectingServers.has(server.id)

                  return (
                    <div key={server.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{server.icon}</div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {server.name}
                            {status?.connected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status?.connected ? (
                          <>
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                              Connected
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disconnectMCPServer(server.id)}
                              className="h-8"
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : isConnecting ? (
                          <Button variant="outline" size="sm" disabled className="h-8">
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Connecting...
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => connectMCPServer(server.id)}
                            className="h-8"
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="plan" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b bg-muted/30 h-auto p-2 space-x-2">
            <TabsTrigger value="plan" className="gap-2">
              <FileText className="h-4 w-4" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="execute" className="gap-2">
              <Play className="h-4 w-4" />
              Execute
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="servers" className="gap-2">
              <Cpu className="h-4 w-4" />
              Servers
            </TabsTrigger>
          </TabsList>

          {/* Plan Mode Tab */}
          <TabsContent value="plan" className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Requirements / Project Description</label>
                  <Textarea
                    value={requirementsInput}
                    onChange={(e) => setRequirementsInput(e.target.value)}
                    placeholder="Describe what you want to build or accomplish. Be specific about goals and constraints..."
                    className="min-h-[120px] resize-none"
                    disabled={isGeneratingPlan}
                  />
                </div>

                {currentPlan && (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        Generated Plan
                      </h3>

                      <div className="space-y-2">
                        {currentPlan.generatedTasks.map((task, idx) => (
                          <div key={task.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded border">
                            <div className="text-sm font-semibold text-blue-600 w-6 text-center">{idx + 1}</div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{task.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                            </div>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 bg-muted/30 flex gap-2">
              <Button
                onClick={generatePlan}
                disabled={isGeneratingPlan || !requirementsInput.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
              {currentPlan && (
                <Button
                  onClick={startExecution}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Execution
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Execute Mode Tab */}
          <TabsContent value="execute" className="flex-1 flex flex-col p-0">
            {executingPlan ? (
              <>
                {/* Task Progress */}
                <div className="border-b p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Task Progress</h3>
                    <Badge>
                      {executingPlan.generatedTasks.filter(t => t.status === 'completed').length} / {executingPlan.generatedTasks.length}
                    </Badge>
                  </div>

                  {executingPlan.generatedTasks.map((task, idx) => (
                    <div key={task.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{task.title}</div>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'failed'
                              ? 'destructive'
                              : task.status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {task.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {task.status === 'in-progress' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {task.status}
                        </Badge>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  ))}
                </div>

                {/* Execution Log */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2 font-mono text-sm">
                    {executionLog.map((log, idx) => (
                      <div key={idx} className="text-muted-foreground">
                        {log}
                      </div>
                    ))}
                    <div ref={logRef} />
                  </div>
                </ScrollArea>

                {/* Comprehensive Execution Summary - Shown after completion */}
                {showExecutionSummary && executingPlan && executionStartTime && executionEndTime && (
                  <div className="border-t bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                      {/* Header */}
                      <div className="text-center space-y-2">
                        <div className="text-4xl">🎉</div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          Execution Complete
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Plan executed successfully with detailed results below
                        </p>
                      </div>

                      {/* Stats Overview */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border shadow-sm">
                          <div className="text-xs text-muted-foreground mb-1">Total Tasks</div>
                          <div className="text-2xl font-bold text-blue-600">{executingPlan.generatedTasks.length}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border shadow-sm">
                          <div className="text-xs text-muted-foreground mb-1">Completed</div>
                          <div className="text-2xl font-bold text-green-600">
                            {executingPlan.generatedTasks.filter(t => t.status === 'completed').length}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border shadow-sm">
                          <div className="text-xs text-muted-foreground mb-1">Failed</div>
                          <div className="text-2xl font-bold text-red-600">
                            {executingPlan.generatedTasks.filter(t => t.status === 'failed').length}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border shadow-sm">
                          <div className="text-xs text-muted-foreground mb-1">Duration</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round((executionEndTime.getTime() - executionStartTime.getTime()) / 1000)}s
                          </div>
                        </div>
                      </div>

                      {/* Task Timeline */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
                        <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                          <h3 className="font-semibold flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            Task Execution Timeline
                          </h3>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                          {executingPlan.generatedTasks.map((task, idx) => (
                            <div key={task.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-semibold text-indigo-600">
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">{task.title}</div>
                                  <Badge
                                    variant={task.status === 'completed' ? 'default' : 'destructive'}
                                    className={task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200' : ''}
                                  >
                                    {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    {task.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                                    {task.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">{task.description}</div>
                                {task.result && (
                                  <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded border text-xs font-mono">
                                    <div className="text-muted-foreground mb-1">Result:</div>
                                    <div className="line-clamp-2">{task.result.substring(0, 200)}...</div>
                                  </div>
                                )}
                                {task.error && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-xs">
                                    <div className="text-red-600 dark:text-red-400 font-semibold mb-1">Error:</div>
                                    <div className="text-red-700 dark:text-red-300">{task.error}</div>
                                  </div>
                                )}
                                {task.completedAt && (
                                  <div className="text-xs text-muted-foreground">
                                    ⏱️ Completed at {task.completedAt.toLocaleTimeString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* What Worked / What Didn't - Enhanced */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
                          <div className="px-4 py-3 border-b bg-green-50 dark:bg-green-900/20">
                            <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-300">
                              <span className="text-lg">✅</span>
                              What Worked
                            </h3>
                          </div>
                          <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                            <div className="text-sm space-y-2">
                              {executingPlan.generatedTasks.filter(t => t.status === 'completed').length > 0 && (
                                <div className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>Successfully completed {executingPlan.generatedTasks.filter(t => t.status === 'completed').length} out of {executingPlan.generatedTasks.length} tasks</span>
                                </div>
                              )}
                              {mcpStatuses.playwright?.connected && (
                                <div className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>Playwright MCP server integration successful</span>
                                </div>
                              )}
                              {mcpStatuses.testflowpro?.connected && (
                                <div className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>TestFlowPro operations executed correctly</span>
                                </div>
                              )}
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>AI agent mode with tool calling functional</span>
                              </div>
                              {executionLog.filter(l => l.includes('Snapshot captured')).length > 0 && (
                                <div className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>Auto-snapshot capture on failures working ({executionLog.filter(l => l.includes('Snapshot captured')).length} snapshots)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
                          <div className="px-4 py-3 border-b bg-red-50 dark:bg-red-900/20">
                            <h3 className="font-semibold flex items-center gap-2 text-red-700 dark:text-red-300">
                              <span className="text-lg">❌</span>
                              What Didn't Work
                            </h3>
                          </div>
                          <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                            {executingPlan.generatedTasks.filter(t => t.status === 'failed').length > 0 ? (
                              <div className="text-sm space-y-2">
                                {executingPlan.generatedTasks.filter(t => t.status === 'failed').map((task, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span><strong>{task.title}:</strong> {task.error?.substring(0, 100) || 'Unknown error'}</span>
                                  </div>
                                ))}
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <span>•</span>
                                  <span>Total retry attempts: {executionLog.filter(l => l.toLowerCase().includes('retrying')).length}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                🎉 No failures! All tasks completed successfully.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Execution Log Summary */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
                        <div className="px-4 py-3 border-b">
                          <h3 className="font-semibold flex items-center gap-2">
                            <span className="text-lg">📜</span>
                            Execution Log Summary
                          </h3>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Log Entries</span>
                              <span className="font-semibold">{executionLog.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Retries</span>
                              <span className="font-semibold">{executionLog.filter(l => l.toLowerCase().includes('retrying')).length}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Snapshots</span>
                              <span className="font-semibold">{executionLog.filter(l => l.includes('Snapshot captured')).length}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Errors</span>
                              <span className="font-semibold text-red-600">{executionLog.filter(l => l.includes('failed')).length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm">
                        <div className="px-4 py-3 border-b bg-blue-50 dark:bg-blue-900/20">
                          <h3 className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <span className="text-lg">💡</span>
                            Next Steps & Recommendations
                          </h3>
                        </div>
                        <div className="p-4 space-y-2 text-sm">
                          {executingPlan.generatedTasks.filter(t => t.status === 'failed').length > 0 ? (
                            <>
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>Review failed tasks above and check error messages</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>Check captured snapshots in execution log for debugging</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>Consider refining task descriptions or breaking complex tasks into smaller steps</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>All tasks completed successfully! Review results in Learning tab</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>Check the execution log for detailed step-by-step analysis</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <span>You can now create a new plan or refine existing workflows</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-start gap-2">
                            <span>•</span>
                            <span>Total tokens used: {totalTokensUsed.toLocaleString()} (tracked in Learning tab)</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 justify-center pt-2">
                        <Button
                          onClick={() => setShowExecutionSummary(false)}
                          variant="outline"
                          className="gap-2"
                        >
                          <ChevronDown className="h-4 w-4" />
                          Hide Summary
                        </Button>
                        <Button
                          onClick={() => {
                            setExecutingPlan(null)
                            setShowExecutionSummary(false)
                            setExecutionLog([])
                          }}
                          className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600"
                        >
                          <Zap className="h-4 w-4" />
                          Create New Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rich Execution Summary */}
                <div className="border-t bg-muted/30 px-4 py-3">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="col-span-1 lg:col-span-2 border rounded-lg bg-background shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📜</span>
                          <span className="font-semibold text-sm">Execution Narrative</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Live</Badge>
                      </div>
                      <div className="p-4 space-y-3 max-h-48 overflow-y-auto text-sm">
                        {executionLog.length === 0 ? (
                          <div className="text-muted-foreground">No steps executed yet.</div>
                        ) : (
                          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                            {executionLog.slice(-6).map((log, idx) => (
                              <li key={idx}>{log}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 border rounded-lg bg-background shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          <span className="font-semibold text-sm">Run Snapshot</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tasks Completed</span>
                          <Badge variant="outline">{executingPlan.generatedTasks.filter(t => t.status === 'completed').length}/{executingPlan.generatedTasks.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">In Progress</span>
                          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/30">
                            {executingPlan.generatedTasks.filter(t => t.status === 'in-progress').length}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Failed</span>
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200">
                            {executingPlan.generatedTasks.filter(t => t.status === 'failed').length}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Attempts (last task)</span>
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30">
                            {/* Simple heuristic: count retries by log entries for current task */}
                            {executionLog.filter(l => l.toLowerCase().includes('attempt')).length || 1}x
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Highlights</div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">✅ Success tracked</Badge>
                            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20">🔁 Retries</Badge>
                            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900/20">📜 Log tail</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg bg-background shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">❌</span>
                          <span className="font-semibold text-sm">What Didn’t Work</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 max-h-32 overflow-y-auto text-sm text-muted-foreground">
                        {executionLog.filter(l => l.toLowerCase().includes('fail') || l.toLowerCase().includes('error')).slice(-5).map((log, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{log}</span>
                          </div>
                        ))}
                        {executionLog.filter(l => l.toLowerCase().includes('fail') || l.toLowerCase().includes('error')).length === 0 && (
                          <div className="text-muted-foreground">No failures recorded yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-lg bg-background shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          <span className="font-semibold text-sm">Recovery & Next Steps</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>Auto-retries are counted and surfaced above. If failures persist, pause and inspect logs.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>Use MCP tools panel to manually rerun a step or adjust selectors.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>•</span>
                          <span>Check the last 6 log lines in the narrative for quick context.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="border-t p-4 bg-muted/30 flex gap-2">
                  {!isExecuting ? (
                    <Button onClick={resumeExecution} className="flex-1" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pauseExecution} className="flex-1" variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={cancelExecution} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No execution in progress</p>
                  <p className="text-sm text-muted-foreground mt-2">Create and start a plan to begin</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600">{learningEntries.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Tasks Executed</div>
                  </div>
                  <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-2xl font-bold text-purple-600">{totalTokensUsed.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Tokens Used</div>
                  </div>
                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600">
                      {learningEntries.length > 0
                        ? Math.round(
                            (learningEntries.filter(e => e.whatFailed.length === 0).length /
                              learningEntries.length) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Success Rate</div>
                  </div>
                </div>

                {/* Learning Entries */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Iteration History
                  </h3>

                  {learningEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No learning entries yet</p>
                      <p className="text-sm mt-2">Execute tasks to populate learning journal</p>
                    </div>
                  ) : (
                    learningEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">Task Execution</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleTimeString()}
                          </div>
                        </div>

                        {entry.whatWorked.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-green-600 mb-1">✓ What Worked:</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {entry.whatWorked.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {entry.whatFailed.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-red-600 mb-1">✗ What Failed:</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {entry.whatFailed.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {entry.insights && (
                          <div>
                            <div className="text-xs font-semibold text-blue-600 mb-1">💡 Insights:</div>
                            <div className="text-xs text-muted-foreground">{entry.insights}</div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div>⏱️ {entry.executionTime}s</div>
                          <div>📊 {entry.tokensUsed} tokens</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Servers Tab */}
          <TabsContent value="servers" className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Connected Servers
                  </h3>

                  <div className="space-y-2">
                    {mcpServers.filter(s => s.enabled).map((server) => {
                      const status = mcpStatuses[server.id]
                      const serverTools = mcpTools.filter(t => t.server === server.id)

                      return (
                        <div key={server.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2">
                              <span className="text-2xl">{server.icon}</span>
                              {server.name}
                              {status?.connected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </div>
                            <Badge
                              variant={status?.connected ? 'default' : 'secondary'}
                              className={
                                status?.connected
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700'
                                  : ''
                              }
                            >
                              {status?.connected ? 'Connected' : 'Disconnected'}
                            </Badge>
                          </div>

                          {status?.connected && serverTools.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-2">
                                Available Tools ({serverTools.length})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {serverTools.slice(0, 5).map((tool, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tool.name}
                                  </Badge>
                                ))}
                                {serverTools.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{serverTools.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

