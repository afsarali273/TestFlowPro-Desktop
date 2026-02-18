import { Plan } from '../types'
import { parsePlanToTasks } from '../utils/planHelpers'

export async function generatePlanWithAI(
  requirementsInput: string,
  setCurrentPlan: (plan: Plan | null) => void,
  setAllPlans: (plans: Plan[] | ((prev: Plan[]) => Plan[])) => void
): Promise<{ success: boolean; error?: string }> {
  if (!requirementsInput.trim()) {
    return { success: false, error: 'Requirements input is empty' }
  }

  try {
    const response = await fetch('/api/copilot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are a project planning AI. Break down these requirements into specific, actionable tasks that can be executed sequentially.\n\nRequirements:\n${requirementsInput}\n\nRespond with a JSON array of tasks with this structure:\n[\n  { "title": "Task title", "description": "What to do", "order": 1 },\n  ...\n]\n\nRespond ONLY with the JSON array, no other text.`,
        type: 'general',
        provider: 'github-copilot',
        agentMode: false
      })
    })

    const data = await response.json()
    const planText = data.response

    const tasks = parsePlanToTasks(planText)

    const plan: Plan = {
      id: `plan-${Date.now()}`,
      title: `Test Plan - ${new Date().toLocaleString()}`,
      requirements: requirementsInput,
      generatedTasks: tasks,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setCurrentPlan(plan)
    setAllPlans(prev => [...prev, plan])

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

