import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '../../../lib/ai/ai-service'
import path from 'path'

let aiService: AIService | null = null

const getAIService = async () => {
  if (!aiService) {
    const testSuitesPath = path.join(process.cwd(), 'testSuites')
    aiService = new AIService(testSuitesPath)
  }
  return aiService
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, type, stream, provider = 'ollama' } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const service = await getAIService()
    
    // Handle streaming for status updates
    if (stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const onStatusUpdate = (status: string) => {
            const data = `data: ${JSON.stringify({ status })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          
          service.generateResponse({ message, type, provider }, onStatusUpdate)
            .then(result => {
              const data = `data: ${JSON.stringify({ ...result, done: true })}\n\n`
              controller.enqueue(encoder.encode(data))
              controller.close()
            })
            .catch(error => {
              const data = `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`
              controller.enqueue(encoder.encode(data))
              controller.close()
            })
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }
    
    // Regular non-streaming response
    const result = await service.generateResponse({ message, type, provider })
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}