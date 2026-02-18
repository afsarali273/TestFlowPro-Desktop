/**
 * Execution and Planning Prompts for Ralph Loop Agent
 *
 * This file contains prompts used for:
 * - Execution summary generation
 * - Plan generation
 * - Task execution
 */


export interface ExecutionSummaryContext {
  planTitle: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalDuration: number
  tasksExecuted: Array<{
    index: number
    title: string
    status: string
    description: string
    duration?: number
    result?: string
    error?: string
  }>
  executionLog: string[]
}

/**
 * Generate detailed execution summary prompt
 */
export const getExecutionSummaryPrompt = (context: ExecutionSummaryContext): string => {
  const tasksDetails = context.tasksExecuted.map((t) => `
${t.index + 1}. **${t.title}** (${t.status})
   - Description: ${t.description}
   - Duration: ${t.duration || 'N/A'}s
   - Result: ${t.result?.substring(0, 150) || t.error || 'N/A'}
`).join('\n')

  const logSummary = context.executionLog.slice(-50).join('\n')

  return `Generate a detailed execution summary in markdown format for this automation test execution:

**Plan**: ${context.planTitle}
**Total Tasks**: ${context.totalTasks}
**Completed**: ${context.completedTasks}
**Failed**: ${context.failedTasks}
**Total Duration**: ${context.totalDuration}s

**Tasks Executed**:
${tasksDetails}

**Execution Log**:
${logSummary}

Create a comprehensive summary with:
- 📊 Executive Summary with key metrics
- ✅ Successful Operations (with details)
- ❌ Failed Operations (with error analysis and retry attempts)
- 🔧 Technical Details (locators used, approaches tried)
- 📈 Performance Metrics (timing, success rate)
- 💡 Insights & Recommendations
- 🎯 Test Coverage Analysis

Use tables, emojis, code blocks, and visual formatting. Be detailed and professional.`
}

/**
 * Generate task execution prompt
 */
export const getTaskExecutionPrompt = (taskTitle: string, taskDescription: string): string => {
  return `Execute this task:

Title: ${taskTitle}
Description: ${taskDescription}

Provide the result or steps taken.`
}

/**
 * Generate plan from requirements prompt
 */
export const getPlanGenerationPrompt = (requirements: string, previousLearnings?: string[]): string => {
  const learningsContext = previousLearnings && previousLearnings.length > 0
    ? `\n\nPrevious Learnings:\n${previousLearnings.join('\n')}`
    : ''

  return `Generate a detailed test automation plan for the following requirements:

${requirements}${learningsContext}

Create a plan with:
1. Clear, actionable tasks
2. Proper task sequencing
3. Detailed descriptions for each task
4. Estimated complexity and duration
5. Dependencies between tasks

Format the response as a structured plan with task breakdown.`
}

/**
 * Generate exploratory test scenarios prompt
 */
export const getExploratoryTestPrompt = (url: string, context?: string): string => {
  const contextSection = context
    ? `\n\nAdditional Context:\n${context}`
    : ''

  return `Explore the website at ${url} and generate comprehensive test scenarios.${contextSection}

Using Playwright MCP tools:
1. Navigate to the URL
2. Take snapshots of the page
3. Identify interactive elements (buttons, links, forms, navigation)
4. Explore 5-7 key pages or features
5. Document user flows and features discovered
6. Categorize test scenarios by priority and type

For each discovered scenario, provide:
- Title (descriptive and action-oriented)
- Description (what to test)
- Priority (high/medium/low)
- Category (Navigation, Forms, Search, etc.)
- Detailed test steps
- Elements involved

Return a comprehensive list of test scenarios that cover the application's functionality.`
}

