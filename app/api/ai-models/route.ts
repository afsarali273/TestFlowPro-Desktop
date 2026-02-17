import { NextResponse } from 'next/server';
import { copilotSDK } from '@/lib/services/copilot-sdk-service';

export async function GET() {
  try {
    // Get available models from GitHub Copilot API
    const response = await fetch('https://api.githubcopilot.com/models', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      // Fallback to default models if API fails
      return NextResponse.json({
        models: [
          // Standard Models
          {
            id: 'gpt-4.1',
            name: 'GPT-4.1',
            description: 'Latest GPT-4 iteration with improved reasoning',
            capabilities: ['text', 'code', 'analysis'],
            max_tokens: 8192,
            tier: 'standard'
          },
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'Optimized GPT-4 for speed and efficiency',
            capabilities: ['text', 'code'],
            max_tokens: 4096,
            tier: 'standard'
          },
          {
            id: 'gpt-5-mini',
            name: 'GPT-5 Mini',
            description: 'Fast and lightweight GPT-5 variant',
            capabilities: ['text', 'code', 'reasoning'],
            max_tokens: 16384,
            tier: 'standard'
          },
          {
            id: 'grok-code-fast-1',
            name: 'Grok Code Fast 1',
            description: 'High-speed code generation model',
            capabilities: ['code', 'debugging', 'optimization'],
            max_tokens: 8192,
            tier: 'standard'
          },

          // Premium Models
          {
            id: 'claude-sonnet-4.5',
            name: 'Claude Sonnet 4.5',
            description: 'Advanced Anthropic model with superior reasoning',
            capabilities: ['text', 'code', 'analysis', 'reasoning'],
            max_tokens: 200000,
            tier: 'premium'
          },
          {
            id: 'gpt-5.1-codex-mini',
            name: 'GPT 5.1 Codex Mini',
            description: 'Specialized coding model with latest capabilities',
            capabilities: ['code', 'debugging', 'optimization', 'testing'],
            max_tokens: 32768,
            tier: 'premium'
          },
          {
            id: 'gemini-3-flash-preview',
            name: 'Gemini 3 Flash (Preview)',
            description: 'Ultra-fast Google AI model in preview',
            capabilities: ['text', 'code', 'multimodal'],
            max_tokens: 32768,
            tier: 'premium'
          }
        ]
      });
    }

    const data = await response.json();

    // Parse and return models
    return NextResponse.json({
      models: data.data || data.models || []
    });
  } catch (error) {
    console.error('Error fetching models:', error);

    // Return fallback models
    return NextResponse.json({
      models: [
        // Standard Models
        {
          id: 'gpt-4.1',
          name: 'GPT-4.1',
          description: 'Latest GPT-4 iteration with improved reasoning',
          capabilities: ['text', 'code', 'analysis'],
          max_tokens: 8192,
          tier: 'standard'
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Optimized GPT-4 for speed and efficiency',
          capabilities: ['text', 'code'],
          max_tokens: 4096,
          tier: 'standard'
        },
        {
          id: 'gpt-5-mini',
          name: 'GPT-5 Mini',
          description: 'Fast and lightweight GPT-5 variant',
          capabilities: ['text', 'code', 'reasoning'],
          max_tokens: 16384,
          tier: 'standard'
        },
        {
          id: 'grok-code-fast-1',
          name: 'Grok Code Fast 1',
          description: 'High-speed code generation model',
          capabilities: ['code', 'debugging', 'optimization'],
          max_tokens: 8192,
          tier: 'standard'
        },

        // Premium Models
        {
          id: 'claude-sonnet-4.5',
          name: 'Claude Sonnet 4.5',
          description: 'Advanced Anthropic model with superior reasoning',
          capabilities: ['text', 'code', 'analysis', 'reasoning'],
          max_tokens: 200000,
          tier: 'premium'
        },
        {
          id: 'gpt-5.1-codex-mini',
          name: 'GPT 5.1 Codex Mini',
          description: 'Specialized coding model with latest capabilities',
          capabilities: ['code', 'debugging', 'optimization', 'testing'],
          max_tokens: 32768,
          tier: 'premium'
        },
        {
          id: 'gemini-3-flash-preview',
          name: 'Gemini 3 Flash (Preview)',
          description: 'Ultra-fast Google AI model in preview',
          capabilities: ['text', 'code', 'multimodal'],
          max_tokens: 32768,
          tier: 'premium'
        }
      ]
    });
  }
}

