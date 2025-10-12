import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"

export async function POST(request: NextRequest) {
  try {
    const { frameworkPath, serviceName, suiteType, suiteName } = await request.json()

    if (!frameworkPath) {
      return NextResponse.json({ error: "Framework path is required" }, { status: 400 })
    }

    // Build the command arguments
    const args = ["ts-node", "src/runner.ts"]

    if (serviceName) {
      args.push(`--serviceName=${serviceName}`)
    }

    if (suiteType) {
      args.push(`--suiteType=${suiteType}`)
    }

    // Execute the command
    const result = await executeCommand("npx", args, frameworkPath)

    return NextResponse.json({
      success: true,
      output: result.output,
      exitCode: result.exitCode,
      command: `npx ${args.join(" ")}`,
      workingDirectory: frameworkPath,
    })
  } catch (error: any) {
    console.error("Test execution error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        output: error.output || "",
      },
      { status: 500 },
    )
  }
}

function executeCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{
  output: string
  exitCode: number
}> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    })

    let output = ""
    let errorOutput = ""

    process.stdout?.on("data", (data) => {
      output += data.toString()
    })

    process.stderr?.on("data", (data) => {
      errorOutput += data.toString()
    })

    process.on("close", (code) => {
      const fullOutput = output + (errorOutput ? `\n--- STDERR ---\n${errorOutput}` : "")

      if (code === 0) {
        resolve({
          output: fullOutput,
          exitCode: code || 0,
        })
      } else {
        reject({
          message: `Command failed with exit code ${code}`,
          output: fullOutput,
          exitCode: code || 1,
        })
      }
    })

    process.on("error", (error) => {
      reject({
        message: `Failed to start process: ${error.message}`,
        output: errorOutput,
        exitCode: -1,
      })
    })
  })
}
