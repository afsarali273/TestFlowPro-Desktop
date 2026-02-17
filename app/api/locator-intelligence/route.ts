import { NextRequest, NextResponse } from 'next/server';
import { mcpServerManager } from '@/lib/services/mcp-server-manager';
import { locatorIntelligence } from '@/lib/locator';

/**
 * Locator Intelligence API
 * Provides intelligent Playwright locator generation
 */
export async function POST(request: NextRequest) {
  try {
    const { action, selector, options } = await request.json();

    // Create executeTool wrapper
    const executeTool = async (serverId: string, toolName: string, args: any) => {
      return await mcpServerManager.executeTool(serverId, toolName, args);
    };

    if (action === 'get-best-locators') {
      // Get best locators for all interactive elements
      const locators = await locatorIntelligence.getBestLocators(executeTool, options);

      return NextResponse.json({
        success: true,
        locators,
        count: locators.length
      });
    }

    if (action === 'get-best-locator') {
      // Get best locator for specific element
      if (!selector) {
        return NextResponse.json(
          { error: 'Selector is required' },
          { status: 400 }
        );
      }

      const locator = await locatorIntelligence.getBestLocatorForElement(
        executeTool,
        selector,
        options
      );

      if (!locator) {
        return NextResponse.json(
          { error: 'Element not found or could not generate locator' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        locator
      });
    }

    if (action === 'enhance-action') {
      // Enhance Playwright action with best locator
      const { playwrightAction } = await request.json();

      if (!playwrightAction) {
        return NextResponse.json(
          { error: 'Playwright action is required' },
          { status: 400 }
        );
      }

      const enhanced = await locatorIntelligence.enhancePlaywrightAction(
        executeTool,
        playwrightAction
      );

      return NextResponse.json({
        success: true,
        enhanced
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: get-best-locators, get-best-locator, or enhance-action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Locator Intelligence API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Get locator intelligence info
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    name: 'Locator Intelligence API',
    version: '1.0.0',
    description: 'Generates best-practice Playwright locators using accessibility-first approach',
    endpoints: {
      POST: {
        'get-best-locators': 'Get best locators for all interactive elements on page',
        'get-best-locator': 'Get best locator for specific element (requires selector)',
        'enhance-action': 'Enhance Playwright action with best locator (requires playwrightAction)'
      }
    },
    strategies: [
      'getByRole+filter (with hasText/has filtering)',
      'getByRole (accessibility-first)',
      'getByLabel (form elements)',
      'getByPlaceholder (input fields)',
      'getByText (with exact option)',
      'chained (complex locators)',
      'getByTestId (test hooks)',
      'id (stable IDs)',
      'css (last resort)'
    ],
    features: [
      'Filtering support (hasText, hasNotText, has)',
      'Chaining support for complex locators',
      'Exact match option for getByText',
      'Regex patterns for flexible matching',
      'Parent-child context awareness',
      'Reusable locator variables'
    ]
  });
}

