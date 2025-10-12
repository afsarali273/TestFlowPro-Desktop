import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const frameworkPath = searchParams.get("path")

  if (!frameworkPath) {
    return NextResponse.json({
      isValid: false,
      message: "Framework path parameter is required",
    })
  }

  try {
    // Check if the path exists and is a directory
    const stats = await fs.stat(frameworkPath)
    if (!stats.isDirectory()) {
      return NextResponse.json({
        isValid: false,
        message: "Path exists but is not a directory",
      })
    }

    // Check for required files
    const runnerPath = path.join(frameworkPath, "src", "runner.ts")
    const packageJsonPath = path.join(frameworkPath, "package.json")

    let hasRunner = false
    let hasPackageJson = false

    try {
      await fs.access(runnerPath)
      hasRunner = true
    } catch {
      // runner.ts not found
    }

    try {
      await fs.access(packageJsonPath)
      hasPackageJson = true
    } catch {
      // package.json not found
    }

    if (!hasRunner) {
      return NextResponse.json({
        isValid: false,
        message: "Framework directory is missing src/runner.ts file",
        hasRunner,
        hasPackageJson,
      })
    }

    return NextResponse.json({
      isValid: true,
      message: "Framework directory is valid and ready for test execution",
      hasRunner,
      hasPackageJson,
    })
  } catch (error: any) {
    let message = "Framework path validation failed"

    if (error.code === "ENOENT") {
      message = "Framework directory does not exist"
    } else if (error.code === "EACCES") {
      message = "Permission denied - cannot access framework directory"
    }

    return NextResponse.json({
      isValid: false,
      message,
    })
  }
}
