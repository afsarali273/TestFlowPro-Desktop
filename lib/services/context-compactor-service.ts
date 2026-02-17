import { LearningEntry, Task } from '@/types/ralph-loop'

export interface CompactedContext {
  summary: string
  keyInsights: string[]
  failedApproaches: string[]
  successfulPatterns: string[]
  estimatedTokensSaved: number
  compactedAt: Date
}

export interface TokenBudget {
  total: number
  used: number
  remaining: number
  percentageUsed: number
}

export class ContextCompactorService {
  private tokenBudget: number = 128000 // Default OpenAI token limit
  private compactionThreshold: number = 0.8 // 80% of budget
  private compactionHistory: CompactedContext[] = []

  constructor(tokenBudget: number = 128000) {
    this.tokenBudget = tokenBudget
  }

  /**
   * Calculate tokens used (rough estimate)
   * ~4 characters ≈ 1 token
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Check if compaction is needed
   */
  shouldCompact(currentUsage: number): boolean {
    const usagePercentage = currentUsage / this.tokenBudget
    return usagePercentage > this.compactionThreshold
  }

  /**
   * Get token budget info
   */
  getTokenBudget(currentUsage: number): TokenBudget {
    const percentageUsed = Math.round((currentUsage / this.tokenBudget) * 100)
    return {
      total: this.tokenBudget,
      used: currentUsage,
      remaining: Math.max(0, this.tokenBudget - currentUsage),
      percentageUsed,
    }
  }

  /**
   * Compact learning history
   */
  compactLearningHistory(entries: LearningEntry[], tasksTotal: number): CompactedContext {
    // Group by success/failure
    const successful = entries.filter((e) => e.whatFailed.length === 0)
    const failed = entries.filter((e) => e.whatFailed.length > 0)

    // Extract patterns
    const successfulPatterns = this.extractPatterns(successful.map((e) => e.whatWorked).flat())
    const failedApproaches = this.extractPatterns(failed.map((e) => e.whatFailed).flat())
    const keyInsights = this.extractInsights(successful, failed)

    // Calculate token savings
    const originalSize = this.estimateTokens(JSON.stringify(entries))
    const compactedSize = this.estimateTokens(JSON.stringify({
      successfulPatterns,
      failedApproaches,
      keyInsights,
    }))
    const tokensSaved = originalSize - compactedSize

    const context: CompactedContext = {
      summary: this.generateSummary(successful, failed, tasksTotal),
      keyInsights,
      failedApproaches,
      successfulPatterns,
      estimatedTokensSaved: tokensSaved,
      compactedAt: new Date(),
    }

    this.compactionHistory.push(context)
    return context
  }

  /**
   * Extract common patterns from array of strings
   */
  private extractPatterns(items: string[]): string[] {
    const frequency: { [key: string]: number } = {}

    items.forEach((item) => {
      frequency[item] = (frequency[item] || 0) + 1
    })

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern]) => pattern)
  }

  /**
   * Extract key insights
   */
  private extractInsights(successful: LearningEntry[], failed: LearningEntry[]): string[] {
    const insights: string[] = []

    // Success rate
    const total = successful.length + failed.length
    const rate = total > 0 ? Math.round((successful.length / total) * 100) : 0
    insights.push(`Overall success rate: ${rate}%`)

    // Performance
    const avgTime =
      successful.length > 0 ? successful.reduce((sum, e) => sum + e.executionTime, 0) / successful.length : 0
    insights.push(`Average execution time: ${Math.round(avgTime)}s`)

    // Token efficiency
    const totalTokens = (successful.concat(failed) as LearningEntry[]).reduce((sum, e) => sum + e.tokensUsed, 0)
    const avgTokens = total > 0 ? Math.round(totalTokens / total) : 0
    insights.push(`Average tokens per task: ${avgTokens}`)

    // Trends
    if (successful.length > 2) {
      const recent = successful.slice(-2)
      const older = successful.slice(0, -2)
      const recentAvg = recent.reduce((sum, e) => sum + e.executionTime, 0) / recent.length
      const olderAvg = older.reduce((sum, e) => sum + e.executionTime, 0) / older.length
      if (recentAvg < olderAvg) {
        insights.push(`✨ Performance improving: ${Math.round(((olderAvg - recentAvg) / olderAvg) * 100)}% faster recently`)
      }
    }

    return insights
  }

  /**
   * Generate summary
   */
  private generateSummary(successful: LearningEntry[], failed: LearningEntry[], tasksTotal: number): string {
    const total = successful.length + failed.length
    const rate = total > 0 ? Math.round((successful.length / total) * 100) : 0

    return `Executed ${total}/${tasksTotal} tasks with ${rate}% success rate. Key patterns identified and context optimized for continuation.`
  }

  /**
   * Create conversation context summary for AI
   */
  createContextSummary(compacted: CompactedContext): string {
    return `
## Execution Context Summary

${compacted.summary}

### What Worked
${compacted.successfulPatterns.map((p) => `- ${p}`).join('\n')}

### Common Failures to Avoid
${compacted.failedApproaches.map((f) => `- ${f}`).join('\n')}

### Key Insights
${compacted.keyInsights.map((i) => `- ${i}`).join('\n')}

---
Context compacted at ${compacted.compactedAt.toISOString()}. Tokens saved: ${compacted.estimatedTokensSaved}
`
  }

  /**
   * Suggest task splitting for long execution
   */
  suggestTaskSplitting(tasks: Task[], currentTokenUsage: number): Task[] {
    const budget = this.getTokenBudget(currentTokenUsage)

    if (budget.percentageUsed > this.compactionThreshold) {
      // Suggest splitting tasks
      const splitTasks: Task[] = []

      tasks.forEach((task) => {
        if (task.description.length > 500) {
          // Split long tasks
          const parts = Math.ceil(task.description.length / 500)
          for (let i = 0; i < parts; i++) {
            const startIdx = i * 500
            const endIdx = Math.min(startIdx + 500, task.description.length)
            splitTasks.push({
              ...task,
              id: `${task.id}-part-${i + 1}`,
              title: `${task.title} (Part ${i + 1}/${parts})`,
              description: task.description.substring(startIdx, endIdx),
            })
          }
        } else {
          splitTasks.push(task)
        }
      })

      return splitTasks
    }

    return tasks
  }

  /**
   * Get compaction history
   */
  getCompactionHistory(): CompactedContext[] {
    return [...this.compactionHistory]
  }

  /**
   * Clear compaction history
   */
  clearCompactionHistory(): void {
    this.compactionHistory = []
  }

  /**
   * Estimate total context size
   */
  estimateContextSize(entries: LearningEntry[], tasks: Task[], messages: any[]): number {
    const entriesSize = this.estimateTokens(JSON.stringify(entries))
    const tasksSize = this.estimateTokens(JSON.stringify(tasks))
    const messagesSize = this.estimateTokens(JSON.stringify(messages))

    return entriesSize + tasksSize + messagesSize
  }
}

export default ContextCompactorService

