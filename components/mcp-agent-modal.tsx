"use client"

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Bot,
  Send,
  Loader2,
  Terminal,
  CheckCircle2,
  XCircle,
  Cpu,
  RefreshCw,
  Zap,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  executionSteps?: ExecutionStep[]
}

interface ExecutionStep {
  id: string
  toolName: string
  action: string
  locator?: string
  value?: string
  status: 'running' | 'success' | 'error'
  result?: string
  timestamp: Date
  javaCode?: string
}

interface ToolCall {
  id: string
  name: string
  args: any
  status: 'pending' | 'executing' | 'success' | 'error'
  result?: string
  error?: string
}

interface ToolResult {
  toolCallId: string
  name: string
  result: string
}

interface MCPAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MCPAgentModal({ open, onOpenChange }: MCPAgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [mcpStatuses, setMcpStatuses] = useState<Record<string, any>>({})
  const [mcpServers, setMcpServers] = useState<any[]>([])
  const [showServerPanel, setShowServerPanel] = useState(true)
  const [connectingServers, setConnectingServers] = useState<Set<string>>(new Set())
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load MCP tools and auto-connect servers
  useEffect(() => {
    if (open) {
      loadMCPServers()
      loadMCPTools()
      autoConnectServers()

      // Refresh tools every 3 seconds while modal is open to detect new connections
      const interval = setInterval(() => {
        loadMCPTools()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [open])

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

  const autoConnectServers = async () => {
    try {
      // Get server statuses
      const statusResponse = await fetch('/api/mcp-servers?action=all-statuses')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        const statuses = statusData.statuses || {}

        // Auto-connect important servers if not connected
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
              // Reload tools after connection
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
        const data = await response.json()
        toast({
          title: '✅ Server Connected',
          description: `${serverId} connected with ${data.toolCount || 0} tools`,
        })
        // Reload tools and statuses
        setTimeout(() => {
          loadMCPTools()
        }, 1000)
      } else {
        throw new Error('Connection failed')
      }
    } catch (error: any) {
      toast({
        title: '❌ Connection Failed',
        description: `Failed to connect ${serverId}: ${error.message}`,
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

  const loadMCPTools = async () => {
    try {
      // Load tools
      const response = await fetch('/api/mcp-servers?action=list-tools')
      if (response.ok) {
        const data = await response.json()
        setMcpTools(data.tools || [])
      }

      // Load statuses
      const statusResponse = await fetch('/api/mcp-servers?action=all-statuses')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setMcpStatuses(statusData.statuses || {})
      }
    } catch (error) {
      console.error('Failed to load MCP tools:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (role: Message['role'], content: string, toolCalls?: ToolCall[], toolResults?: ToolResult[], executionSteps?: ExecutionStep[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      toolCalls,
      toolResults,
      executionSteps
    }
    setMessages(prev => [...prev, newMessage])
  }


  const sendMessage = async (userMessage: string): Promise<void> => {
    try {
      console.log(`🚀 Sending message to AI...`)

      // Build simplified conversation history (avoid sending tool results which can be huge)
      const conversationHistory = messages
        .filter(m => m.role !== 'tool') // Skip tool results to reduce token usage
        .map(m => ({
          role: m.role,
          content: m.content.substring(0, 1000) // Truncate long messages
        }))

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage
      })

      console.log(`📤 Sending ${conversationHistory.length} messages to API`)

      // Call Copilot API with MCP tools (iterative mode)
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          type: 'mcp-agent',
          provider: 'github-copilot',
          agentMode: true,
          mcpTools: mcpTools,
          conversationHistory: conversationHistory.slice(-6) // Only last 6 messages to avoid token limits
        })
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid response from API')
      }

      if (!response.ok) {
        console.error('API Error:', data)
        throw new Error(data.error || `API request failed: ${response.status} ${response.statusText}`)
      }

      // Add assistant response with execution steps
      const executionSteps = data.metadata?.executionSteps || []
      addMessage('assistant', data.response, undefined, data.toolResults, executionSteps)


      // Show tool execution count
      if (data.metadata?.toolCallsExecuted > 0) {
        toast({
          title: '✅ Task Completed',
          description: `Executed ${data.metadata.toolCallsExecuted} tool(s) successfully`,
        })
      }

      setIsLoading(false)

    } catch (error: any) {
      console.error('Error in sendMessage:', error)
      addMessage('assistant', `❌ Error: ${error.message}\n\nThis might be because:\n- The response was too large\n- A tool execution failed\n- The AI model encountered an issue\n\nPlease try:\n- Simplifying your request\n- Asking one step at a time\n- Checking if all required servers are connected`)
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    addMessage('user', userMessage)

    setIsLoading(true)

    // Send message (AI will handle tool execution iteratively)
    await sendMessage(userMessage)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyJavaCode = async (code: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(messageId)
      toast({
        title: '✅ Copied!',
        description: 'Java code copied to clipboard',
      })
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast({
        title: '❌ Failed to copy',
        description: 'Could not copy code to clipboard',
        variant: 'destructive'
      })
    }
  }

  const generateCompleteJavaCode = (steps: ExecutionStep[]) => {
    // Filter and deduplicate Java code
    const javaCodeLines = steps
            .map(step => step.javaCode?.trim())
            .filter((code): code is string => {
              if (!code || code.length === 0) return false;
              if (code.startsWith('//')) return false;
              return true;
            })
      .filter((code, index, array) => array.indexOf(code) === index);

    const javaCode = javaCodeLines.join('\n');

    return `import com.microsoft.playwright.*;

public class PlaywrightTest {
    public static void main(String[] args) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
            Page page = browser.newPage();
            
            // Generated automation steps
${javaCode.split('\n').map(line => '            ' + line).join('\n')}
            
            browser.close();
        }
    }
}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600">
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="relative">
              <Terminal className="h-6 w-6" />
              <Zap className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
            <div className="flex-1">
              <div className="font-bold">MCP Agent</div>
              <div className="text-xs text-white/80 font-normal">
                {mcpTools.length} MCP tools • {' '}
                {mcpStatuses.testflowpro?.connected && mcpStatuses.playwright?.connected ? (
                  <span className="text-green-300">✓ TestFlowPro & Playwright Ready</span>
                ) : mcpStatuses.testflowpro?.connected ? (
                  <span className="text-yellow-300">⚡ TestFlowPro Only (Playwright connecting...)</span>
                ) : (
                  <span className="text-orange-300">⏳ Servers connecting...</span>
                )}
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
                  {Object.values(mcpStatuses).filter((s: any) => s.connected).length}/{mcpServers.length} Connected
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showServerPanel ? 'rotate-180' : ''}`} />
            </Button>

            {showServerPanel && (
              <div className="mt-3 space-y-2">
                {mcpServers.filter(s => s.enabled).map((server) => {
                  const status = mcpStatuses[server.id]
                  const isConnecting = connectingServers.has(server.id)
                  const serverTools = mcpTools.filter(t => t.server === server.id)

                  return (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{server.icon}</div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {server.name}
                            {status?.connected && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {status?.connected
                              ? `${serverTools.length} tools available`
                              : server.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status?.connected ? (
                          <>
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
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
                            className="h-8 bg-gradient-to-r from-indigo-500 to-purple-600"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {mcpServers.filter(s => s.enabled).length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No MCP servers configured
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">MCP Agent Ready</p>

                {mcpTools.length === 0 ? (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      ⚠️ No MCP servers connected
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Please connect MCP servers above to enable tool usage
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mt-2">
                      I can help you with file operations, terminal commands, browser automation, and more.
                    </p>
                    <div className="mt-4 text-xs">
                      <p>Try asking me to:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Read or write files</li>
                        <li>• Execute terminal commands</li>
                        {mcpStatuses.playwright?.connected && <li>• Automate browser tasks</li>}
                        <li>• Search and manipulate code</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {message.role === 'system' ? (
                      <RefreshCw className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                  {/* Execution Steps */}
                  {message.executionSteps && message.executionSteps.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                        <Terminal className="h-3 w-3" />
                        Execution Steps ({message.executionSteps.length})
                      </div>
                      {message.executionSteps.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className={`text-xs p-2 rounded border ${
                            step.status === 'success'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : step.status === 'error'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 font-medium">
                              {step.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />}
                              {step.status === 'error' && <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />}
                              {step.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />}
                              <span>{step.action}</span>
                            </div>
                            <span className="text-[10px] opacity-60">{step.toolName}</span>
                          </div>
                          {step.locator && (
                            <div className="text-[11px] opacity-80 mb-1">
                              <span className="font-semibold">Locator:</span> {step.locator}
                            </div>
                          )}
                          {step.value && (
                            <div className="text-[11px] opacity-80 mb-1">
                              <span className="font-semibold">Value:</span> {step.value}
                            </div>
                          )}
                          {step.result && (
                            <div className="text-[10px] opacity-70 mt-1 pt-1 border-t border-current/10">
                              {step.result}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Java Code Section */}
                      <div className="mt-3 border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold flex items-center gap-2">
                            <Terminal className="h-3 w-3" />
                            Playwright Java Code
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyJavaCode(generateCompleteJavaCode(message.executionSteps || []), message.id)}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedCode === message.id ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          💡 <strong>Tip:</strong> This code uses Playwright's recommended locator strategies (getByRole, getByPlaceholder, getByText, etc).
                          Replace any ref IDs with specific locators for your use case.
                        </div>
                        <pre className="text-[10px] bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                          <code>{generateCompleteJavaCode(message.executionSteps || [])}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Tool Results */}
                  {message.toolResults && message.toolResults.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-2">
                      {message.toolResults.map((result, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex items-center gap-2 font-medium mb-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{result.name}</span>
                          </div>
                          <pre className="bg-black/5 dark:bg-white/5 rounded p-2 overflow-x-auto">
                            {result.result.substring(0, 200)}
                            {result.result.length > 200 && '...'}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking and using tools...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to do anything using MCP tools..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line • AI handles tool execution iteratively
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

