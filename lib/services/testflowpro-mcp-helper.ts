/**
 * TestFlowPro MCP Helper
 * Easy-to-use wrapper for TestFlowPro MCP server operations
 */

export class TestFlowProMCP {
  private serverId = 'testflowpro';

  /**
   * Execute a tool on the TestFlowPro MCP server
   */
  private async executeTool(toolName: string, args: any): Promise<any> {
    const response = await fetch('/api/mcp-servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'execute-tool',
        serverId: this.serverId,
        toolName,
        args
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Tool execution failed');
    }

    return data.result;
  }

  // File Operations
  async readFile(path: string): Promise<string> {
    const result = await this.executeTool('read_file', { path });
    return result.content[0].text;
  }

  async writeFile(path: string, content: string): Promise<string> {
    const result = await this.executeTool('write_file', { path, content });
    return result.content[0].text;
  }

  async appendFile(path: string, content: string): Promise<string> {
    const result = await this.executeTool('append_file', { path, content });
    return result.content[0].text;
  }

  async deleteFile(path: string): Promise<string> {
    const result = await this.executeTool('delete_file', { path });
    return result.content[0].text;
  }

  async listDirectory(path: string, recursive = false): Promise<any[]> {
    const result = await this.executeTool('list_directory', { path, recursive });
    return JSON.parse(result.content[0].text);
  }

  async createDirectory(path: string, recursive = true): Promise<string> {
    const result = await this.executeTool('create_directory', { path, recursive });
    return result.content[0].text;
  }

  async deleteDirectory(path: string, recursive = false): Promise<string> {
    const result = await this.executeTool('delete_directory', { path, recursive });
    return result.content[0].text;
  }

  async fileExists(path: string): Promise<boolean> {
    const result = await this.executeTool('file_exists', { path });
    return result.content[0].text === 'true';
  }

  async getFileInfo(path: string): Promise<any> {
    const result = await this.executeTool('get_file_info', { path });
    return JSON.parse(result.content[0].text);
  }

  async searchFiles(directory: string, pattern: string): Promise<string[]> {
    const result = await this.executeTool('search_files', { directory, pattern });
    return JSON.parse(result.content[0].text);
  }

  async copyFile(source: string, destination: string): Promise<string> {
    const result = await this.executeTool('copy_file', { source, destination });
    return result.content[0].text;
  }

  async moveFile(source: string, destination: string): Promise<string> {
    const result = await this.executeTool('move_file', { source, destination });
    return result.content[0].text;
  }

  // Terminal Operations
  async executeCommand(command: string, cwd?: string, timeout?: number): Promise<any> {
    const result = await this.executeTool('execute_command', { command, cwd, timeout });
    return JSON.parse(result.content[0].text);
  }

  async startTerminalSession(shell = 'zsh', cwd?: string): Promise<any> {
    const result = await this.executeTool('start_terminal_session', { shell, cwd });
    return JSON.parse(result.content[0].text);
  }

  async executeInSession(sessionId: string, command: string): Promise<string> {
    const result = await this.executeTool('execute_in_session', { sessionId, command });
    return result.content[0].text;
  }

  async getSessionOutput(sessionId: string): Promise<string> {
    const result = await this.executeTool('get_session_output', { sessionId });
    return result.content[0].text;
  }

  async closeTerminalSession(sessionId: string): Promise<string> {
    const result = await this.executeTool('close_terminal_session', { sessionId });
    return result.content[0].text;
  }

  async listTerminalSessions(): Promise<any[]> {
    const result = await this.executeTool('list_terminal_sessions', {});
    return JSON.parse(result.content[0].text);
  }

  // Git Operations
  async gitStatus(cwd?: string): Promise<string> {
    const result = await this.executeTool('git_status', { cwd });
    return result.content[0].text;
  }

  async gitDiff(cwd?: string, file?: string): Promise<string> {
    const result = await this.executeTool('git_diff', { cwd, file });
    return result.content[0].text;
  }

  // Process Management
  async listProcesses(filter?: string): Promise<string> {
    const result = await this.executeTool('list_processes', { filter });
    return result.content[0].text;
  }

  async getEnvironment(variable?: string): Promise<any> {
    const result = await this.executeTool('get_environment', { variable });
    return variable ? result.content[0].text : JSON.parse(result.content[0].text);
  }
}

// Export singleton instance
export const testflowproMCP = new TestFlowProMCP();

