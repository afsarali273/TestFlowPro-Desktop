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
  X
} from 'lucide-react'
import { Plan, Task } from '../types'

interface TasksBreakdownProps {
  plan: Plan
  onStartExecution: () => void
  onAddTask: () => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onReorderTasks: (orderedTaskIds: string[]) => void
}

export function TasksBreakdown({
  plan,
  onStartExecution,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks
}: TasksBreakdownProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === targetTaskId) return

    const tasks = plan.generatedTasks
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
    <Card
      className="p-6 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-white/10 backdrop-blur-xl shadow-2xl"
      data-tasks-section
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Tasks Breakdown ({plan.generatedTasks.length})
          </h3>
          {plan.mode === 'exploratory' && (
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-400" />
              Generated from {plan.discoveredScenarios?.length || 0} discovered scenarios
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
          {plan.generatedTasks.map((task, idx) => {
            // Extract scenario info from task title if it's from exploratory mode
            const isExploratoryTask = plan.mode === 'exploratory' && task.title.includes(' - Step ')
            const scenarioTitle = isExploratoryTask ? task.title.split(' - Step ')[0] : null
            const isFirstStepOfScenario = scenarioTitle && (idx === 0 || !plan.generatedTasks[idx - 1]?.title.startsWith(scenarioTitle))

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
  )
}

