import { Plan } from '@/types/ralph-loop'

interface ExplorationResult {
  success: boolean
  error?: string
}

export async function exploreAndGenerateScenarios(
  url: string,
  context: string | undefined,
  mcpTools: any[],
  setCurrentPlan: (plan: Plan | null) => void,
  setAllPlans: (plans: Plan[] | ((prev: Plan[]) => Plan[])) => void,
  ensureMCPReady: () => Promise<boolean>
): Promise<ExplorationResult> {
  try {
    // Validate URL
    if (!url.trim()) {
      return { success: false, error: 'URL is required' }
    }

    let fullUrl = url.trim()
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl
    }

    // Ensure MCP servers are ready
    const mcpReady = await ensureMCPReady()
    if (!mcpReady) {
      return { success: false, error: 'MCP servers not ready. Please try again.' }
    }

    // Phase 1: Explore the website using Playwright MCP
    const explorationPrompt = `You are an expert QA automation engineer performing exploratory testing.

**TASK**: Explore ${fullUrl} and discover all possible test scenarios

**CONTEXT**: ${context?.trim() || 'Explore the entire website systematically'}

**INSTRUCTIONS**:
1. Navigate to ${fullUrl}
2. Take a snapshot to understand the page structure
3. ${context?.trim() ? 'Focus on the specific areas mentioned in the context' : 'Identify all interactive elements (buttons, links, forms, inputs)'}
4. ${context?.trim() ? 'Prioritize areas mentioned in the context' : 'Click on major navigation links and explore key pages'}
5. Take snapshots of important pages
6. Document user flows and features discovered
7. ${context?.trim() ? 'Focus on the specific modules, features, or flows mentioned in the context' : 'Cover main user journeys and critical features'}

**IMPORTANT RULES**:
- Use Playwright MCP tools (browser_navigate, browser_snapshot, browser_click, browser_type, browser_fill_form, etc.)
- ${context?.trim() ? 'Prioritize areas mentioned in the specific instructions' : 'Explore thoroughly but efficiently (visit 5-7 key pages maximum)'}
- Handle any popups, modals, or cookie banners appropriately
- If you encounter login forms and credentials are provided, use them
- Document what you find as you explore
- Be systematic and thorough

After exploration, provide a JSON response with discovered test scenarios in this format:
{
  "scenarios": [
    {
      "title": "Scenario title",
      "description": "What to test",
      "page": "Page URL or name",
      "category": "Category (e.g., Navigation, Search, Forms, Login, Dashboard, etc.)",
      "priority": "high|medium|low",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Begin exploration now using MCP tools. Be thorough and systematic.`

    const response = await fetch('/api/copilot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: explorationPrompt,
        type: 'mcp-agent',
        provider: 'github-copilot',
        agentMode: true,
        mcpTools: mcpTools
      })
    })

    const data = await response.json()
    const explorationResult = data.response

    // Parse discovered scenarios
    const scenarios = parseExplorationResult(explorationResult)

    if (scenarios.length === 0) {
      return {
        success: false,
        error: 'Unable to discover test scenarios. Please try again.'
      }
    }

    // Generate detailed exploration summary
    const explorationSummary = generateExplorationSummary(fullUrl, context, scenarios, explorationResult)

    // Phase 2: Convert scenarios to executable tasks
    const tasks = scenarios.flatMap((scenario: any, idx: number) =>
      scenario.steps.map((step: string, stepIdx: number) => ({
        id: `task-${Date.now()}-${idx}-${stepIdx}`,
        title: `${scenario.title} - Step ${stepIdx + 1}`,
        description: step,
        status: 'pending' as const,
        progress: 0
      }))
    )

    const plan: Plan = {
      id: `plan-${Date.now()}`,
      title: `Exploratory Test Plan - ${new URL(fullUrl).hostname}`,
      requirements: context?.trim()
        ? `Exploratory testing for ${fullUrl}\n\nContext: ${context}`
        : `Exploratory testing for ${fullUrl}`,
      generatedTasks: tasks,
      createdAt: new Date(),
      updatedAt: new Date(),
      mode: 'exploratory',
      explorationUrl: fullUrl,
      explorationSummary: explorationSummary,
      discoveredScenarios: scenarios.map((s: any) => ({
        id: `scenario-${Date.now()}-${Math.random()}`,
        title: s.title,
        description: s.description,
        page: s.page,
        elements: [],
        steps: s.steps,
        priority: s.priority as 'high' | 'medium' | 'low',
        category: s.category
      }))
    }

    setCurrentPlan(plan)
    setAllPlans(prev => [...prev, plan])

    return { success: true }

  } catch (error: any) {
    console.error('Exploration error:', error)
    return {
      success: false,
      error: error.message || 'Failed to explore and generate scenarios'
    }
  }
}

function parseExplorationResult(resultText: string): any[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*"scenarios"[\s\S]*}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.scenarios || []
    }

    // Alternative: look for array
    const arrayMatch = resultText.match(/\[[\s\S]*]/)
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

