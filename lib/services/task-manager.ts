import { Task, Plan } from '@/types/ralph-loop'

export interface TaskQueueItem {
  plan: Plan
  taskIndex: number
  priority: number
  retryCount: number
  status: 'pending' | 'executing' | 'completed' | 'failed'
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface QueueStats {
  total: number
  pending: number
  executing: number
  completed: number
  failed: number
  averageWaitTime: number
  averageExecutionTime: number
}

export class TaskManager {
  private queue: Map<string, TaskQueueItem> = new Map()
  private executingTasks: Set<string> = new Set()
  private maxConcurrent: number
  private listeners: ((stats: QueueStats) => void)[] = []

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * Add task to queue
   */
  addTask(plan: Plan, taskIndex: number, priority: number = 0): string {
    const taskId = `${plan.id}-task-${taskIndex}-${Date.now()}`

    const queueItem: TaskQueueItem = {
      plan,
      taskIndex,
      priority,
      retryCount: 0,
      status: 'pending',
      createdAt: new Date(),
    }

    this.queue.set(taskId, queueItem)
    this.notifyListeners()

    return taskId
  }

  /**
   * Get next task to execute
   */
  getNextTask(): TaskQueueItem | null {
    if (this.executingTasks.size >= this.maxConcurrent) {
      return null
    }

    // Get pending tasks sorted by priority
    const pendingTasks = Array.from(this.queue.values())
      .filter((item) => item.status === 'pending')
      .sort((a, b) => b.priority - a.priority)

    if (pendingTasks.length === 0) {
      return null
    }

    return pendingTasks[0]
  }

  /**
   * Mark task as executing
   */
  markExecuting(taskId: string): void {
    const task = this.queue.get(taskId)
    if (task) {
      task.status = 'executing'
      task.startedAt = new Date()
      this.executingTasks.add(taskId)
      this.notifyListeners()
    }
  }

  /**
   * Mark task as completed
   */
  markCompleted(taskId: string): void {
    const task = this.queue.get(taskId)
    if (task) {
      task.status = 'completed'
      task.completedAt = new Date()
      this.executingTasks.delete(taskId)
      this.notifyListeners()
    }
  }

  /**
   * Mark task as failed
   */
  markFailed(taskId: string, retryCount: number): void {
    const task = this.queue.get(taskId)
    if (task) {
      task.retryCount = retryCount
      if (retryCount >= 3) {
        task.status = 'failed'
        this.executingTasks.delete(taskId)
      } else {
        task.status = 'pending' // Requeue for retry
      }
      this.notifyListeners()
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const items = Array.from(this.queue.values())

    const completed = items.filter((i) => i.status === 'completed')
    const executing = items.filter((i) => i.status === 'executing')
    const pending = items.filter((i) => i.status === 'pending')
    const failed = items.filter((i) => i.status === 'failed')

    const avgWaitTime =
      completed.length > 0
        ? completed.reduce((sum, i) => {
            const wait = i.startedAt ? i.startedAt.getTime() - i.createdAt.getTime() : 0
            return sum + wait
          }, 0) / completed.length
        : 0

    const avgExecTime =
      completed.length > 0
        ? completed.reduce((sum, i) => {
            const exec = i.completedAt && i.startedAt ? i.completedAt.getTime() - i.startedAt.getTime() : 0
            return sum + exec
          }, 0) / completed.length
        : 0

    return {
      total: items.length,
      pending: pending.length,
      executing: executing.length,
      completed: completed.length,
      failed: failed.length,
      averageWaitTime: Math.round(avgWaitTime),
      averageExecutionTime: Math.round(avgExecTime),
    }
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.clear()
    this.executingTasks.clear()
    this.notifyListeners()
  }

  /**
   * Get all tasks
   */
  getAllTasks(): TaskQueueItem[] {
    return Array.from(this.queue.values())
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (stats: QueueStats) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const stats = this.getStats()
    this.listeners.forEach((listener) => listener(stats))
  }
}

export default TaskManager

