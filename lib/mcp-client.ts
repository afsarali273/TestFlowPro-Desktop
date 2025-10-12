import { spawn, ChildProcess } from 'child_process'

export class MCPPlaywrightClient {
  private mcpProcess: ChildProcess | null = null
  private isConnected = false
  private messageId = 1

  async connect(): Promise<void> {
    try {
      this.mcpProcess = spawn('npx', ['playwright-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PLAYWRIGHT_HEADLESS: 'false' }
      })

      if (!this.mcpProcess.stdout || !this.mcpProcess.stdin) {
        throw new Error('Failed to create MCP process streams')
      }

      this.mcpProcess.stdout!.on('data', (data) => {
        console.log('MCP Response:', data.toString())
      })

      this.mcpProcess.stderr!.on('data', (data) => {
        console.error('MCP Error:', data.toString())
      })

      await this.initialize()
      this.isConnected = true

      console.log('✅ MCP Client connected to Playwright server')
    } catch (error) {
      console.error('❌ MCP connection failed:', error)
      throw error
    }
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
    if (!this.isConnected) {
      throw new Error('MCP client not connected')
    }

    try {
      const actions = this.parsePromptToActions(prompt)
      const results = []

      for (const action of actions) {
        console.log(`Executing: ${action.tool} with args:`, action.args)
        const result = await this.callTool(action.tool, action.args)
        results.push(result)
      }

      return results
    } catch (error) {
      console.error('❌ MCP execution failed:', error)
      throw error
    }
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
    const lines = prompt.split('\n').filter(line => line.trim())
    const actions = []
    let browserInitialized = false

    for (const line of lines) {
      const instruction = line.toLowerCase().trim()

      // Initialize browser first if URL found
      if ((instruction.includes('navigate') || instruction.includes('goto') || instruction.includes('http')) && !browserInitialized) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/)
        if (urlMatch) {
          actions.push({ tool: 'init-browser', args: { url: urlMatch[0] } })
          browserInitialized = true
        }
      }
      
      // Use execute-code for complex interactions
      else if (instruction.includes('search') || instruction.includes('type') || instruction.includes('fill')) {
        const text = this.extractText(line)
        const code = `async function run(page) {
  const searchInput = await page.locator('input[name="search"], #searchInput, [placeholder*="search"]').first()
  await searchInput.fill('${text}')
  return 'Filled search input with: ${text}'
}`
        actions.push({ tool: 'execute-code', args: { code } })
      }
      
      else if (instruction.includes('click')) {
        const code = `async function run(page) {
  const button = await page.locator('button[type="submit"], .search-button, [value="Search"]').first()
  await button.click()
  return 'Clicked search button'
}`
        actions.push({ tool: 'execute-code', args: { code } })
      }
      
      else if (instruction.includes('screenshot')) {
        actions.push({ tool: 'get-screenshot', args: {} })
      }
    }

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
    try {
      if (this.mcpProcess) {
        this.mcpProcess.kill()
        this.mcpProcess = null
      }
      
      this.isConnected = false
      console.log('✅ MCP Client disconnected')
    } catch (error) {
      console.error('❌ MCP disconnect error:', error)
    }
  }
}