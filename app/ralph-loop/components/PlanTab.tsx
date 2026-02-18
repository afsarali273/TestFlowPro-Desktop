import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import {
  Sparkles,
  FileText,
  Play,
  Zap,
  Clock,
  CheckCircle2,
  Compass,
  Edit2,
  Trash2,
  GripVertical,
  Plus,
  Save,
  X
} from 'lucide-react'
import { Plan, Task } from '../types'

interface PlanTabProps {
  requirementsInput: string
  setRequirementsInput: (value: string) => void
  currentPlan: Plan | null
  isGeneratingPlan: boolean
  onGeneratePlan: () => void
  onStartExecution: () => void
  onAddTask: () => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onReorderTasks: (orderedTaskIds: string[]) => void
  onExploreAndGenerate: (url: string, context?: string) => void
  isExploring: boolean
}

export function PlanTab({
  requirementsInput,
  setRequirementsInput,
  currentPlan,
  isGeneratingPlan,
  onGeneratePlan,
  onStartExecution,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  onExploreAndGenerate,
  isExploring
}: PlanTabProps) {
  const [planMode, setPlanMode] = useState<'manual' | 'exploratory'>('manual')
  const [explorationUrl, setExplorationUrl] = useState('')
  const [explorationContext, setExplorationContext] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === targetTaskId) return

    const tasks = currentPlan?.generatedTasks || []
    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId)
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newTasks = [...tasks]
    const [removed] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, removed)

    onReorderTasks(newTasks.map(t => t.id))
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card className="p-6 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex gap-4 mb-6">
          <Button
            variant={planMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setPlanMode('manual')}
            className={planMode === 'manual'
              ? 'flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/50'
              : 'flex-1 border-white/20 hover:bg-white/5'}
          >
            <FileText className="h-4 w-4 mr-2" />
            Manual Plan
          </Button>
          <Button
            variant={planMode === 'exploratory' ? 'default' : 'outline'}
            onClick={() => setPlanMode('exploratory')}
            className={planMode === 'exploratory'
              ? 'flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/50'
              : 'flex-1 border-white/20 hover:bg-white/5'}
          >
            <Compass className="h-4 w-4 mr-2" />
            Exploratory Test
          </Button>
        </div>

        {planMode === 'manual' ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Define Your Requirements
              </h3>
              <p className="text-sm text-white/60 mb-4">
                Describe step-by-step what you want to test or automate
              </p>
            </div>

            <Textarea
              placeholder="Example:
1. Open https://example.com
2. Click on login button
3. Enter credentials
4. Verify dashboard loads"
              value={requirementsInput}
              onChange={(e) => setRequirementsInput(e.target.value)}
              className="min-h-[200px] bg-slate-700/50 border-white/10 text-white placeholder-white/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg"
              disabled={isGeneratingPlan}
            />

            <Button
              onClick={onGeneratePlan}
              disabled={isGeneratingPlan || !requirementsInput.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
              size="lg"
            >
              {isGeneratingPlan ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Plan with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-400" />
                Exploratory Testing
              </h3>
              <p className="text-sm text-white/60 mb-4">
                AI will explore the website and discover test scenarios for you
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Website URL *</label>
                <Input
                  placeholder="https://example.com"
                  value={explorationUrl}
                  onChange={(e) => setExplorationUrl(e.target.value)}
                  className="bg-slate-700/50 border-white/10 text-white placeholder-white/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isExploring}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Exploration Context (Optional)
                </label>
                <Textarea
                  placeholder="e.g., Focus on checkout flow, Test admin dashboard features, Explore after login..."
                  value={explorationContext}
                  onChange={(e) => setExplorationContext(e.target.value)}
                  className="min-h-[100px] bg-slate-700/50 border-white/10 text-white placeholder-white/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                  disabled={isExploring}
                />
              </div>
            </div>

            <Button
              onClick={() => onExploreAndGenerate(explorationUrl, explorationContext)}
              disabled={isExploring || !explorationUrl.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
              size="lg"
            >
              {isExploring ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Exploring Website...
                </>
              ) : (
                <>
                  <Compass className="h-5 w-5 mr-2" />
                  Explore & Generate Scenarios
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Exploration Summary - Professional Design */}
      {currentPlan?.explorationSummary && (
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Background Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-teal-600/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent_50%)]" />

          <div className="relative">
            {/* Header Section */}
            <div className="px-8 py-6 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border-b border-cyan-500/20 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30">
                    <Compass className="h-7 w-7 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                      AI Exploration Report
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Discovered {currentPlan.discoveredScenarios?.length || 0} test scenarios from {currentPlan.explorationUrl}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-3">
                  <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-red-400 font-medium">High Priority</div>
                    <div className="text-xl font-bold text-red-300">
                      {currentPlan.discoveredScenarios?.filter(s => s.priority === 'high').length || 0}
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="text-xs text-yellow-400 font-medium">Medium</div>
                    <div className="text-xl font-bold text-yellow-300">
                      {currentPlan.discoveredScenarios?.filter(s => s.priority === 'medium').length || 0}
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-xs text-green-400 font-medium">Low</div>
                    <div className="text-xl font-bold text-green-300">
                      {currentPlan.discoveredScenarios?.filter(s => s.priority === 'low').length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <ScrollArea className="max-h-[650px]">
              <div className="p-8">
                {/* Professional Markdown Rendering */}
                <div className="prose prose-lg prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-4xl prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gradient-to-r prose-h1:from-cyan-500/30 prose-h1:via-transparent prose-h1:to-transparent
                  prose-h1:bg-gradient-to-r prose-h1:from-cyan-300 prose-h1:to-blue-400 prose-h1:bg-clip-text prose-h1:text-transparent
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-5 prose-h2:text-cyan-300 prose-h2:flex prose-h2:items-center prose-h2:gap-3
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-cyan-400 prose-h3:font-semibold
                  prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3 prose-h4:text-cyan-500 prose-h4:font-medium
                  prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base prose-p:my-4
                  prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 hover:prose-a:underline prose-a:transition-all
                  prose-strong:text-cyan-200 prose-strong:font-semibold
                  prose-em:text-slate-400 prose-em:not-italic
                  prose-code:text-pink-400 prose-code:bg-slate-800/70 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-gradient-to-br prose-pre:from-slate-900/90 prose-pre:to-slate-800/90 prose-pre:border prose-pre:border-cyan-500/20 prose-pre:rounded-xl prose-pre:shadow-xl prose-pre:my-6 prose-pre:p-6
                  prose-ul:my-5 prose-ul:text-slate-300
                  prose-ol:my-5 prose-ol:text-slate-300
                  prose-li:my-2 prose-li:text-slate-300 prose-li:leading-relaxed
                  prose-li:marker:text-cyan-400
                  prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-gradient-to-r prose-blockquote:from-cyan-900/20 prose-blockquote:to-transparent prose-blockquote:text-cyan-100 prose-blockquote:pl-6 prose-blockquote:py-3 prose-blockquote:my-6 prose-blockquote:rounded-r-lg prose-blockquote:italic
                  prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:rounded-lg prose-table:overflow-hidden
                  prose-thead:bg-gradient-to-r prose-thead:from-cyan-900/40 prose-thead:to-blue-900/40
                  prose-th:text-cyan-200 prose-th:font-semibold prose-th:text-left prose-th:px-6 prose-th:py-4 prose-th:border prose-th:border-cyan-500/20
                  prose-td:text-slate-300 prose-td:px-6 prose-td:py-4 prose-td:border prose-td:border-slate-700/30
                  prose-tbody:bg-slate-900/30
                  prose-tr:transition-colors hover:prose-tr:bg-cyan-500/5
                  prose-hr:border-0 prose-hr:h-px prose-hr:bg-gradient-to-r prose-hr:from-transparent prose-hr:via-cyan-500/50 prose-hr:to-transparent prose-hr:my-10
                  prose-img:rounded-xl prose-img:shadow-2xl prose-img:border prose-img:border-cyan-500/20 prose-img:my-8
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      // Enhanced H1
                      h1: ({node, ...props}) => (
                        <h1 className="flex items-center gap-3" {...props}>
                          <span className="flex-shrink-0 w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                          {props.children}
                        </h1>
                      ),
                      // Enhanced H2
                      h2: ({node, ...props}) => (
                        <h2 className="flex items-center gap-3" {...props}>
                          <span className="flex-shrink-0 w-1 h-7 bg-gradient-to-b from-cyan-500 to-cyan-600 rounded-full" />
                          {props.children}
                        </h2>
                      ),
                      // Enhanced Table
                      table: ({node, ...props}) => (
                        <div className="overflow-hidden rounded-xl border border-cyan-500/20 shadow-lg my-8">
                          <table {...props} />
                        </div>
                      ),
                      // Enhanced Blockquote
                      blockquote: ({node, ...props}) => (
                        <blockquote className="relative" {...props}>
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
                          {props.children}
                        </blockquote>
                      ),
                      // Priority Badge Highlighting
                      li: ({node, children, ...props}) => {
                        const content = String(children);
                        if (content.includes('🔴')) {
                          return (
                            <li className="flex items-start gap-2 text-red-300 font-medium" {...props}>
                              {children}
                            </li>
                          )
                        } else if (content.includes('🟡')) {
                          return (
                            <li className="flex items-start gap-2 text-yellow-300 font-medium" {...props}>
                              {children}
                            </li>
                          )
                        } else if (content.includes('🟢')) {
                          return (
                            <li className="flex items-start gap-2 text-green-300 font-medium" {...props}>
                              {children}
                            </li>
                          )
                        }
                        return <li {...props}>{children}</li>
                      },
                      // Enhanced details/summary for collapsible sections
                      details: ({node, ...props}) => (
                        <details className="group my-6 rounded-lg border border-cyan-500/20 bg-slate-900/30 overflow-hidden" {...props}>
                          {props.children}
                        </details>
                      ),
                      summary: ({node, ...props}) => (
                        <summary className="px-4 py-3 cursor-pointer bg-gradient-to-r from-cyan-900/20 to-blue-900/20 hover:from-cyan-900/30 hover:to-blue-900/30 transition-colors text-cyan-300 font-medium flex items-center gap-2 select-none" {...props}>
                          <span className="text-cyan-400">▶</span>
                          {props.children}
                        </summary>
                      )
                    }}
                  >
                    {currentPlan.explorationSummary}
                  </ReactMarkdown>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border-t border-cyan-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300 font-medium">
                      {currentPlan.generatedTasks.length} tasks generated from scenarios
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Review the report above, then edit/reorder tasks below
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const tasksSection = document.querySelector('[data-tasks-section]')
                    tasksSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 border-0"
                >
                  <Play className="h-4 w-4 mr-2" />
                  View Tasks Below
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Task Breakdown */}
      {currentPlan && currentPlan.generatedTasks.length > 0 && (
        <Card
          className="p-6 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-white/10 backdrop-blur-xl shadow-2xl"
          data-tasks-section
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Tasks Breakdown ({currentPlan.generatedTasks.length})
              </h3>
              {currentPlan.mode === 'exploratory' && (
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-cyan-400" />
                  Generated from {currentPlan.discoveredScenarios?.length || 0} discovered scenarios
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onAddTask}
                size="sm"
                variant="outline"
                className="border-white/20 hover:bg-white/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
              <Button
                onClick={onStartExecution}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30"
              >
                <Play className="h-4 w-4 mr-1" />
                Start Execution
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[600px]">
            <div className="space-y-2">
              {currentPlan.generatedTasks.map((task, idx) => {
                // Extract scenario info from task title if it's from exploratory mode
                const isExploratoryTask = currentPlan.mode === 'exploratory' && task.title.includes(' - Step ')
                const scenarioTitle = isExploratoryTask ? task.title.split(' - Step ')[0] : null
                const isFirstStepOfScenario = scenarioTitle && (idx === 0 || !currentPlan.generatedTasks[idx - 1]?.title.startsWith(scenarioTitle))

                return (
                  <div key={task.id}>
                    {/* Scenario Header for Exploratory Mode */}
                    {isFirstStepOfScenario && (
                      <div className="mt-6 mb-3 first:mt-0">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-lg">
                          <Compass className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-semibold text-cyan-300">{scenarioTitle}</span>
                        </div>
                      </div>
                    )}

                    {/* Task Card */}
                    <div
                      draggable={true}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative flex gap-3 p-4 rounded-lg ${
                        isExploratoryTask 
                          ? 'bg-slate-800/30 hover:bg-slate-700/50 border border-cyan-500/10 hover:border-cyan-500/30' 
                          : 'bg-slate-800/50 hover:bg-slate-700/70 border border-white/10 hover:border-indigo-500/50'
                      } transition-all cursor-move ${
                        draggedTaskId === task.id ? 'opacity-50' : ''
                      }`}
                    >
                      <GripVertical className="h-5 w-5 text-white/30 group-hover:text-white/60 flex-shrink-0 mt-0.5" />

                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        isExploratoryTask
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      } flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {editingTaskId === task.id ? (
                          <>
                            <Input
                              value={task.title}
                              onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
                              className="bg-slate-700/50 border-white/20 text-white text-sm"
                              placeholder="Task title"
                            />
                            <Textarea
                              value={task.description}
                              onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
                              className="bg-slate-700/50 border-white/20 text-white text-sm min-h-[60px]"
                              placeholder="Task description"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setEditingTaskId(null)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingTaskId(null)}
                                size="sm"
                                variant="outline"
                                className="border-white/20 hover:bg-white/10"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start gap-2">
                              <div className="text-sm font-semibold text-white flex-1">
                                {task.title}
                              </div>
                              {isExploratoryTask && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                                  AI Discovered
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/70 leading-relaxed">{task.description}</div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => setEditingTaskId(task.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-indigo-500/20"
                        >
                          <Edit2 className="h-3 w-3 text-indigo-400" />
                        </Button>
                        <Button
                          onClick={() => onDeleteTask(task.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}

