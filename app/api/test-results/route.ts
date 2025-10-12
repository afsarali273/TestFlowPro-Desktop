import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const resultsPath = searchParams.get("path")
  const suiteName = searchParams.get("suiteName")

  if (!resultsPath) {
    return NextResponse.json({ error: "Results path parameter is required" }, { status: 400 })
  }

  try {
    let filePath: string

    if (suiteName) {
      // Look for specific suite results file
      const fileName = `${suiteName.replace(/\s+/g, "_")}_results.json`
      filePath = path.join(resultsPath, fileName)
    } else {
      return NextResponse.json({ error: "Suite name is required" }, { status: 400 })
    }

    // Check if the results file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "Results file not found" }, { status: 404 })
    }

    // Read and parse the results file
    const fileContent = await fs.readFile(filePath, "utf-8")
    const results = JSON.parse(fileContent)

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error loading test results:", error)
    return NextResponse.json({ error: "Failed to load test results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { results, filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    // Write the results to the file
    await fs.writeFile(filePath, JSON.stringify(results, null, 2), "utf-8")

    return NextResponse.json({ success: true, message: "Results saved successfully" })
  } catch (error) {
    console.error("Error saving test results:", error)
    return NextResponse.json({ error: "Failed to save test results" }, { status: 500 })
  }
}
