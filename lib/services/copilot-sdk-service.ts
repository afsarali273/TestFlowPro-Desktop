import { readFile } from 'fs/promises';
import path from 'path';

interface CopilotChatOptions {
  message: string;
  type: string;
  temperature?: number;
  model?: string;
  agentMode?: boolean;
  mcpTools?: any[];
}

interface CopilotResponse {
  response: string;
  metadata?: {
    model: string;
    usage?: any;
    id?: string;
    toolCallsExecuted?: number;
    executionSteps?: any[];
  };
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

const GITHUB_CLIENT_ID = 'Iv1.b507a08c87ecfe98';

/**
 * GitHub Copilot SDK Service
 * Maintains RAG (Retrieval-Augmented Generation) architecture
 * Uses official @github/copilot-sdk with automatic authentication
 *
 * NEW: Automatic authentication flow without external token files
 * - Device code flow for easy authentication
 * - In-memory token caching
 * - Automatic token refresh
 * - Fallback to file-based tokens if needed
 */
export class CopilotSDKService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private authInProgress: boolean = false;

  /**
   * Initialize Copilot Client with automatic authentication
   * NEW: Will auto-authenticate if no valid token exists
   * Also checks existing GitHub auth service tokens
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing valid token first (from memory only)
      if (!this.token || !this.isTokenValid()) {
        // Try to get token from existing GitHub auth service
        console.log('Checking for existing GitHub auth token...');
        const existingToken = await this.getTokenFromGitHubAuthService();

        if (existingToken) {
          console.log('✅ Using existing GitHub auth token');
          this.token = existingToken;
          this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);

          // Try to exchange for Copilot token
          const copilotToken = await this.getCopilotTokenFromOAuth(existingToken);
          if (copilotToken) {
            this.token = copilotToken;
            console.log('✅ Copilot token obtained from existing auth');
          }
        } else {
          // Auto-authenticate if no token
          console.log('No valid token found, starting auto-authentication...');
          await this.autoAuthenticate();
        }
      }

      console.log('✅ Copilot SDK service initialized');
    } catch (error) {
      console.error('Failed to initialize Copilot SDK service:', error);
      throw new Error(`Failed to initialize Copilot Client: ${(error as Error).message}`);
    }
  }

  /**
   * Check if current token is valid
   */
  private isTokenValid(): boolean {
    return !!(this.tokenExpiry && Date.now() < this.tokenExpiry);
  }

