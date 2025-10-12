import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { testSuite, location, fileName } = await request.json()
    
    const saveLocation = location || path.join(process.cwd(), 'testSuites')
    const saveFileName = fileName || `AI_${testSuite.suiteName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`
    
    // Ensure directory exists
    await fs.mkdir(saveLocation, { recursive: true })
    
    const filePath = path.join(saveLocation, saveFileName)
    await fs.writeFile(filePath, JSON.stringify(testSuite, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      filePath,
      message: 'Test suite saved successfully' 
    })
  } catch (error) {
    console.error('Save Test Suite API Error:', error)
    return NextResponse.json(
      { error: 'Failed to save test suite' },
      { status: 500 }
    )
  }
}