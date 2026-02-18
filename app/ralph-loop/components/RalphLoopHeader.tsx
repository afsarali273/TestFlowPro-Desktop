import { Rocket, Home, Settings, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RalphLoopHeaderProps {
  mcpStatuses: Record<string, any>
}

export function RalphLoopHeader({ mcpStatuses }: RalphLoopHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/90 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-slate-200 hover:text-white transition">
            <Home className="h-5 w-5" />
            <span className="text-sm">Back to Dashboard</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-sky-300 drop-shadow" />
            <div>
              <h1 className="text-2xl font-semibold text-white">TestFlowPro MCP Agent</h1>
              <p className="text-xs text-slate-300">Autonomous MCP-driven execution and generation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mcpStatuses.testflowpro?.connected && (
            <Badge className="bg-emerald-500/15 text-emerald-100 border-emerald-400/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              TestFlowPro
            </Badge>
          )}
          {mcpStatuses.playwright?.connected && (
            <Badge className="bg-sky-500/15 text-sky-100 border-sky-400/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Playwright
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-slate-200 hover:bg-white/10 hover:text-white">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
