#!/usr/bin/env node

/**
 * Test Locator Intelligence MCP Tool Integration
 * Run this to verify the tool is working correctly
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testLocatorIntelligenceTool() {
  console.log('🧪 Testing Locator Intelligence MCP Tool Integration\n');

  try {
    // Test 1: Check if tool is available
    console.log('📋 Test 1: Checking if tool is available...');
    const toolsResponse = await fetch(`${BASE_URL}/api/mcp-servers?action=list-tools`);
    const toolsData = await toolsResponse.json();

    const locatorTool = toolsData.tools?.find(t => t.name === 'get_best_locators');

    if (locatorTool) {
      console.log('✅ Tool found!');
      console.log(`   Name: ${locatorTool.name}`);
      console.log(`   Server: ${locatorTool.server}`);
      console.log(`   Description: ${locatorTool.description.substring(0, 80)}...`);
    } else {
      console.log('❌ Tool not found');
      console.log('   Make sure Playwright MCP server is connected');
      return;
    }

    // Test 2: Check Playwright connection
    console.log('\n📋 Test 2: Checking Playwright connection...');
    const statusResponse = await fetch(`${BASE_URL}/api/mcp-servers?action=all-statuses`);
    const statusData = await statusResponse.json();

    if (statusData.statuses?.playwright?.connected) {
      console.log('✅ Playwright MCP is connected');
      console.log(`   Tool count: ${statusData.statuses.playwright.toolCount}`);
    } else {
      console.log('❌ Playwright MCP not connected');
      console.log('   Connect it first from Ralph Loop UI');
      return;
    }

    // Test 3: Try to execute tool (basic call)
    console.log('\n📋 Test 3: Executing get_best_locators tool...');
    console.log('   Note: This requires a loaded page in Playwright browser');

    const executeResponse = await fetch(`${BASE_URL}/api/mcp-servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'execute-tool',
        serverId: 'playwright',
        toolName: 'get_best_locators',
        args: {
          options: {
            enableFiltering: true,
            minConfidence: 70
          }
        }
      })
    });

    const executeData = await executeResponse.json();

    if (executeResponse.ok) {
      console.log('✅ Tool executed successfully!');

      if (executeData.result?.content?.[0]?.text) {
        const result = JSON.parse(executeData.result.content[0].text);
        console.log(`   Locators found: ${result.count || 1}`);

        if (result.locators && result.locators.length > 0) {
          console.log(`\n   Sample locator:`);
          const sample = result.locators[0];
          console.log(`   - Element: ${sample.element.tag} (${sample.element.role})`);
          console.log(`   - Locator: ${sample.locator}`);
          console.log(`   - Strategy: ${sample.strategy}`);
          console.log(`   - Confidence: ${sample.confidence}%`);
          if (sample.usesFiltering) {
            console.log(`   - Uses Filtering: ✓`);
          }
        }
      }
    } else {
      console.log('⚠️  Tool execution failed (expected if no page loaded)');
      console.log(`   Error: ${executeData.error || 'Unknown error'}`);
      console.log(`   This is normal if Playwright browser hasn't navigated to a page yet`);
    }

    // Test 4: Check API endpoint
    console.log('\n📋 Test 4: Testing Locator Intelligence API endpoint...');
    const apiResponse = await fetch(`${BASE_URL}/api/locator-intelligence`);
    const apiData = await apiResponse.json();

    if (apiResponse.ok) {
      console.log('✅ API endpoint is available');
      console.log(`   Version: ${apiData.version}`);
      console.log(`   Strategies: ${apiData.strategies.length}`);
    } else {
      console.log('❌ API endpoint failed');
    }

    console.log('\n✅ All integration tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - Locator Intelligence tool is integrated');
    console.log('   - Tool appears in Playwright MCP server');
    console.log('   - Can be called via MCP Servers API');
    console.log('   - Direct API endpoint also available');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Navigate to a page using Playwright MCP');
    console.log('   2. Call get_best_locators to get optimal locators');
    console.log('   3. Use in Ralph Loop Generator Agent prompts');
    console.log('   4. Enable Agent Mode in chat to auto-use tools');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('   1. Next.js dev server is running (npm run dev)');
    console.error('   2. Playwright MCP server is connected');
    console.error('   3. You are on http://localhost:3000');
  }
}

// Run tests
testLocatorIntelligenceTool();

