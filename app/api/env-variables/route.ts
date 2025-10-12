import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frameworkPath = searchParams.get('frameworkPath');
    
    if (!frameworkPath) {
      throw new Error('frameworkPath is required');
    }
    
    const files = await fs.readdir(frameworkPath);
    
    const envFiles = files
      .filter(file => file.startsWith('.env.') && file !== '.env.example')
      .map(file => file.replace('.env.', ''));
    
    return NextResponse.json({ environments: envFiles });
  } catch (error) {
    console.error('Error reading environment files:', error);
    return NextResponse.json({ environments: [] });
  }
}