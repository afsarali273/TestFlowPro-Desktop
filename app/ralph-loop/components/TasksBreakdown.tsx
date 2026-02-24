import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import {
  CheckCircle2,
  Compass,
  Play,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  LayoutList,
  Layers,
  AlertTriangle,
  Info,
  CheckCheck,
  Tag,
  MapPin,
  ListOrdered,
} from 'lucide-react'
import { Plan, Task, DiscoveredScenario } from '../types'

interface TasksBreakdownProps {
  plan: Plan
  onStartExecution: () => void
  onAddTask: () => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onReorderTasks: (orderedTaskIds: string[]) => void
}

// ─── Priority helpers ───────────────────────────────────────────────────────

function priorityIcon(priority: string) {
  if (priority === 'high') return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
  if (priority === 'medium') return <Info className="h-3.5 w-3.5 text-yellow-400" />
  return <CheckCheck className="h-3.5 w-3.5 text-green-400" />
}

function priorityBadge(priority: string) {
  if (priority === 'high')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
        {priorityIcon(priority)} HIGH
      </span>
    )
  if (priority === 'medium')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
        {priorityIcon(priority)} MEDIUM
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-300 border border-green-500/30">
      {priorityIcon(priority)} LOW
    </span>
  )
}

// ─── Category color map ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Navigation:    'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300',
  Search:        'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-300',
  Forms:         'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300',
  Authentication:'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300',
  'User Flow':   'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-300',
  Performance:   'from-pink-500/20 to-fuchsia-500/20 border-pink-500/30 text-pink-300',
  Accessibility: 'from-lime-500/20 to-green-500/20 border-lime-500/30 text-lime-300',
  Security:      'from-rose-600/20 to-red-600/20 border-rose-500/30 text-rose-300',
  Exploratory:   'from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-300',
}

function categoryStyle(cat: string): string {
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return CATEGORY_COLORS[key]
  }
  return 'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300'
}

// ─── Scenario Card ──────────────────────────────────────────────────────────

