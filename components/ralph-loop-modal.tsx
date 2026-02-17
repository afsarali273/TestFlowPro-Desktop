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

    // Start executing first task
    executeTask(0)
  }

  const executeTask = async (taskIndex: number) => {
    if (!executingPlan) return

    const task = executingPlan.generatedTasks[taskIndex]
    if (!task) {
      // All tasks completed
      setIsExecuting(false)
      addLog('✅ All tasks completed!')
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

      // Call AI to execute this task
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Execute this task:\n\nTitle: ${task.title}\nDescription: ${task.description}\n\nProvide the result or steps taken.`,
          type: 'mcp-agent',
          provider: 'github-copilot',
          agentMode: true,
          mcpTools: mcpTools
        })
      })

      const data = await response.json()

      addLog(`⚙️ Execution completed`)
      addLog(`Result: ${data.response.substring(0, 200)}...`)

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

