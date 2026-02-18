export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number
  result?: string
  error?: string
  executedAt?: Date
  completedAt?: Date
  duration?: number
}

export interface Plan {
  id: string
  title: string
  requirements: string
  generatedTasks: Task[]
  createdAt: Date
  updatedAt: Date
  mode?: 'manual' | 'exploratory'
  explorationUrl?: string
  explorationSummary?: string
  discoveredScenarios?: DiscoveredScenario[]
}

export interface DiscoveredScenario {
  id: string
  title: string
  description: string
  page: string
  elements: any[]
  steps: string[]
  priority: 'high' | 'medium' | 'low'
  category: string
}

export interface LearningEntry {
  id: string
  taskId: string
  whatWorked: string[]
  whatFailed: string[]
  insights: string
  tokensUsed: number
  executionTime: number
  timestamp: Date
}

export interface ExecutionLog {
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: Record<string, any>
}

export interface RalphLoopState {
  plan: Plan | null
  isExecuting: boolean
  isPaused: boolean
  executionLog: ExecutionLog[]
  learningEntries: LearningEntry[]
  currentTaskIndex: number
  startTime?: Date
  endTime?: Date
}

export interface PlanGenerationRequest {
  requirements: string
  context?: string
  previousLearnings?: string[]
}

export interface PlanGenerationResponse {
  plan: Plan
  estimatedDuration: number
  estimatedTokens: number
  complexity: 'simple' | 'medium' | 'complex'
}

