import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import os from "os"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const currentPath = searchParams.get("path") || os.homedir()

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(currentPath, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Add parent directory option if not at root
    const parentPath = path.dirname(currentPath)
    if (parentPath !== currentPath) {
      directories.unshift({
        name: "..",
        path: parentPath,
      })
    }

    return NextResponse.json({
      currentPath,
      directories,
      parentPath: parentPath !== currentPath ? parentPath : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to browse directories", details: error.message }, { status: 500 })
  }
}
