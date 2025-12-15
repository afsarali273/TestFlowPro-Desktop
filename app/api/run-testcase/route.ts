import { NextRequest, NextResponse } from 'next/server';
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const { target, frameworkPath: requestedFrameworkPath, suiteId, suiteName, testCaseId, testCaseName, filePath } = await request.json();

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

        // Get absolute path to the backend: prefer frameworkPath from requester, otherwise derive relative to server
        // Require the caller to provide the frameworkPath (stored in client localStorage).
        // Previously the code defaulted to resolving the project root which caused the server
        // to operate on the wrong directory; now we mandate an explicit path to avoid ambiguity.
        if (!requestedFrameworkPath) {
            return NextResponse.json(
                { error: 'MISSING_FRAMEWORK_PATH', message: 'frameworkPath is required in request body. Provide the absolute path to the framework (from the Framework Path modal).' },
                { status: 400 }
            );
        }
        const backendPath = requestedFrameworkPath;
        const runnerPath = path.join(backendPath, 'src/runner.ts');

        // If runner isn't present, return a helpful error instead of letting spawn produce ENOENT
        try {
            if (!fs.existsSync(runnerPath)) {
                return NextResponse.json(
                    { error: 'RUNNER_NOT_FOUND', message: `Runner not found at ${runnerPath}. Ensure the frameworkPath is correct and that 'src/runner.ts' exists.` },
                    { status: 400 }
                );
            }
        } catch (e) {
            // If fs check fails for permission reasons, continue and let spawn handlers deal with it
            console.warn('Could not verify runnerPath existence', e);
        }

        // childProc needs to be visible to both start and cancel handlers; declare here.
        let childProc: any = null;
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                // Track whether the controller has been closed to avoid enqueueing after close
                let streamClosed = false;

                const safeEnqueue = (chunk: Uint8Array) => {
                    if (streamClosed) return;
                    try {
                        controller.enqueue(chunk);
                    } catch (e) {
                        // If enqueue fails because controller is already closed, mark closed and ignore
                        streamClosed = true;
                    }
                };

                const safeClose = () => {
                    if (streamClosed) return;
                    streamClosed = true;
                    try {
                        controller.close();
                    } catch (e) {
                        // ignore
                    }
                };

                const sendEvent = (type: string, data: any) => {
                    if (streamClosed) return;
                    const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
                    safeEnqueue(encoder.encode(message));
                };

                // Send initial command info
                const command = filePath
                    ? `npx ts-node ${runnerPath} --file ${filePath} --target "${finalTarget}"`
                    : `npx ts-node ${runnerPath} --target "${finalTarget}"`;

                sendEvent('command', {
                    command,
                    target: finalTarget,
                    backendPath,
                });

                const args = ['ts-node', runnerPath, '--target', finalTarget];
                if (filePath) {
                    args.push('--file', filePath);
                }

                console.log('Executing command:', 'npx', args.join(' '));
                console.log('Target:', finalTarget);
                console.log('FilePath:', filePath || 'Not provided - will search by suite ID/name');
                console.log('BackendPath:', backendPath);

                let outputBuffer = '';

                // Helper to spawn using local ts-node binary, then npx (platform-aware), or fallback to node
                const spawnRunner = () => {
                    // 1) Prefer local ts-node binary from backend/node_modules/.bin
                    try {
                        const binDir = path.join(backendPath, 'node_modules', '.bin');
                        const localExe = process.platform === 'win32' ? path.join(binDir, 'ts-node.cmd') : path.join(binDir, 'ts-node');
                        if (fs.existsSync(localExe)) {
                            return spawn(localExe, [runnerPath, '--target', finalTarget].concat(filePath ? ['--file', filePath] : []), { cwd: backendPath, stdio: ['pipe','pipe','pipe'] });
                        }
                    } catch (e) {
                        // ignore and continue to next option
                    }

                    // 2) Try npx (probe first to avoid ENOENT)
                    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
                    const probeCmd = process.platform === 'win32' ? 'where' : 'which';
                    try {
                        const probe = spawnSync(probeCmd, [npxCmd], { cwd: backendPath });
                        if (probe && probe.status === 0) {
                            return spawn(npxCmd, ['ts-node', runnerPath, '--target', finalTarget].concat(filePath ? ['--file', filePath] : []), { cwd: backendPath, stdio: ['pipe','pipe','pipe'] });
                        }
                    } catch (e) {
                        // ignore
                    }

                    // 3) No npx and no local ts-node binary: return null to let fallback use node -r ts-node/register
                    return null;
                };

                const tryFallbackToNode = () => {
                    const nodeArgs = ['-r', 'ts-node/register', runnerPath, '--target', finalTarget];
                    if (filePath) nodeArgs.push('--file', filePath);
                    try {
                        return spawn(process.execPath, nodeArgs, { cwd: backendPath, stdio: ['pipe','pipe','pipe'] });
                    } catch (e) {
                        return null;
                    }
                };

                // attach stdout/stderr/close/error handlers to a given child process
                const attachHandlers = (cp: any) => {
                    if (!cp) return;
                    // stdout
                    cp.stdout?.on('data', (data: Buffer) => {
                        const output = data.toString();
                        outputBuffer += output;
                        try { sendEvent('stdout', { data: output }); } catch(e){}

                        // parse stats from accumulated buffer
                        try {
                            if (/Test Results Summary:|PASS|FAIL/i.test(output)) {
                                const passMatch = outputBuffer.match(/(\d+)\s+passed/i);
                                const failMatch = outputBuffer.match(/(\d+)\s+failed/i);
                                const totalMatch = outputBuffer.match(/Total:\s*(\d+)/i);
                                if (passMatch || failMatch || totalMatch) {
                                    const passed = passMatch ? parseInt(passMatch[1]) : 0;
                                    const failed = failMatch ? parseInt(failMatch[1]) : 0;
                                    const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;
                                    sendEvent('stats', { stats: { passed, failed, total } });
                                }
                            }
                        } catch (e) {}
                    });

                    // stderr
                    cp.stderr?.on('data', (data: Buffer) => {
                        try { sendEvent('stderr', { data: data.toString() }); } catch(e){}
                    });

                    // close
                    cp.on('close', (code: number) => {
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
                        } catch (e) {}
                        try { sendEvent('exit', { exitCode: code, success: code === 0, stats, message: code === 0 ? 'Test case executed successfully' : 'Test case execution failed' }); } catch(e){}
                        safeClose();
                    });

                    // error - if ENOENT, try fallback
                    cp.on('error', (err: any) => {
                        if (err && err.code === 'ENOENT') {
                            // attempt fallback to node
                            const fallback = tryFallbackToNode();
                            if (fallback) {
                                childProc = fallback;
                                attachHandlers(fallback);
                                return;
                            }
                        }
                        try { sendEvent('error', { error: err?.message || String(err), message: 'Failed to start test case execution' }); } catch(e){}
                        safeClose();
                    });
                };

                // Start runner: prefer local binary, then npx, then fallback to node+ts-node/register
                childProc = spawnRunner();
                if (!childProc) childProc = tryFallbackToNode();
                if (!childProc) {
                    // Nothing could be started — inform client and close
                    try { sendEvent('error', { error: 'NO_RUNNER', message: 'Could not start test runner (ts-node/npx/node unavailable)' }); } catch(e){}
                    safeClose();
                    return;
                }

                // attach handlers to whichever process we have
                attachHandlers(childProc);
            },
            cancel(reason) {
                // Called when the consumer disconnects / aborts the stream
                try {
                    console.log('SSE stream canceled by client', reason);
                } catch (e) {}
                try {
                    // kill child if still running
                    // childProc is closure-scoped; TypeScript wise it's accessible here because cancel is defined in same scope
                    // @ts-ignore
                    if (typeof childProc !== 'undefined' && childProc && !childProc.killed) {
                        try { childProc.kill(); } catch (e) {}
                    }
                } catch (e) {}
                // ensure stream closed flag is set
                try { /* nothing to set here; safeClose behavior is internal to start */ } catch (e) {}
            }
        });

        // If the incoming request supports AbortSignal, ensure we terminate the child process
        // promptly when the client aborts the request (defensive: request.signal may not be present in all runtimes).
        try {
            const anyReq = request as any;
            if (anyReq && anyReq.signal && typeof anyReq.signal.addEventListener === 'function') {
                try {
                    anyReq.signal.addEventListener('abort', () => {
                        try {
                            if (typeof childProc !== 'undefined' && childProc && !childProc.killed) {
                                try { childProc.kill(); } catch (e) {}
                            }
                        } catch (e) {}
                    });
                } catch (e) {
                    // ignore listener registration failures
                }
            }
        } catch (e) {}

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
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