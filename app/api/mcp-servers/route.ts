import { NextRequest, NextResponse } from 'next/server';
import { mcpServerManager } from '@/lib/services/mcp-server-manager';
import { MCP_SERVERS, updateServerConfig } from '@/lib/services/mcp-server-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list-servers') {
      // List all available servers
      return NextResponse.json({
        servers: Object.values(MCP_SERVERS)
      });
    }

    if (action === 'list-tools') {
      // List all available tools
      const tools = mcpServerManager.getAllTools();
      return NextResponse.json({ tools });
    }

    if (action === 'list-resources') {
      // List all resources
      const resources = mcpServerManager.getAllResources();
      return NextResponse.json({ resources });
    }

    if (action === 'server-status') {
      const serverId = searchParams.get('serverId');
      if (!serverId) {
        return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
      }

      const status = mcpServerManager.getServerStatus(serverId);
      return NextResponse.json({ status });
    }

    if (action === 'all-statuses') {
      const statuses = Object.fromEntries(mcpServerManager.getAllServerStatuses());
      return NextResponse.json({ statuses });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('MCP Servers API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId, toolName, args, uri, config } = body;

    if (action === 'connect') {
      if (!serverId) {
        return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
      }

      // Start connection
      await mcpServerManager.connectServer(serverId);

      // Wait for npm installation and tool discovery (8 seconds for first-time install + initialization)
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Get tools for this server
      const tools = mcpServerManager.getServerTools(serverId);
      const status = mcpServerManager.getServerStatus(serverId);

      return NextResponse.json({
        success: true,
        message: `Connected to ${serverId}`,
        tools: tools,
        toolCount: tools.length,
        status: status
      });
    }

    if (action === 'disconnect') {
      if (!serverId) {
        return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
      }

      await mcpServerManager.disconnectServer(serverId);
      return NextResponse.json({ success: true, message: `Disconnected from ${serverId}` });
    }

    if (action === 'connect-all') {
      await mcpServerManager.connectAll();
      return NextResponse.json({ success: true, message: 'Connected to all enabled servers' });
    }

    if (action === 'disconnect-all') {
      await mcpServerManager.disconnectAll();
      return NextResponse.json({ success: true, message: 'Disconnected from all servers' });
    }

    if (action === 'execute-tool') {
      if (!serverId || !toolName) {
        return NextResponse.json({ error: 'Server ID and tool name required' }, { status: 400 });
      }

      const result = await mcpServerManager.executeTool(serverId, toolName, args || {});
      return NextResponse.json({ success: true, result });
    }

    if (action === 'read-resource') {
      if (!serverId || !uri) {
        return NextResponse.json({ error: 'Server ID and URI required' }, { status: 400 });
      }

      const resource = await mcpServerManager.readResource(serverId, uri);
      return NextResponse.json({ success: true, resource });
    }

    if (action === 'update-config') {
      if (!serverId || !config) {
        return NextResponse.json({ error: 'Server ID and config required' }, { status: 400 });
      }

      updateServerConfig(serverId, config);
      return NextResponse.json({ success: true, message: 'Config updated' });
    }

    if (action === 'enable-server') {
      if (!serverId) {
        return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
      }

      updateServerConfig(serverId, { enabled: true });
      return NextResponse.json({ success: true, message: `${serverId} enabled` });
    }

    if (action === 'disable-server') {
      if (!serverId) {
        return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
      }

      await mcpServerManager.disconnectServer(serverId);
      updateServerConfig(serverId, { enabled: false });
      return NextResponse.json({ success: true, message: `${serverId} disabled` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('MCP Servers API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

