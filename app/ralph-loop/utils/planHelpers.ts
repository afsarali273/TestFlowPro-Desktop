import { Plan } from '../types'

export function parsePlanToTasks(planText: string) {
  try {
    // Try to extract JSON array from response
    const jsonMatch = planText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsedTasks = JSON.parse(jsonMatch[0])

      return parsedTasks.map((task: any, idx: number) => ({
        id: `task-${Date.now()}-${idx}`,
        title: task.title || `Task ${idx + 1}`,
        description: task.description || task.title || '',
        status: 'pending' as const,
        progress: 0
      }))
    }
  } catch (error) {
    console.error('Failed to parse JSON plan, falling back to text parsing:', error)
  }

  // Fallback: Parse as numbered list
  const lines = planText.split('\n')
  const tasks = []
  let currentTask: any = null

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*\*?\*?(.+?)\*?\*?:?\s*(.*)/)
    if (match) {
      if (currentTask) tasks.push(currentTask)
      currentTask = {
        id: `task-${Date.now()}-${tasks.length}`,
        title: match[2].trim(),
        description: match[3].trim() || match[2].trim(),
        status: 'pending' as const,
        progress: 0
      }
    } else if (currentTask && line.trim()) {
      currentTask.description += ' ' + line.trim()
    }
  }

  if (currentTask) tasks.push(currentTask)

  return tasks.length > 0 ? tasks : [
    {
      id: `task-${Date.now()}`,
      title: 'Execute test plan',
      description: planText,
      status: 'pending' as const,
      progress: 0
    }
  ]
}

export function parseExplorationResult(resultText: string): any[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*"scenarios"[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.scenarios || []
    }

    // Alternative: look for array
    const arrayMatch = resultText.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0])
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Failed to parse exploration result:', error)
  }

  // Fallback: create basic scenarios from exploration text
  return [{
    title: 'Explore discovered features',
    description: 'Test the features discovered during exploration',
    page: 'Various pages',
    category: 'Exploratory',
    priority: 'medium',
    steps: ['Navigate to the website', 'Explore key features', 'Document findings']
  }]
}

export function generateExplorationSummary(
  url: string,
  context: string | undefined,
  scenarios: any[],
  rawExploration: string
): string {
  const timestamp = new Date().toLocaleString()
  const hostname = new URL(url).hostname

  let summary = `# 🔍 Exploration Report: ${hostname}\n\n`
  summary += `**Generated:** ${timestamp}\n`
  summary += `**URL:** ${url}\n\n`

  if (context?.trim()) {
    summary += `## 📋 Exploration Context\n\n`
    summary += `${context}\n\n`
    summary += `---\n\n`
  }

  summary += `## 📊 Discovery Summary\n\n`
  summary += `- **Total Scenarios Discovered:** ${scenarios.length}\n`

  const categoryCount: Record<string, number> = {}
  const priorityCount: Record<string, number> = { high: 0, medium: 0, low: 0 }

  scenarios.forEach(s => {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1
    priorityCount[s.priority] = (priorityCount[s.priority] || 0) + 1
  })

  summary += `- **Categories:** ${Object.keys(categoryCount).join(', ')}\n`
  summary += `- **Priority Breakdown:** 🔴 High (${priorityCount.high}) | 🟡 Medium (${priorityCount.medium}) | 🟢 Low (${priorityCount.low})\n\n`

  summary += `---\n\n`

  // Group scenarios by category
  const scenariosByCategory: Record<string, any[]> = scenarios.reduce((acc, scenario) => {
    if (!acc[scenario.category]) acc[scenario.category] = []
    acc[scenario.category].push(scenario)
    return acc
  }, {} as Record<string, any[]>)

  summary += `## 🎯 Discovered Test Scenarios\n\n`

  Object.entries(scenariosByCategory).forEach(([category, categoryScenarios]) => {
    summary += `### ${category}\n\n`

    categoryScenarios.forEach((scenario: any, idx: number) => {
      const priorityEmoji = scenario.priority === 'high' ? '🔴' : scenario.priority === 'medium' ? '🟡' : '🟢'

      summary += `#### ${idx + 1}. ${scenario.title} ${priorityEmoji}\n\n`
      summary += `**Priority:** ${scenario.priority}\n`
      summary += `**Page:** ${scenario.page}\n`
      summary += `**Description:** ${scenario.description}\n\n`

      summary += `**Test Steps:**\n`
      scenario.steps.forEach((step: string, stepIdx: number) => {
        summary += `${stepIdx + 1}. ${step}\n`
      })
      summary += `\n`
    })
  })

  summary += `---\n\n`

  summary += `## 🛠️ Next Steps\n\n`
  summary += `1. **Review** the discovered scenarios above\n`
  summary += `2. **Edit** or **delete** tasks as needed using the task controls\n`
  summary += `3. **Add** any missing scenarios using the "Add Task" button\n`
  summary += `4. **Reorder** tasks by dragging to prioritize execution\n`
  summary += `5. Click **"Start Execution"** when ready to run the tests\n\n`

  summary += `---\n\n`
  summary += `## 📝 Raw Exploration Notes\n\n`
  summary += `<details>\n`
  summary += `<summary>View AI exploration details</summary>\n\n`
  summary += `\`\`\`\n${rawExploration.substring(0, 2000)}${rawExploration.length > 2000 ? '...' : ''}\n\`\`\`\n\n`
  summary += `</details>\n`

  return summary
}

