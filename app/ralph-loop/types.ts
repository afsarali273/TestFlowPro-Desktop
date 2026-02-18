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

