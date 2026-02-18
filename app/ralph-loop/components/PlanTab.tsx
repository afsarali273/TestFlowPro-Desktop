import { useState } from 'react'
import { Plan, Task } from '../types'
import { PlanModeSelector } from './PlanModeSelector'
import { ExplorationReport } from './ExplorationReport'
import { TasksBreakdown } from './TasksBreakdown'

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

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <PlanModeSelector
        planMode={planMode}
        setPlanMode={setPlanMode}
        requirementsInput={requirementsInput}
        setRequirementsInput={setRequirementsInput}
        explorationUrl={explorationUrl}
        setExplorationUrl={setExplorationUrl}
        explorationContext={explorationContext}
        setExplorationContext={setExplorationContext}
        isGeneratingPlan={isGeneratingPlan}
        isExploring={isExploring}
        onGeneratePlan={onGeneratePlan}
        onExploreAndGenerate={onExploreAndGenerate}
      />

      {/* Exploration Summary */}
      {currentPlan?.explorationSummary && (
        <ExplorationReport plan={currentPlan} />
      )}

      {/* Task Breakdown */}
      {currentPlan && currentPlan.generatedTasks.length > 0 && (
        <TasksBreakdown
          plan={currentPlan}
          onStartExecution={onStartExecution}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onReorderTasks={onReorderTasks}
        />
      )}
    </div>
  )
}

