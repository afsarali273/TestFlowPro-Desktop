import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const resultsPath = searchParams.get("path")

  if (!resultsPath) {
    return NextResponse.json({ error: "Results path parameter is required" }, { status: 400 })
  }

  try {
    // Check if the directory exists
    const stats = await fs.stat(resultsPath)
    if (!stats.isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 })
    }

    // Read all JSON files from the results directory
    const allResults = await loadAllResultsFromDirectory(resultsPath)

    return NextResponse.json(allResults)
  } catch (error) {
    console.error("Error loading test results:", error)
    return NextResponse.json({ error: "Failed to load test results from the specified path" }, { status: 500 })
  }
}

async function loadAllResultsFromDirectory(dirPath: string): Promise<any[]> {
  const results: any[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively load from subdirectories
        const subResults = await loadAllResultsFromDirectory(fullPath)
        results.push(...subResults)
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        try {
          const fileContent = await fs.readFile(fullPath, "utf-8")
          const resultData = JSON.parse(fileContent)

          // Validate that it's a test result file (has summary and results)
          if (resultData.summary && resultData.results) {
            // Add metadata
            resultData.fileName = entry.name
            resultData.filePath = fullPath
            resultData.lastModified = (await fs.stat(fullPath)).mtime.toISOString()

            results.push(resultData)
          } else {
            console.warn(`Invalid test result structure in file: ${fullPath}`)
          }
        } catch (parseError) {
          console.error(`Error parsing JSON file ${fullPath}:`, parseError)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }

  // Sort by last modified date (newest first)
  results.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

  return results
}
