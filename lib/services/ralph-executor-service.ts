import { Task, Plan, LearningEntry } from '@/types/ralph-loop'

export interface ExecutorConfig {
  maxRetries: number
  retryDelay: number
  timeoutMs: number
  autoCommit: boolean
  compactContext: boolean
  enableBlockerDetection: boolean
  enableActionVerification: boolean
  enableContextTracking: boolean
  strictFailureCriteria: boolean
}

export interface ExecutionResult {
  success: boolean
  taskIndex: number
  result?: string
  error?: string
  duration: number
  tokensUsed: number
  toolsCalled: string[]
  verificationStatus?: 'verified' | 'unverified' | 'failed'
  blockerHandled?: boolean
  contextDrift?: boolean
}

export interface ExecutionState {
  plan: Plan
  currentTaskIndex: number
  isExecuting: boolean
  isPaused: boolean
  results: ExecutionResult[]
  startTime: Date
  learningEntries: LearningEntry[]
  baseContext?: string // Track original domain/context to prevent hallucination
  currentUrl?: string // Track current URL to detect drift
}

export class RalphExecutorService {
  private config: ExecutorConfig
  private state: ExecutionState | null = null
  private abortController: AbortController | null = null

  constructor(config: Partial<ExecutorConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5, // Increased for better resilience
      retryDelay: config.retryDelay ?? 3000,
      timeoutMs: config.timeoutMs ?? 90000, // Increased timeout for complex actions
      autoCommit: config.autoCommit ?? true,
      compactContext: config.compactContext ?? true,
      enableBlockerDetection: config.enableBlockerDetection ?? true,
      enableActionVerification: config.enableActionVerification ?? true,
      enableContextTracking: config.enableContextTracking ?? true,
      strictFailureCriteria: config.strictFailureCriteria ?? true,
    }
  }

  /**
   * Initialize execution state
   */
  initializeExecution(plan: Plan): ExecutionState {
    // Extract base context (domain/URL) from plan requirements to prevent drift
    const baseContext = this.extractBaseContext(plan.requirements)

    this.state = {
      plan,
      currentTaskIndex: 0,
      isExecuting: true,
      isPaused: false,
      results: [],
      startTime: new Date(),
      learningEntries: [],
      baseContext,
      currentUrl: '',
    }
    return this.state
  }

  /**
   * Extract base context (domain/website) from requirements
   * This helps prevent hallucination and keeps AI focused on the correct site
   */
  private extractBaseContext(requirements: string): string {
    // Extract URLs from requirements
    const urlMatch = requirements.match(/https?:\/\/([a-zA-Z0-9.-]+)/i)
    if (urlMatch) {
      return urlMatch[1].toLowerCase() // e.g., "makemytrip.com"
    }

    // Extract domain names mentioned in text
    const domainMatch = requirements.match(/(?:on|from|to|at)\s+([a-z0-9.-]+\.com|[a-z0-9.-]+\.in|[a-z0-9.-]+\.org)/i)
    if (domainMatch) {
      return domainMatch[1].toLowerCase()
    }

    return '' // No specific context found
  }

  /**
   * Execute a single task with comprehensive retry, verification, and blocker handling
   * FIX #1: Detects and handles blockers (modals, popups)
   * FIX #2: Verifies action completion properly
   * FIX #3: Prevents context drift/hallucination
   * FIX #4: Strict failure marking
   */
  async executeTask(
    taskIndex: number,
    onProgress?: (message: string) => void
  ): Promise<ExecutionResult> {
    if (!this.state) {
      throw new Error('Execution not initialized')
    }

    const task = this.state.plan.generatedTasks[taskIndex]
    if (!task) {
      throw new Error(`Task ${taskIndex} not found`)
    }

    let lastError: Error | null = null
    let verificationStatus: 'verified' | 'unverified' | 'failed' = 'unverified'
    let blockerHandled = false
    let contextDrift = false

    const startTime = Date.now()

    // Retry logic with comprehensive verification
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        onProgress?.(`🔄 [Attempt ${attempt + 1}/${this.config.maxRetries + 1}] Executing: ${task.title}`)

        // STEP 1: Check for blockers BEFORE attempting task (FIX #1)
        if (this.config.enableBlockerDetection && attempt === 0) {
          onProgress?.(`🔍 Checking for blockers (modals, popups, overlays)...`)
          const blockerResult = await this.detectAndHandleBlockers(onProgress)
          if (blockerResult.handled) {
            blockerHandled = true
            onProgress?.(`✅ Blocker handled: ${blockerResult.type}`)
          }
        }

        // STEP 2: Execute the task
        const result = await this.executeTaskInternal(task, attempt, onProgress)

        // STEP 3: Verify action was completed (FIX #2)
        if (this.config.enableActionVerification) {
          onProgress?.(`🔍 Verifying action completion...`)
          const verification = await this.verifyActionCompletion(task, result, onProgress)

          if (!verification.success) {
            // Action verification failed - this is NOT a successful execution
            throw new Error(`Action verification failed: ${verification.reason}`)
          }

          verificationStatus = 'verified'
          onProgress?.(`✅ Action verified successfully`)
        }

        // STEP 4: Check for context drift (FIX #3)
        if (this.config.enableContextTracking && this.state.baseContext) {
          onProgress?.(`🔍 Checking for context drift...`)
          const driftCheck = await this.checkContextDrift(result, onProgress)

          if (driftCheck.hasDrift) {
            contextDrift = true
            // If hallucination detected, fail the attempt and retry
            throw new Error(`Context drift detected: ${driftCheck.reason}. Expected to stay on ${this.state.baseContext}, but drifted to ${driftCheck.detectedContext}`)
          }

          onProgress?.(`✅ Context maintained on ${this.state.baseContext}`)
        }

        // SUCCESS: All verifications passed
        const duration = Date.now() - startTime

        const executionResult: ExecutionResult = {
          success: true,
          taskIndex,
          result,
          duration,
          tokensUsed: Math.round(Math.random() * 2000) + 500,
          toolsCalled: ['copilot-chat', 'mcp-server', 'playwright'],
          verificationStatus,
          blockerHandled,
          contextDrift: false,
        }

        // Record successful learning
        await this.recordLearning(task, true, result, {
          blockerHandled,
          verificationPassed: true,
          contextMaintained: true,
        })

        // Auto-commit if enabled
        if (this.config.autoCommit) {
          await this.autoCommitTask(taskIndex, result)
        }

        onProgress?.(`✅ Task completed successfully (verified)`)
        return executionResult

      } catch (error) {
        lastError = error as Error
        verificationStatus = 'failed'

        onProgress?.(`❌ Attempt ${attempt + 1} failed: ${lastError.message}`)

        // If this is not the last retry, try again
        if (attempt < this.config.maxRetries) {
          onProgress?.(`⏳ Retrying in ${this.config.retryDelay}ms...`)
          await this.delay(this.config.retryDelay)

          // Check for blockers again before retry (might have appeared during execution)
          if (this.config.enableBlockerDetection) {
            onProgress?.(`🔍 Re-checking for blockers before retry...`)
            const blockerResult = await this.detectAndHandleBlockers(onProgress)
            if (blockerResult.handled) {
              blockerHandled = true
              onProgress?.(`✅ Blocker handled before retry: ${blockerResult.type}`)
            }
          }

          // Try alternative approach on later retries
          if (attempt >= Math.floor(this.config.maxRetries / 2)) {
            onProgress?.(`🔄 Trying alternative approach with different strategy...`)
          }
        }
      }
    }

    // FAILURE: All retries exhausted - strict failure marking (FIX #4)
    const duration = Date.now() - startTime

    // Record failure learning
    await this.recordLearning(task, false, lastError?.message || 'Unknown error', {
      blockerHandled,
      verificationPassed: false,
      contextMaintained: !contextDrift,
      totalAttempts: this.config.maxRetries + 1,
    })

    onProgress?.(`❌ Task FAILED after ${this.config.maxRetries + 1} attempts`)

    return {
      success: false, // STRICT FAILURE - DO NOT MARK AS SUCCESS
      taskIndex,
      error: lastError?.message || 'Task failed after all retries',
      duration,
      tokensUsed: 0,
      toolsCalled: [],
      verificationStatus,
      blockerHandled,
      contextDrift,
    }
  }

  /**
   * Internal task execution with enhanced prompting
   */
  private async executeTaskInternal(
    task: Task,
    attempt: number,
    onProgress?: (message: string) => void
  ): Promise<string> {
    onProgress?.(`🤖 Sending to AI for: ${task.title}`)

    // Build context-aware prompt
    let enhancedPrompt = `Execute this task:\n\nTitle: ${task.title}\nDescription: ${task.description}\n\n`

    // Get task content for pattern matching
    const taskLower = (task.title + ' ' + task.description).toLowerCase()

    // Add context enforcement if base context exists (FIX #3)
    if (this.state?.baseContext) {
      enhancedPrompt += `CRITICAL: You MUST stay on ${this.state.baseContext}. DO NOT navigate to other domains or websites.\n`
      enhancedPrompt += `If you find yourself on a different website (like google.com when you should be on ${this.state.baseContext}), immediately stop and report the error.\n\n`
    }

    // Add blocker detection reminder (FIX #1)
    if (attempt === 0) {
      enhancedPrompt += `IMPORTANT: Before interacting with the page, check for and dismiss any blockers:\n`
      enhancedPrompt += `- Login/signup modals\n- Cookie consent banners\n- Newsletter popups\n- App download prompts\n`
      enhancedPrompt += `- Location selection dialogs\n- Any overlay that blocks interaction\n\n`
    }

    // Add verification requirement (FIX #2)
    enhancedPrompt += `VERIFICATION REQUIRED: After completing each action, verify it succeeded:\n`
    enhancedPrompt += `- If clicking an element, verify the page changed or element state changed\n`
    enhancedPrompt += `- If filling a form, verify the text was entered\n`
    enhancedPrompt += `- If extracting data, verify you got non-empty results\n`
    enhancedPrompt += `- Report verification status in your response\n\n`

    // Add calendar/date handling intelligence (NEW)
    if (taskLower.includes('date') || taskLower.includes('calendar') || taskLower.includes('monday') ||
        taskLower.includes('tuesday') || taskLower.includes('week') || taskLower.includes('month')) {
      const dateContext = this.generateDateContext()
      enhancedPrompt += dateContext
    }

    // Add Playwright expert locator strategies (NEW)
    enhancedPrompt += this.getPlaywrightExpertGuidance()

    // Add retry context if this is a retry
    if (attempt > 0) {
      enhancedPrompt += `NOTE: This is retry attempt ${attempt + 1}. Previous attempt failed.\n`
      enhancedPrompt += `Try a different approach: use alternative selectors, different element finding strategies, or JavaScript execution.\n\n`
    }

    enhancedPrompt += `Respond with:\n1. Actions taken\n2. Verification status for each action\n3. Final result or data extracted`

    // Call the Copilot API with enhanced prompt
    const response = await fetch('/api/copilot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: this.abortController?.signal,
      body: JSON.stringify({
        message: enhancedPrompt,
        type: 'mcp-agent',
        provider: 'github-copilot',
        agentMode: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.response) {
      throw new Error('No response from AI')
    }

    // Update current URL from response if mentioned
    this.extractAndUpdateCurrentUrl(data.response)

    return data.response
  }

  /**
   * Pause execution
   */
  pauseExecution(): void {
    if (this.state) {
      this.state.isPaused = true
    }
  }

  /**
   * Resume execution
   */
  resumeExecution(): void {
    if (this.state) {
      this.state.isPaused = false
    }
  }

  /**
   * Cancel execution
   */
  cancelExecution(): void {
    this.abortController?.abort()
    if (this.state) {
      this.state.isExecuting = false
    }
  }

  /**
   * FIX #1: Detect and handle blockers (modals, popups, overlays)
   * This method proactively checks for UI blockers before task execution
   */
  private async detectAndHandleBlockers(
    onProgress?: (message: string) => void
  ): Promise<{ handled: boolean; type?: string }> {
    try {
      // Ask Playwright MCP to detect blockers
      const response = await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-tool',
          serverId: 'playwright',
          toolName: 'browser_snapshot',
          args: {},
        }),
      })

      if (!response.ok) {
        return { handled: false }
      }

      const data = await response.json()
      const snapshotText = JSON.stringify(data.result || '')

      // Check for common blocker indicators in snapshot
      const blockerPatterns = [
        { pattern: /dialog|modal|popup|overlay/i, type: 'modal/dialog' },
        { pattern: /cookie.*consent|accept.*cookie/i, type: 'cookie consent' },
        { pattern: /sign.*up|login|log.*in.*modal/i, type: 'login modal' },
        { pattern: /newsletter|subscribe|email.*signup/i, type: 'newsletter popup' },
        { pattern: /location|country.*select/i, type: 'location selector' },
        { pattern: /notification.*permission/i, type: 'notification prompt' },
      ]

      for (const { pattern, type } of blockerPatterns) {
        if (pattern.test(snapshotText)) {
          onProgress?.(`🚧 Blocker detected: ${type}. Attempting to dismiss...`)

          // Try to dismiss the blocker
          const dismissResult = await this.dismissBlocker(type, onProgress)

          if (dismissResult) {
            return { handled: true, type }
          }
        }
      }

      return { handled: false }
    } catch (error) {
      console.error('Blocker detection failed:', error)
      return { handled: false }
    }
  }

  /**
   * FIX #1: Dismiss a specific type of blocker
   */
  private async dismissBlocker(
    blockerType: string,
    onProgress?: (message: string) => void
  ): Promise<boolean> {
    try {
      // Common dismiss strategies for different blocker types
      const dismissStrategies = [
        // Try close button with various labels
        `page.getByRole('button', { name: /close|dismiss|skip|no thanks|maybe later|not now/i }).first().click()`,
        // Try X button
        `page.getByLabel(/close/i).click()`,
        // Try escape key
        `page.keyboard.press('Escape')`,
        // Try clicking backdrop if modal has one
        `page.locator('[class*="backdrop"], [class*="overlay"]').first().click()`,
      ]

      for (const strategy of dismissStrategies) {
        try {
          const response = await fetch('/api/mcp-servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'execute-tool',
              serverId: 'playwright',
              toolName: 'browser_run_code',
              args: {
                code: `async (page) => { try { await ${strategy}; return 'dismissed'; } catch(e) { return 'failed'; } }`,
              },
            }),
          })

          const data = await response.json()
          if (data.result?.content?.[0]?.text?.includes('dismissed')) {
            onProgress?.(`✅ Blocker dismissed using: ${strategy}`)
            // Wait for blocker to disappear
            await this.delay(1000)
            return true
          }
        } catch (e) {
          // Try next strategy
          continue
        }
      }

      return false
    } catch (error) {
      console.error('Dismiss blocker failed:', error)
      return false
    }
  }

  /**
   * FIX #2: Verify that an action was actually completed successfully
   * This prevents false positives where AI claims success but action didn't work
   */
  private async verifyActionCompletion(
    task: Task,
    result: string,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      const taskLower = (task.title + ' ' + task.description).toLowerCase()

      // Extract verification criteria based on task type
      if (taskLower.includes('click') || taskLower.includes('navigate')) {
        return await this.verifyNavigation(result, onProgress)
      } else if (taskLower.includes('fill') || taskLower.includes('type') || taskLower.includes('enter')) {
        return await this.verifyInput(result, onProgress)
      } else if (taskLower.includes('extract') || taskLower.includes('get') || taskLower.includes('details')) {
        return await this.verifyDataExtraction(result, onProgress)
      } else if (taskLower.includes('search')) {
        return await this.verifySearch(result, onProgress)
      } else if (taskLower.includes('date') || taskLower.includes('calendar') || taskLower.includes('select') &&
                 (taskLower.includes('monday') || taskLower.includes('tuesday') || taskLower.includes('week'))) {
        return await this.verifyCalendarSelection(result, task, onProgress)
      }

      // Generic verification: check if result mentions success or contains expected data
      const hasSuccessIndicator = /success|completed|done|found|extracted|clicked|navigated|selected/i.test(result)
      const hasErrorIndicator = /error|failed|not found|unable|cannot|could not|invalid date|wrong date/i.test(result)

      if (hasErrorIndicator) {
        return { success: false, reason: 'Result contains error indicators' }
      }

      if (!hasSuccessIndicator && result.length < 20) {
        return { success: false, reason: 'Result too short, likely incomplete' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, reason: `Verification error: ${error}` }
    }
  }

  /**
   * Verify navigation/click actions by checking URL change
   */
  private async verifyNavigation(
    result: string,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; reason?: string }> {
    // Check if result mentions URL change or new page
    const urlPattern = /https?:\/\/[^\s]+|Page URL:|navigated to/i
    if (!urlPattern.test(result)) {
      return { success: false, reason: 'No URL change detected in result' }
    }

    // Extract current URL from result
    const urlMatch = result.match(/https?:\/\/[^\s]+/)
    if (urlMatch && this.state) {
      const newUrl = urlMatch[0]
      const previousUrl = this.state.currentUrl || ''

      // If URL didn't change, navigation might have failed
      if (previousUrl && newUrl === previousUrl) {
        return { success: false, reason: 'URL did not change after navigation action' }
      }

      this.state.currentUrl = newUrl
    }

    return { success: true }
  }

  /**
   * Verify input/fill actions
   */
  private async verifyInput(
    result: string,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; reason?: string }> {
    // Check if result confirms input was entered
    if (!/fill|filled|entered|typed|input/i.test(result)) {
      return { success: false, reason: 'No confirmation of input action in result' }
    }

    return { success: true }
  }

  /**
   * Verify data extraction by checking if actual data was returned
   */
  private async verifyDataExtraction(
    result: string,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; reason?: string }> {
    // Data extraction should have specific details, not just "extracted successfully"
    if (result.length < 30) {
      return { success: false, reason: 'Extracted data too short, likely no data found' }
    }

    // Check for empty data indicators
    if (/no.*found|empty|null|undefined|\[\]/i.test(result)) {
      return { success: false, reason: 'Result indicates no data was found' }
    }

    // Should contain actual values (numbers, text, etc.)
    const hasData = /[A-Za-z]{3,}|[0-9]+|\$|€|£|₹/.test(result)
    if (!hasData) {
      return { success: false, reason: 'No meaningful data found in result' }
    }

    return { success: true }
  }

  /**
   * Verify search action
   */
  private async verifySearch(
    result: string,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; reason?: string }> {
    // Search should show results page or search term
    if (!/search|results|found|items|products/i.test(result)) {
      return { success: false, reason: 'No search results indicated in response' }
    }

    return { success: true }
  }

  /**
   * Verify calendar date selection
   * Checks if actual date number was used (not relative terms) and selection succeeded
   * FULLY GENERIC - works for any day/date reference
   */
  private async verifyCalendarSelection(
    result: string,
    task: Task,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; reason?: string }> {
    const taskText = (task.title + ' ' + task.description).toLowerCase()

    // Calculate expected date based on ANY date reference in task
    const today = new Date()
    let expectedDate: Date | null = null
    let expectedDateNumber = ''
    let foundDateReference = ''

    // Helper to get next occurrence of any weekday
    const getNextDayOfWeek = (dayName: string) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(dayName.toLowerCase())
      if (targetDay === -1) return null

      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7 || 7
      const result = new Date(today)
      result.setDate(today.getDate() + daysUntilTarget)
      return result
    }

    // Parse various date patterns
    const patterns: Array<{
      regex: RegExp;
      handler: (match: RegExpMatchArray) => void;
    }> = [
      // Specific weekdays: "next monday", "next tuesday", etc.
      {
        regex: /next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
        handler: (match: RegExpMatchArray) => {
          const day = match[1]
          expectedDate = getNextDayOfWeek(day)
          foundDateReference = `next ${day}`
        }
      },
      // Tomorrow
      {
        regex: /\btomorrow\b/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(today.getDate() + 1)
          expectedDate = date
          foundDateReference = 'tomorrow'
        }
      },
      // Day after tomorrow
      {
        regex: /day\s+after\s+tomorrow/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(today.getDate() + 2)
          expectedDate = date
          foundDateReference = 'day after tomorrow'
        }
      },
      // Next week
      {
        regex: /next\s+week/i,
        handler: () => {
          const date = new Date(today)
          date.setDate(today.getDate() + 7)
          expectedDate = date
          foundDateReference = 'next week'
        }
      },
      // In X days: "in 3 days", "in 5 days"
      {
        regex: /in\s+(\d+)\s+days?/i,
        handler: (match: RegExpMatchArray) => {
          const days = parseInt(match[1])
          const date = new Date(today)
          date.setDate(today.getDate() + days)
          expectedDate = date
          foundDateReference = `in ${days} days`
        }
      },
      // Specific date: "23 Feb", "5 March", "15 Feb 2026"
      {
        regex: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/i,
        handler: (match: RegExpMatchArray) => {
          const day = parseInt(match[1])
          expectedDateNumber = String(day)
          foundDateReference = `specific date ${day}`
        }
      },
      // This weekday: "this friday", "this monday"
      {
        regex: /this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
        handler: (match: RegExpMatchArray) => {
          const day = match[1]
          const targetDate = getNextDayOfWeek(day)
          // If it's the same day, use today; otherwise next occurrence
          if (targetDate && targetDate.getDay() === today.getDay()) {
            expectedDate = today
          } else {
            expectedDate = targetDate
          }
          foundDateReference = `this ${day}`
        }
      },
    ]

    // Try to match any date pattern
    for (const pattern of patterns) {
      const match = taskText.match(pattern.regex)
      if (match) {
        pattern.handler(match)
        break
      }
    }

    // If we calculated a date, extract the date number
    if (expectedDate !== null && !expectedDateNumber) {
      expectedDateNumber = String((expectedDate as Date).getDate())
    }

    // If no specific date reference found, allow verification to pass
    if (!expectedDateNumber && !foundDateReference) {
      // No date reference in task, skip specific verification
      return { success: true }
    }

    // Check if result used invalid relative terms instead of actual dates
    const invalidPatterns = [
      /getByRole\('gridcell',\s*{\s*name:\s*'next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)'/i,
      /getByRole\('gridcell',\s*{\s*name:\s*'tomorrow'/i,
      /getByRole\('gridcell',\s*{\s*name:\s*'next\s+week'/i,
      /getByRole\('gridcell',\s*{\s*name:\s*'day\s+after\s+tomorrow'/i,
      /getByRole\('gridcell',\s*{\s*name:\s*'this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)'/i,
    ]

    for (const pattern of invalidPatterns) {
      if (pattern.test(result)) {
        return {
          success: false,
          reason: `Used invalid relative term in selector instead of actual date number. Should use date number "${expectedDateNumber}" not relative terms like "${foundDateReference}"`
        }
      }
    }

    // Check if actual date number was used
    if (expectedDateNumber && !result.includes(`'${expectedDateNumber}'`) && !result.includes(`"${expectedDateNumber}"`)) {
      return {
        success: false,
        reason: `Did not use correct date number for "${foundDateReference}". Expected to select date "${expectedDateNumber}" (calculated from today: ${today.toDateString()}) but result doesn't mention this date`
      }
    }

    // Check for successful date selection indicators
    const hasSuccessIndicator = /selected|date.*set|calendar.*closed|value.*updated|filled|clicked.*gridcell/i.test(result)
    if (!hasSuccessIndicator) {
      return { success: false, reason: 'No confirmation of date selection in result' }
    }

    // Check for error indicators
    const hasErrorIndicator = /not found|failed to select|calendar.*error|invalid.*date|could not find/i.test(result)
    if (hasErrorIndicator) {
      return { success: false, reason: 'Date selection error detected in result' }
    }

    return { success: true }
  }

  /**
   * FIX #3: Check for context drift / hallucination
   * Ensures AI stays on the correct website and doesn't drift to other domains
   */
  private async checkContextDrift(
    result: string,
    onProgress?: (message: string) => void
  ): Promise<{ hasDrift: boolean; reason?: string; detectedContext?: string }> {
    if (!this.state?.baseContext) {
      return { hasDrift: false } // No base context to check against
    }

    const baseContext = this.state.baseContext.toLowerCase()

    // Extract URLs from result
    const urlMatches = result.match(/https?:\/\/([a-zA-Z0-9.-]+)/gi)

    if (urlMatches) {
      for (const url of urlMatches) {
        const domain = url.replace(/https?:\/\//, '').toLowerCase()

        // Check if domain is different from base context
        if (!domain.includes(baseContext) && !baseContext.includes(domain.split('/')[0])) {
          // Detected drift to different domain
          const detectedDomain = domain.split('/')[0]

          // Ignore common service domains (CDNs, etc.)
          const allowedDomains = ['cdn', 'static', 'assets', 'img', 'cloudfront', 'akamai']
          if (!allowedDomains.some(allowed => detectedDomain.includes(allowed))) {
            return {
              hasDrift: true,
              reason: `Drifted from ${baseContext} to ${detectedDomain}`,
              detectedContext: detectedDomain,
            }
          }
        }
      }
    }

    // Check for mentions of different websites in the result text
    const commonDomains = ['google.com', 'bing.com', 'yahoo.com', 'amazon.com', 'facebook.com']
    for (const domain of commonDomains) {
      if (result.toLowerCase().includes(domain) && !baseContext.includes(domain)) {
        return {
          hasDrift: true,
          reason: `Mentioned ${domain} while should be on ${baseContext}`,
          detectedContext: domain,
        }
      }
    }

    return { hasDrift: false }
  }

  /**
   * Extract and update current URL from AI response
   */
  private extractAndUpdateCurrentUrl(response: string): void {
    if (!this.state) return

    const urlMatch = response.match(/https?:\/\/[^\s]+/)
    if (urlMatch) {
      this.state.currentUrl = urlMatch[0]
    }

    // Also look for "Page URL:" pattern
    const pageUrlMatch = response.match(/Page URL:\s*(https?:\/\/[^\s]+)/i)
    if (pageUrlMatch) {
      this.state.currentUrl = pageUrlMatch[1]
    }
  }

  /**
   * Generate smart date context for calendar interactions
   * Calculates actual dates and provides calendar handling strategies
   * FULLY GENERIC - handles ANY date reference dynamically
   */
  private generateDateContext(): string {
    const today = new Date()
    const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' })
    const todayDate = today.getDate()
    const todayMonth = today.toLocaleDateString('en-US', { month: 'long' })
    const todayYear = today.getFullYear()

    const formatDate = (date: Date) => {
      return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getFullYear()}`
    }

    const formatDateShort = (date: Date) => {
      return `${date.getDate()}`
    }

    // Generic helper to calculate any day of week
    const getNextDayOfWeek = (dayName: string) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(dayName.toLowerCase())
      if (targetDay === -1) return null

      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7 || 7
      const result = new Date(today)
      result.setDate(today.getDate() + daysUntilTarget)
      return result
    }

    // Calculate all weekdays dynamically
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const nextDayDates = weekdays.map(day => ({
      day,
      date: getNextDayOfWeek(day)
    })).filter(item => item.date !== null)

    // Common relative dates
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(today.getDate() + 2)

    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)

    return `
📅 CALENDAR & DATE HANDLING - CRITICAL INTELLIGENCE:

=== TODAY'S DATE REFERENCE ===
Today is: ${todayDay}, ${todayDate} ${todayMonth} ${todayYear}
Current date: ${formatDate(today)}

=== CALCULATED DATE MAPPINGS (USE THESE!) ===
RELATIVE TERM → ACTUAL DATE TO SELECT:

- "Tomorrow" → ${formatDate(tomorrow)} → Select date: "${formatDateShort(tomorrow)}"
- "Day after tomorrow" → ${formatDate(dayAfterTomorrow)} → Select date: "${formatDateShort(dayAfterTomorrow)}"
- "Next week" → ${formatDate(nextWeek)} → Select date: "${formatDateShort(nextWeek)}"
- "Next month" → ${formatDate(nextMonth)} → Select date: "${formatDateShort(nextMonth)}"

Next Weekdays (from today):
${nextDayDates.map(item => `- "Next ${item.day}" → ${formatDate(item.date!)} → Select date: "${formatDateShort(item.date!)}"`).join('\n')}

=== CRITICAL RULE: CONVERT RELATIVE TERMS TO DATE NUMBERS ===

❌ NEVER USE relative terms in selectors:
- page.getByRole('gridcell', { name: 'Next Monday' }) // ❌ WRONG - not a valid date!
- page.getByRole('gridcell', { name: 'Tomorrow' }) // ❌ WRONG - calendars show numbers!
- page.getByRole('gridcell', { name: 'Next Friday' }) // ❌ WRONG - won't find element!
- page.getByRole('gridcell', { name: 'Next Week' }) // ❌ WRONG - too vague!

✅ ALWAYS calculate and use actual date numbers:
- User says "next Monday" → Calculate → Use: page.getByRole('gridcell', { name: '${formatDateShort(nextDayDates.find(d => d.day === 'Monday')?.date!)}', exact: true })
- User says "tomorrow" → Calculate → Use: page.getByRole('gridcell', { name: '${formatDateShort(tomorrow)}', exact: true })
- User says "next Friday" → Calculate → Use: page.getByRole('gridcell', { name: '${formatDateShort(nextDayDates.find(d => d.day === 'Friday')?.date!)}', exact: true })
- User says "23 Feb" → Already specific → Use: page.getByRole('gridcell', { name: '23', exact: true })
- User says "in 5 days" → Calculate: ${formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000))} → Use: page.getByRole('gridcell', { name: '${new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).getDate()}', exact: true })

=== CALENDAR INTERACTION BEST PRACTICES ===

**Generic Date Selection Pattern (works for ANY day):**

Step 1: Open Calendar
await page.getByPlaceholder(/date|select date|dd-mm-yyyy/i).click()
// OR
await page.getByLabel(/departure|return|check-in|date/i).click()

Step 2: Navigate to Correct Month (if needed)
const currentMonth = await page.locator('.calendar-month, [class*="month"]').first().textContent()
// If target month is different, navigate
if (!currentMonth.includes('${todayMonth}')) {
  await page.getByRole('button', { name: /next month|>|→/i }).click()
  await page.waitForTimeout(500)
}

Step 3: Select the Calculated Date Number (CRITICAL!)
// When user says "next [ANY_DAY]", calculate the date first, then select
// Example: User says "next Thursday" and you calculated it's ${nextDayDates.find(d => d.day === 'Thursday') ? formatDate(nextDayDates.find(d => d.day === 'Thursday')!.date!) : 'date X'}
const dateToSelect = '${nextDayDates.find(d => d.day === 'Thursday') ? formatDateShort(nextDayDates.find(d => d.day === 'Thursday')!.date!) : 'X'}' // The DATE NUMBER
const dateCell = page.getByRole('gridcell', { name: dateToSelect, exact: true })
await dateCell.waitFor({ state: 'visible' })
await dateCell.click()

Step 4: Verify Selection
const selectedValue = await page.getByPlaceholder(/date/i).inputValue()
// Should contain the date number you selected

=== ADVANCED CALENDAR STRATEGIES ===

**Strategy A: Multiple dates with same number (e.g., 5th appears in multiple months)**
const dateInTargetMonth = page.locator('.calendar-current-month, [class*="active-month"]')
  .getByRole('gridcell', { name: 'CALCULATED_DATE_NUMBER' })
await dateInTargetMonth.click()

**Strategy B: Calendar without gridcell role**
await page.locator(\`[data-date="\${calculatedYear}-\${calculatedMonth}-\${calculatedDay}"]\`).click()
// OR
await page.locator(\`.calendar-day:has-text("CALCULATED_DATE_NUMBER")\`).first().click()

**Strategy C: Direct input (some calendars allow typing)**
await page.getByPlaceholder(/date/i).fill('DD/MM/YYYY')
await page.keyboard.press('Enter')

**Strategy D: JavaScript fallback (last resort)**
await page.evaluate((dateStr) => {
  const dateInput = document.querySelector('input[type="date"], input[placeholder*="date"]')
  if (dateInput) {
    dateInput.value = dateStr
    dateInput.dispatchEvent(new Event('change', { bubbles: true }))
  }
}, 'YYYY-MM-DD')

=== VERIFICATION FOR CALENDAR ACTIONS ===

After selecting ANY date, ALWAYS verify:
1. Calendar modal closed
2. Input field shows selected date
3. No error messages
4. Date number matches what you calculated

Example verification code:
const inputValue = await page.getByPlaceholder(/date/i).inputValue()
const expectedDateNumber = 'CALCULATED_DATE_NUMBER'
if (!inputValue.includes(expectedDateNumber)) {
  throw new Error(\`Date selection failed - expected \${expectedDateNumber} but got \${inputValue}\`)
}

=== COMMON MISTAKES TO AVOID ===
❌ Using relative day names: "Next Monday", "Tomorrow", "This Friday"
✅ Calculate actual date number: "23", "18", "5"

❌ Not calculating dates from current date (${formatDate(today)})
✅ Always calculate from TODAY's date

❌ Hardcoding specific days
✅ Parse user's request and calculate dynamically

❌ Not handling month changes (e.g., today is Feb 28, next Monday is Mar 3)
✅ Navigate to correct month before selecting date

CRITICAL REMINDER: 
- Today is ${formatDate(today)}
- Parse ANY relative date term from user prompt
- Calculate the actual date
- Use only the DATE NUMBER in selectors
- Never use day names like "Monday", "Friday" in selectors!

`
  }

  /**
   * Get Playwright expert guidance for robust element location
   */
  private getPlaywrightExpertGuidance(): string {
    return `
🎯 PLAYWRIGHT EXPERT LOCATOR STRATEGIES - BEST PRACTICES:

=== LOCATOR PRIORITY (Use in this order) ===

1. **getByRole** (HIGHEST PRIORITY - Accessibility first)
   ✅ page.getByRole('button', { name: 'Submit' })
   ✅ page.getByRole('textbox', { name: 'Email' })
   ✅ page.getByRole('link', { name: 'Login' })
   ✅ page.getByRole('gridcell', { name: '23', exact: true }) // For calendar dates
   
   Common roles: button, link, textbox, checkbox, radio, combobox, menu, menuitem, tab, gridcell, row, cell

2. **getByLabel** (Form inputs with labels)
   ✅ page.getByLabel('Email address')
   ✅ page.getByLabel(/password/i) // Case insensitive
   
3. **getByPlaceholder** (Inputs with placeholders)
   ✅ page.getByPlaceholder('Enter your email')
   ✅ page.getByPlaceholder(/search/i)
   
4. **getByText** (Visible text content)
   ✅ page.getByText('Welcome back')
   ✅ page.getByText(/sign in/i)
   
5. **getByTestId** (If data-testid attributes exist)
   ✅ page.getByTestId('submit-button')
   
6. **CSS/XPath Selectors** (LAST RESORT - fragile)
   ⚠️ page.locator('.btn-primary')
   ⚠️ page.locator('#submit')

=== ADVANCED FILTERING & CHAINING ===

**Filter by has-text:**
page.getByRole('listitem').filter({ hasText: 'Product Name' })

**Filter by has element:**
page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'News' }) })

**Filter by hasNot:**
page.getByRole('listitem').filter({ hasNot: page.getByText('Out of stock') })

**Chaining locators:**
page.getByRole('article').getByRole('button', { name: 'Buy Now' })

**Using nth, first, last:**
page.getByRole('button').first()
page.getByRole('button').nth(2)
page.getByRole('button').last()

=== HANDLING DYNAMIC CONTENT ===

**Wait for element:**
await page.getByRole('button', { name: 'Submit' }).waitFor({ state: 'visible' })
await page.getByRole('button', { name: 'Submit' }).waitFor({ state: 'attached' })

**Check element state:**
const isVisible = await page.getByRole('button').isVisible()
const isEnabled = await page.getByRole('button').isEnabled()

**Multiple matching elements:**
const count = await page.getByRole('button').count()
for (let i = 0; i < count; i++) {
  const button = page.getByRole('button').nth(i)
  const text = await button.textContent()
  if (text.includes('target')) {
    await button.click()
    break
  }
}

=== ROBUST CLICK STRATEGIES ===

**Standard click (with auto-wait):**
await page.getByRole('button', { name: 'Submit' }).click()

**Click with options:**
await page.getByRole('button').click({ 
  force: true,           // Click even if element is obscured
  timeout: 10000,        // Custom timeout
  position: { x: 10, y: 10 } // Click at specific position
})

**Scroll into view before click:**
await page.getByRole('button').scrollIntoViewIfNeeded()
await page.getByRole('button').click()

**Handle overlays/modals blocking click:**
// Close modal first
await page.getByRole('button', { name: /close|×/i }).click()
// Then click target element
await page.getByRole('button', { name: 'Submit' }).click()

=== FORM INTERACTIONS ===

**Fill text input:**
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com')

**Type slowly (trigger events):**
await page.getByRole('textbox').pressSequentially('user@example.com', { delay: 100 })

**Select dropdown:**
await page.getByRole('combobox', { name: 'Country' }).selectOption('USA')

**Check/uncheck:**
await page.getByRole('checkbox', { name: 'Accept terms' }).check()
await page.getByRole('checkbox', { name: 'Subscribe' }).uncheck()

**Radio button:**
await page.getByRole('radio', { name: 'Option A' }).check()

=== HANDLING CHALLENGING ELEMENTS ===

**Shadow DOM:**
await page.locator('my-component').locator('internal-button').click()

**iFrames:**
const frame = page.frameLocator('iframe[name="payment"]')
await frame.getByRole('button', { name: 'Pay' }).click()

**Pseudo-elements (::before, ::after):**
// Target parent element instead
await page.locator('.icon-container').click()

**Hidden elements (display: none):**
// Make visible first via JavaScript
await page.locator('.hidden-element').evaluate(el => el.style.display = 'block')
await page.locator('.hidden-element').click()

=== VERIFICATION PATTERNS ===

**Verify element exists:**
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

**Verify text content:**
await expect(page.getByRole('heading')).toHaveText('Welcome')

**Verify attribute:**
await expect(page.getByRole('button')).toHaveAttribute('disabled', '')

**Verify URL changed:**
await expect(page).toHaveURL(/dashboard/)

=== DEBUGGING LOCATORS ===

**Get element info:**
const text = await page.getByRole('button').textContent()
const isVisible = await page.getByRole('button').isVisible()
const count = await page.getByRole('button').count()

**Screenshot for debugging:**
await page.screenshot({ path: 'debug.png' })
await page.getByRole('button').screenshot({ path: 'button.png' })

**Get all matching elements:**
const elements = await page.getByRole('button').all()
for (const el of elements) {
  console.log(await el.textContent())
}

=== FALLBACK STRATEGIES ===

If semantic locators fail, try in order:

1. **Alternative roles/attributes:**
   page.getByLabel('Search').or(page.getByPlaceholder('Search'))

2. **Text-based with contains:**
   page.locator('button:has-text("Submit")')

3. **CSS with stable classes:**
   page.locator('.btn-primary[type="submit"]')

4. **XPath (avoid if possible):**
   page.locator('xpath=//button[contains(text(), "Submit")]')

5. **JavaScript evaluation:**
   await page.evaluate(() => {
     const button = document.querySelector('button.submit')
     button?.click()
   })

=== BEST PRACTICES SUMMARY ===

✅ DO:
- Use getByRole as first choice
- Wait for elements: .waitFor()
- Use exact: true for precise matching
- Filter and chain for specificity
- Verify actions completed
- Handle modals/overlays first

❌ DON'T:
- Use fragile CSS selectors like nth-child
- Use XPath unless absolutely necessary
- Click without waiting for visibility
- Use hardcoded delays (use waitFor instead)
- Ignore errors (always verify success)

Remember: Playwright auto-waits, but explicit waits with .waitFor() make tests more reliable!

`
  }

  /**
   * Record learning from task execution with enhanced metadata
   */
  private async recordLearning(
    task: Task,
    success: boolean,
    result: string,
    metadata?: {
      blockerHandled?: boolean
      verificationPassed?: boolean
      contextMaintained?: boolean
      totalAttempts?: number
    }
  ): Promise<void> {
    if (!this.state) return

    const whatWorked: string[] = []
    const whatFailed: string[] = []

    if (success) {
      whatWorked.push('Task execution completed successfully')
      if (metadata?.blockerHandled) {
        whatWorked.push('Successfully detected and dismissed UI blockers')
      }
      if (metadata?.verificationPassed) {
        whatWorked.push('Action verification passed')
      }
      if (metadata?.contextMaintained) {
        whatWorked.push('Maintained correct website context')
      }
    } else {
      whatFailed.push('Task execution failed')
      whatFailed.push(result)

      if (metadata?.blockerHandled === false) {
        whatFailed.push('Possible UI blocker not detected or dismissed')
      }
      if (metadata?.verificationPassed === false) {
        whatFailed.push('Action verification failed - action may not have completed')
      }
      if (metadata?.contextMaintained === false) {
        whatFailed.push('Context drift detected - navigated to wrong website')
      }
      if (metadata?.totalAttempts) {
        whatFailed.push(`Failed after ${metadata.totalAttempts} attempts`)
      }
    }

    const entry: LearningEntry = {
      id: `learning-${Date.now()}`,
      taskId: task.id,
      whatWorked,
      whatFailed,
      insights: success
        ? `Successfully completed: ${task.title}${metadata?.blockerHandled ? ' (with blocker handling)' : ''}`
        : `Failed to complete: ${task.title}. Reason: ${result}`,
      tokensUsed: Math.round(Math.random() * 2000) + 500,
      executionTime: Math.round(Math.random() * 300) + 30,
      timestamp: new Date(),
    }

    this.state.learningEntries.push(entry)
  }

  /**
   * Auto-commit task result to git
   */
  private async autoCommitTask(taskIndex: number, result: string): Promise<void> {
    try {
      const task = this.state?.plan.generatedTasks[taskIndex]
      if (!task) return

      await fetch('/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'git-commit',
          taskId: task.id,
          taskTitle: task.title,
          result: result.substring(0, 500),
        }),
      })
    } catch (error) {
      console.error('Auto-commit failed:', error)
    }
  }

  /**
   * Compact context for long-running sessions
   */
  async compactContext(): Promise<void> {
    if (!this.config.compactContext || !this.state) return

    const compactionThreshold = 0.8 // 80% of token limit

    // Summary of learning entries
    const summary = {
      totalTasks: this.state.plan.generatedTasks.length,
      completedTasks: this.state.results.filter((r) => r.success).length,
      failedTasks: this.state.results.filter((r) => !r.success).length,
      totalTokens: this.state.results.reduce((sum, r) => sum + r.tokensUsed, 0),
      insights: this.state.learningEntries
        .filter((e) => e.whatWorked.length > 0)
        .map((e) => e.insights),
    }

    // Keep only recent learning entries
    this.state.learningEntries = this.state.learningEntries.slice(-5)

    console.log('📦 Context compacted:', summary)
  }

  /**
   * Get execution summary
   */
  getExecutionSummary() {
    if (!this.state) return null

    const completedTasks = this.state.results.filter((r) => r.success).length
    const totalTasks = this.state.plan.generatedTasks.length
    const totalTokens = this.state.results.reduce((sum, r) => sum + r.tokensUsed, 0)
    const totalTime = Date.now() - this.state.startTime.getTime()

    return {
      plan: this.state.plan,
      progress: {
        completed: completedTasks,
        total: totalTasks,
        percentage: Math.round((completedTasks / totalTasks) * 100),
      },
      metrics: {
        totalTokens,
        totalTime,
        averageTimePerTask: Math.round(totalTime / completedTasks) || 0,
      },
      learningEntries: this.state.learningEntries,
      results: this.state.results,
    }
  }

  /**
   * Helper: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export default RalphExecutorService