function generateExplorationSummary(
  url: string,
  context: string | undefined,
  scenarios: any[],
  rawExploration: string
): string {
  const timestamp = new Date().toLocaleString()

  let summary = `# 🔍 AI Exploration Report\n\n`
  summary += `> **Website:** ${url}  \n`
  summary += `> **Generated:** ${timestamp}  \n`
  summary += `> **Total Scenarios:** ${scenarios.length}\n\n`

  summary += `---\n\n`

  if (context?.trim()) {
    summary += `## 📋 Exploration Context\n\n`
    summary += `\`\`\`\n${context}\n\`\`\`\n\n`
  }

  // Discovery Summary with Table
  summary += `## 📊 Discovery Summary\n\n`

  const categoryCount: Record<string, number> = {}
  const priorityCount: Record<string, number> = { high: 0, medium: 0, low: 0 }

  scenarios.forEach(s => {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1
    priorityCount[s.priority] = (priorityCount[s.priority] || 0) + 1
  })

  // Summary Table
  summary += `| Metric | Value |\n`
  summary += `|--------|-------|\n`
  summary += `| 🎯 **Total Scenarios** | ${scenarios.length} |\n`
  summary += `| 📁 **Categories** | ${Object.keys(categoryCount).length} |\n`
  summary += `| 🔴 **High Priority** | ${priorityCount.high} |\n`
  summary += `| 🟡 **Medium Priority** | ${priorityCount.medium} |\n`
  summary += `| 🟢 **Low Priority** | ${priorityCount.low} |\n\n`

  // Category Breakdown Table
  if (Object.keys(categoryCount).length > 0) {
    summary += `### 📂 Category Breakdown\n\n`
    summary += `| Category | Scenarios | Percentage |\n`
    summary += `|----------|-----------|------------|\n`
    Object.entries(categoryCount).forEach(([category, count]) => {
      const percentage = ((count / scenarios.length) * 100).toFixed(1)
      summary += `| ${category} | ${count} | ${percentage}% |\n`
    })
    summary += `\n`
  }

  summary += `---\n\n`

  // Group scenarios by category
  const scenariosByCategory: Record<string, any[]> = scenarios.reduce((acc, scenario) => {
    if (!acc[scenario.category]) acc[scenario.category] = []
    acc[scenario.category].push(scenario)
    return acc
  }, {} as Record<string, any[]>)

  summary += `## 🎯 Discovered Test Scenarios\n\n`

  Object.entries(scenariosByCategory).forEach(([category, categoryScenarios]) => {
    summary += `### 📦 ${category}\n\n`

    categoryScenarios.forEach((scenario: any, idx: number) => {
      const priorityEmoji = scenario.priority === 'high' ? '🔴' : scenario.priority === 'medium' ? '🟡' : '🟢'
      const priorityBadge = scenario.priority === 'high' ? 'HIGH' : scenario.priority === 'medium' ? 'MEDIUM' : 'LOW'

      summary += `#### ${idx + 1}. ${scenario.title} ${priorityEmoji}\n\n`

      // Scenario Details Table
      summary += `| | |\n`
      summary += `|---------|--------|\n`
      summary += `| **Priority** | \`${priorityBadge}\` ${priorityEmoji} |\n`
      summary += `| **Page** | ${scenario.page} |\n`
      summary += `| **Category** | ${scenario.category} |\n\n`

      summary += `**📝 Description:**  \n${scenario.description}\n\n`

      summary += `**✅ Test Steps:**\n\n`
      scenario.steps.forEach((step: string, stepIdx: number) => {
        summary += `${stepIdx + 1}. ${step}\n`
      })
      summary += `\n`
    })
  })

  summary += `---\n\n`

  summary += `## 🛠️ Next Steps\n\n`
  summary += `| Step | Action | Description |\n`
  summary += `|------|--------|-------------|\n`
  summary += `| 1️⃣ | **Review** | Check discovered scenarios above |\n`
  summary += `| 2️⃣ | **Edit** | Modify tasks using pencil icon ✏️ |\n`
  summary += `| 3️⃣ | **Add** | Create additional scenarios with + button |\n`
  summary += `| 4️⃣ | **Reorder** | Drag & drop to prioritize 🔄 |\n`
  summary += `| 5️⃣ | **Execute** | Click "Start Execution" to run tests ▶️ |\n\n`

  summary += `> 💡 **Tip:** All scenarios have been converted to executable tasks below. You can edit, delete, or reorder them before execution.\n\n`

  summary += `---\n\n`

  summary += `## 📊 Coverage Analysis\n\n`
  summary += `### Priority Distribution\n\n`
  summary += `\`\`\`\n`
  summary += `High Priority   (🔴): ${'█'.repeat(priorityCount.high * 2)} ${priorityCount.high}\n`
  summary += `Medium Priority (🟡): ${'█'.repeat(priorityCount.medium * 2)} ${priorityCount.medium}\n`
  summary += `Low Priority    (🟢): ${'█'.repeat(priorityCount.low * 2)} ${priorityCount.low}\n`
  summary += `\`\`\`\n\n`

  summary += `---\n\n`

  summary += `<details>\n`
  summary += `<summary>📝 <strong>View Raw Exploration Details</strong> (Click to expand)</summary>\n\n`
  summary += `### AI Exploration Log\n\n`
  summary += `\`\`\`json\n${rawExploration.substring(0, 2000)}${rawExploration.length > 2000 ? '\n...(truncated)' : ''}\n\`\`\`\n\n`
  summary += `</details>\n\n`

  summary += `---\n\n`
  summary += `*Generated by TestFlowPro MCP Agent using Playwright exploration capabilities* 🤖✨\n`

  return summary
}

