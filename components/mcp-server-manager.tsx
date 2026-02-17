"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Settings,
  Play,
  Square,
  RefreshCw,
  Cpu,
  CheckCircle2,
  XCircle,
  Zap,
  Database,
  GitBranch,
  MessageSquare,
  Wrench
} from 'lucide-react'

interface MCPServer {
  id: string
  name: string
  description: string
  enabled: boolean
  icon: string
  category: string
}

interface ServerStatus {
  connected: boolean
  toolCount: number
  resourceCount: number
}

interface MCPTool {
  name: string
  description: string
  server: string
}

export function MCPServerManager() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [statuses, setStatuses] = useState<Record<string, ServerStatus>>({})
  const [tools, setTools] = useState<MCPTool[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    loadServers()
    loadStatuses()
    loadTools()
  }, [])

  const loadServers = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=list-servers')
      const data = await response.json()
      setServers(data.servers || [])
    } catch (error) {
      console.error('Failed to load servers:', error)
    }
  }

  const loadStatuses = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=all-statuses')
      const data = await response.json()
      setStatuses(data.statuses || {})
    } catch (error) {
      console.error('Failed to load statuses:', error)
    }
  }

  const loadTools = async () => {
    try {
      const response = await fetch('/api/mcp-servers?action=list-tools')
      const data = await response.json()
      setTools(data.tools || [])
    } catch (error) {
      console.error('Failed to load tools:', error)
    }
  }

  const connectServer = async (serverId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', serverId })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Server Connected',
          description: data.message
        })
        await Promise.all([loadStatuses(), loadTools()])
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const disconnectServer = async (serverId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', serverId })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Server Disconnected',
          description: data.message
        })
        await Promise.all([loadStatuses(), loadTools()])
      }
    } catch (error: any) {
      toast({
        title: 'Disconnection Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleServer = async (serverId: string, enabled: boolean) => {
    setLoading(true)
    try {
      const action = enabled ? 'enable-server' : 'disable-server'
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, serverId })
      })

      const data = await response.json()

      if (data.success) {
        await loadServers()
        toast({
          title: enabled ? 'Server Enabled' : 'Server Disabled',
          description: data.message
        })
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const connectAll = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect-all' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'All Servers Connected',
          description: data.message
        })
        await Promise.all([loadStatuses(), loadTools()])
      }
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'automation': return <Cpu className="h-4 w-4" />
      case 'version-control': return <GitBranch className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'project-management': return <MessageSquare className="h-4 w-4" />
      default: return <Wrench className="h-4 w-4" />
    }
  }

  const filteredServers = activeCategory === 'all'
    ? servers
    : servers.filter(s => s.category === activeCategory)

  const categories = ['all', 'automation', 'version-control', 'project-management', 'database', 'other']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MCP Servers</h2>
          <p className="text-muted-foreground">
            Manage Model Context Protocol server integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStatuses} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={connectAll} disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            Connect All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Servers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(statuses).filter(s => s.connected).length} / {servers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled Servers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {servers.filter(s => s.enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat.replace('-', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Server List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServers.map(server => {
          const status = statuses[server.id]
          const isConnected = status?.connected || false

          return (
            <Card key={server.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{server.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {server.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  {getCategoryIcon(server.category)}
                  <Badge variant="outline" className="text-xs capitalize">
                    {server.category.replace('-', ' ')}
                  </Badge>
                </div>

                {/* Status Info */}
                {isConnected && status && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tools:</span>
                      <span className="font-medium">{status.toolCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resources:</span>
                      <span className="font-medium">{status.resourceCount}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={server.enabled}
                      onCheckedChange={(checked) => toggleServer(server.id, checked)}
                      disabled={loading}
                    />
                    <Label className="text-xs">Enabled</Label>
                  </div>

                  <div className="flex gap-2">
                    {isConnected ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => disconnectServer(server.id)}
                        disabled={loading}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => connectServer(server.id)}
                        disabled={loading || !server.enabled}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tools Section */}
      {tools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
            <CardDescription>
              Tools provided by connected MCP servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Wrench className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{tool.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {tool.description}
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {tool.server}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

