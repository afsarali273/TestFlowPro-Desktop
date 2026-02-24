import { Plan } from '@/types/ralph-loop'
import { generateExplorationPrompt } from '../prompts/exploration-prompts';

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

    // Phase 1: Explore the website using Playwright MCP with iterative task discovery
    const explorationPrompt = generateExplorationPrompt({
      url: fullUrl,
      context: context,
      minScenarios: 50,
      maxScenarios: 100,
      mode: 'deep'
    })

    console.log('🚀 Starting iterative AI exploration for:', fullUrl)
    console.log('📝 Exploration mode: DEEP (iterative task discovery)')
    console.log('📊 Target scenarios: 50-100 comprehensive test scenarios')
    console.log('📝 Prompt length:', explorationPrompt.length, 'characters')

    const response = await fetch('/api/copilot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: explorationPrompt,
        type: 'mcp-agent',
        provider: 'github-copilot',
        agentMode: true,
        mcpTools: mcpTools,
        model: 'gpt-4o' // Use GPT-4o for best tool-calling capability
      })
    })

    if (!response.ok) {
      console.error('❌ API response not OK:', response.status, response.statusText)
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`
      }
    }

    const data = await response.json()
    console.log('📦 API Response received, length:', JSON.stringify(data).length)

    const explorationResult = data.response

    if (!explorationResult) {
      console.error('❌ No response from AI')
      return {
        success: false,
        error: 'No response received from AI agent'
      }
    }

    console.log('🔍 Parsing exploration result...')

    // Parse discovered scenarios
    const scenarios = parseExplorationResult(explorationResult)

    if (scenarios.length === 0) {
      return {
        success: false,
        error: 'Unable to discover test scenarios. The AI did not return valid scenario data. Please try again.'
      }
    }

    console.log(`✅ Parsed ${scenarios.length} scenarios`)

    if (scenarios.length < 20) {
      console.warn(`⚠️ Only ${scenarios.length} scenarios generated (expected 50-100). AI may not have completed iterative exploration cycles.`)
    }

    if (scenarios.length < 50) {
      console.warn(`⚠️ ${scenarios.length} scenarios generated - below target of 50. Consider re-running for deeper coverage.`)
    }

    // Generate detailed exploration summary
    const explorationSummary = generateExplorationSummary(fullUrl, context, scenarios, explorationResult)

    // Phase 2: Convert scenarios to executable tasks
    // Ensure every scenario starts with a navigation step to the correct URL
    const scenariosWithNav = scenarios.map((scenario: any) => {
      const navStep = `Navigate to ${fullUrl}`;
      const alreadyHasNav = scenario.steps?.length > 0 &&
        (scenario.steps[0].toLowerCase().includes('navigate') ||
         scenario.steps[0].toLowerCase().includes('go to') ||
         scenario.steps[0].toLowerCase().includes(fullUrl));

      // Ensure the navigation step is correctly added
      return {
        ...scenario,
        steps: alreadyHasNav ? scenario.steps : [navStep, ...scenario.steps]
      };
    })

    const tasks = scenariosWithNav.flatMap((scenario: any, idx: number) =>
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
      discoveredScenarios: scenariosWithNav.map((s: any) => ({
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
    console.log('📥 Raw exploration result:', resultText.substring(0, 500))

    // Remove markdown code blocks if present
    let cleanedText = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

    // Try to extract JSON object with scenarios
    const jsonObjectMatch = cleanedText.match(/\{[\s\S]*"scenarios"[\s\S]*}/);
    const scenariosArrayMatch = cleanedText.match(/"scenarios"\s*:\s*(\[[\s\S]*?])/);
    if (jsonObjectMatch) {
      try {
        const parsed = JSON.parse(jsonObjectMatch[0])
        if (parsed.scenarios && Array.isArray(parsed.scenarios) && parsed.scenarios.length > 0) {
          console.log(`✅ Successfully parsed ${parsed.scenarios.length} scenarios from JSON object`)
          return parsed.scenarios
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse JSON object:', e)
      }
    }

    // Try to extract just the scenarios array
    if (scenariosArrayMatch) {
      try {
        const scenariosArray = JSON.parse(scenariosArrayMatch[1])
        if (Array.isArray(scenariosArray) && scenariosArray.length > 0) {
          console.log(`✅ Successfully parsed ${scenariosArray.length} scenarios from array`)
          return scenariosArray
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse scenarios array:', e)
      }
    }

    // Try to parse the entire text as JSON
    try {
      const parsed = JSON.parse(cleanedText)
      if (parsed.scenarios && Array.isArray(parsed.scenarios)) {
        console.log(`✅ Successfully parsed ${parsed.scenarios.length} scenarios from full text`)
        return parsed.scenarios
      }
      if (Array.isArray(parsed)) {
        console.log(`✅ Successfully parsed ${parsed.length} scenarios from array`)
        return parsed
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse full text as JSON:', e)
    }

    // Try to find multiple scenario objects in the text
    const scenarioPattern = /\{[^}]*"title"[^}]*"description"[^}]*"steps"[^}]*}/g
    const scenarioMatches = cleanedText.match(scenarioPattern)
    if (scenarioMatches && scenarioMatches.length > 0) {
      console.log(`✅ Found ${scenarioMatches.length} individual scenario objects`)
      const scenarios = scenarioMatches.map(match => {
        try {
          return JSON.parse(match)
        } catch (e) {
          return null
        }
      }).filter(s => s !== null)

      if (scenarios.length > 0) {
        return scenarios
      }
    }

    console.warn('⚠️ No valid scenarios found in response, using fallback')

  } catch (error) {
    console.error('❌ Failed to parse exploration result:', error)
  }

  // Fallback: create basic scenarios from exploration text
  console.warn('⚠️ Creating fallback scenario - AI did not return proper JSON')
  return [{
    title: 'Explore discovered features',
    description: 'Test the features discovered during exploration. Note: AI did not return structured scenarios.',
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
  summary += `**Website:** [${url}](${url})  \n`
  summary += `**Generated:** ${timestamp}  \n`
  summary += `**Total Scenarios Discovered:** **${scenarios.length}** test scenarios\n\n`

  summary += `---\n\n`

  if (context?.trim()) {
    summary += `## 📋 Exploration Context\n\n`
    summary += `> ${context.split('\n').join('\n> ')}\n\n`
  }

  // Discovery Summary with Enhanced Table
  summary += `## 📊 Executive Summary\n\n`

  const categoryCount: Record<string, number> = {}
  const priorityCount: Record<string, number> = { high: 0, medium: 0, low: 0 }

  scenarios.forEach(s => {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1
    priorityCount[s.priority] = (priorityCount[s.priority] || 0) + 1
  })

  // Enhanced Summary Table with Bold Headers
  summary += `| 📌 Metric | 📈 Value | 📊 Details |\n`
  summary += `|-----------|----------|------------|\n`
  summary += `| **Total Test Scenarios** | **${scenarios.length}** | Comprehensive test coverage |\n`
  summary += `| **Test Categories** | **${Object.keys(categoryCount).length}** | Distinct testing areas |\n`
  summary += `| **🔴 High Priority** | **${priorityCount.high}** | Critical tests |\n`
  summary += `| **🟡 Medium Priority** | **${priorityCount.medium}** | Important tests |\n`
  summary += `| **🟢 Low Priority** | **${priorityCount.low}** | Optional tests |\n\n`

  // Enhanced Category Breakdown Table
  if (Object.keys(categoryCount).length > 0) {
    summary += `## 📂 Test Category Breakdown\n\n`
    summary += `| 📦 Category | 🔢 Scenarios | 📊 Coverage | 📈 Priority Split |\n`
    summary += `|-------------|--------------|-------------|-------------------|\n`
    Object.entries(categoryCount).forEach(([category, count]) => {
      const percentage = ((count / scenarios.length) * 100).toFixed(1)
      const categoryScenarios = scenarios.filter(s => s.category === category)
      const highP = categoryScenarios.filter(s => s.priority === 'high').length
      const medP = categoryScenarios.filter(s => s.priority === 'medium').length
      const lowP = categoryScenarios.filter(s => s.priority === 'low').length
      summary += `| **${category}** | **${count}** | ${percentage}% | 🔴${highP} 🟡${medP} 🟢${lowP} |\n`
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

  summary += `## 🎯 Detailed Test Scenarios\n\n`
  summary += `Below are all discovered test scenarios organized by category. Each scenario includes priority, description, and detailed test steps.\n\n`

  Object.entries(scenariosByCategory).forEach(([category, categoryScenarios]) => {
    summary += `### 📦 ${category}\n\n`
    summary += `**${categoryScenarios.length}** scenario(s) in this category\n\n`

    categoryScenarios.forEach((scenario: any, idx: number) => {
      const priorityEmoji = scenario.priority === 'high' ? '🔴' : scenario.priority === 'medium' ? '🟡' : '🟢'
      const priorityText = scenario.priority === 'high' ? 'HIGH PRIORITY' : scenario.priority === 'medium' ? 'MEDIUM PRIORITY' : 'LOW PRIORITY'

      summary += `#### ${idx + 1}. ${scenario.title} ${priorityEmoji}\n\n`

      // Enhanced Scenario Details Table
      summary += `| 📋 Attribute | 📝 Value |\n`
      summary += `|--------------|----------|\n`
      summary += `| **Priority** | \`${priorityText}\` ${priorityEmoji} |\n`
      summary += `| **Target Page** | ${scenario.page} |\n`
      summary += `| **Category** | ${scenario.category} |\n`
      summary += `| **Test Steps** | ${scenario.steps.length} steps |\n\n`

      summary += `**📝 Scenario Description:**\n\n`
      summary += `${scenario.description}\n\n`

      summary += `**✅ Detailed Test Steps:**\n\n`
      scenario.steps.forEach((step: string, stepIdx: number) => {
        summary += `${stepIdx + 1}. **${step}**\n`
      })
      summary += `\n`

      summary += `---\n\n`
    })
  })

  summary += `## 🛠️ Recommended Next Steps\n\n`
  summary += `Follow these steps to execute your test scenarios:\n\n`
  summary += `| # | ⚡ Action | 📝 Description | 🎯 Purpose |\n`
  summary += `|---|----------|----------------|------------|\n`
  summary += `| 1️⃣ | **Review Scenarios** | Check all discovered scenarios above | Understand test coverage |\n`
  summary += `| 2️⃣ | **Edit & Customize** | Use ✏️ pencil icon to modify tasks | Tailor to your needs |\n`
  summary += `| 3️⃣ | **Add More Tests** | Click + button to create scenarios | Enhance coverage |\n`
  summary += `| 4️⃣ | **Prioritize** | Drag & drop 🔄 to reorder tasks | Set execution order |\n`
  summary += `| 5️⃣ | **Execute Tests** | Click ▶️ "Start Execution" button | Run automated tests |\n\n`

  summary += `> 💡 **Pro Tip:** All discovered scenarios have been automatically converted to executable tasks in the "Tasks Breakdown" section below. You can edit, delete, or reorder them before starting execution.\n\n`

  summary += `---\n\n`

  summary += `## 📊 Test Coverage Analysis\n\n`

  // Priority Distribution Table
  summary += `### 🎯 Priority Distribution\n\n`
  const total = priorityCount.high + priorityCount.medium + priorityCount.low
  const highPercent = total > 0 ? ((priorityCount.high / total) * 100).toFixed(1) : '0'
  const mediumPercent = total > 0 ? ((priorityCount.medium / total) * 100).toFixed(1) : '0'
  const lowPercent = total > 0 ? ((priorityCount.low / total) * 100).toFixed(1) : '0'

  summary += `| Priority Level | Count | Percentage | Visual |\n`
  summary += `|----------------|-------|------------|--------|\n`
  summary += `| 🔴 **High Priority** | **${priorityCount.high}** | ${highPercent}% | ${'█'.repeat(Math.min(priorityCount.high, 20))} |\n`
  summary += `| 🟡 **Medium Priority** | **${priorityCount.medium}** | ${mediumPercent}% | ${'█'.repeat(Math.min(priorityCount.medium, 20))} |\n`
  summary += `| 🟢 **Low Priority** | **${priorityCount.low}** | ${lowPercent}% | ${'█'.repeat(Math.min(priorityCount.low, 20))} |\n\n`

  summary += `**Total Test Scenarios:** **${total}**\n\n`

  summary += `---\n\n`

  summary += `<details>\n`
  summary += `<summary><strong>📝 View Raw Exploration Data</strong> (Click to expand)</summary>\n\n`
  summary += `### AI Exploration Log\n\n`
  summary += `Below is the raw data collected during AI exploration:\n\n`
  summary += `\`\`\`json\n${rawExploration.substring(0, 2000)}${rawExploration.length > 2000 ? '\n...(truncated for brevity)' : ''}\n\`\`\`\n\n`
  summary += `</details>`

  summary += `---\n\n`
  summary += `<div style="text-align: center;">\n\n`
  summary += `**🤖 Generated by TestFlowPro MCP Agent**\n\n`
  summary += `*Powered by Playwright Browser Automation & AI Intelligence* ✨\n\n`
  summary += `</div>\n`

  return summary
}
