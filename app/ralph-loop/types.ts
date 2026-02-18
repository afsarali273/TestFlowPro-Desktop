// Ralph Loop Types

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
  discoveredScenarios?: DiscoveredScenario[]
  explorationSummary?: string // Markdown-formatted exploration report
}

export interface DiscoveredScenario {
  id: string
  title: string
  description: string
  page: string
  elements: string[]
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

export interface MCPServer {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  tools?: any[]
}

export type CodeGenType = 'java' | 'typescript' | 'python' | 'testflow' | 'cucumber'
export type TestType = 'UI' | 'API'

