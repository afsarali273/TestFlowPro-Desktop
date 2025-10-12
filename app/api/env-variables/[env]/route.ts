import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ env: string }> }) {
  try {
    const { env } = await params;
    // Get frameworkPath from query params
    const { searchParams } = new URL(request.url);
    const frameworkPath = searchParams.get('frameworkPath');
    if (!frameworkPath) {
      throw new Error('frameworkPath is required');
    }
    const envFile = path.join(frameworkPath, `.env.${env}`);
    const content = await fs.readFile(envFile, 'utf-8');
    const variables = parseEnvContent(content);
    return NextResponse.json({ variables });
  } catch (error) {
    const { env } = await params;
    console.error(`Error reading .env.${env}:`, error);
    return NextResponse.json({ variables: [] });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ env: string }> }) {
  try {
    const { env } = await params;
    const body = await request.json();
    const { variables, frameworkPath } = body;
    if (!frameworkPath) {
      throw new Error('frameworkPath is required');
    }
    const envFile = path.join(frameworkPath, `.env.${env}`);
    const content = generateEnvContent(variables);
    await fs.writeFile(envFile, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    const { env } = await params;
    console.error(`Error writing .env.${env}:`, error);
    return NextResponse.json({ error: 'Failed to save environment variables' }, { status: 500 });
  }
}

function parseEnvContent(content: string) {
  const variables: { key: string; value: string }[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        variables.push({
          key: key.trim(),
          value: valueParts.join('=').trim()
        });
      }
    }
  }
  
  return variables;
}

function generateEnvContent(variables: { key: string; value: string }[]) {
  return variables
    .filter(v => v.key.trim())
    .map(v => `${v.key}=${v.value}`)
    .join('\n') + '\n';
}