import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'

class MCPClient {
  private mcpProcess: ChildProcess | null = null
  private messageId = 1

  async connect(): Promise<void> {
    console.log('🚀 Starting MCP process...')
    this.mcpProcess = spawn('npx', ['playwright-mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PLAYWRIGHT_HEADLESS: 'false' }
    })

    if (!this.mcpProcess.stdout || !this.mcpProcess.stdin) {
      throw new Error('Failed to create MCP process streams')
    }

    this.mcpProcess.stdout.on('data', (data) => {
      console.log('📥 MCP Response:', data.toString())
    })

    this.mcpProcess.stderr.on('data', (data) => {
      console.log('❌ MCP Error:', data.toString())
    })

    console.log('🔧 Initializing MCP...')
    await this.initialize()
    console.log('✅ MCP connected successfully')
  }

  private async initialize(): Promise<void> {
    return new Promise((resolve) => {
      const initCommand = {
        jsonrpc: '2.0',
        id: this.messageId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'TestFlowPro', version: '1.0.0' }
        }
      }
      
      this.mcpProcess!.stdin!.write(JSON.stringify(initCommand) + '\n')
      
      setTimeout(() => {
        this.mcpProcess!.stdin!.write(JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        }) + '\n')
        resolve()
      }, 2000)
    })
  }

  async executePrompt(prompt: string): Promise<any> {
    console.log('📝 Executing prompt:', prompt)
    const actions = this.parsePromptToActions(prompt)
    console.log('🎯 Parsed actions:', actions)
    const results = []

    for (const action of actions) {
      console.log(`🔧 Executing tool: ${action.tool} with args:`, action.args)
      const result = await this.callTool(action.tool, action.args)
      console.log('📊 Tool result:', result)
      results.push(result)
    }

    console.log('✅ All actions completed. Results:', results)
    return results
  }

  private async callTool(name: string, args: any): Promise<any> {
    return new Promise((resolve) => {
      const command = {
        jsonrpc: '2.0',
        id: this.messageId++,
        method: 'tools/call',
        params: { name, arguments: args }
      }
      
      this.mcpProcess!.stdin!.write(JSON.stringify(command) + '\n')
      
      setTimeout(() => {
        resolve({ success: true, tool: name, args })
      }, 1000)
    })
  }

  private parsePromptToActions(prompt: string): Array<{tool: string, args: any}> {
    console.log('🔍 Parsing prompt:', prompt)
    const lines = prompt.split('\n').filter(line => line.trim())
    console.log('📄 Lines to process:', lines)
    const actions = []
    let browserInitialized = false

    for (const line of lines) {
      const instruction = line.toLowerCase().trim()
      console.log('🔎 Processing instruction:', instruction)

      if ((instruction.includes('open') || instruction.includes('navigate') || instruction.includes('goto') || instruction.includes('google.com')) && !browserInitialized) {
        let url = 'https://google.com'
        const urlMatch = line.match(/https?:\/\/[^\s]+/)
        if (urlMatch) {
          url = urlMatch[0]
        } else if (instruction.includes('google.com')) {
          url = 'https://google.com'
        }
        console.log('🌐 Adding init-browser action with URL:', url)
        actions.push({ tool: 'init-browser', args: { url } })
        // Add a small delay after browser init
        actions.push({ tool: 'get-context', args: {} })
        browserInitialized = true
      }
      
      else if (instruction.includes('search')) {
        const text = this.extractText(line)
        console.log('🔍 Adding search action with text:', text)
        const code = `async function run(page) {
  console.log('Searching for: ${text}');
  console.log('Page object:', typeof page);
  
  // Wait for page to be ready
  await page.waitForLoadState('networkidle');
  
  // Try multiple selectors for Google search
  const searchInput = await page.locator('textarea[name="q"], input[name="q"], input[title="Search"]').first();
  
  console.log('Found search input:', await searchInput.count());
  
  if (await searchInput.count() > 0) {
    await searchInput.click();
    await searchInput.fill('${text}');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);
    return 'Successfully searched for: ${text}';
  } else {
    return 'Could not find search input';
  }
}`
        actions.push({ tool: 'execute-code', args: { code } })
      }
      
      else if (instruction.includes('click')) {
        console.log('👆 Adding click action')
        const code = `async function run(page) {
  const button = await page.locator('button[type="submit"], .search-button, [value="Search"]').first();
  await button.click();
  return 'Clicked search button';
}`
        actions.push({ tool: 'execute-code', args: { code } })
      }
      
      else if (instruction.includes('screenshot')) {
        console.log('📸 Adding screenshot action')
        actions.push({ tool: 'get-screenshot', args: {} })
      }
      
      else if (instruction.includes('title')) {
        console.log('📄 Adding get title action')
        const code = `async function run(page) {
  const title = await page.title();
  console.log('Page title:', title);
  return title;
}`
        actions.push({ tool: 'execute-code', args: { code } })
      }
      
      else {
        console.log('❓ No action matched for instruction:', instruction)
      }
    }

    console.log('📋 Final actions array:', actions)
    return actions
  }

  private extractText(instruction: string): string {
    const quotedMatch = instruction.match(/["']([^"']+)["']/)
    if (quotedMatch) return quotedMatch[1]
    
    const searchMatch = instruction.match(/search\s+(?:for\s+)?(\w+)/i)
    if (searchMatch) return searchMatch[1]
    
    return 'test'
  }

  async disconnect(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill()
      this.mcpProcess = null
    }
  }
}