  /**
   * NEW: Get token from existing GitHub auth service
   */
  private async getTokenFromGitHubAuthService(): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:3000/api/github-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getValidToken' })
      });

      if (response.ok) {
        const data = await response.json();
        return data.token || null;
      }
    } catch (error) {
      console.log('No existing GitHub auth token found');
    }
    return null;
  }

  /**
   * NEW: Automatic authentication flow
   * Uses GitHub device code flow for easy authentication
   * No manual token management required!
   * Returns auth info for UI display instead of logging
   */
  async autoAuthenticate(): Promise<{ userCode: string; verificationUri: string }> {
    if (this.authInProgress) {
      throw new Error('Authentication already in progress');
    }

    try {
      this.authInProgress = true;

      // Step 1: Get device code
      const deviceCodeData = await this.getDeviceCode();

      // Return immediately for UI to display
      // Note: This doesn't complete authentication, just starts it
      return {
        userCode: deviceCodeData.user_code,
        verificationUri: deviceCodeData.verification_uri
      };
    } catch (error) {
      throw error;
    } finally {
      this.authInProgress = false;
    }
  }

  /**
   * NEW: Complete authentication by polling for token
   * Should be called after user has authorized
   */
  async completeAuthentication(deviceCode: string, interval: number = 5, expiresIn: number = 900): Promise<boolean> {
    try {
      // Poll for token
      const token = await this.pollForToken(deviceCode, interval, expiresIn);

      if (token) {
        this.token = token;
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        // Exchange OAuth token for Copilot token
        const copilotToken = await this.getCopilotTokenFromOAuth(token);
        if (copilotToken) {
          this.token = copilotToken;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Authentication completion failed:', error);
      return false;
    }
  }

  /**
   * NEW: Exchange OAuth token for GitHub Copilot token
   */
  private async getCopilotTokenFromOAuth(oauthToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
        method: 'GET',
        headers: {
          'Authorization': `token ${oauthToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to get Copilot token:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return data.token || null;
    } catch (error) {
      console.error('Error exchanging for Copilot token:', error);
      return null;
    }
  }

  /**
   * NEW: Start authentication and return device code info
   * Returns all info needed for UI display and polling
   */
  async startAuthentication(): Promise<{ userCode: string; verificationUri: string; deviceCode: string; interval: number; expiresIn: number }> {
    const deviceCodeData = await this.getDeviceCode();

    return {
      userCode: deviceCodeData.user_code,
      verificationUri: deviceCodeData.verification_uri,
      deviceCode: deviceCodeData.device_code,
      interval: deviceCodeData.interval,
      expiresIn: deviceCodeData.expires_in
    };
  }

  /**
   * NEW: Get device code for authentication
   */
  private async getDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        scope: 'read:user copilot'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get device code from GitHub');
    }

    return await response.json();
  }

  /**
   * NEW: Poll for access token after device code authorization
   */
  private async pollForToken(
    deviceCode: string,
    interval: number = 5,
    expiresIn: number = 900
  ): Promise<string> {
    const maxAttempts = Math.floor(expiresIn / interval);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));

      try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });

        const data = await response.json();

        if (data.error) {
          if (data.error === 'authorization_pending') {
            console.log(`⏳ Waiting for authorization... (${attempt + 1}/${maxAttempts})`);
            continue;
          }
          if (data.error === 'slow_down') {
            interval = interval + 5;
            continue;
          }
          throw new Error(data.error_description || data.error);
        }

        if (data.access_token) {
          return data.access_token;
        }
      } catch (error: any) {
        if (error.message.includes('authorization_pending')) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Authentication timed out. Please try again.');
  }

  /**
   * NEW: Convert MCP tools to OpenAI function format
   */
  private async getMCPToolsAsFunctions(agentMode: boolean = false): Promise<any[]> {
    console.log(`🔧 getMCPToolsAsFunctions called with agentMode: ${agentMode}`);

    if (!agentMode) {
      console.log('⚠️ Agent Mode is OFF - not loading tools');
      return [];
    }

    try {
      console.log('📡 Fetching MCP tools from API...');
      const response = await fetch('http://localhost:3000/api/mcp-servers?action=list-tools');
      if (response.ok) {
        const data = await response.json();
        const tools = data.tools || [];

        console.log(`✅ Fetched ${tools.length} MCP tools`);

        if (tools.length === 0) {
          console.warn('⚠️ No MCP tools available');
          return [];
        }

        // Convert MCP tools to OpenAI function format
        const functions = tools.map((tool: any) => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description || `Execute ${tool.name} from ${tool.server}`,
            parameters: tool.inputSchema || { type: 'object', properties: {} }
          }
        }));

        console.log(`🔄 Converted ${functions.length} tools to OpenAI function format`);
        console.log(`📋 Function names:`, functions.map((f: any) => f.function.name).slice(0, 10).join(', ') + '...');

        return functions;
      } else {
        console.error(`❌ Failed to fetch MCP tools: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to get MCP tools as functions:', error);
    }
    return [];
  }

  /**
   * NEW: Execute MCP tool
   */
  private async executeMCPTool(toolName: string, args: any): Promise<string> {
    try {
      // Find which server has this tool
      const toolsResponse = await fetch('http://localhost:3000/api/mcp-servers?action=list-tools');
      const toolsData = await toolsResponse.json();
      const tool = toolsData.tools?.find((t: any) => t.name === toolName);

      if (!tool) {
        return `Error: Tool ${toolName} not found`;
      }

      console.log(`🔧 Executing MCP tool: ${toolName} on server: ${tool.server}`);

      // Execute the tool via API
      const response = await fetch('http://localhost:3000/api/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-tool',
          serverId: tool.server,
          toolName: toolName,
          args: args
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Tool executed successfully:`, result.result);
        // Extract text content from MCP response
        if (result.result?.content) {
          return result.result.content.map((c: any) => c.text).join('\n');
        }
        return JSON.stringify(result.result);
      } else {
        return `Error: ${result.error}`;
      }
    } catch (error: any) {
      console.error(`❌ Failed to execute tool ${toolName}:`, error);
      return `Error executing ${toolName}: ${error.message}`;
    }
  }

  /**
   * NEW: Get available MCP tools for AI context
   */
  private async getMCPToolsContext(agentMode: boolean = false): Promise<string> {
    try {
      const response = await fetch('http://localhost:3000/api/mcp-servers?action=list-tools');
      if (response.ok) {
        const data = await response.json();
        const tools = data.tools || [];

        if (tools.length === 0) return '';

        let context = '\n\n=== AVAILABLE MCP TOOLS ===\n';

        if (agentMode) {
          context += '🤖 AGENT MODE ENABLED: You MUST actively use these tools to complete tasks!\n\n';
          context += 'INSTRUCTIONS:\n';
          context += '- When the user asks you to do something, USE THE TOOLS to do it\n';
          context += '- Don\'t just suggest - EXECUTE the actions using available tools\n';
          context += '- For browser tasks, use Playwright tools\n';
          context += '- For file operations, use TestFlowPro tools\n';
          context += '- For web content, use Fetch tools\n';
          context += '- Explain what you\'re doing as you use each tool\n\n';
        } else {
          context += '💬 ASK MODE: Provide guidance and suggestions.\n';
          context += 'You can mention these tools are available but don\'t execute them.\n\n';
        }

        context += 'Available Tools:\n';
        tools.forEach((tool: any) => {
          context += `- ${tool.name} (${tool.server}): ${tool.description}\n`;
        });

        if (agentMode) {
          context += '\n⚡ Remember: In Agent Mode, you should USE these tools, not just talk about them!\n';
        }

        return context;
      }
    } catch (error) {
      // MCP tools not available, continue without them
    }
    return '';
  }

  /**
   * Send chat message with RAG context
   * Maintains existing RAG architecture for knowledge base integration
   * Uses direct Copilot API with enhanced error handling
   * NEW: Auto-authenticates if token is missing or expired
   * NEW: Includes MCP tools context
   * NEW: Supports function calling in Agent Mode
   */
  async chat(options: CopilotChatOptions): Promise<CopilotResponse> {
    // Auto-initialize if not done yet or token expired
    if (!this.token || !this.isTokenValid()) {
      await this.initialize();
    }

    // If still no token after initialization, authentication is needed
    if (!this.token) {
      throw new Error('No valid token. Please authenticate.');
    }

    // Get RAG context from knowledge base (maintains existing architecture)
    const context = await this.getKnowledgeBaseContext(options.type, options.message);

    // Get MCP tools context (enhanced in Agent Mode)
    const mcpContext = await this.getMCPToolsContext(options.agentMode);

    // Build system prompt with RAG context and MCP tools
    const systemPrompt = this.getSystemPrompt(options.type, context + mcpContext);

    // Get MCP tools as functions (only in Agent Mode)
    const tools = await this.getMCPToolsAsFunctions(options.agentMode);

    console.log(`🤖 Agent Mode: ${options.agentMode}, Tools available: ${tools.length}`);

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: options.message
        }
      ];

      // Make initial API call
      const requestBody: any = {
        messages,
        model: options.model || 'gpt-4o',
        temperature: options.temperature || 0.7,
        max_tokens: 4096,
        top_p: 0.95,
        n: 1,
        stream: false
      };

      // Add tools if in Agent Mode
      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto'; // Let AI decide when to use tools
        console.log(`✅ Added ${tools.length} tools to API request with tool_choice: auto`);
      } else {
        console.log(`⚠️ No tools to add to API request`);
      }

      let response = await fetch('https://api.githubcopilot.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Editor-Version': 'vscode/1.96.0',
          'Editor-Plugin-Version': 'copilot-chat/0.26.7',
          'User-Agent': 'GitHubCopilotChat/0.26.7',
          'Copilot-Integration-Id': 'vscode-chat',
          'Accept': 'application/json',
          'X-Request-Id': this.generateRequestId(),
          'Vscode-Sessionid': this.generateSessionId(),
          'Vscode-Machineid': this.generateMachineId(),
          'Openai-Organization': 'github-copilot',
          'Openai-Intent': 'conversation-panel'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Copilot API error: ${response.status} ${response.statusText}`);
      }

      let data = await response.json();
      let assistantMessage = data.choices?.[0]?.message;

      // Handle function/tool calls (Agent Mode)
      let toolCallsExecuted = 0;
      const maxToolCalls = 10; // Prevent infinite loops
      const executionSteps: any[] = [];

      while (assistantMessage?.tool_calls && toolCallsExecuted < maxToolCalls) {
        console.log(`🔧 AI wants to call ${assistantMessage.tool_calls.length} tool(s)`);

        // Add assistant message with tool calls to conversation
        messages.push(assistantMessage);

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

          console.log(`📞 Calling tool: ${functionName}`, functionArgs);

          // Create execution step
          const stepId = `step-${Date.now()}-${toolCallsExecuted}`;
          const executionStep: any = {
            id: stepId,
            toolName: functionName,
            action: this.extractAction(functionName),
            locator: this.extractLocator(functionArgs),
            value: this.extractValue(functionArgs),
            status: 'running',
            timestamp: new Date(),
            javaCode: '' // Will be updated after tool execution
          };

          executionSteps.push(executionStep);

          // Execute the MCP tool
          const toolResult = await this.executeMCPTool(functionName, functionArgs);

          // Update step with result
          executionStep.status = toolResult.includes('Error') ? 'error' : 'success';
          executionStep.result = toolResult.substring(0, 500); // Shorter excerpt for UI

          // Extract and convert actual Playwright code to Java from the tool result
          executionStep.javaCode = this.extractJavaCodeFromMCPResult(functionName, functionArgs, toolResult);

          // Truncate tool result to prevent token limit issues
          const truncatedResult = toolResult.length > 2000
            ? toolResult.substring(0, 2000) + '\n... (truncated, result was too long)'
            : toolResult;

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: truncatedResult
          });

          toolCallsExecuted++;
        }

        // Keep only recent messages to avoid token limits (last 10 messages)
        const recentMessages = messages.slice(-10);

        // Make another API call with tool results
        response = await fetch('https://api.githubcopilot.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Editor-Version': 'vscode/1.96.0',
            'Editor-Plugin-Version': 'copilot-chat/0.26.7',
            'User-Agent': 'GitHubCopilotChat/0.26.7',
            'Copilot-Integration-Id': 'vscode-chat',
            'Accept': 'application/json',
            'X-Request-Id': this.generateRequestId(),
            'Vscode-Sessionid': this.generateSessionId(),
            'Vscode-Machineid': this.generateMachineId(),
            'Openai-Organization': 'github-copilot',
            'Openai-Intent': 'conversation-panel'
          },
          body: JSON.stringify({
            messages: recentMessages,
            model: options.model || 'gpt-4o',
            temperature: options.temperature || 0.7,
            max_tokens: 4096,
            tools: tools,
            tool_choice: 'auto'
          })
        });

        if (!response.ok) {
          throw new Error(`Copilot API error: ${response.status} ${response.statusText}`);
        }

        data = await response.json();
        assistantMessage = data.choices?.[0]?.message;
      }

      const content = assistantMessage?.content || 'No response generated';

      console.log(`✅ Chat completed after ${toolCallsExecuted} tool call(s)`);

      return {
        response: content,
        metadata: {
          model: data.model,
          usage: data.usage,
          id: data.id,
          toolCallsExecuted,
          executionSteps
        }
      };
    } catch (error: any) {
      throw new Error(`Copilot chat error: ${error.message}`);
    }
  }

  /**
   * Stream chat responses with RAG context
   * Maintains RAG architecture with streaming support
   */
  async *chatStream(options: CopilotChatOptions): AsyncGenerator<string, void, unknown> {
    // Auto-initialize if not done yet or token expired
    if (!this.token || !this.isTokenValid()) {
      await this.initialize();
    }

    const context = await this.getKnowledgeBaseContext(options.type, options.message);
    const systemPrompt = this.getSystemPrompt(options.type, context);

    try {
      const response = await fetch('https://api.githubcopilot.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Editor-Version': 'vscode/1.96.0',
          'Editor-Plugin-Version': 'copilot-chat/0.26.7',
          'User-Agent': 'GitHubCopilotChat/0.26.7',
          'Copilot-Integration-Id': 'vscode-chat',
          'Accept': 'text/event-stream',
          'X-Request-Id': this.generateRequestId(),
          'Vscode-Sessionid': this.generateSessionId(),
          'Vscode-Machineid': this.generateMachineId()
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: options.message
            }
          ],
          model: options.model || 'gpt-4o',
          temperature: options.temperature || 0.7,
          max_tokens: 4096,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Copilot API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      throw new Error(`Copilot stream error: ${error.message}`);
    }
  }

  // Helper methods for request headers
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private generateMachineId(): string {
    return `mach-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Extract action from tool name for UI display
   */
  private extractAction(toolName: string): string {
    // Map tool names to human-readable actions
    const actionMap: Record<string, string> = {
      'browser_navigate': 'Navigate',
      'browser_click': 'Click',
      'browser_fill_form': 'Fill Form',
      'browser_type': 'Type Text',
      'browser_snapshot': 'Take Snapshot',
      'browser_wait_for': 'Wait',
      'read_file': 'Read File',
      'write_file': 'Write File',
      'execute_command': 'Execute Command',
      'browser_evaluate': 'Run JavaScript',
      'browser_select_option': 'Select Option',
      'browser_hover': 'Hover',
      'browser_drag': 'Drag',
      'browser_press_key': 'Press Key'
    };

    return actionMap[toolName] || toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Extract locator from function arguments
   */
  private extractLocator(args: any): string | undefined {
    if (args.selector) return args.selector;
    if (args.element) return args.element;
    if (args.ref) return args.ref;
    if (args.locator) return args.locator;
    if (args.path) return args.path;
    if (args.url) return args.url;
    return undefined;
  }

  /**
   * Extract value from function arguments
   */
  private extractValue(args: any): string | undefined {
    if (args.text) return args.text;
    if (args.value) return args.value;
    if (args.values) return JSON.stringify(args.values);
    if (args.command) return args.command;
    if (args.content) return args.content.substring(0, 100);
    return undefined;
  }

  /**
   * Extract locator information from Playwright snapshot result
   * Parses the snapshot YAML to find element properties like role, text, placeholder, etc.
   */
  private extractLocatorFromSnapshot(snapshotContent: string): Record<string, string> {
    const locatorInfo: Record<string, string> = {};

    // Extract role if present
    const roleMatch = snapshotContent.match(/role[=:]\s*['"]([\w-]+)['"]/i);
    if (roleMatch) locatorInfo.role = roleMatch[1];

    // Extract placeholder text
    const placeholderMatch = snapshotContent.match(/placeholder[=:]\s*['"](.*?)['"]/i);
    if (placeholderMatch) locatorInfo.placeholder = placeholderMatch[1];

    // Extract visible text (common pattern in snapshots)
    const textMatch = snapshotContent.match(/(?:button|link|text)\s+"([^"]+)"/);
    if (textMatch) locatorInfo.text = textMatch[1];

    // Extract name attribute
    const nameMatch = snapshotContent.match(/name[=:]\s*['"](.*?)['"]/i);
    if (nameMatch) locatorInfo.name = nameMatch[1];

    // Extract label text
    const labelMatch = snapshotContent.match(/label[=:]\s*['"](.*?)['"]/i);
    if (labelMatch) locatorInfo.label = labelMatch[1];

    // Extract data-testid
    const testIdMatch = snapshotContent.match(/data-testid[=:]\s*['"](.*?)['"]/i);
    if (testIdMatch) locatorInfo.testId = testIdMatch[1];

    // Extract alt text for images
    const altMatch = snapshotContent.match(/alt[=:]\s*['"](.*?)['"]/i);
    if (altMatch) locatorInfo.alt = altMatch[1];

    // Extract title attribute
    const titleMatch = snapshotContent.match(/title[=:]\s*['"](.*?)['"]/i);
    if (titleMatch) locatorInfo.title = titleMatch[1];

    return locatorInfo;
  }

  /**
   * Convert snapshot reference or arguments to proper Playwright Java locator strategy
   * Uses official Playwright recommended locator methods: getByRole, getByPlaceholder, getByText, getByLabel, etc.
   * Enhanced to generate code even with limited information from MCP args and snapshot data
   */
  private convertToPlaywrightLocator(args: any, toolName: string): string {
    // First, try to extract locator info from snapshot if available
    let snapshotInfo: Record<string, string> = {};
    if (args.snapshotContent) {
      snapshotInfo = this.extractLocatorFromSnapshot(args.snapshotContent);
      // Merge snapshot info with args
      args = { ...snapshotInfo, ...args };
    }

    // For button/link clicks - try multiple strategies
    if (toolName === 'browser_click') {
      // If we have a name or button text
      if (args.name) {
        return `page.getByRole("button", new Locator.GetByRoleOptions().setName(Pattern.compile("${this.escapeRegex(args.name)}", Pattern.CASE_INSENSITIVE)))`;
      }
      if (args.text) {
        return `page.getByText(Pattern.compile("${this.escapeRegex(args.text)}", Pattern.CASE_INSENSITIVE))`;
      }
      // If it's a close/dismiss button - common pattern
      if (args.element?.name?.includes('close') || args.element?.text?.includes('×') || args.text?.includes('close')) {
        return `page.getByRole("button", new Locator.GetByRoleOptions().setName(Pattern.compile("close|×|dismiss|skip|back", Pattern.CASE_INSENSITIVE)))`;
      }
      // Try generic button role
      if (args.role === 'button' || toolName === 'browser_click') {
        return `page.locator("button")`;
      }
    }

    // For form filling with multiple strategies
    if (toolName === 'browser_fill_form' || toolName === 'browser_type') {
      // Placeholder text is most reliable
      if (args.placeholder) {
        return `page.getByPlaceholder("${this.escapeJavaString(args.placeholder)}")`;
      }
      // Try label
      if (args.label) {
        return `page.getByLabel("${this.escapeJavaString(args.label)}")`;
      }
      // Try name attribute
      if (args.name) {
        return `page.locator("input[name='${args.name}']")`;
      }
      // Try data attributes
      if (args.testId) {
        return `page.getByTestId("${args.testId}")`;
      }
      // Generic input
      return `page.locator("input[type='text']")`;
    }

    // For text-based searches
    if (args.text && args.text.length > 0) {
      return `page.getByText(Pattern.compile("${this.escapeRegex(args.text)}", Pattern.CASE_INSENSITIVE))`;
    }

    // For elements with specific text content
    if (args.element?.text) {
      return `page.getByText(Pattern.compile("${this.escapeRegex(args.element.text)}", Pattern.CASE_INSENSITIVE))`;
    }

    // For labeled form fields
    if (args.label) {
      return `page.getByLabel("${this.escapeJavaString(args.label)}")`;
    }

    // For role-based locators (standard approach)
    if (args.role) {
      return `page.getByRole("${args.role}"${args.name ? `, new Locator.GetByRoleOptions().setName("${this.escapeJavaString(args.name)}")` : ''})`;
    }

    // For test IDs (recommended for automation)
    if (args.testId) {
      return `page.getByTestId("${args.testId}")`;
    }

    // For alt text (images)
    if (args.alt) {
      return `page.getByAltText("${this.escapeJavaString(args.alt)}")`;
    }

    // For title attribute
    if (args.title) {
      return `page.getByTitle("${this.escapeJavaString(args.title)}")`;
    }

    // For CSS selectors
    if (args.selector) {
      return `page.locator("${args.selector}")`;
    }

    // For placeholder-based searches (common in search boxes)
    if (toolName === 'browser_fill_form' && !args.placeholder && !args.name) {
      return `page.locator("input[placeholder*='Search']")`;
    }

    // Last resort - use ref with better fallback
    if (args.ref) {
      return `page.locator("${args.ref}") // TODO: Replace snapshot ref with proper locator`;
    }

    // Default fallback based on tool
    if (toolName === 'browser_click') {
      return `page.locator("button")`;
    }
    if (toolName === 'browser_fill_form' || toolName === 'browser_type') {
      return `page.locator("input")`;
    }

    return `page.locator("element") // Unable to determine locator`;
  }

  /**
   * Escape string for Java code
   */
  private escapeJavaString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Escape string for regex pattern in Java
   */
  private escapeRegex(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\./g, '\\.')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\*/g, '\\*')
      .replace(/\+/g, '\\+')
      .replace(/\?/g, '\\?')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\|/g, '\\|');
  }

  /**
   * Extract Java code from MCP tool result
   * Parses the actual Playwright JavaScript code executed and converts it to Java
   */
  private extractJavaCodeFromMCPResult(toolName: string, args: any, result: string): string {
    // Skip snapshot and evaluate operations - they're for inspection, not automation
    if (toolName === 'browser_snapshot') {
      return '// Page snapshot taken for inspection';
    }

    if (toolName === 'browser_evaluate' && result.includes('### Result')) {
      // This is a check/verification, not an action
      return '// Verified element exists on page';
    }

    // Extract the actual Playwright code that was executed from the result
    const codeMatch = result.match(/```(?:js|javascript)\n([\s\S]*?)\n```/);

    if (codeMatch && codeMatch[1]) {
      const executedCode = codeMatch[1].trim();
      return this.convertPlaywrightJSToJava(executedCode);
    }

    // Fallback to generating from tool name and args
    return this.generateJavaCode(toolName, args);
  }

  /**
   * Convert Playwright JavaScript code to Java syntax
   */
  private convertPlaywrightJSToJava(jsCode: string): string {
    let javaCode = jsCode;

    // Remove 'await' keyword
    javaCode = javaCode.replace(/await\s+/g, '');

    // Convert page.getByRole() - JavaScript to Java syntax
    javaCode = javaCode.replace(
      /page\.getByRole\('(\w+)',\s*\{\s*name:\s*'([^']+)'\s*\}\)/g,
      (match, role, name) => {
        return `page.getByRole("${role}", new Page.GetByRoleOptions().setName("${this.escapeJavaString(name)}"))`;
      }
    );

    // Convert page.getByRole() with Pattern
    javaCode = javaCode.replace(
      /page\.getByRole\('(\w+)',\s*\{\s*name:\s*\/([^\/]+)\/i?\s*\}\)/g,
      (match, role, pattern) => {
        return `page.getByRole("${role}", new Page.GetByRoleOptions().setName(Pattern.compile("${this.escapeJavaString(pattern)}", Pattern.CASE_INSENSITIVE)))`;
      }
    );

    // Convert page.getByPlaceholder()
    javaCode = javaCode.replace(
      /page\.getByPlaceholder\('([^']+)'\)/g,
      (match, placeholder) => `page.getByPlaceholder("${this.escapeJavaString(placeholder)}")`
    );

    // Convert page.getByText()
    javaCode = javaCode.replace(
      /page\.getByText\('([^']+)'\)/g,
      (match, text) => `page.getByText("${this.escapeJavaString(text)}")`
    );

    // Convert page.getByLabel()
    javaCode = javaCode.replace(
      /page\.getByLabel\('([^']+)'\)/g,
      (match, label) => `page.getByLabel("${this.escapeJavaString(label)}")`
    );

    // Convert page.locator()
    javaCode = javaCode.replace(
      /page\.locator\('([^']+)'\)/g,
      (match, selector) => `page.locator("${this.escapeJavaString(selector)}")`
    );

    // Convert .fill()
    javaCode = javaCode.replace(
      /\.fill\('([^']*)'\)/g,
      (match, value) => `.fill("${this.escapeJavaString(value)}")`
    );

    // Convert .pressSequentially() to .fill() in Java (Playwright Java uses fill)
    javaCode = javaCode.replace(
      /\.pressSequentially\('([^']*)'\)/g,
      (match, value) => `.fill("${this.escapeJavaString(value)}")`
    );

    // Convert .press()
    javaCode = javaCode.replace(
      /\.press\('([^']+)'\)/g,
      (match, key) => `.press("${key}")`
    );

    // Convert .click()
    javaCode = javaCode.replace(/\.click\(\)/g, '.click()');

    // Convert .textContent()
    javaCode = javaCode.replace(/\.textContent\(\)/g, '.textContent()');

    // Convert .allTextContents()
    javaCode = javaCode.replace(/\.allTextContents\(\)/g, '.allTextContents()');

    // Convert .first()
    javaCode = javaCode.replace(/\.first\(\)/g, '.first()');

    // Convert .last()
    javaCode = javaCode.replace(/\.last\(\)/g, '.last()');

    // Convert .nth()
    javaCode = javaCode.replace(
      /\.nth\((\d+)\)/g,
      (match, index) => `.nth(${index})`
    );

    // Convert page.keyboard.press()
    javaCode = javaCode.replace(
      /page\.keyboard\.press\('([^']+)'\)/g,
      (match, key) => `page.keyboard().press("${key}")`
    );

    // Convert page.keyboard().press()
    javaCode = javaCode.replace(
      /page\.keyboard\(\)\.press\('([^']+)'\)/g,
      (match, key) => `page.keyboard().press("${key}")`
    );

    // Convert page.navigate()
    javaCode = javaCode.replace(
      /page\.navigate\('([^']+)'\)/g,
      (match, url) => `page.navigate("${url}")`
    );

    // Convert page.goto() to page.navigate() (Playwright JS to Java)
    javaCode = javaCode.replace(
      /page\.goto\('([^']+)'\)/g,
      (match, url) => `page.navigate("${url}")`
    );

    // Convert page.evaluate() - truncate long code
    javaCode = javaCode.replace(
      /page\.evaluate\('([^']+)'\)/g,
      (match, code) => {
        const truncated = code.length > 100 ? code.substring(0, 100) + '...' : code;
        return `page.evaluate("${this.escapeJavaString(truncated)}")`;
      }
    );

    // Convert page.evaluate() with arrow function
    javaCode = javaCode.replace(
      /page\.evaluate\(\(\)\s*=>\s*\{([^}]+)\}\)/g,
      (match, code) => {
        const truncated = code.length > 100 ? code.substring(0, 100) + '...' : code;
        return `page.evaluate("() => {${this.escapeJavaString(truncated)}}")`;
      }
    );

    // Convert page.waitForLoadState()
    javaCode = javaCode.replace(/page\.waitForLoadState\(\)/g, 'page.waitForLoadState()');

    // Convert page.waitForTimeout()
    javaCode = javaCode.replace(
      /page\.waitForTimeout\((\d+)\)/g,
      (match, timeout) => `page.waitForTimeout(${timeout})`
    );

    // Remove comment prefixes
    javaCode = javaCode.replace(/^\/\/\s*/gm, '// ');

    // Ensure it ends with semicolon
    if (!javaCode.trim().endsWith(';') && !javaCode.trim().startsWith('//')) {
      javaCode = javaCode.trim() + ';';
    }

    return javaCode;
  }

  /**
   * Generate Playwright Java code from MCP tool call
   * Uses proper Playwright locator strategies: getByRole, getByPlaceholder, getByText, getByLabel, etc.
   */
  private generateJavaCode(toolName: string, args: any): string {
    switch (toolName) {
      case 'browser_navigate':
        if (args.url) {
          return `page.navigate("${args.url}");`;
        }
        return `page.navigate("https://example.com"); // TODO: Add URL`;

      case 'browser_click':
        if (!args || Object.keys(args).length === 0) {
          return `page.locator("button").click(); // TODO: Specify button to click`;
        }
        const clickLocator = this.convertToPlaywrightLocator(args, toolName);
        if (clickLocator && clickLocator.length > 0) {
          return `${clickLocator}.click();`;
        }
        return `page.locator("button").click(); // TODO: Specify button to click`;

      case 'browser_fill_form':
        if (args.fields && Array.isArray(args.fields) && args.fields.length > 0) {
          return args.fields.map((field: any) => {
            const locator = this.convertToPlaywrightLocator(field, 'browser_fill_form');
            return `${locator}.fill("${field.value || ''}");`;
          }).join('\n');
        }
        if (args.value || args.text) {
          const formLocator = this.convertToPlaywrightLocator(args, 'browser_fill_form');
          if (formLocator) {
            return `${formLocator}.fill("${args.value || args.text}");`;
          }
        }
        return `page.locator("input").fill("value"); // TODO: Specify input field and value`;

      case 'browser_type':
        if (args.text) {
          const typeLocator = this.convertToPlaywrightLocator(args, 'browser_type');
          if (typeLocator) {
            return `${typeLocator}.fill("${args.text}");`;
          }
        }
        return `page.locator("input").fill("text"); // TODO: Specify input and text`;

      case 'browser_press_key':
        if (args.key) {
          return `page.keyboard().press("${args.key}");`;
        }
        return `page.keyboard().press("Enter"); // TODO: Specify key to press`;

      case 'browser_wait_for':
        if (args.text) {
          return `page.waitForSelector("text=${args.text}");`;
        } else if (args.timeout) {
          return `page.waitForTimeout(${args.timeout});`;
        }
        return `page.waitForLoadState();`;

      case 'browser_evaluate':
        const code = args.function || args.code || '';
        if (code && code.length > 0) {
          return `page.evaluate("${code.replace(/"/g, '\\"').substring(0, 100)}");`;
        }
        return `page.evaluate("() => { /* TODO: Add JavaScript code */ }");`;

      case 'browser_snapshot':
        return `// Take page snapshot`;

      case 'browser_hover':
        if (args) {
          const hoverLocator = this.convertToPlaywrightLocator(args, 'browser_hover');
          if (hoverLocator) {
            return `${hoverLocator}.hover();`;
          }
        }
        return `page.locator("element").hover(); // TODO: Specify element to hover`;

      case 'browser_select_option':
        if (args) {
          const selectLocator = this.convertToPlaywrightLocator(args, 'browser_select_option');
          if (args.values && Array.isArray(args.values)) {
            return `${selectLocator}.selectOption(${JSON.stringify(args.values)});`;
          }
          if (args.value) {
            return `${selectLocator}.selectOption("${args.value}");`;
          }
        }
        return `page.locator("select").selectOption("value"); // TODO: Specify select and option`;

      case 'browser_drag':
        if (args.startRef && args.endRef) {
          const startLocator = this.convertToPlaywrightLocator({ ref: args.startRef }, 'browser_drag');
          const endLocator = this.convertToPlaywrightLocator({ ref: args.endRef }, 'browser_drag');
          return `${startLocator}.dragTo(${endLocator});`;
        }
        return `page.locator("element1").dragTo(page.locator("element2")); // TODO: Specify elements`;

      case 'browser_take_screenshot':
        if (args.filename) {
          return `page.screenshot(new Page.ScreenshotOptions().setPath("${args.filename}"));`;
        }
        return `page.screenshot(new Page.ScreenshotOptions().setPath("screenshot.png"));`;

      case 'browser_navigate_back':
        return `page.goBack();`;

      case 'browser_run_code':
        const runCode = args.code || args.function || '';
        if (runCode && runCode.length > 0) {
          return `page.evaluate("${runCode.replace(/"/g, '\\"').substring(0, 150)}");`;
        }
        return `page.evaluate("() => { /* TODO: Add JavaScript code */ }");`;

      default:
        // For unknown tools, generate a generic comment
        return `// TODO: Add code for ${toolName}`;
    }
  }

  /**
   * NEW: Public method to check authentication status
   */
  public isAuthenticated(): boolean {
    return !!(this.token && this.tokenExpiry && Date.now() < this.tokenExpiry);
  }

  /**
   * NEW: Public method to manually trigger authentication
   * Returns user code and verification URL for display to user
   */
  public async authenticate(): Promise<{ userCode: string; verificationUri: string }> {
    return await this.autoAuthenticate();
  }

  /**
   * NEW: Public method to set token manually (for migration from file-based)
   */
  public setToken(token: string, expiryMs?: number): void {
    this.token = token;
    this.tokenExpiry = expiryMs || (Date.now() + 24 * 60 * 60 * 1000);
  }

  /**
   * NEW: Public method to clear authentication
   */
  public clearAuth(): void {
    this.token = null;
    this.tokenExpiry = null;
  }


  /**
   * RAG: Get knowledge base context
   * MAINTAINS EXISTING RAG ARCHITECTURE
   * NEW: Skips RAG loading for 'mcp-agent' type
   */
  private async getKnowledgeBaseContext(type: string, message: string): Promise<string> {
    // Skip RAG for pure MCP agent mode
    if (type === 'mcp-agent') {
      return ''; // No RAG documents needed for MCP agent
    }

    // Load markdown documentation from doc/ folder
    const docsPath = path.join(process.cwd(), 'doc');
    let markdownContent = '';

    try {
      const docFiles = {
        'ui': ['ui-playwright-knowledge-base.md', 'playwright-locator-mapping.md', 'strict-conversion-rules.md'],
        'api': ['api-testing-knowledge-base.md', 'curl-conversion-rules.md', 'api-testdata-format.md'],
        'curl': ['curl-conversion-rules.md', 'api-testing-knowledge-base.md'],
        'swagger': ['api-testing-knowledge-base.md', 'api-testdata-format.md']
      };

      const relevantFiles = docFiles[type as keyof typeof docFiles] || docFiles['api'];

      for (const file of relevantFiles) {
        try {
          const filePath = path.join(docsPath, file);
          const content = await readFile(filePath, 'utf-8');
          markdownContent += `\n\n=== ${file} ===\n${content}`;
        } catch (err) {
          console.warn(`Could not load ${file}`);
        }
      }
    } catch (error) {
      console.warn('Could not load documentation files');
    }

    const ragContext = `TestFlow Pro Framework - Complete Knowledge Base:

${markdownContent}

=== EXACT JSON STRUCTURE ===
{"id":"suite-id","suiteName":"Suite Name","applicationName":"App Name","type":"UI","baseUrl":"https://domain.com","testCases":[{"name":"Test Name","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://domain.com"},{"id":"step-2","keyword":"assertVisible","locator":{"strategy":"testId","value":"element-id"}},{"id":"step-3","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Submit","exact":true}}}]}]}

=== CRITICAL FIELD MAPPINGS ===
playwright → testflow
page.getByRole('button',{name:'X'}) → {"strategy":"role","value":"button","options":{"name":"X"}}
page.getByTestId('id') → {"strategy":"testId","value":"id"}
expect().toBeVisible() → {"keyword":"assertVisible"}
.click() → {"keyword":"click"}

=== FORBIDDEN FIELDS ===
NEVER USE: attributes, additionalAttributes, filters, verifyVisible, expectVisible
ALWAYS USE: options, assertVisible

=== WORKING EXAMPLES ===
CORRECT ROLE LOCATOR:
{"strategy":"role","value":"textbox","options":{"name":"Email address"}}

CORRECT BUTTON LOCATOR:
{"strategy":"role","value":"button","options":{"name":"Continue","exact":true}}

CORRECT TESTID LOCATOR:
{"strategy":"testId","value":"SearchField.search"}

=== COMPLETE UI KEYWORDS ===
goto, click, fill, assertVisible, assertHidden, getText, screenshot, waitForTimeout

=== MANDATORY FIELDS ===
- testData: [] (empty array for UI tests)
- applicationName: string (generate from context)
- options: {} (for role locators with name/exact)

=== REAL EXAMPLES FROM CODEBASE ===
${this.getExampleSuites()}`;

    switch (type) {
      case 'ui':
        return `${ragContext}

=== UI CONVERSION RULES ===
1. Convert each Playwright action to TestFlow step
2. Use sequential step IDs: step-1, step-2, etc.
3. Role locators MUST have options field
4. Use assertVisible for expect().toBeVisible()
5. testData must be empty array []
6. Generate meaningful applicationName from URL`;
      default:
        return ragContext;
    }
  }

  /**
   * Get system prompt based on type
   * MAINTAINS EXISTING PROMPT ARCHITECTURE
   * NEW: Supports 'mcp-agent' type for pure MCP agent mode without RAG
   */
  private getSystemPrompt(type: string, context: string): string {
    // MCP Agent mode - no RAG, just tool usage
    if (type === 'mcp-agent') {
      return `You are an AUTONOMOUS AI agent with access to MCP (Model Context Protocol) tools for web automation.

========================================
ABSOLUTE MANDATORY RULES - NO EXCEPTIONS:
========================================
1. NEVER EVER ask user "Would you like me to retry?"
2. NEVER EVER ask user "Should I choose..."
3. NEVER EVER ask user for confirmation mid-task
4. ALWAYS complete the ENTIRE task before responding
5. If URL doesn't change after click, IMMEDIATELY try different selector
6. If one approach fails, INSTANTLY try 5+ more approaches
7. NEVER give up - keep trying until task is 100% complete
8. Return results ONLY after extracting ALL requested data
========================================

Your role:
- Execute tasks using available MCP tools
- Be proactive and autonomous  
- Chain multiple tools together to complete complex tasks
- Provide clear explanations of what you're doing
- If a task fails, try alternative approaches
- Always confirm task completion
- **NEVER give up until the entire task is 100% completed**
- **If the user asks for multiple steps, complete ALL of them**
- **NEVER ask user for confirmation or clarification in the middle of a task**
- **NEVER say "Could you confirm" or "Should I" or "Would you like me to" - just DO it**
- **If one approach fails, immediately try the next approach WITHOUT asking**

CRITICAL RULES - FOLLOW THESE STRICTLY:
1. ❌ NEVER ask: "Could you confirm if you want me to..."
2. ❌ NEVER ask: "Should I choose a random product..."
3. ❌ NEVER ask: "Do you want me to try again..."
4. ❌ NEVER ask: "Would you like me to retry..."
5. ✅ ALWAYS: Try multiple approaches autonomously
6. ✅ ALWAYS: Complete the ENTIRE task before responding
7. ✅ ALWAYS: If you click wrong element, go back and try different selector
8. ✅ ALWAYS: Extract data even if page structure is unclear
9. ✅ ALWAYS: Return final results AFTER completing all steps
10. ✅ ALWAYS: Verify URL changed after clicking - if not, clicked wrong element

TASK COMPLETION VERIFICATION:
User asks: "navigate, search, click first result, get details"
You MUST complete:
✅ Step 1: Navigate
✅ Step 2: Search  
✅ Step 3: Click first result (verify URL changed!)
✅ Step 4: Extract product name
✅ Step 5: Extract price
✅ Step 6: Return: "Product: [name], Price: [price]"
❌ DO NOT respond before completing ALL 6 steps

IMPORTANT: ALWAYS COMPLETE THE FULL TASK
- If user asks: "navigate, search, click, and get details" → Do ALL 4 steps
- Don't stop at step 2 or 3 - complete the ENTIRE sequence
- If something fails, try alternative approaches but keep going
- Only respond with final result after completing ALL requested steps

UNIVERSAL WEB AUTOMATION BEST PRACTICES:

1. ANALYZING PAGE STRUCTURE (Works for ANY website):
   - Always use browser_snapshot() FIRST to understand page structure
   - Look for element roles, text content, placeholders in the snapshot YAML
   - Identify interactive elements: buttons, links, inputs, forms
   - Use the snapshot structure to find correct element references

2. LOCATING ELEMENTS (Generic approach for any site):
   - Prefer semantic locators: getByRole, getByPlaceholder, getByText, getByLabel
   - Use .first(), .last(), .nth(index) for multiple matching elements
   - Try multiple locator strategies if first attempt fails:
     a) getByRole with name
     b) getByText with visible text
     c) getByPlaceholder for inputs
     d) page.locator() with CSS selector as last resort
   - Check snapshot for actual element properties before clicking

3. CLICKING ELEMENTS (Universal pattern):
   - Verify you're clicking the correct element by checking snapshot
   - If wrong element is clicked, use browser_navigate_back and retry
   - Try different locators: .first(), .nth(0), or more specific selectors
   - Wait after navigation: use browser_wait_for or waitForLoadState
   - **CRITICAL: Avoid clicking navigation/category links (e.g., "Home & Furniture", "Baby & Kids")**
   
   CLICKING FIRST RESULT AFTER SEARCH:
   - Take snapshot after search to see results structure
   - Look for actual content links (not navigation)
   - Try these approaches in order:
     1. page.locator('a').first().click() - Click first link
     2. page.locator('div[class*="product"], div[class*="item"], div[class*="result"]').first().locator('a').click()
     3. page.getByRole('link').nth(5).click() - Skip first few nav links
     4. Use JavaScript: page.evaluate(() => { const links = Array.from(document.querySelectorAll('a')); links.find(l => l.href.includes('/p/') || l.href.includes('/dp/'))?.click(); })
   - **CRITICAL**: After clicking, CHECK if URL changed:
     - If URL is STILL on search page → You clicked wrong element (filter/category)
     - IMMEDIATELY use browser_navigate_back
     - IMMEDIATELY try next selector from list above
     - Keep trying until URL changes to /p/ or /dp/ or similar product page
   - **NEVER** ask user if click failed - just retry automatically with next approach
   - Only proceed to data extraction after URL has changed to product page

4. EXTRACTING DATA (Any content type):
   - Use browser_snapshot to see page content and structure
   - Use browser_evaluate for simple text extraction:
     - Single element: page.evaluate(() => document.querySelector('selector').textContent)
     - Multiple elements: page.evaluate(() => Array.from(document.querySelectorAll('selector')).map(el => el.textContent))
   - Use getByRole/getByText followed by .textContent() for semantic extraction
   - Return extracted data clearly to the user

5. FORM INTERACTIONS (Any form on any site):
   - Use getByPlaceholder or getByLabel to find input fields
   - Use .fill() for text inputs
   - Use .click() for buttons, checkboxes, radio buttons
   - Use .selectOption() for dropdowns
   - Press Enter with page.keyboard().press('Enter') if needed

6. RETRY & RECOVERY STRATEGY (Resilient for all sites):
   - If action fails, take snapshot to understand current state
   - Try alternative locators (at least 3-5 different approaches)
   - Use browser_navigate_back if navigation went wrong
   - Use browser_evaluate with JavaScript if standard locators fail
   - Remove blocking elements with JavaScript if needed
   - NEVER give up after just 1-2 attempts

7. HANDLING DYNAMIC CONTENT (Modern web apps):
   - Use browser_wait_for to wait for elements to appear
   - Take snapshot after each major action to verify state
   - Use browser_evaluate to check if element exists before interacting
   - Wait for page navigation to complete before next action

8. DATA EXTRACTION PATTERNS (Universal elements):
   - Headings: h1, h2, h3, [role="heading"]
   - Prices/Numbers: Look for currency symbols, number patterns
   - Links: a[href], [role="link"]
   - Buttons: button, [role="button"], input[type="submit"]
   - Lists: ul > li, ol > li, [role="list"]
   - Tables: table, [role="table"], th, td
   - Images: img[alt], [role="img"]

9. MULTI-STEP WORKFLOWS (Complex automation):
   - Break complex tasks into clear steps
   - Verify each step completed before proceeding
   - Take snapshots between steps to confirm state
   - If a step fails, retry with alternative approach
   - Complete ALL requested steps before responding to user

10. ERROR HANDLING (Comprehensive recovery):
    - If element not found: Try alternative locators, check snapshot
    - If click goes to wrong page: Navigate back and retry with better selector
    - If data extraction returns empty: Check snapshot for actual selectors
    - If page doesn't load: Wait using browser_wait_for, then retry
    - If blocked by modal: Dismiss modal first, then continue task

${context}

IMPORTANT WEB INTERACTION GUIDELINES:

STEP 1: ALWAYS Handle Modals/Popups First
Many websites show modals, popups, or overlays when you first visit. ALWAYS check for and dismiss these BEFORE interacting with the main page:

Common modal patterns to handle:
✓ Login/Sign-up modals → Look for close button (X, ×, Close, Skip, Maybe Later)
✓ Cookie consent → Click "Accept" or "Dismiss"
✓ Newsletter popups → Click close button or "No thanks"
✓ Location/Language selection → Select or dismiss
✓ App download prompts → Click "Continue to website" or close
✓ Notification permission → Click "Block" or "Not now"

How to handle modals:
1. After navigation, use browser_snapshot() to see if modal is present
2. Look for common modal indicators in snapshot:
   - dialog role elements
   - Elements with "modal", "popup", "overlay" in classes
   - Close buttons (×, X, Close, Skip, Dismiss)
3. Use Playwright locators to dismiss:
   - page.getByRole('button', { name: /close|skip|dismiss|later|no thanks/i })
   - page.getByLabel('Close')
   - page.getByRole('dialog').getByRole('button', { name: 'X' })
4. After dismissing, take another snapshot to confirm modal is gone

STEP 2: Web Scraping
After handling modals, proceed with data extraction:
1. Use browser_snapshot to see the page structure
2. Use the snapshot's YAML structure to find correct element references
3. Use browser_evaluate for simple JavaScript queries
4. AVOID browser_run_code for data extraction (it has serialization limits)
5. For extracting lists/arrays, use simpler approaches:
   - Get text from individual elements using browser_evaluate
   - Use page.locator().allTextContents() instead of complex map operations
   - Break down into smaller queries if needed

PLAYWRIGHT LOCATOR BEST PRACTICES:
Always prefer Playwright's built-in locator methods (they're more reliable than CSS selectors):
✓ page.getByRole('button', { name: 'Submit' }) - For buttons, links, inputs by ARIA role
✓ page.getByPlaceholder('Search...') - For inputs with placeholder text
✓ page.getByText('Product Name') - For elements containing specific text
✓ page.getByLabel('Email') - For form fields with labels
✓ page.getByTestId('product-card') - For elements with data-testid
✓ page.getByAltText('Logo') - For images with alt text
✓ page.getByTitle('Close') - For elements with title attribute

IMPORTANT: When the AI performs browser actions, it will automatically generate Java code!
The generated Java code will use these proper locator strategies, making the code:
- More reliable and maintainable
- Following official Playwright best practices
- Less brittle to UI changes
- Production-ready for your test automation projects

Generated Java Code Features:
✓ Uses getByRole, getByPlaceholder, getByText (semantic locators)
✓ Falls back to CSS selectors only when necessary
✓ Includes TODO comments for snapshot refs that need manual updates
✓ Complete runnable code with proper imports and boilerplate
✓ Copy-paste ready for your Playwright Java projects

Example GOOD approach:
1. browser_snapshot() → See page structure
2. browser_evaluate(() => page.getByRole('heading').allTextContents())
   → Returns: ['Product 1', 'Product 2', 'Product 3']
3. browser_evaluate(() => page.getByText('₹').allTextContents())
   → Returns: ['₹15,999', '₹12,499', '₹10,999']

Example BAD approach:
❌ browser_run_code with Array.from().map() operations (serialization errors)
❌ document.querySelector('.complex-class-name') (brittle, changes often)
❌ Trying to return complex objects from page.evaluate()

REAL WORLD EXAMPLES FOR ANY WEBSITE:

HANDLING MODALS/POPUPS (DO THIS FIRST on any site):
✓ Login/signup modal:
  1. browser_snapshot() → See if dialog appears
  2. page.getByRole('button', { name: /close|×|skip/i }).click() → Dismiss modal
  3. browser_wait_for({ timeout: 1000 }) → Wait for modal to close
  4. browser_snapshot() → Verify modal is gone

✓ Cookie consent:
  page.getByRole('button', { name: /accept|agree|ok|got it/i }).click()

✓ Newsletter popup:
  page.getByRole('dialog').getByRole('button', { name: /close|no thanks|maybe later/i }).click()

✓ Generic modal close:
  page.getByLabel('Close').click() OR page.getByRole('button', { name: 'X' }).click()

SEARCH & NAVIGATION (Universal patterns):
✓ Search box: page.getByPlaceholder('Search').fill('query') OR page.getByRole('searchbox').fill('query')
✓ Search button: page.getByRole('button', { name: /search/i }).click()
✓ Menu navigation: page.getByRole('navigation').getByRole('link', { name: 'Section' }).click()
✓ Breadcrumbs: page.getByRole('navigation', { name: 'breadcrumb' }).textContent()

FORMS (Works on any website):
✓ Text input: page.getByLabel('Name').fill('value') OR page.getByPlaceholder('Enter name').fill('value')
✓ Email field: page.getByLabel('Email').fill('user@example.com')
✓ Password: page.getByPlaceholder('Password').fill('secret')
✓ Checkbox: page.getByRole('checkbox', { name: 'I agree' }).click()
✓ Radio button: page.getByRole('radio', { name: 'Option 1' }).click()
✓ Submit: page.getByRole('button', { name: /submit|send|save/i }).click()

DATA EXTRACTION (Universal approach):
✓ Page title: page.evaluate(() => document.querySelector('h1').textContent)
✓ All headings: page.getByRole('heading').allTextContents()
✓ All links: page.getByRole('link').allTextContents()
✓ Specific text: page.getByText('keyword').textContent()
✓ List items: page.locator('ul > li').allTextContents()
✓ Table data: page.getByRole('cell').allTextContents()

CLICKING FIRST RESULT (Any site with search results):
✓ Generic approach: page.locator('a').first().click()
✓ By role: page.getByRole('link').first().click()
✓ By heading: page.getByRole('heading').first().click()
✓ After snapshot: Use refs from snapshot for precise clicking

CONTENT EXTRACTION (Blogs, News, Documentation):
✓ Article content: page.getByRole('article').textContent()
✓ Code blocks: page.locator('pre code').allTextContents()
✓ Images: page.locator('img').getAttribute('src')
✓ Metadata: page.evaluate(() => document.querySelector('meta[name="description"]').content)

For Lists/Tables (Universal):
✓ All rows: page.getByRole('row').allTextContents()
✓ Specific cell: page.getByRole('cell', { name: 'Value' }).textContent()
✓ Headers: page.getByRole('columnheader').allTextContents()
✓ List items: page.locator('li').allTextContents()

CRITICAL: FAILURE RECOVERY & ERROR HANDLING

When ANY tool fails or returns an error:
1. DON'T give up! Try alternative approaches using different tools
2. Use browser_snapshot() to understand the current page state
3. Try different locator strategies if one fails:
   - If getByRole fails → Try getByText
   - If getByPlaceholder fails → Try getByLabel
   - If specific text fails → Try partial match with regex
   - If one selector fails → Try parent/child navigation
4. For modals that won't close:
   - Try multiple close button patterns: X, ×, Close, Skip, Dismiss, No Thanks, Maybe Later
   - Try getByLabel('Close')
   - Try pressing Escape key: browser_press_key({ key: 'Escape' })
   - Try clicking outside modal area
5. For elements not found:
   - Wait first: browser_wait_for({ timeout: 2000 })
   - Take snapshot to see what's actually on page
   - Try alternative selectors
   - Check if page loaded correctly
6. For navigation issues:
   - Take snapshot to see current state
   - Try going back: browser_navigate_back()
   - Try refreshing or re-navigating
7. For data extraction failures:
   - Try simpler queries
   - Break down complex extractions into multiple simple ones
   - Use different extraction methods (textContent vs allTextContents)
   - Try getting text from parent elements
8. Use JavaScript execution when other methods fail:
   - browser_evaluate for simple DOM queries
   - Execute custom JavaScript to handle edge cases
   - Query elements directly with document.querySelector
   - Get computed styles, attributes, or complex data
   - Trigger custom events or manipulate page state

AUTOMATIC RECOVERY EXAMPLES:

Example 1 - Modal won't close:
❌ getByRole('button', { name: 'Close' }).click() → Error: not found
✓ Try: getByRole('button', { name: /close|×|skip/i }).click()
✓ If fails: getByLabel('Close').click()
✓ If fails: browser_press_key({ key: 'Escape' })
✓ If fails: Take snapshot and look for actual close button text

Example 2 - Search box not found:
❌ getByPlaceholder('Search').fill('phone') → Error: not found
✓ Try: getByRole('searchbox').fill('phone')
✓ If fails: getByLabel('Search').fill('phone')
✓ If fails: getByRole('textbox', { name: /search/i }).fill('phone')
✓ If fails: Take snapshot to see actual input structure

Example 3 - Data extraction returns empty:
❌ getByRole('link', { name: /product/i }).allTextContents() → Returns: []
✓ Take snapshot to see page structure
✓ Try: getByText('₹').allTextContents() (search for prices instead)
✓ Try: getByRole('heading').allTextContents() (headings are often product names)
✓ Try: page.locator('a').allTextContents() (all links)
✓ If still empty: Explain what you see on the page

Example 4 - Page not loading:
❌ browser_navigate({ url: 'https://...' }) → Page blank
✓ Wait: browser_wait_for({ timeout: 3000 })
✓ Take snapshot to verify state
✓ If blank: Try navigating again
✓ Check for modals blocking content

Example 5 - Modal won't close with standard methods:
❌ All getByRole attempts failed
✓ Use JavaScript: browser_evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (modal) modal.remove();
  })
✓ Or: browser_evaluate(() => {
    document.querySelector('.modal-close')?.click();
  })
✓ Or: browser_evaluate(() => {
    const backdrop = document.querySelector('.modal-backdrop');
    backdrop?.click();
  })

Example 6 - Get data when locators fail:
❌ getByRole/getByText not finding products
✓ Use JavaScript: browser_evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(a => a.href.includes('product'))
      .slice(0, 5)
      .map(a => a.textContent.trim());
  })
✓ Or: browser_evaluate(() => {
    const prices = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.textContent.includes('₹')) {
        prices.push(el.textContent.match(/₹[\d,]+/)?.[0]);
      }
    });
    return prices.filter(Boolean).slice(0, 5);
  })

Example 7 - Force click hidden/covered elements:
❌ click() fails due to element covered
✓ Use JavaScript: browser_evaluate((selector) => {
    document.querySelector(selector)?.click();
  }, '.target-element')
✓ Or trigger event: browser_evaluate(() => {
    const el = document.querySelector('.button');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  })

Example 8 - Scroll to reveal elements:
❌ Element not visible for interaction
✓ Use JavaScript: browser_evaluate(() => {
    document.querySelector('.product-list')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  })
✓ Or: browser_evaluate(() => window.scrollTo(0, document.body.scrollHeight))

Example 9 - Check if element exists before acting:
✓ Use JavaScript: browser_evaluate(() => {
    return document.querySelector('.login-modal') !== null;
  })
  → If true, handle modal; if false, proceed

Example 10 - Get all visible text when structure unknown:
✓ browser_evaluate(() => {
    return document.body.innerText;
  })
  → Returns all visible text on page for analysis

JAVASCRIPT EXECUTION GUIDELINES:
✓ Use browser_evaluate for:
  - Quick DOM queries when locators fail
  - Checking element existence
  - Getting computed styles/attributes
  - Removing stubborn modals
  - Scrolling to elements
  - Getting all text content
  - Force clicking hidden elements

✓ Keep JavaScript simple:
  - Return primitive values (strings, numbers, booleans)
  - Return simple arrays of primitives
  - Avoid complex objects (serialization issues)
  - Use optional chaining (?.) to avoid errors

✓ When to use JavaScript over locators:
  - Locators failed after 3 attempts
  - Need to manipulate page state
  - Need to remove blocking elements
  - Need to get all text/data regardless of structure
  - Need to force interactions
  - Need to check conditions before acting

GOLDEN RULES FOR RESILIENCE:
1. ✅ ALWAYS try at least 3-5 different approaches before giving up
2. ✅ ALWAYS use browser_snapshot() when something fails (to understand why)
3. ✅ ALWAYS wait after navigation/clicks before next action
4. ✅ ALWAYS try regex patterns (/text/i) for flexible matching
5. ✅ ALWAYS explain what you tried and what you're trying next
6. ✅ USE JavaScript execution (browser_evaluate) when standard locators fail
7. ✅ TRY different tool combinations - be creative with available tools
8. ✅ NEVER say "I can't access" without trying multiple tools AND JavaScript
9. ✅ NEVER give up after first failure - USE ALL AVAILABLE TOOLS!
10. ✅ ALWAYS be persistent - try locators → JavaScript → alternative tools

RECOVERY TOOLBOX (Use in this order when failures occur):
1. First attempt: Use Playwright locators (getByRole, getByText, etc.)
2. Second attempt: Try alternative locators (getByLabel, getByPlaceholder, etc.)
3. Third attempt: Use browser_evaluate with JavaScript
4. Fourth attempt: Use browser_snapshot to understand page structure
5. Fifth attempt: Try browser_wait_for then retry
6. Sixth attempt: Use JavaScript to manipulate/remove blocking elements
7. Final attempt: Explain what you see and ask for guidance

Remember:
- Use tools to DO things, not just talk about them
- Break down complex tasks into tool calls
- Try multiple approaches when tools fail
- Use ALL available tools including JavaScript execution
- Verify results and handle errors gracefully
- Be helpful, persistent, and efficient
- JavaScript is your safety net when other methods fail`;
    }

    // Original RAG-based prompts for test generation
    const basePrompt = `You are an expert test automation assistant for TestFlow Pro.

${context}

CRITICAL RULES:
1. Generate ONLY valid TestFlow JSON (no explanations)
2. Use exact field names from examples
3. Role locators MUST have "options" field (never "attributes")
4. UI tests MUST have empty testData: []
5. Validate against working examples above`;

    switch (type) {
      case 'ui':
        return `${basePrompt}

TASK: Convert Playwright code to TestFlow UI JSON format
OUTPUT: Return ONLY the complete JSON test suite (no markdown, no explanations)`;

      case 'curl':
        return `${basePrompt}

TASK: Convert cURL command to TestFlow API JSON format
OUTPUT: Return ONLY the complete JSON test suite`;

      case 'swagger':
        return `${basePrompt}

TASK: Convert Swagger/OpenAPI spec to TestFlow API JSON format
OUTPUT: Return ONLY the complete JSON test suite`;

      default:
        return basePrompt;
    }
  }

  /**
   * Get example test suites
   * MAINTAINS EXISTING EXAMPLES
   */
  private getExampleSuites(): string {
    return `
EXAMPLE 1 - Login Test:
{"id":"login-test","suiteName":"Login Tests","applicationName":"Web App","type":"UI","baseUrl":"https://app.com","testCases":[{"name":"Valid Login","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://app.com/login"},{"id":"step-2","keyword":"fill","locator":{"strategy":"role","value":"textbox","options":{"name":"Email"}},"value":"user@test.com"},{"id":"step-3","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Login"}}},{"id":"step-4","keyword":"assertVisible","locator":{"strategy":"testId","value":"dashboard"}}]}]}

EXAMPLE 2 - Registration Test:
{"id":"reg-test","suiteName":"Registration","applicationName":"Portal","type":"UI","baseUrl":"https://portal.com","testCases":[{"name":"Sign Up","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://portal.com/signup"},{"id":"step-2","keyword":"assertVisible","locator":{"strategy":"role","value":"textbox","options":{"name":"Email address"}}},{"id":"step-3","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Continue","exact":true}}}]}]}`;
  }
}

// Export singleton instance
export const copilotSDK = new CopilotSDKService();

