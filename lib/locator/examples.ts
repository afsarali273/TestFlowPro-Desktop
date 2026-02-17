/**
 * Quick Start Examples
 * Copy these examples to get started with Locator Intelligence
 */

import { locatorIntelligence } from '@/lib/locator';
import { mcpServerManager } from '@/lib/services/mcp-server-manager';

/**
 * Example 1: Get Best Locators for All Elements
 */
export async function example1_getAllLocators() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const locators = await locatorIntelligence.getBestLocators(executeTool, {
    enableFiltering: true,
    minConfidence: 80
  });

  console.log(`Found ${locators.length} elements`);

  locators.forEach((loc, i) => {
    console.log(`\n${i + 1}. ${loc.bestLocator}`);
    console.log(`   Strategy: ${loc.strategy}`);
    console.log(`   Confidence: ${loc.confidence}%`);
    console.log(`   Reason: ${loc.reasoning}`);
  });

  return locators;
}

/**
 * Example 2: Get Locator for Specific Element
 */
export async function example2_getSingleLocator() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const locator = await locatorIntelligence.getBestLocatorForElement(
    executeTool,
    'button.submit',  // Your CSS selector
    { enableFiltering: true }
  );

  if (locator) {
    console.log('Best locator:', locator.bestLocator);
    console.log('Alternatives:', locator.alternatives);
  }

  return locator;
}

/**
 * Example 3: Enhance Playwright Action
 */
export async function example3_enhanceAction() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const rawAction = {
    type: 'click',
    selector: 'div.product-card:nth-child(2) > button'
  };

  const enhanced = await locatorIntelligence.enhancePlaywrightAction(
    executeTool,
    rawAction
  );

  console.log('Original:', rawAction.selector);
  console.log('Enhanced:', enhanced.locator);
  console.log('Strategy:', enhanced.strategy);
  console.log('Confidence:', enhanced.confidence);

  return enhanced;
}

/**
 * Example 4: Use with API Endpoint
 */
export async function example4_useAPI() {
  // Get all locators
  const response = await fetch('/api/locator-intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get-best-locators',
      options: {
        enableFiltering: true,
        minConfidence: 80
      }
    })
  });

  const data = await response.json();
  console.log(`Found ${data.count} locators`);
  console.log('First locator:', data.locators[0]);

  return data.locators;
}

/**
 * Example 5: Generate Playwright Test Code
 */
export async function example5_generateTestCode() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const locators = await locatorIntelligence.getBestLocators(executeTool);

  // Generate test code
  let testCode = `import { test, expect } from '@playwright/test';\n\n`;
  testCode += `test('Generated test', async ({ page }) => {\n`;
  testCode += `  await page.goto('https://example.com');\n\n`;

  locators.slice(0, 5).forEach(loc => {
    if (loc.strategy === 'getByRole' && loc.element.role === 'button') {
      testCode += `  // ${loc.reasoning}\n`;
      testCode += `  await page.${loc.bestLocator}.click();\n\n`;
    }
  });

  testCode += `});\n`;

  console.log(testCode);
  return testCode;
}

/**
 * Example 6: Filter by Confidence
 */
export async function example6_filterByConfidence() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  // Only get high-confidence locators
  const highConfidence = await locatorIntelligence.getBestLocators(executeTool, {
    minConfidence: 90
  });

  console.log(`High confidence locators: ${highConfidence.length}`);

  highConfidence.forEach(loc => {
    console.log(`${loc.bestLocator} (${loc.confidence}%)`);
  });

  return highConfidence;
}

/**
 * Example 7: Real-World Scenario - Product List
 */
export async function example7_productList() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const locators = await locatorIntelligence.getBestLocators(executeTool, {
    enableFiltering: true,
    enableChaining: true
  });

  // Find product-related locators
  const productLocators = locators.filter(loc =>
    loc.element.role === 'listitem' ||
    loc.element.text?.includes('Product') ||
    loc.element.text?.includes('Add to cart')
  );

  console.log('Product-related locators:');
  productLocators.forEach(loc => {
    console.log(`\n${loc.bestLocator}`);
    if (loc.usesFiltering) console.log('  ✓ Uses filtering');
    if (loc.usesChaining) console.log('  ✓ Uses chaining');
  });

  return productLocators;
}

/**
 * Example 8: Export to JSON
 */
export async function example8_exportJSON() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const locators = await locatorIntelligence.getBestLocators(executeTool);

  const exportData = locators.map(loc => ({
    locator: loc.bestLocator,
    strategy: loc.strategy,
    confidence: loc.confidence,
    element: {
      tag: loc.element.tag,
      role: loc.element.role,
      text: loc.element.text
    }
  }));

  console.log(JSON.stringify(exportData, null, 2));
  return exportData;
}

/**
 * Example 9: Compare Strategies
 */
export async function example9_compareStrategies() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  const locators = await locatorIntelligence.getBestLocators(executeTool);

  // Group by strategy
  const byStrategy: Record<string, number> = {};

  locators.forEach(loc => {
    byStrategy[loc.strategy] = (byStrategy[loc.strategy] || 0) + 1;
  });

  console.log('Locators by strategy:');
  Object.entries(byStrategy)
    .sort((a, b) => b[1] - a[1])
    .forEach(([strategy, count]) => {
      console.log(`  ${strategy}: ${count}`);
    });

  return byStrategy;
}

/**
 * Example 10: Use in Ralph Loop
 */
export async function example10_ralphLoopIntegration() {
  const executeTool = async (serverId: string, toolName: string, args: any) => {
    return await mcpServerManager.executeTool(serverId, toolName, args);
  };

  // Simulated Playwright code from MCP
  let code = `
    await page.locator('div.product-card:nth-child(2)').click();
    await page.locator('#submit-button').click();
  `;

  // Get best locators
  const locators = await locatorIntelligence.getBestLocators(executeTool);

  // Replace with best locators
  let enhancedCode = code;

  // This is a simple example - in real implementation, use AST parsing
  if (locators.length > 0 && locators[0].element.role === 'button') {
    enhancedCode = code.replace(
      /locator\('[^']+'\)/g,
      locators[0].bestLocator
    );
  }

  console.log('Original code:', code);
  console.log('Enhanced code:', enhancedCode);

  return enhancedCode;
}

// Export all examples
export const examples = {
  example1_getAllLocators,
  example2_getSingleLocator,
  example3_enhanceAction,
  example4_useAPI,
  example5_generateTestCode,
  example6_filterByConfidence,
  example7_productList,
  example8_exportJSON,
  example9_compareStrategies,
  example10_ralphLoopIntegration
};

// Default export
export default examples;

