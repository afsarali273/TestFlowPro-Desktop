import { GitHubAuthService } from './githubAuth';
import { AI_CONFIG } from '../../ai-config';

export type AIProvider = 'ollama' | 'github-copilot';

export interface AIProviderConfig {
  provider: AIProvider;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export class AIProviderService {
  private githubAuth = new GitHubAuthService();

  async getProviderConfig(provider: AIProvider): Promise<AIProviderConfig> {
    switch (provider) {
      case 'ollama':
        return {
          provider: 'ollama',
          baseUrl: AI_CONFIG.ollama.baseUrl,
          model: AI_CONFIG.ollama.model
        };
      
      case 'github-copilot':
        const authStatus = await this.githubAuth.checkAuthStatus();
        if (!authStatus.hasToken || !authStatus.isValid) {
          throw new Error('GitHub Copilot not authenticated');
        }
        return {
          provider: 'github-copilot',
          baseUrl: AI_CONFIG.github.baseUrl,
          model: AI_CONFIG.github.model,
          apiKey: 'authenticated'
        };
      
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  async sendMessage(config: AIProviderConfig, message: string): Promise<string> {
    if (config.provider === 'ollama') {
      return this.sendOllamaMessage(config, message);
    } else if (config.provider === 'github-copilot') {
      return this.sendCopilotMessage(config, message);
    }
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  private async sendOllamaMessage(config: AIProviderConfig, message: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: message,
        stream: false
      })
    });
    
    const data = await response.json();
    return data.response;
  }

  private async sendCopilotMessage(config: AIProviderConfig, message: string): Promise<string> {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: message }]
      })
    });
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
  }


}