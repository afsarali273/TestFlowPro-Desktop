import { Rocket, Home, Settings, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RalphLoopHeaderProps {
  mcpStatuses: Record<string, any>
}

export function RalphLoopHeader({ mcpStatuses }: RalphLoopHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Home className="h-5 w-5 text-white" />
            <span className="text-sm text-white/80">Back to Dashboard</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-yellow-300 animate-bounce" />
            <div>
              <h1 className="text-2xl font-bold text-white">Ralph Loop Agent</h1>
              <p className="text-xs text-white/70">Autonomous AI-Assisted Development</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mcpStatuses.testflowpro?.connected && (
            <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              TestFlowPro
            </Badge>
          )}
          {mcpStatuses.playwright?.connected && (
            <Badge className="bg-purple-500/20 text-purple-100 border-purple-400/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Playwright
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

