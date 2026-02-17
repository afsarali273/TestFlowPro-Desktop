import { LearningEntry } from '@/types/ralph-loop'

export interface JournalStats {
  totalEntries: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  totalTokensUsed: number
  averageExecutionTime: number
  insights: string[]
  recentLessons: string[]
}

export class LearningJournalService {
  private entries: LearningEntry[] = []
  private maxEntries: number = 100
  private storageKey: string = 'ralph-loop-learning-journal'

  constructor(maxEntries: number = 100) {
    this.maxEntries = maxEntries
    this.loadFromStorage()
  }

  /**
   * Record a new learning entry
   */
  recordEntry(entry: LearningEntry): void {
    this.entries.push(entry)

    // Keep only the most recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries)
    }

    this.saveToStorage()
  }

  /**
   * Get journal statistics
   */
  getStats(): JournalStats {
    const successful = this.entries.filter((e) => e.whatFailed.length === 0)
    const failed = this.entries.filter((e) => e.whatFailed.length > 0)

    const totalTokens = this.entries.reduce((sum, e) => sum + e.tokensUsed, 0)
    const avgTime =
      this.entries.length > 0 ? this.entries.reduce((sum, e) => sum + e.executionTime, 0) / this.entries.length : 0

    // Extract insights
    const insights = this.extractInsights()
    const recentLessons = this.extractRecentLessons()

    return {
      totalEntries: this.entries.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      successRate:
        this.entries.length > 0 ? Math.round((successful.length / this.entries.length) * 100) : 0,
      totalTokensUsed: totalTokens,
      averageExecutionTime: Math.round(avgTime),
      insights,
      recentLessons,
    }
  }

  /**
   * Extract key insights from entries
   */
  private extractInsights(): string[] {
    const insights: string[] = []

    // What works
    const successPatterns = this.entries
      .filter((e) => e.whatWorked.length > 0)
      .flatMap((e) => e.whatWorked)
      .filter((v, i, a) => a.indexOf(v) === i) // unique

    if (successPatterns.length > 0) {
      insights.push(`✓ Working approaches: ${successPatterns.slice(0, 3).join(', ')}`)
    }

    // Common failures
    const failurePatterns = this.entries
      .filter((e) => e.whatFailed.length > 0)
      .flatMap((e) => e.whatFailed)
      .filter((v, i, a) => a.indexOf(v) === i) // unique

    if (failurePatterns.length > 0) {
      insights.push(`✗ Common issues: ${failurePatterns.slice(0, 3).join(', ')}`)
    }

    // Token efficiency
    const avgTokens = this.getStats().totalTokensUsed / Math.max(this.entries.length, 1)
    insights.push(`📊 Average tokens per task: ${Math.round(avgTokens)}`)

    return insights
  }

  /**
   * Extract recent lessons learned
   */
  private extractRecentLessons(): string[] {
    const lessons: string[] = []

    // Get last 5 entries
    const recent = this.entries.slice(-5)

    // Analyze success trends
    const recentSuccess = recent.filter((e) => e.whatFailed.length === 0).length
    if (recentSuccess === recent.length && recent.length > 0) {
      lessons.push('💡 Recent executions all successful - maintain current approach')
    } else if (recentSuccess === 0 && recent.length > 0) {
      lessons.push('⚠️ Recent failures - time to try new strategies')
    }

    // Time trends
    const recentAvgTime = recent.length > 0 ? recent.reduce((sum, e) => sum + e.executionTime, 0) / recent.length : 0
    const overallAvgTime = this.getStats().averageExecutionTime
    if (recentAvgTime < overallAvgTime * 0.8) {
      lessons.push(`⚡ Recent tasks 20% faster - optimization working!`)
    }

    return lessons
  }

  /**
   * Get all entries
   */
  getAllEntries(): LearningEntry[] {
    return [...this.entries]
  }

  /**
   * Get entries for a specific task
   */
  getEntriesForTask(taskId: string): LearningEntry[] {
    return this.entries.filter((e) => e.taskId === taskId)
  }

  /**
   * Get recent entries
   */
  getRecentEntries(count: number = 10): LearningEntry[] {
    return this.entries.slice(-count)
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
    this.saveToStorage()
  }

  /**
   * Export journal as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        stats: this.getStats(),
        entries: this.entries,
      },
      null,
      2
    )
  }

  /**
   * Import journal from JSON
   */
  importFromJSON(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString)
      if (Array.isArray(data.entries)) {
        this.entries = data.entries.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }))
        this.saveToStorage()
      }
    } catch (error) {
      console.error('Failed to import journal:', error)
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.entries))
      }
    } catch (error) {
      console.error('Failed to save journal to storage:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          this.entries = JSON.parse(stored).map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load journal from storage:', error)
    }
  }

  /**
   * Generate AI recommendation based on learnings
   */
  generateRecommendation(): string {
    const stats = this.getStats()

    if (stats.successRate === 100 && stats.totalEntries > 5) {
      return '🎯 Perfect streak! Your approach is optimized. Keep the current strategy.'
    }

    if (stats.successRate < 50 && stats.totalEntries > 5) {
      return '⚠️ Success rate below 50%. Consider changing your approach or being more specific with requirements.'
    }

    if (stats.averageExecutionTime > 5000) {
      return '⏱️ Tasks are taking longer than expected. Try breaking them into smaller pieces.'
    }

    if (stats.totalTokensUsed > stats.totalEntries * 3000) {
      return '💰 High token usage. Consider using simpler, more focused prompts.'
    }

    return '✨ Keep iterating! Each execution teaches the system something new.'
  }
}

export default LearningJournalService

