import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const { filePath } = await request.json()
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Validate that the file path is safe (no directory traversal)
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(process.cwd()) && !path.isAbsolute(filePath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete the file
    await fs.unlink(resolvedPath)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test suite file deleted successfully' 
    })
    
  } catch (error) {
    console.error('Error deleting test suite file:', error)
    return NextResponse.json(
      { error: 'Failed to delete test suite file' },
      { status: 500 }
    )
  }
}