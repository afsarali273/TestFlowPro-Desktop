import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params before using
    const resolvedParams = await params;
    
    // Get framework path from localStorage equivalent (we'll need to pass it via query param)
    const frameworkPath = request.nextUrl.searchParams.get('frameworkPath');
    
    if (!frameworkPath) {
      return NextResponse.json(
        { error: 'Framework path not provided' },
        { status: 400 }
      );
    }

    // Reconstruct the screenshot path
    const screenshotPath = decodeURIComponent(resolvedParams.path.join('/'));
    
    // Resolve the full path to the screenshot in the backend repository
    const fullPath = path.isAbsolute(screenshotPath) 
      ? screenshotPath 
      : path.join(frameworkPath, screenshotPath);

    // Read the image file
    const imageBuffer = await readFile(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'image/png'; // default
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error serving screenshot:', error);
    return NextResponse.json(
      { error: 'Screenshot not found' },
      { status: 404 }
    );
  }
}