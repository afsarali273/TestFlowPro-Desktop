/**
 * MCP Locator Intelligence Tool
 * Exposes locator intelligence as an MCP tool
 *
 * Integration Point: Add to MCP Server Manager's tool list
 */

import { locatorIntelligence, BestLocator, LocatorOptions } from '@/lib/locator';

export interface LocatorIntelligenceTool {
  name: 'get_best_locators';
  description: string;
  inputSchema: {
    type: 'object';
    properties: {
      selector?: {
        type: 'string';
        description: string;
      };
      options?: {
        type: 'object';
        properties: {
          minConfidence?: { type: 'number' };
          enableFiltering?: { type: 'boolean' };
          enableChaining?: { type: 'boolean' };
          exactMatch?: { type: 'boolean' };
        };
      };
    };
  };
}

/**
 * MCP Tool Definition
 */
export const LOCATOR_INTELLIGENCE_TOOL: LocatorIntelligenceTool = {
  name: 'get_best_locators',
  description: `Get best Playwright locators for elements on the page using accessibility-first approach.
  
Supports:
- getByRole with filtering (hasText, has)
- getByLabel for form elements
- getByPlaceholder for inputs
- getByText with exact option
- Chaining for complex locators
- Regex patterns for flexible matching

Examples:
1. Get all locators: {} 
2. Get specific element: { "selector": "button.submit" }
3. With options: { "options": { "enableFiltering": true, "minConfidence": 80 } }`,
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector for specific element (optional, omit to get all elements)'
      },
      options: {
        type: 'object',
        properties: {
          minConfidence: { type: 'number' },
          enableFiltering: { type: 'boolean' },
          enableChaining: { type: 'boolean' },
          exactMatch: { type: 'boolean' }
        }
      }
    }
  }
};

/**
 * Execute locator intelligence tool
 */
export async function executeLocatorIntelligenceTool(
  args: { selector?: string; options?: LocatorOptions },
  executeTool: (serverId: string, toolName: string, args: any) => Promise<any>
): Promise<{ locators?: BestLocator[]; locator?: BestLocator; error?: string }> {
  try {
    if (args.selector) {
      // Get locator for specific element
      const locator = await locatorIntelligence.getBestLocatorForElement(
        executeTool,
        args.selector,
        args.options || {}
      );

      if (!locator) {
        return { error: 'Element not found or could not generate locator' };
      }

      return { locator };
    } else {
      // Get all locators
      const locators = await locatorIntelligence.getBestLocators(
        executeTool,
        args.options || {}
      );

      return { locators };
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to generate locators' };
  }
}

/**
 * Format locator result for display
 */
export function formatLocatorResult(result: BestLocator): string {
  const parts = [
    `🎯 Best Locator: ${result.bestLocator}`,
    `📊 Strategy: ${result.strategy}`,
    `💯 Confidence: ${result.confidence}%`,
    `💡 Reason: ${result.reasoning}`
  ];

  if (result.usesFiltering) {
    parts.push('🔍 Uses filtering: Yes');
  }

  if (result.usesChaining) {
    parts.push('🔗 Uses chaining: Yes');
  }

  if (result.alternatives.length > 0) {
    parts.push(`\n📝 Alternatives:\n${result.alternatives.map((alt, i) => `  ${i + 1}. ${alt}`).join('\n')}`);
  }

  return parts.join('\n');
}

/**
 * Convert locator result to Playwright code
 */
export function toPlaywrightCode(locator: BestLocator, variableName: string = 'element'): string {
  const loc = locator.bestLocator;

  // If it's already a const declaration, return as is
  if (loc.startsWith('const ')) {
    return loc;
  }

  // Wrap in page. if not already
  const fullLocator = loc.startsWith('page.') ? loc : `page.${loc}`;

  return `const ${variableName} = ${fullLocator};`;
}

