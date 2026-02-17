/**
 * MCP Server Configuration and Registry
 * Supports multiple MCP servers like Playwright, Jira, GitHub, etc.
 */

import path from 'path';

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  icon?: string;
  category: 'automation' | 'project-management' | 'version-control' | 'ai' | 'database' | 'other';
}

export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  testflowpro: {
    id: 'testflowpro',
    name: 'TestFlowPro Operations',
    description: 'Complete file system, terminal, and development operations',
    command: 'node',
    args: [path.join(process.cwd(), 'lib', 'services', 'testflowpro-mcp-server.js')],
    enabled: true,
    icon: '⚡',
    category: 'automation'
  },

  playwright: {
    id: 'playwright',
    name: 'Playwright',
    description: 'Browser automation and testing (official)',
    command: 'npx',
    args: ['@playwright/mcp@latest'],
    env: {
      PLAYWRIGHT_HEADLESS: 'false'
    },
    enabled: true,
    icon: '🎭',
    category: 'automation'
  },

  github: {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub repository management and operations',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || ''
    },
    enabled: false,
    icon: '🐙',
    category: 'version-control'
  },

  memory: {
    id: 'memory',
    name: 'Memory',
    description: 'Knowledge graph memory for AI',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    enabled: true,
    icon: '🧠',
    category: 'ai'
  },

  fetch: {
    id: 'fetch',
    name: 'Fetch',
    description: 'Fetch web content and resources',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    enabled: true,
    icon: '🌐',
    category: 'other'
  },

  postgres: {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'PostgreSQL database operations',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: {
      POSTGRES_CONNECTION_STRING: process.env.POSTGRES_URL || ''
    },
    enabled: false,
    icon: '🐘',
    category: 'database'
  },

  sqlite: {
    id: 'sqlite',
    name: 'SQLite',
    description: 'SQLite database operations',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    enabled: false,
    icon: '💾',
    category: 'database'
  },

  filesystem: {
    id: 'filesystem',
    name: 'File System',
    description: 'Secure file system operations (disabled - use TestFlowPro instead)',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    enabled: false,
    icon: '📁',
    category: 'other'
  },

  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Slack messaging and workspace operations',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
      SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || ''
    },
    enabled: false,
    icon: '💬',
    category: 'other'
  },

  puppeteer: {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Chrome automation with Puppeteer',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    enabled: false,
    icon: '🎪',
    category: 'automation'
  },

  brave: {
    id: 'brave',
    name: 'Brave Search',
    description: 'Web search using Brave Search API',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || ''
    },
    enabled: false,
    icon: '🔍',
    category: 'other'
  },

  google: {
    id: 'google',
    name: 'Google Maps',
    description: 'Google Maps integration',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    env: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || ''
    },
    enabled: false,
    icon: '🗺️',
    category: 'other'
  }
};

/**
 * Get enabled MCP servers
 */
export function getEnabledServers(): MCPServerConfig[] {
  return Object.values(MCP_SERVERS).filter(server => server.enabled);
}

/**
 * Get servers by category
 */
export function getServersByCategory(category: MCPServerConfig['category']): MCPServerConfig[] {
  return Object.values(MCP_SERVERS).filter(server => server.category === category);
}

/**
 * Update server configuration
 */
export function updateServerConfig(id: string, updates: Partial<MCPServerConfig>): void {
  if (MCP_SERVERS[id]) {
    MCP_SERVERS[id] = { ...MCP_SERVERS[id], ...updates };
  }
}

/**
 * Get server by ID
 */
export function getServerById(id: string): MCPServerConfig | undefined {
  return MCP_SERVERS[id];
}

