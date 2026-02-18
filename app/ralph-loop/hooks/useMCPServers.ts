import { useState } from 'react'
import { MCPServer } from '../types'
import { useToast } from '@/components/ui/use-toast'

export function useMCPServers() {
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([])
  const [mcpStatuses, setMcpStatuses] = useState<Record<string, any>>({})
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [connectingServers, setConnectingServers] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const loadMCPServers = async () => {
    try {
      await fetch('/api/mcp-servers?action=list-servers')

      const servers: MCPServer[] = [
        { id: 'testflowpro', name: 'TestFlowPro Operations', status: 'disconnected' },
        { id: 'playwright', name: 'Playwright', status: 'disconnected' },
        { id: 'memory', name: 'Memory', status: 'disconnected' },
        { id: 'fetch', name: 'Fetch', status: 'disconnected' }
      ]

      setMcpServers(servers)
      await refreshMCPStatuses()
      await refreshMCPTools()
    } catch (error) {
      console.error('Failed to load MCP servers:', error)
    }
  }

  const refreshMCPStatuses = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=all-statuses')
      const data = await response.json()
      setMcpStatuses(data.statuses || {})
    } catch (error) {
      console.error('Failed to refresh MCP statuses:', error)
    }
  }

  const refreshMCPTools = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=list-tools')
      const data = await response.json()
      setMcpTools(data.tools || [])
    } catch (error) {
      console.error('Failed to refresh MCP tools:', error)
    }
  }

  const connectToServer = async (serverId: string) => {
    setConnectingServers(prev => new Set(prev).add(serverId))

    try {
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', serverId })
      })

      if (!response.ok) throw new Error('Failed to connect')

      await refreshMCPStatuses()
      await refreshMCPTools()

      toast({
        title: '✅ Connected',
        description: `Connected to ${serverId}`
      })
    } catch (error: any) {
      toast({
        title: '❌ Connection Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setConnectingServers(prev => {
        const newSet = new Set(prev)
        newSet.delete(serverId)
        return newSet
      })
    }
  }

  const autoConnectServers = async () => {
    try {
      await refreshMCPStatuses()
      const statuses = mcpStatuses

      const serversToConnect = ['testflowpro', 'playwright']

      for (const serverId of serversToConnect) {
        if (!statuses[serverId]?.connected) {
          await connectToServer(serverId)
        }
      }

      let retries = 0
      while (retries < 5) {
        await refreshMCPTools()
        if (mcpTools.length > 0) break
        await new Promise(r => setTimeout(r, 1000))
        retries++
      }
    } catch (err) {
      console.error('Failed to auto-connect MCP servers:', err)
    }
  }

  const ensureMCPReady = async (): Promise<boolean> => {
    try {
      await refreshMCPStatuses()
      await refreshMCPTools()

      const statuses = mcpStatuses

      const isPlaywrightConnected = statuses.playwright?.connected
      const isTestflowConnected = statuses.testflowpro?.connected

      if (!isTestflowConnected) await connectToServer('testflowpro')
      if (!isPlaywrightConnected) await connectToServer('playwright')

      let retries = 0
      while (retries < 5) {
        await refreshMCPTools()
        if (mcpTools.length > 0) break
        await new Promise(r => setTimeout(r, 1500))
        retries++
      }

      const hasPlaywrightTools = mcpTools.some(t => t.server === 'playwright')
      const hasTFPTools = mcpTools.some(t => t.server === 'testflowpro')

      if (!hasPlaywrightTools || !hasTFPTools) {
        toast({
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

  return {
    mcpServers,
    mcpStatuses,
    mcpTools,
    connectingServers,
    setMcpServers,
    setMcpStatuses,
    setMcpTools,
    loadMCPServers,
    refreshMCPStatuses,
    refreshMCPTools,
    connectToServer,
    autoConnectServers,
    ensureMCPReady
  }
}

