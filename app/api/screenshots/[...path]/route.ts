import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const screenshotPath = decodeURIComponent(params.path.join('/'))
    const fullPath = path.resolve(process.cwd(), '../../', screenshotPath)
    
    // Security check - ensure path is within screenshots directory
    if (!fullPath.includes('screenshots/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 })
    }
    
    const imageBuffer = fs.readFileSync(fullPath)
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error serving screenshot:', error)
    return NextResponse.json({ error: 'Failed to load screenshot' }, { status: 500 })
  }
}