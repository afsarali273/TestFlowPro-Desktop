import { Plan, Task } from '../types'
import { useToast } from '@/components/ui/use-toast'

export function usePlanOperations(
  currentPlan: Plan | null,
  setCurrentPlan: (plan: Plan | null) => void,
  setAllPlans: (plans: Plan[] | ((prev: Plan[]) => Plan[])) => void
) {
  const { toast } = useToast()

  const addPlanTask = () => {
    if (!currentPlan) return
    const updatedPlan: Plan = {
      ...currentPlan,
      generatedTasks: [
        ...currentPlan.generatedTasks,
        {
          id: `task-${Date.now()}-${currentPlan.generatedTasks.length}`,
          title: 'New Task',
          description: 'Describe the task',
          status: 'pending',
          progress: 0
        }
      ],
      updatedAt: new Date()
    }
    setCurrentPlan(updatedPlan)
  }

  const updatePlanTask = (taskId: string, updates: Partial<Task>) => {
    if (!currentPlan) return
    const updatedPlan: Plan = {
      ...currentPlan,
      generatedTasks: currentPlan.generatedTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
      updatedAt: new Date()
    }
    setCurrentPlan(updatedPlan)
  }

  const deletePlanTask = (taskId: string) => {
    if (!currentPlan) return
    const updatedPlan: Plan = {
      ...currentPlan,
      generatedTasks: currentPlan.generatedTasks.filter(task => task.id !== taskId),
      updatedAt: new Date()
    }
    setCurrentPlan(updatedPlan)
  }

  const reorderPlanTasks = (orderedTaskIds: string[]) => {
    if (!currentPlan) return
    const taskMap = new Map(currentPlan.generatedTasks.map(task => [task.id, task]))
    const reorderedTasks = orderedTaskIds
      .map(id => taskMap.get(id))
      .filter((task): task is Task => Boolean(task))

    const updatedPlan: Plan = {
      ...currentPlan,
      generatedTasks: reorderedTasks,
      updatedAt: new Date()
    }
    setCurrentPlan(updatedPlan)
  }

  return {
    addPlanTask,
    updatePlanTask,
    deletePlanTask,
    reorderPlanTasks
  }
}

