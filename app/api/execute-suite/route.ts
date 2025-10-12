import type { NextRequest } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { frameworkPath, suiteFilePath } = await request.json()

    if (!frameworkPath) {
      return new Response("Framework path is required", { status: 400 })
    }

    if (!suiteFilePath) {
      return new Response("Suite file path is required", { status: 400 })
    }

    // Build the command arguments - use the framework path directly with runner.ts
    const normalizedFrameworkPath = path.normalize(frameworkPath)
    const normalizedSuiteFilePath = path.normalize(suiteFilePath)
    const runnerPath = path.join(normalizedFrameworkPath, "src/runner.ts")
    const args = ["ts-node", runnerPath, "--file", normalizedSuiteFilePath]

    // Create a readable stream for real-time output
    const stream = new ReadableStream({
      start(controller) {
        const process = spawn("npx", args, {
          cwd: normalizedFrameworkPath,
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        })

        // Send initial command info
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: "command",
              command: `npx ${args.join(" ")}`,
              workingDirectory: normalizedFrameworkPath,
              suiteFile: normalizedSuiteFilePath,
            })}\n\n`,
          ),
        )

        let outputBuffer = ''
        
        process.stdout?.on("data", (data) => {
          const output = data.toString()
          outputBuffer += output
          
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "stdout",
                data: output,
              })}\n\n`,
            ),
          )
          
          // Try to parse test results from output
          try {
            const lines = output.split('\n')
            for (const line of lines) {
              if (line.includes('Test Results Summary:') || line.includes('PASS') || line.includes('FAIL')) {
                // Parse test statistics from output
                const passMatch = outputBuffer.match(/(\d+)\s+passed/i)
                const failMatch = outputBuffer.match(/(\d+)\s+failed/i)
                const totalMatch = outputBuffer.match(/Total:\s*(\d+)/i)
                
                if (passMatch || failMatch || totalMatch) {
                  const passed = passMatch ? parseInt(passMatch[1]) : 0
                  const failed = failMatch ? parseInt(failMatch[1]) : 0
                  const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed
                  
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({
                        type: "stats",
                        stats: { passed, failed, total }
                      })}\n\n`,
                    ),
                  )
                }
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        })

        process.stderr?.on("data", (data) => {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "stderr",
                data: data.toString(),
              })}\n\n`,
            ),
          )
        })

        process.on("close", (code) => {
          // Parse final stats from complete output buffer
          let stats = null
          try {
            const passMatch = outputBuffer.match(/(\d+)\s+passed/i)
            const failMatch = outputBuffer.match(/(\d+)\s+failed/i)
            const totalMatch = outputBuffer.match(/Total:\s*(\d+)/i)
            
            if (passMatch || failMatch || totalMatch) {
              const passed = passMatch ? parseInt(passMatch[1]) : 0
              const failed = failMatch ? parseInt(failMatch[1]) : 0
              const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed
              stats = { passed, failed, total }
            }
          } catch (e) {
            // Ignore parsing errors
          }
          
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "exit",
                exitCode: code,
                success: code === 0,
                stats: stats
              })}\n\n`,
            ),
          )
          controller.close()
        })

        process.on("error", (error) => {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error.message,
              })}\n\n`,
            ),
          )
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