let mcpClient: MCPClient | null = null
let recordingSession: {
  isRecording: boolean
  actions: Array<any>
  startUrl?: string
  results: Array<any>
} = {
  isRecording: false,
  actions: [],
  results: []
}

export async function POST(request: NextRequest) {
  try {
    const { url, action, testSteps } = await request.json()

    if (action === 'start') {
      try {
        console.log('🎬 Starting MCP recording with prompt:', url)
        
        // Initialize MCP client
        console.log('🔧 Creating MCP client...')
        mcpClient = new MCPClient()
        await mcpClient.connect()
        
        // Execute prompt
        console.log('▶️ Executing prompt...')
        const results = await mcpClient.executePrompt(url)
        
        recordingSession = {
          isRecording: true,
          actions: parseNaturalLanguageSteps(url),
          startUrl: extractUrlFromPrompt(url),
          results: results
        }

        console.log('✅ MCP execution completed successfully')
        return NextResponse.json({ 
          success: true, 
          message: 'MCP automation executed successfully',
          results: results,
          generatedSteps: recordingSession.actions
        })
      } catch (error) {
        console.error('❌ MCP execution error:', error)
        return NextResponse.json({ 
          error: `MCP automation failed: ${error.message}`
        }, { status: 500 })
      }
    }

    if (action === 'export') {
      if (!recordingSession.isRecording) {
        return NextResponse.json({ 
          error: 'No active recording session' 
        }, { status: 400 })
      }

      if (mcpClient) {
        await mcpClient.disconnect()
        mcpClient = null
      }

      const testSuite = convertResultsToTestSuite(recordingSession.results, recordingSession.actions, recordingSession.startUrl)
      recordingSession.isRecording = false
      
      return NextResponse.json({ 
        success: true, 
        testSuite 
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function parseNaturalLanguageSteps(input: string) {
  const lines = input.split('\n').filter(line => line.trim())
  return lines.map((line, index) => ({
    id: `step-${index + 1}`,
    instruction: line.trim(),
    description: line.trim()
  }))
}

function extractUrlFromPrompt(prompt: string): string {
  const urlMatch = prompt.match(/https?:\/\/[^\s]+/)
  return urlMatch?.[0] || ''
}









function convertResultsToTestSuite(results: any[], actions: any[], startUrl?: string) {
  const uiSteps = actions.map((action, index) => {
    const result = results[index]
    const instruction = action.instruction.toLowerCase()
    
    if (instruction.includes('navigate') || instruction.includes('goto')) {
      return {
        keyword: 'goto',
        target: startUrl || 'https://example.com',
        description: action.instruction
      }
    }
    
    if (instruction.includes('search') || instruction.includes('type')) {
      return {
        keyword: 'type',
        locator: 'input[name="search"]',
        target: action.instruction.match(/search\s+(?:for\s+)?(\w+)/i)?.[1] || 'test',
        description: action.instruction
      }
    }
    
    if (instruction.includes('click')) {
      return {
        keyword: 'click',
        locator: 'button[type="submit"]',
        description: action.instruction
      }
    }
    
    if (instruction.includes('screenshot')) {
      return {
        keyword: 'screenshot',
        target: 'mcp-screenshot.png',
        description: action.instruction
      }
    }
    
    return {
      keyword: 'assertVisible',
      locator: 'body',
      description: action.instruction
    }
  })
  
  return {
    suiteName: 'MCP Generated UI Test Suite',
    baseUrl: startUrl || '',
    type: 'UI',
    tags: [
      'serviceName=@MCPGenerated',
      'suiteType=@automation'
    ],
    testCases: [{
      name: 'MCP Automated Test Case',
      testData: [{
        name: 'Browser Automation via MCP',
        uiSteps: uiSteps,
        mcpMetadata: {
          recordedAt: new Date().toISOString(),
          totalSteps: actions.length,
          executionResults: results
        }
      }]
    }]
  }
}