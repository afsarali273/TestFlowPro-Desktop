import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react'

interface ServersTabProps {
  mcpServers: any[]
  mcpStatuses: Record<string, any>
  mcpTools: any[]
  connectingServers: Set<string>
  onConnectServer: (serverId: string) => void
  onRefreshStatuses: () => void
}

export function ServersTab({
  mcpServers,
  mcpStatuses,
  mcpTools,
  connectingServers,
  onConnectServer,
  onRefreshStatuses
}: ServersTabProps) {
  return (
    <div className="space-y-6">
      {/* Servers List */}
      <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            MCP Servers
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefreshStatuses}
            className="text-white"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mcpServers.map((server) => {
            const status = mcpStatuses[server.id]
            const isConnecting = connectingServers.has(server.id)
            const isConnected = status?.connected

            return (
              <div
                key={server.id}
                className="border border-white/10 rounded-lg p-4 bg-slate-900/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">{server.name}</h4>
                  {isConnected ? (
                    <Badge className="bg-green-500/20 text-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : isConnecting ? (
                    <Badge className="bg-yellow-500/20 text-yellow-100">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Connecting
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-100">
                      <XCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>

                {isConnected && status?.toolsCount !== undefined && (
                  <div className="text-xs text-white/60 mb-2">
                    {status.toolsCount} tools available
                  </div>
                )}

                {!isConnected && !isConnecting && (
                  <Button
                    size="sm"
                    onClick={() => onConnectServer(server.id)}
                    className="w-full mt-2"
                  >
                    Connect
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Available Tools */}
      <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          Available Tools ({mcpTools.length})
        </h3>

        {mcpTools.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-3">
              {mcpTools.map((tool, idx) => (
                <div
                  key={idx}
                  className="border border-white/5 rounded-lg p-3 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {tool.name || 'Unknown Tool'}
                      </div>
                      {tool.description && (
                        <div className="text-xs text-white/50 line-clamp-2 mt-1">
                          {tool.description}
                        </div>
                      )}
                      {tool.server && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {tool.server}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/60 mb-2">No tools available</p>
              <p className="text-sm text-white/40">Connect to MCP servers to see available tools</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

