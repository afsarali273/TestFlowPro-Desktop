import {type NextRequest, NextResponse} from "next/server"
import {promises as fs} from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const testSuitePath = searchParams.get("path")

  if (!testSuitePath) {
    console.error('❌ [API] No path parameter provided')
    return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
  }

  try {
    // Resolve to absolute path if it's relative and normalize for cross-platform compatibility
    const resolvedPath = path.normalize(path.isAbsolute(testSuitePath) ? testSuitePath : path.resolve(process.cwd(), testSuitePath))

    // Check if the directory exists
    const stats = await fs.stat(resolvedPath)
    if (!stats.isDirectory()) {
      console.error('❌ [API] Path is not a directory:', resolvedPath)
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 })
    }

    // Read all JSON files from the directory
    const testSuites = await loadTestSuitesFromDirectory(resolvedPath)

    return NextResponse.json(testSuites)
  } catch (error) {
    console.error("❌ [API] Error loading test suites:", error)
    return NextResponse.json({ error: `Failed to load test suites: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

async function loadTestSuitesFromDirectory(dirPath: string): Promise<any[]> {
  //console.log('📂 [loadTestSuitesFromDirectory] Processing directory:', dirPath)
  const testSuites: any[] = []
  const processedPaths = new Set<string>() // Track processed file paths to avoid duplicates

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    //console.log('📁 [loadTestSuitesFromDirectory] Found entries:', entries.length, entries.map(e => `${e.name} (${e.isDirectory() ? 'dir' : 'file'})`))

    for (const entry of entries) {
      const fullPath = path.normalize(path.join(dirPath, entry.name))
      //console.log('🔍 [loadTestSuitesFromDirectory] Processing:', fullPath)

      if (entry.isDirectory()) {
        //console.log('📁 [loadTestSuitesFromDirectory] Recursing into subdirectory:', fullPath)
        // Recursively load from subdirectories
        const subSuites = await loadTestSuitesFromDirectory(fullPath)
        //console.log('📊 [loadTestSuitesFromDirectory] Got', subSuites.length, 'suites from subdirectory')
        testSuites.push(...subSuites)
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        //console.log('📜 [loadTestSuitesFromDirectory] Processing JSON file:', entry.name)
        // Skip if we've already processed this file path
        if (processedPaths.has(fullPath)) {
          //console.log('⚠️ [loadTestSuitesFromDirectory] Skipping duplicate path:', fullPath)
          continue
        }
        processedPaths.add(fullPath)

        try {
          const fileContent = await fs.readFile(fullPath, "utf-8")
          const testSuite = JSON.parse(fileContent)
          //console.log('📊 [loadTestSuitesFromDirectory] Parsed suite:', testSuite.suiteName)

          // Generate a deterministic ID based on file path and suite name
          const pathHash = Buffer.from(fullPath)
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 8)
          const suiteName = testSuite.suiteName ? testSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_") : "unnamed"
          const uniqueId = `${suiteName}_${pathHash}`

          // Add metadata
          testSuite.id = uniqueId
          testSuite.filePath = fullPath
          testSuite.fileName = entry.name
          testSuite.lastModified = (await fs.stat(fullPath)).mtime

          // Validate basic structure
          if (testSuite.suiteName && testSuite.testCases) {
            testSuites.push(testSuite)
          } else {
            console.warn(`⚠️ [loadTestSuitesFromDirectory] Invalid test suite structure in file: ${fullPath}`, { suiteName: testSuite.suiteName, hasTestCases: !!testSuite.testCases })
          }
        } catch (parseError) {
          console.error(`❌ [loadTestSuitesFromDirectory] Error parsing JSON file ${fullPath}:`, parseError)
        }
      } else {
      }
    }
  } catch (error) {
    console.error(`❌ [loadTestSuitesFromDirectory] Error reading directory ${dirPath}:`, error)
  }

  // Remove any potential duplicates based on file path
  return testSuites.filter(
      (suite, index, self) => index === self.findIndex((s) => s.filePath === suite.filePath),
  )
}

function generateIdFromPath(filePath: string): string {
  // Generate a consistent ID based on the file path
  return Buffer.from(filePath)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const { testSuite, filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    // Normalize and ensure the directory exists
    const normalizedFilePath = path.normalize(filePath)
    const dirPath = path.dirname(normalizedFilePath)
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      console.error("Error creating directory:", error)
      return NextResponse.json({ error: "Failed to create directory" }, { status: 500 })
    }

    // Check if file already exists
    let fileExists = false
    try {
      await fs.access(normalizedFilePath)
      fileExists = true
    } catch {
      // File doesn't exist, which is fine for new files
    }

    // Write the test suite to the file
    await fs.writeFile(normalizedFilePath, JSON.stringify(testSuite, null, 2), "utf-8")

    return NextResponse.json({
      success: true,
      message: fileExists ? "Test suite updated successfully" : "Test suite created successfully",
      filePath: normalizedFilePath,
    })
  } catch (error) {
    console.error("Error saving test suite:", error)
    return NextResponse.json({ error: "Failed to save test suite" }, { status: 500 })
  }
}
