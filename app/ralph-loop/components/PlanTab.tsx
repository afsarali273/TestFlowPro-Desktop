import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkles, FileText, Play, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { Plan } from '../types'

interface PlanTabProps {
  requirementsInput: string
  setRequirementsInput: (value: string) => void
  currentPlan: Plan | null
  isGeneratingPlan: boolean
  onGeneratePlan: () => void
  onStartExecution: () => void
}

export function PlanTab({
  requirementsInput,
  setRequirementsInput,
  currentPlan,
  isGeneratingPlan,
  onGeneratePlan,
  onStartExecution
}: PlanTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur h-fit">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          Define Your Requirements
        </h3>

        <Textarea
          placeholder="Describe what you want to build or test...

Example:
- Open flipkart.com
- Search for a product
- Click on first result
- Get product details and price"
          value={requirementsInput}
          onChange={(e) => setRequirementsInput(e.target.value)}
          className="min-h-[350px] bg-slate-700/50 border-white/10 text-white placeholder:text-white/40 resize-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20"
        />

        <div className="mt-4">
          <Button
            onClick={onGeneratePlan}
            disabled={!requirementsInput.trim() || isGeneratingPlan}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGeneratingPlan ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Plan with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Plan Display Section */}
      <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur flex flex-col h-fit lg:min-h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-400" />
            Generated Plan
          </h3>
          {currentPlan && (
            <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {currentPlan.generatedTasks.length} Tasks
            </Badge>
          )}
        </div>

        {currentPlan ? (
          <div className="flex flex-col gap-4 flex-1">
            {/* Plan Info Card */}
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 rounded-lg p-4 border border-green-400/20 shadow-lg">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-base font-bold text-white flex-1">{currentPlan.title}</h4>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Clock className="h-3 w-3" />
                  {new Date(currentPlan.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{currentPlan.requirements}</p>
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="text-xs font-semibold text-white/60 mb-2 px-1">TASKS BREAKDOWN</div>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2 pb-2">
                  {currentPlan.generatedTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="group bg-slate-900/50 rounded-lg p-3 border border-white/5 hover:border-indigo-400/40 hover:bg-slate-900/70 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-400/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-xs font-bold text-indigo-200">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-white mb-1 group-hover:text-indigo-200 transition-colors">{task.title}</h5>
                          <p className="text-xs text-white/60 leading-relaxed">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Action Button */}
            <Button
              onClick={onStartExecution}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Execution
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="relative mb-6">
                <FileText className="h-20 w-20 mx-auto text-white/20" />
                <Sparkles className="h-8 w-8 absolute top-0 right-1/3 text-indigo-400/40 animate-pulse" />
              </div>
              <p className="text-lg text-white/60 mb-2 font-semibold">No plan generated yet</p>
              <p className="text-sm text-white/40 max-w-xs mx-auto">Enter your requirements and click "Generate Plan with AI" to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

