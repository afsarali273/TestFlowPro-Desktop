import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    console.log(`🎬 Starting Playwright codegen for: ${url}`)
    
    // Start Playwright codegen
    const codegen = spawn('npx', ['playwright', 'codegen', url], {
      stdio: 'inherit',
      shell: true
    })

    return NextResponse.json({
      success: true,
      message: `Playwright codegen started for ${url}. Record your actions in the browser window.`
    })

  } catch (error: any) {
    console.error('❌ Playwright codegen error:', error.message)
    return NextResponse.json({ 
      error: `Failed to start codegen: ${error.message}` 
    }, { status: 500 })
  }
}