import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const testPath = searchParams.get("path")

  if (!testPath) {
    return NextResponse.json({
      isValid: false,
      message: "Path parameter is required",
    })
  }

  try {
    // Normalize path for cross-platform compatibility
    const normalizedPath = path.normalize(testPath)
    
    // Check if the path exists
    const stats = await fs.stat(normalizedPath)

    if (!stats.isDirectory()) {
      return NextResponse.json({
        isValid: false,
        message: "Path exists but is not a directory",
      })
    }

    // Count JSON files in the directory
    const fileCount = await countJsonFiles(normalizedPath)

    return NextResponse.json({
      isValid: true,
      message: fileCount > 0 ? `Directory is valid and accessible` : "Directory is valid but contains no JSON files",
      fileCount,
    })
  } catch (error: any) {
    let message = "Path validation failed"

    if (error.code === "ENOENT") {
      message = "Directory does not exist"
    } else if (error.code === "EACCES") {
      message = "Permission denied - cannot access directory"
    } else if (error.code === "ENOTDIR") {
      message = "Path exists but is not a directory"
    }

    return NextResponse.json({
      isValid: false,
      message,
    })
  }
}

async function countJsonFiles(dirPath: string): Promise<number> {
  let count = 0

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.normalize(path.join(dirPath, entry.name))

      if (entry.isDirectory()) {
        // Recursively count in subdirectories
        count += await countJsonFiles(fullPath)
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // Validate that it's a proper JSON file
        try {
          const content = await fs.readFile(fullPath, "utf-8")
          JSON.parse(content)
          count++
        } catch {
          // Skip invalid JSON files
        }
      }
    }
  } catch (error) {
    console.error(`Error counting JSON files in ${dirPath}:`, error)
  }

  return count
}
