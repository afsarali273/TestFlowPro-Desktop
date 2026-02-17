#!/usr/bin/env node

/**
 * TestFlowPro MCP Server
 * Provides file system, terminal, and development operations
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Active terminal sessions
const terminalSessions = new Map();
let sessionIdCounter = 0;

// Create MCP server
const server = new Server(
  {
    name: 'testflowpro-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // File Operations
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to read',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write or create a file with content',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to write',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'append_file',
        description: 'Append content to an existing file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file',
            },
            content: {
              type: 'string',
              description: 'Content to append',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'delete_file',
        description: 'Delete a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to delete',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory',
            },
            recursive: {
              type: 'boolean',
              description: 'List recursively',
              default: false,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path for the new directory',
            },
            recursive: {
              type: 'boolean',
              description: 'Create parent directories if needed',
              default: true,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'delete_directory',
        description: 'Delete a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory to delete',
            },
            recursive: {
              type: 'boolean',
              description: 'Delete recursively',
              default: false,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'file_exists',
        description: 'Check if a file or directory exists',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to check',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_file_info',
        description: 'Get detailed information about a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file or directory',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_files',
        description: 'Search for files by name pattern',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory to search in',
            },
            pattern: {
              type: 'string',
              description: 'File name pattern (supports wildcards)',
            },
          },
          required: ['directory', 'pattern'],
        },
      },
      {
        name: 'copy_file',
        description: 'Copy a file to a new location',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Source file path',
            },
            destination: {
              type: 'string',
              description: 'Destination file path',
            },
          },
          required: ['source', 'destination'],
        },
      },
      {
        name: 'move_file',
        description: 'Move or rename a file',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Source file path',
            },
            destination: {
              type: 'string',
              description: 'Destination file path',
            },
          },
          required: ['source', 'destination'],
        },
      },

      // Terminal Operations
      {
        name: 'execute_command',
        description: 'Execute a shell command and get output',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Command to execute',
            },
            cwd: {
              type: 'string',
              description: 'Working directory (optional)',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds (default: 30000)',
              default: 30000,
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'start_terminal_session',
        description: 'Start a persistent terminal session',
        inputSchema: {
          type: 'object',
          properties: {
            shell: {
              type: 'string',
              description: 'Shell to use (bash, zsh, sh, etc.)',
              default: 'zsh',
            },
            cwd: {
              type: 'string',
              description: 'Working directory',
            },
          },
        },
      },
      {
        name: 'execute_in_session',
        description: 'Execute command in a persistent terminal session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Terminal session ID',
            },
            command: {
              type: 'string',
              description: 'Command to execute',
            },
          },
          required: ['sessionId', 'command'],
        },
      },
      {
        name: 'get_session_output',
        description: 'Get output from a terminal session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Terminal session ID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'close_terminal_session',
        description: 'Close a terminal session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Terminal session ID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'list_terminal_sessions',
        description: 'List all active terminal sessions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Git Operations
      {
        name: 'git_status',
        description: 'Get git repository status',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Repository directory',
            },
          },
        },
      },
      {
        name: 'git_diff',
        description: 'Get git diff',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Repository directory',
            },
            file: {
              type: 'string',
              description: 'Specific file to diff (optional)',
            },
          },
        },
      },

      // Process Management
      {
        name: 'list_processes',
        description: 'List running processes',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'Filter by process name (optional)',
            },
          },
        },
      },
      {
        name: 'get_environment',
        description: 'Get environment variables',
        inputSchema: {
          type: 'object',
          properties: {
            variable: {
              type: 'string',
              description: 'Specific variable name (optional)',
            },
          },
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // File Operations
      case 'read_file': {
        const content = await fs.readFile(args.path, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'write_file': {
        const dir = path.dirname(args.path);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(args.path, args.content, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Successfully wrote to ${args.path}`,
            },
          ],
        };
      }

      case 'append_file': {
        await fs.appendFile(args.path, args.content, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Successfully appended to ${args.path}`,
            },
          ],
        };
      }

      case 'delete_file': {
        await fs.unlink(args.path);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted ${args.path}`,
            },
          ],
        };
      }

      case 'list_directory': {
        const files = await fs.readdir(args.path, { withFileTypes: true });
        const items = files.map((file) => ({
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file',
          path: path.join(args.path, file.name),
        }));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(items, null, 2),
            },
          ],
        };
      }

      case 'create_directory': {
        await fs.mkdir(args.path, { recursive: args.recursive !== false });
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created directory ${args.path}`,
            },
          ],
        };
      }

      case 'delete_directory': {
        await fs.rm(args.path, { recursive: args.recursive === true, force: true });
        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted directory ${args.path}`,
            },
          ],
        };
      }

      case 'file_exists': {
        try {
          await fs.access(args.path);
          return {
            content: [
              {
                type: 'text',
                text: 'true',
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: 'false',
              },
            ],
          };
        }
      }

      case 'get_file_info': {
        const stats = await fs.stat(args.path);
        const info = {
          path: args.path,
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          permissions: stats.mode.toString(8).slice(-3),
        };
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case 'search_files': {
        const { glob } = await import('glob');
        const pattern = path.join(args.directory, args.pattern);
        const files = await glob(pattern);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }

      case 'copy_file': {
        await fs.copyFile(args.source, args.destination);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully copied ${args.source} to ${args.destination}`,
            },
          ],
        };
      }

      case 'move_file': {
        await fs.rename(args.source, args.destination);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully moved ${args.source} to ${args.destination}`,
            },
          ],
        };
      }

      // Terminal Operations
      case 'execute_command': {
        const { stdout, stderr } = await execAsync(args.command, {
          cwd: args.cwd || process.cwd(),
          timeout: args.timeout || 30000,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                  success: true,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'start_terminal_session': {
        const sessionId = `session_${sessionIdCounter++}`;
        const shell = args.shell || 'zsh';
        const cwd = args.cwd || process.cwd();

        const terminal = spawn(shell, [], {
          cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: process.env,
        });

        const output = [];
        terminal.stdout.on('data', (data) => {
          output.push(data.toString());
        });
        terminal.stderr.on('data', (data) => {
          output.push(data.toString());
        });

        terminalSessions.set(sessionId, {
          terminal,
          output,
          cwd,
          shell,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ sessionId, shell, cwd }, null, 2),
            },
          ],
        };
      }

      case 'execute_in_session': {
        const session = terminalSessions.get(args.sessionId);
        if (!session) {
          throw new Error(`Session ${args.sessionId} not found`);
        }

        session.output = []; // Clear previous output
        session.terminal.stdin.write(args.command + '\n');

        // Wait for output
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
          content: [
            {
              type: 'text',
              text: session.output.join(''),
            },
          ],
        };
      }

      case 'get_session_output': {
        const session = terminalSessions.get(args.sessionId);
        if (!session) {
          throw new Error(`Session ${args.sessionId} not found`);
        }

        return {
          content: [
            {
              type: 'text',
              text: session.output.join(''),
            },
          ],
        };
      }

      case 'close_terminal_session': {
        const session = terminalSessions.get(args.sessionId);
        if (session) {
          session.terminal.kill();
          terminalSessions.delete(args.sessionId);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Session ${args.sessionId} closed`,
            },
          ],
        };
      }

      case 'list_terminal_sessions': {
        const sessions = Array.from(terminalSessions.entries()).map(([id, session]) => ({
          sessionId: id,
          shell: session.shell,
          cwd: session.cwd,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sessions, null, 2),
            },
          ],
        };
      }

      // Git Operations
      case 'git_status': {
        const { stdout } = await execAsync('git status', {
          cwd: args.cwd || process.cwd(),
        });
        return {
          content: [
            {
              type: 'text',
              text: stdout,
            },
          ],
        };
      }

      case 'git_diff': {
        const cmd = args.file ? `git diff ${args.file}` : 'git diff';
        const { stdout } = await execAsync(cmd, {
          cwd: args.cwd || process.cwd(),
        });
        return {
          content: [
            {
              type: 'text',
              text: stdout || 'No changes',
            },
          ],
        };
      }

      // Process Management
      case 'list_processes': {
        const cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux';
        const { stdout } = await execAsync(cmd);
        const filtered = args.filter
          ? stdout
              .split('\n')
              .filter((line) => line.toLowerCase().includes(args.filter.toLowerCase()))
              .join('\n')
          : stdout;

        return {
          content: [
            {
              type: 'text',
              text: filtered,
            },
          ],
        };
      }

      case 'get_environment': {
        if (args.variable) {
          return {
            content: [
              {
                type: 'text',
                text: process.env[args.variable] || '',
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(process.env, null, 2),
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TestFlowPro MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

