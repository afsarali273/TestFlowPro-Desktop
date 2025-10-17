import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { target, frameworkPath, suiteId, suiteName, testCaseId, testCaseName, filePath } = await request.json();

    // Handle both new target format and legacy individual parameters
    let finalTarget: string;
    if (target) {
      finalTarget = target;
    } else if (suiteId && suiteName && testCaseName) {
      finalTarget = `${suiteId}:${suiteName} > ${testCaseId || ''}:${testCaseName}`;
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters: either target or (suiteId, suiteName, testCaseName)' },
        { status: 400 }
      );
    }
    
    // Get absolute path to the backend
    const backendPath = frameworkPath || path.resolve(process.cwd(), '../../');
    const runnerPath = path.join(backendPath, 'src/runner.ts');
    
    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        let isControllerClosed = false;
        
        const sendEvent = (type: string, data: any) => {
          if (isControllerClosed) return;
          try {
            const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error('Error sending event:', error);
            isControllerClosed = true;
          }
        };

        // Send initial command info
        const command = filePath 
          ? `npx ts-node ${runnerPath} --file ${filePath} --target "${finalTarget}"`
          : `npx ts-node ${runnerPath} --target "${finalTarget}"`;
        
        sendEvent('command', {
          command,
          target: finalTarget
        });

        const args = ['ts-node', runnerPath, '--target', finalTarget];
        if (filePath) {
          args.push('--file', filePath);
        }
        
        console.log('Executing command:', 'npx', args.join(' '));
        console.log('Target:', finalTarget);
        console.log('FilePath:', filePath || 'Not provided - will search by suite ID/name');

        const child = spawn('npx', args, {
          cwd: backendPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
          env: { ...process.env, PATH: process.env.PATH }
        });

        let outputBuffer = '';
        
        child.stdout.on('data', (data) => {
          const output = data.toString();
          outputBuffer += output;
          
          sendEvent('stdout', { data: output });
          
          // Try to parse test results from output
          try {
            const lines = output.split('\n');
            for (const line of lines) {
              if (line.includes('Test Results Summary:') || line.includes('PASS') || line.includes('FAIL')) {
                // Parse test statistics from output
                const passMatch = outputBuffer.match(/(\d+)\s+passed/i);
                const failMatch = outputBuffer.match(/(\d+)\s+failed/i);
                const totalMatch = outputBuffer.match(/Total:\s*(\d+)/i);
                
                if (passMatch || failMatch || totalMatch) {
                  const passed = passMatch ? parseInt(passMatch[1]) : 0;
                  const failed = failMatch ? parseInt(failMatch[1]) : 0;
                  const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;
                  
                  sendEvent('stats', {
                    stats: { passed, failed, total }
                  });
                }
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });

        child.stderr.on('data', (data) => {
          sendEvent('stderr', { data: data.toString() });
        });

        child.on('close', (code) => {
          if (isControllerClosed) return;
          
          // Parse final stats from complete output buffer
          let stats = null;
          try {
            const passMatch = outputBuffer.match(/(\d+)\s+passed/i);
            const failMatch = outputBuffer.match(/(\d+)\s+failed/i);
            const totalMatch = outputBuffer.match(/Total:\s*(\d+)/i);
            
            if (passMatch || failMatch || totalMatch) {
              const passed = passMatch ? parseInt(passMatch[1]) : 0;
              const failed = failMatch ? parseInt(failMatch[1]) : 0;
              const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;
              stats = { passed, failed, total };
            }
          } catch (e) {
            // Ignore parsing errors
          }
          
          sendEvent('exit', {
            exitCode: code,
            success: code === 0,
            stats: stats,
            message: code === 0 ? 'Test case executed successfully' : 'Test case execution failed'
          });
          
          isControllerClosed = true;
          controller.close();
        });

        child.on('error', (error) => {
          if (isControllerClosed) return;
          
          sendEvent('error', {
            error: error.message,
            message: 'Failed to start test case execution'
          });
          
          isControllerClosed = true;
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Test case execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}