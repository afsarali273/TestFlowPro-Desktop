export interface AIConfig {
  ollama: {
    baseUrl: string
    model: string
    embeddingModel: string
  }
  github: {
    baseUrl: string
    model: string
    maxTokens: number
  }
  defaults: {
    provider: 'ollama' | 'github-copilot'
    timeout: number
  }
  ui: {
    showChatIcon: boolean
  }
}

export const AI_CONFIG: AIConfig = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5-coder:14b',  // Specialized for code generation and structured output
    embeddingModel: 'mxbai-embed-large'  // High quality embeddings for better context matching
  },
  github: {
    baseUrl: 'https://api.githubcopilot.com',
    model: 'gpt-5-mini',  // Valid model: gpt-5-mini, gpt-4o, gpt-4, gpt-3.5-turbo, grok code fast 1
    maxTokens: 4096
  },
  defaults: {
    provider: 'github-copilot',
    timeout: 30000
  },
  ui: {
    showChatIcon: true  // Set to false to hide AI chat icon
  }
}