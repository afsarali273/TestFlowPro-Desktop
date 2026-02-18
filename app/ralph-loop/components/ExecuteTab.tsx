import { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Play,
  Sparkles,
  Copy,
  Terminal,
  Clock
} from 'lucide-react'
import { Plan } from '../types'
import { useToast } from '@/hooks/use-toast'
import { ExecutionConsole } from './ExecutionConsole'

interface ExecuteTabProps {
  executingPlan: Plan | null
  isExecuting: boolean
  executionLog: string[]
  logRef: RefObject<HTMLDivElement | null>
  executionSummary: string
  showExecutionSummary: boolean
  completedCount: number
  totalCount: number
  successRate: number
  onResume: () => void
  onPause: () => void
  onCancel: () => void
  onRegenerateSummary: () => void
  onNavigateToTab?: (tab: string) => void
}

export function ExecuteTab({
  executingPlan,
  isExecuting,
  executionLog,
  logRef,
  executionSummary,
  showExecutionSummary,
  completedCount,
  totalCount,
  successRate,
  onResume,
  onPause,
  onCancel,
  onRegenerateSummary,
  onNavigateToTab
}: ExecuteTabProps) {
  const { toast } = useToast()

  if (!executingPlan) {
    return (
      <div className="border border-white/10 rounded-xl p-12 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 mx-auto mb-4 text-white/30" />
          <p className="text-lg text-white/60 mb-2">No execution in progress</p>
          <p className="text-sm text-white/40">Create a plan and start execution to begin</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Progress Section */}
      <div className="lg:col-span-3 space-y-4">
        {/* Plan Header */}
        <div className="border border-indigo-500/30 rounded-xl p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Executing Plan</h3>
              </div>
              <p className="text-sm font-semibold text-indigo-200">{executingPlan.title}</p>
              <p className="text-xs text-white/60 mt-1 line-clamp-2">{executingPlan.requirements}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-indigo-500/20 text-indigo-100 border-indigo-400/30">
                {completedCount}/{totalCount} Tasks
              </Badge>
              {isExecuting && (
                <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30 animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Running
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Overall Progress - modern redesign */}
        <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/40 to-slate-700/30 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Task Progress</h3>
                <p className="text-sm text-white/60">Execution overview and per-task status</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/60 text-right">
                <div className="font-semibold text-white">{completedCount}/{totalCount} Tasks</div>
                <div className="text-xs">{completedCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}% Complete` : '0% Complete'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {executingPlan.generatedTasks.map((task) => {
              const isPending = task.status === 'pending'
              const isInProgress = task.status === 'in-progress'
              const isCompleted = task.status === 'completed'
              const isFailed = task.status === 'failed'

              const statusClass = isCompleted ? 'bg-green-500/20 text-green-100 border-green-400/30' :
                isInProgress ? 'bg-blue-500/20 text-blue-100 border-blue-400/30' :
                isFailed ? 'bg-red-500/20 text-red-100 border-red-400/30' :
                'bg-white/5 text-white/60 border-white/10'

              return (
                <div key={task.id} className="p-4 rounded-lg bg-slate-900/40 border border-white/5 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-400" />}
                    {isInProgress && <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />}
                    {isFailed && <XCircle className="h-6 w-6 text-red-400" />}
                    {isPending && <AlertCircle className="h-6 w-6 text-white/40" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{task.title}</div>
                        <div className="text-xs text-white/60 truncate">{task.description}</div>
                      </div>

                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}> {task.status} </div>
                    </div>

                    <div className="mt-2">
                      <div className="h-2 bg-slate-800 rounded overflow-hidden">
                        <div
                          className={`h-full ${isCompleted ? 'bg-green-400' : isInProgress ? 'bg-blue-400' : isFailed ? 'bg-red-400' : 'bg-slate-600'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                        <div>{task.duration ? `⏱ ${task.duration}s` : '—'}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(task.description); toast({ title: 'Copied task description' }) }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { /* open task details or logs */ }}>
                            <Terminal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Execution Log */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur" style={{ height: '400px' }}>
          <ExecutionConsole logs={executionLog} logRef={logRef} />
        </div>

        {/* Execution Summary - Modern Redesign */}
        {showExecutionSummary && executionSummary && (
          <div className="space-y-6">
            {/* Summary Header */}
            <div className="border border-emerald-500/30 rounded-xl p-6 bg-gradient-to-br from-emerald-900/20 via-slate-900/40 to-blue-900/20 backdrop-blur shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-xl shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Execution Complete</h3>
                    <p className="text-sm text-emerald-300/80">Test automation summary and insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRegenerateSummary}
                    className="text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(executionSummary)
                      toast({ title: '✅ Summary copied!' })
                    }}
                    className="text-slate-300 hover:bg-slate-500/10 hover:text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-300/70 font-medium">Success Rate</p>
                      <p className="text-2xl font-bold text-emerald-400">{successRate}%</p>
                    </div>
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-300/70 font-medium">Tasks Completed</p>
                      <p className="text-2xl font-bold text-blue-400">{completedCount}/{totalCount}</p>
                    </div>
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300/70 font-medium">Total Duration</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {executingPlan.generatedTasks.reduce((sum, t) => sum + (t.duration || 0), 0)}s
                      </p>
                    </div>
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-300/70 font-medium">Failed Tasks</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {executingPlan.generatedTasks.filter(t => t.status === 'failed').length}
                      </p>
                    </div>
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <XCircle className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  Key Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-slate-300 font-medium">Most Reliable Actions</p>
                      <p className="text-slate-400 text-xs">Navigation and basic interactions performed consistently</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-slate-300 font-medium">Performance</p>
                      <p className="text-slate-400 text-xs">Average task completion: ~{(executingPlan.generatedTasks.reduce((sum, t) => sum + (t.duration || 0), 0) / totalCount).toFixed(1)}s per task</p>
                    </div>
                  </div>
                  {executingPlan.generatedTasks.filter(t => t.status === 'failed').length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-slate-300 font-medium">Areas for Improvement</p>
                        <p className="text-slate-400 text-xs">Some tasks failed - consider locator strategies or wait conditions</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-slate-300 font-medium">Next Steps</p>
                      <p className="text-slate-400 text-xs">Generate code or refine test scenarios based on results</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="lg:col-span-1 space-y-3">
        {/* Control Buttons */}
        <div className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
          <h3 className="text-xs font-semibold text-white/80 mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Controls
          </h3>
          <div className="space-y-2">
            {!isExecuting ? (
              <button
                onClick={onResume}
                className="group relative w-full px-4 py-2.5 bg-gradient-to-r from-slate-700/80 to-slate-600/80 hover:from-slate-600/90 hover:to-slate-500/90 text-slate-200 text-sm font-medium rounded-lg border border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 shadow-lg hover:shadow-slate-500/20 hover:shadow-xl backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  {completedCount === totalCount && totalCount > 0 ? 'Start' : 'Resume'}
                </span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="group relative w-full px-4 py-2.5 bg-gradient-to-r from-slate-700/80 to-slate-600/80 hover:from-slate-600/90 hover:to-slate-500/90 text-slate-200 text-sm font-medium rounded-lg border border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 shadow-lg hover:shadow-slate-500/20 hover:shadow-xl backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  Pause
                </span>
              </button>
            )}
            <button
              onClick={onCancel}
              className="group relative w-full px-4 py-2.5 bg-gradient-to-r from-slate-700/80 to-slate-600/80 hover:from-slate-600/90 hover:to-slate-500/90 text-slate-200 text-sm font-medium rounded-lg border border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 shadow-lg hover:shadow-slate-500/20 hover:shadow-xl backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                Cancel
              </span>
            </button>
            <button
              onClick={() => onNavigateToTab?.('generate')}
              className="group relative w-full px-4 py-2.5 bg-gradient-to-r from-slate-700/80 to-slate-600/80 hover:from-slate-600/90 hover:to-slate-500/90 text-slate-200 text-sm font-medium rounded-lg border border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 shadow-lg hover:shadow-slate-500/20 hover:shadow-xl backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                Generate Code
              </span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
          <h3 className="text-xs font-semibold text-white/80 mb-3">Metrics</h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-3 border border-green-400/20">
              <div className="text-[10px] text-green-300/80 mb-1 font-medium uppercase tracking-wide">Completed</div>
              <div className="text-2xl font-bold text-green-400">{completedCount}<span className="text-sm text-green-300/60">/{totalCount}</span></div>
              <div className="mt-2 h-1 bg-green-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-3 border border-blue-400/20">
              <div className="text-[10px] text-blue-300/80 mb-1 font-medium uppercase tracking-wide">Success</div>
              <div className="text-2xl font-bold text-blue-400">{successRate}<span className="text-sm text-blue-300/60">%</span></div>
              <div className="mt-2 h-1 bg-blue-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-500"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            {totalCount > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5">
                  <div className="text-[10px] text-white/50 mb-0.5 uppercase tracking-wide">Pending</div>
                  <div className="text-lg font-bold text-white/80">
                    {executingPlan.generatedTasks.filter(t => t.status === 'pending').length}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5">
                  <div className="text-[10px] text-white/50 mb-0.5 uppercase tracking-wide">Failed</div>
                  <div className="text-lg font-bold text-red-400">
                    {executingPlan.generatedTasks.filter(t => t.status === 'failed').length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

