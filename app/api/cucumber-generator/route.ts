import { NextRequest, NextResponse } from 'next/server'
import { CucumberAIService } from '@/lib/ai/cucumber-ai-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/cucumber-generator
 *
 * Generate Cucumber/Gherkin feature files from Playwright code or manual test descriptions
 *
 * Request body:
 * {
 *   "message": "Playwright code or test description",
 *   "type": "playwright" | "manual" | "general",
 *   "provider": "ollama" | "github-copilot"
 * }
 *
 * Response:
 * {
 *   "feature": "Gherkin feature file content",
 *   "scenarios": [{"name": "Scenario name", "steps": ["Given...", "When...", "Then..."]}],
 *   "status": "Success message"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, type = 'playwright', provider = 'ollama' } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('🥒 Cucumber Generation Request:', {
      type,
      provider,
      messageLength: message.length,
      messagePreview: message.substring(0, 100)
    })

    const service = new CucumberAIService()

    const result = await service.generateCucumberFeature(
      { message, type, provider },
      (status) => console.log('📊 Status:', status)
    )

    console.log('✅ Cucumber feature generated:', {
      featureLength: result.feature.length,
      scenarioCount: result.scenarios?.length || 0
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Cucumber generation error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate Cucumber feature',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

