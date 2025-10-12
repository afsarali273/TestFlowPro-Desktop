import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { curlCommand } = await request.json();
    
    if (!curlCommand || !curlCommand.trim().startsWith('curl')) {
      return NextResponse.json({ error: 'Invalid cURL command' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Add timeout and format options to curl command
    const enhancedCurl = `${curlCommand} --max-time 30 --silent --show-error --write-out "\\n%{http_code}\\n%{time_total}"`;
    
    const { stdout, stderr } = await execAsync(enhancedCurl);
    const endTime = Date.now();
    
    if (stderr) {
      return NextResponse.json({ 
        error: 'cURL execution failed', 
        details: stderr 
      }, { status: 400 });
    }

    // Parse curl output
    const lines = stdout.trim().split('\n');
    const httpCode = lines[lines.length - 2];
    const timeTotal = parseFloat(lines[lines.length - 1]) * 1000; // Convert to ms
    
    // Extract response body (everything except last 2 lines)
    const responseBody = lines.slice(0, -2).join('\n');
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseBody);
    } catch (e) {
      parsedData = responseBody;
    }

    return NextResponse.json({
      status: parseInt(httpCode),
      time: Math.round(timeTotal),
      data: parsedData,
      raw: responseBody
    });
    
  } catch (error: any) {
    console.error('cURL Test Error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute cURL command',
      details: error.message 
    }, { status: 500 });
  }
}