function ScenarioCard({ scenario, index }: { scenario: DiscoveredScenario; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/40 hover:bg-slate-800/60 transition-all overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white leading-snug">{scenario.title}</span>
            {priorityBadge(scenario.priority)}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {scenario.page}
            </span>
            <span className="flex items-center gap-1">
              <ListOrdered className="h-3 w-3" /> {scenario.steps.length} steps
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 mt-1 text-slate-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {scenario.description && (
            <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>
          )}
          <div className="space-y-1.5">
            {scenario.steps.map((step, si) => (
              <div key={si} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {si + 1}
                </span>
                <span className="text-xs text-slate-300 leading-relaxed pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Category Group ─────────────────────────────────────────────────────────

function CategoryGroup({
  category,
  scenarios,
}: {
  category: string
  scenarios: DiscoveredScenario[]
}) {
  const [open, setOpen] = useState(true)
  const style = categoryStyle(category)
  const highCount = scenarios.filter(s => s.priority === 'high').length
  const medCount  = scenarios.filter(s => s.priority === 'medium').length

  return (
    <div className="rounded-2xl border overflow-hidden bg-slate-900/60"
         style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Category header */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${style} backdrop-blur-sm`}
      >
        <Tag className="h-4 w-4 flex-shrink-0" />
        <span className="font-semibold text-sm flex-1 text-left">{category}</span>

        <div className="flex items-center gap-2 mr-2">
          <span className="text-xs font-medium opacity-80">{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}</span>
          {highCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/30 text-red-200 text-xs font-bold">
              🔴 {highCount}
            </span>
          )}
          {medCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-yellow-500/30 text-yellow-200 text-xs font-bold">
              🟡 {medCount}
            </span>
          )}
        </div>

        {open ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
      </button>

      {/* Scenarios */}
      {open && (
        <div className="p-3 space-y-2">
          {scenarios.map((s, idx) => (
            <ScenarioCard key={s.id} scenario={s} index={idx} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Scenarios View ─────────────────────────────────────────────────────────

function ScenariosView({ plan }: { plan: Plan }) {
  const scenarios = plan.discoveredScenarios || []

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Compass className="h-10 w-10 mx-auto mb-3 text-slate-600" />
        <p className="text-sm">No scenarios discovered yet.</p>
      </div>
    )
  }

  // Group by category
  const grouped = scenarios.reduce<Record<string, DiscoveredScenario[]>>((acc, s) => {
    const cat = s.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  // Sort categories: most scenarios first, then alphabetically
  const sortedCategories = Object.entries(grouped).sort(([, a], [, b]) => {
    const highA = a.filter(s => s.priority === 'high').length
    const highB = b.filter(s => s.priority === 'high').length
    if (highB !== highA) return highB - highA
    return b.length - a.length
  })

  const totalHigh   = scenarios.filter(s => s.priority === 'high').length
  const totalMedium = scenarios.filter(s => s.priority === 'medium').length
  const totalLow    = scenarios.filter(s => s.priority === 'low').length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-800/50 border border-white/8">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Layers className="h-3.5 w-3.5" />
          {scenarios.length} Total Scenarios
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/60 border border-white/10 text-slate-300 text-xs font-semibold">
          <Tag className="h-3.5 w-3.5" />
          {sortedCategories.length} Categories
        </div>
        {totalHigh > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
            🔴 {totalHigh} High Priority
          </div>
        )}
        {totalMedium > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
            🟡 {totalMedium} Medium Priority
          </div>
        )}
        {totalLow > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-semibold">
            🟢 {totalLow} Low Priority
          </div>
        )}
      </div>

      {/* Category groups */}
      <div className="space-y-3">
        {sortedCategories.map(([cat, catScenarios]) => (
          <CategoryGroup key={cat} category={cat} scenarios={catScenarios} />
        ))}
      </div>
    </div>
  )
}

// ─── Flat Tasks View (original) ─────────────────────────────────────────────

function FlatTasksView({
  plan,
  editingTaskId,
  setEditingTaskId,
  draggedTaskId,
  onUpdateTask,
  onDeleteTask,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
}: {
  plan: Plan
  editingTaskId: string | null
  setEditingTaskId: (id: string | null) => void
  draggedTaskId: string | null
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  handleDragStart: (id: string) => void
  handleDragOver: (e: React.DragEvent, id: string) => void
  handleDragEnd: () => void
}) {
  return (
    <div className="space-y-2 pr-4">
      {plan.generatedTasks.map((task, idx) => {
        const isExploratoryTask = plan.mode === 'exploratory' && task.title.includes(' - Step ')
        const scenarioTitle = isExploratoryTask ? task.title.split(' - Step ')[0] : null
        const isFirstStepOfScenario =
          scenarioTitle &&
          (idx === 0 || !plan.generatedTasks[idx - 1]?.title.startsWith(scenarioTitle))

        return (
          <div key={task.id}>
            {isFirstStepOfScenario && (
              <div className="mt-6 mb-3 first:mt-0">
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-lg">
                  <Compass className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-300">{scenarioTitle}</span>
                </div>
              </div>
            )}

            <div
              draggable={true}
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={e => handleDragOver(e, task.id)}
              onDragEnd={handleDragEnd}
              className={`group relative flex gap-3 p-4 rounded-lg ${
                isExploratoryTask
                  ? 'bg-slate-800/30 hover:bg-slate-700/50 border border-cyan-500/10 hover:border-cyan-500/30'
                  : 'bg-slate-800/50 hover:bg-slate-700/70 border border-white/10 hover:border-indigo-500/50'
              } transition-all cursor-move ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
            >
              <GripVertical className="h-5 w-5 text-white/30 group-hover:text-white/60 flex-shrink-0 mt-0.5" />

              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${
                  isExploratoryTask
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                } flex items-center justify-center text-sm font-bold text-white shadow-lg`}
              >
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {editingTaskId === task.id ? (
                  <>
                    <Input
                      value={task.title}
                      onChange={e => onUpdateTask(task.id, { title: e.target.value })}
                      className="bg-slate-700/50 border-white/20 text-white text-sm"
                      placeholder="Task title"
                    />
                    <Textarea
                      value={task.description}
                      onChange={e => onUpdateTask(task.id, { description: e.target.value })}
                      className="bg-slate-700/50 border-white/20 text-white text-sm min-h-[60px]"
                      placeholder="Task description"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingTaskId(null)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button
                        onClick={() => setEditingTaskId(null)}
                        size="sm"
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                      >
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="text-sm font-semibold text-white flex-1">{task.title}</div>
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
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TasksBreakdown({
  plan,
  onStartExecution,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}: TasksBreakdownProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  // Default to scenarios view when in exploratory mode and there are scenarios
  const hasScenarios = (plan.discoveredScenarios?.length ?? 0) > 0
  const [view, setView] = useState<'scenarios' | 'tasks'>(
    plan.mode === 'exploratory' && hasScenarios ? 'scenarios' : 'tasks'
  )

  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId)

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === targetTaskId) return
    const tasks = plan.generatedTasks
    const di = tasks.findIndex(t => t.id === draggedTaskId)
    const ti = tasks.findIndex(t => t.id === targetTaskId)
    if (di === -1 || ti === -1) return
    const newTasks = [...tasks]
    const [removed] = newTasks.splice(di, 1)
    newTasks.splice(ti, 0, removed)
    onReorderTasks(newTasks.map(t => t.id))
  }

  const handleDragEnd = () => setDraggedTaskId(null)

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Tasks Breakdown
          </h3>
          {plan.mode === 'exploratory' && (
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-400" />
              {hasScenarios
                ? `${plan.discoveredScenarios!.length} discovered scenarios · ${plan.generatedTasks.length} tasks`
                : `${plan.generatedTasks.length} tasks generated`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — only in exploratory mode with scenarios */}
          {plan.mode === 'exploratory' && hasScenarios && (
            <div className="flex rounded-lg overflow-hidden border border-white/15 mr-2">
              <button
                onClick={() => setView('scenarios')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'scenarios'
                    ? 'bg-cyan-600/70 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Scenarios
              </button>
              <button
                onClick={() => setView('tasks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'tasks'
                    ? 'bg-indigo-600/70 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                Steps
              </button>
            </div>
          )}

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

      {/* Content */}
      <ScrollArea className="h-[650px]">
        {view === 'scenarios' && plan.mode === 'exploratory' ? (
          <ScenariosView plan={plan} />
        ) : (
          <FlatTasksView
            plan={plan}
            editingTaskId={editingTaskId}
            setEditingTaskId={setEditingTaskId}
            draggedTaskId={draggedTaskId}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
          />
        )}
      </ScrollArea>
    </Card>
  )
}
