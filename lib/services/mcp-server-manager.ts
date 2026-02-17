/**
 * MCP Server Manager
 * Manages multiple MCP server connections and provides unified interface
 */

import { spawn, ChildProcess } from 'child_process';
import { MCPServerConfig, getEnabledServers } from './mcp-server-config';

interface MCPMessage {
  jsonrpc: '2.0';
  id?: number;
  method: string;
  params?: any;
  result?: any;
  error?: any;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  server: string;
}

interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  server: string;
}

/**
 * MCP Server Manager Class
 * Manages connections to multiple MCP servers
 */
class MCPServerManager {
  private servers: Map<string, {
    config: MCPServerConfig;
    process: ChildProcess | null;
    connected: boolean;
    tools: MCPTool[];
    resources: MCPResource[];
    messageId: number;
    pendingRequests: Map<number, { resolve: Function; reject: Function }>;
  }> = new Map();

  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeServers();
  }

  /**
   * Initialize all enabled servers
   */
  private initializeServers(): void {
    const enabledServers = getEnabledServers();

    for (const config of enabledServers) {
      this.servers.set(config.id, {
        config,
        process: null,
        connected: false,
        tools: [],
        resources: [],
        messageId: 1,
        pendingRequests: new Map()
      });
    }
  }

  /**
   * Install MCP server package if needed
   */
  private async installIfNeeded(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    // Skip installation for local file-based servers
    if (server.config.command === 'node') {
      return;
    }

    // For npx-based servers, the package will be auto-installed on first run
    // We'll emit progress events for the UI
    this.emit('installation-progress', {
      serverId,
      message: 'Checking package availability...'
    });
  }

  /**
   * Connect to a specific server
   */
  async connectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.connected) {
      console.log(`✅ Server ${serverId} already connected`);
      return;
    }

    try {
      console.log(`🔌 Connecting to ${server.config.name}...`);

      // Check and install if needed
      await this.installIfNeeded(serverId);

      this.emit('connection-progress', {
        serverId,
        message: 'Starting server...'
      });

      // Spawn the MCP server process
      server.process = spawn(server.config.command, server.config.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...server.config.env }
      });

      if (!server.process.stdout || !server.process.stdin) {
        throw new Error('Failed to create MCP process streams');
      }

      // Set up message handling
      let buffer = '';
      server.process.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const message: MCPMessage = JSON.parse(line);
              this.handleMessage(serverId, message);
            } catch (error) {
              console.error(`Failed to parse message from ${serverId}:`, line);
            }
          }
        }
      });

      server.process.stderr?.on('data', (data) => {
        const message = data.toString();
        // Log npm installation messages
        if (message.includes('npm warn exec') || message.includes('will be installed')) {
          console.log(`📦 ${server.config.name}: ${message.trim()}`);
          this.emit('installation-progress', { serverId, message: message.trim() });
        } else {
          console.error(`${server.config.name} Error:`, message);
        }
      });

      server.process.on('exit', (code) => {
        console.log(`${server.config.name} exited with code ${code}`);
        server.connected = false;
        this.emit('server-disconnected', { serverId, code });
      });

      // Initialize the connection
      await this.sendRequest(serverId, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: 'TestFlowPro',
          version: '1.0.0'
        }
      });

      // Send initialized notification
      await this.sendNotification(serverId, 'notifications/initialized');

      // Wait for server to be fully ready (5 seconds for npm-installed servers)
      console.log(`⏳ Waiting for ${server.config.name} to initialize...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // List available tools and resources (with retry)
      await this.refreshServerCapabilities(serverId);

      // If no tools found, retry after 2 more seconds
      if (server.tools.length === 0) {
        console.log(`⏳ No tools found, waiting 2 more seconds for ${server.config.name}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.refreshServerCapabilities(serverId);
      }

      server.connected = true;
      console.log(`✅ Connected to ${server.config.name}`);
      this.emit('server-connected', { serverId });

    } catch (error) {
      console.error(`❌ Failed to connect to ${server.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a server
   */
  async disconnectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server || !server.process) {
      return;
    }

    try {
      server.process.kill();
      server.connected = false;
      server.tools = [];
      server.resources = [];
      console.log(`🔌 Disconnected from ${server.config.name}`);
    } catch (error) {
      console.error(`Error disconnecting from ${serverId}:`, error);
    }
  }

  /**
   * Connect to all enabled servers
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(id =>
      this.connectServer(id).catch(err => {
        console.error(`Failed to connect ${id}:`, err);
      })
    );
    await Promise.all(promises);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(id =>
      this.disconnectServer(id)
    );
    await Promise.all(promises);
  }

  /**
   * Refresh server capabilities (tools and resources)
   */
  private async refreshServerCapabilities(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    try {
      console.log(`🔍 Discovering capabilities for ${server.config.name}...`);

      // List tools
      const toolsResponse = await this.sendRequest(serverId, 'tools/list', {});
      console.log(`📦 Tools response for ${serverId}:`, JSON.stringify(toolsResponse).substring(0, 200));

      if (toolsResponse?.tools) {
        server.tools = toolsResponse.tools.map((tool: any) => ({
          ...tool,
          server: serverId
        }));

        // Add Locator Intelligence virtual tool for Playwright
        if (serverId === 'playwright') {
          server.tools.push({
            name: 'get_best_locators',
            description: 'Get best Playwright locators using accessibility-first approach with filtering support. Returns optimal locators like getByRole with .filter() for specificity.',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'Optional CSS selector for specific element. Omit to get all interactive elements.'
                },
                options: {
                  type: 'object',
                  properties: {
                    enableFiltering: { type: 'boolean', description: 'Enable .filter() chaining (default: true)' },
                    enableChaining: { type: 'boolean', description: 'Enable complex chaining (default: true)' },
                    minConfidence: { type: 'number', description: 'Minimum confidence score 0-100 (default: 0)' },
                    exactMatch: { type: 'boolean', description: 'Use exact: true for text matches (default: false)' }
                  }
                }
              }
            },
            server: serverId
          });
          console.log(`✨ Added Locator Intelligence virtual tool to ${server.config.name}`);
        }

        console.log(`✅ ${server.config.name}: Found ${server.tools.length} tools`);
        console.log(`   Tools:`, server.tools.map((t: any) => t.name).join(', '));
      } else {
        console.warn(`⚠️  ${server.config.name}: No tools in response`);
      }

      // List resources (optional - not all servers support this)
      try {
        const resourcesResponse = await this.sendRequest(serverId, 'resources/list', {});
        if (resourcesResponse?.resources) {
          server.resources = resourcesResponse.resources.map((resource: any) => ({
            ...resource,
            server: serverId
          }));
          console.log(`📚 ${server.config.name}: Found ${server.resources.length} resources`);
        }
      } catch (resourceError: any) {
        // Resources are optional - ignore if not supported
        if (resourceError.message !== 'Method not found') {
          console.warn(`⚠️  ${server.config.name}: Could not list resources:`, resourceError.message);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to refresh capabilities for ${serverId}:`, error);
    }
  }

  /**
   * Execute a tool from any connected server
   */
  async executeTool(serverId: string, toolName: string, args: any): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server || !server.connected) {
      throw new Error(`Server ${serverId} not connected`);
    }

    try {
      console.log(`🔧 Executing ${toolName} on ${server.config.name}`, args);

      // Check if this is a Locator Intelligence virtual tool
      if (toolName === 'get_best_locators' && serverId === 'playwright') {
        return await this.executeLocatorIntelligenceTool(args);
      }

      const result = await this.sendRequest(serverId, 'tools/call', {
        name: toolName,
        arguments: args
      });

      return result;
    } catch (error) {
      console.error(`❌ Tool execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute Locator Intelligence tool (virtual tool that wraps Playwright)
   */
  private async executeLocatorIntelligenceTool(args: any): Promise<any> {
    try {
      const { locatorIntelligence } = await import('@/lib/locator');

      // Create executeTool wrapper for locator intelligence
      const executeTool = async (serverId: string, toolName: string, toolArgs: any) => {
        return await this.executeTool(serverId, toolName, toolArgs);
      };

      if (args.selector) {
        // Get locator for specific element
        const locator = await locatorIntelligence.getBestLocatorForElement(
          executeTool,
          args.selector,
          args.options || {}
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              locator: locator?.bestLocator,
              strategy: locator?.strategy,
              confidence: locator?.confidence,
              reasoning: locator?.reasoning,
              alternatives: locator?.alternatives,
              usesFiltering: locator?.usesFiltering,
              usesChaining: locator?.usesChaining
            }, null, 2)
          }]
        };
      } else {
        // Get all locators
        const locators = await locatorIntelligence.getBestLocators(
          executeTool,
          args.options || {}
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: locators.length,
              locators: locators.map(loc => ({
                element: {
                  tag: loc.element.tag,
                  role: loc.element.role,
                  text: loc.element.text?.substring(0, 50)
                },
                locator: loc.bestLocator,
                strategy: loc.strategy,
                confidence: loc.confidence,
                usesFiltering: loc.usesFiltering
              }))
            }, null, 2)
          }]
        };
      }
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  /**
   * Read a resource from a server
   */
  async readResource(serverId: string, uri: string): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server || !server.connected) {
      throw new Error(`Server ${serverId} not connected`);
    }

    try {
      const result = await this.sendRequest(serverId, 'resources/read', { uri });
      return result;
    } catch (error) {
      console.error(`Failed to read resource:`, error);
      throw error;
    }
  }

  /**
   * Get all available tools across all servers
   * Returns tools from servers that have discovered them, even if still finalizing connection
   */
  getAllTools(): MCPTool[] {
    const allTools: MCPTool[] = [];
    let connectedCount = 0;
    let withToolsCount = 0;
    let totalServers = this.servers.size;

    for (const [serverId, server] of this.servers.entries()) {
      if (server.connected) {
        connectedCount++;
      }

      // Include tools if they exist, regardless of connection status
      // This handles the race condition where tools are discovered but connection is still finalizing
      if (server.tools && server.tools.length > 0) {
        withToolsCount++;
        console.log(`📦 ${serverId}: ${server.connected ? 'connected' : 'connecting'}, ${server.tools.length} tools available`);
        allTools.push(...server.tools);
      } else {
        console.log(`⏳ ${serverId}: ${server.connected ? 'connected' : 'connecting'}, no tools yet`);
      }
    }

    console.log(`📊 getAllTools: ${connectedCount}/${totalServers} connected, ${withToolsCount}/${totalServers} have tools, returning ${allTools.length} total tools`);
    return allTools;
  }

  /**
   * Get tools for a specific server
   */
  getServerTools(serverId: string): MCPTool[] {
    const server = this.servers.get(serverId);
    return server?.tools || [];
  }

  /**
   * Get all resources across all servers
   */
  getAllResources(): MCPResource[] {
    const allResources: MCPResource[] = [];
    for (const server of this.servers.values()) {
      if (server.connected) {
        allResources.push(...server.resources);
      }
    }
    return allResources;
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): { connected: boolean; toolCount: number; resourceCount: number } | null {
    const server = this.servers.get(serverId);
    if (!server) return null;

    return {
      connected: server.connected,
      toolCount: server.tools.length,
      resourceCount: server.resources.length
    };
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): Map<string, { connected: boolean; toolCount: number; resourceCount: number }> {
    const statuses = new Map();
    for (const [id, server] of this.servers.entries()) {
      statuses.set(id, {
        connected: server.connected,
        toolCount: server.tools.length,
        resourceCount: server.resources.length
      });
    }
    return statuses;
  }

  /**
   * Send request to server
   */
  private async sendRequest(serverId: string, method: string, params: any): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server || !server.process?.stdin) {
      throw new Error(`Server ${serverId} not ready`);
    }

    return new Promise((resolve, reject) => {
      const id = server.messageId++;
      const message: MCPMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      console.log(`📤 Sending ${method} to ${serverId} (id: ${id})`);
      server.pendingRequests.set(id, { resolve, reject });

      try {
        server.process!.stdin!.write(JSON.stringify(message) + '\n');
      } catch (error) {
        console.error(`❌ Failed to write to ${serverId}:`, error);
        server.pendingRequests.delete(id);
        reject(error);
        return;
      }

      // Timeout after 60 seconds (increased for slower MCP servers like Playwright)
      setTimeout(() => {
        if (server.pendingRequests.has(id)) {
          console.warn(`⏱️ Request timeout for ${method} on ${serverId} (id: ${id})`);
          server.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 60000);
    });
  }

  /**
   * Send notification to server
   */
  private async sendNotification(serverId: string, method: string, params?: any): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server || !server.process?.stdin) {
      throw new Error(`Server ${serverId} not ready`);
    }

    const message: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params
    };

    server.process.stdin.write(JSON.stringify(message) + '\n');
  }

  /**
   * Handle incoming message from server
   */
  private handleMessage(serverId: string, message: MCPMessage): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    console.log(`📥 Received from ${serverId}:`, JSON.stringify(message).substring(0, 200));

    // Handle response to request
    if (message.id !== undefined) {
      const pending = server.pendingRequests.get(message.id);
      if (pending) {
        // Remove pending entry immediately to avoid double-resolution
        server.pendingRequests.delete(message.id);
        if (message.error) {
          console.error(`❌ Error response from ${serverId} (id: ${message.id}):`, message.error);

          // Ensure reject is callable
          try {
            if (typeof pending.reject === 'function') {
              pending.reject(new Error(message.error.message || 'Unknown error'));
            } else {
              console.warn(`⚠️ pending.reject for ${serverId} (id: ${message.id}) is not a function`, pending.reject);
            }
          } catch (err) {
            console.error('Error while calling pending.reject:', err);
          }
        } else {
          console.log(`✅ Success response from ${serverId} (id: ${message.id})`);

          // Defensive: verify resolve is a function before calling it. This prevents runtime errors
          // like "{}.resolve is not a function" if the pending record was corrupted.
          try {
            if (typeof pending.resolve === 'function') {
              pending.resolve(message.result);
            } else {
              console.warn(`⚠️ pending.resolve for ${serverId} (id: ${message.id}) is not a function`, pending.resolve);

              // Attempt to surface the result to the caller by rejecting with a helpful message
              if (typeof pending.reject === 'function') {
                pending.reject(new Error('Internal error: pending.resolve is not callable'));
              }
            }
          } catch (err) {
            console.error('Error while calling pending.resolve:', err);
            try {
              if (typeof pending.reject === 'function') {
                pending.reject(err);
              }
            } catch (err2) {
              console.error('Error while rejecting after failed resolve call:', err2);
            }
          }
        }
      } else {
        console.warn(`⚠️ No pending request for id ${message.id} from ${serverId}`);
      }
    }

    // Handle notifications
    if (message.method && !message.id) {
      console.log(`🔔 Notification from ${serverId}:`, message.method);
      this.emit('notification', { serverId, method: message.method, params: message.params });
    }
  }

  /**
   * Event emitter
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  /**
   * Subscribe to events
   */
  on(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

// Use global singleton pattern to prevent recreation during Next.js hot reload
declare global {
  var mcpServerManagerInstance: MCPServerManager | undefined;
}

// Create or reuse singleton instance
export const mcpServerManager = global.mcpServerManagerInstance ?? new MCPServerManager();

// Store instance globally in development to persist across hot reloads
if (process.env.NODE_ENV !== 'production') {
  global.mcpServerManagerInstance = mcpServerManager;
}
