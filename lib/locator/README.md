# Playwright Locator Intelligence

**Intelligent Playwright locator generation using accessibility-first approach with filtering and chaining support.**

## Overview

This module enhances your Playwright MCP server to return best-practice locators instead of raw CSS selectors. It follows Playwright's official recommendations and supports advanced filtering patterns.

## Features

✅ **Accessibility-First**: Prioritizes `getByRole`, `getByLabel`, `getByPlaceholder`  
✅ **Filtering Support**: Generates `.filter({ hasText, hasNotText, has })` patterns  
✅ **Chaining Support**: Creates complex chained locators for specificity  
✅ **Exact Matching**: Uses `{ exact: true }` option for precise text matches  
✅ **Regex Patterns**: Generates regex for flexible matching (`/submit/i`)  
✅ **Variable Extraction**: Suggests reusable locator variables  
✅ **Stability Rules**: Rejects unstable selectors (nth-child, hashes, etc.)  
✅ **Deterministic Ranking**: Consistent, predictable locator selection  

## Architecture

```
lib/locator/
├── types.ts          # TypeScript type definitions
├── extractor.ts      # Page element metadata extraction
├── candidates.ts     # Locator candidate generation
├── ranker.ts         # Deterministic ranking algorithm
├── index.ts          # Main orchestrator service
├── mcp-tool.ts       # MCP tool integration helpers
├── INTEGRATION.md    # Detailed integration guide
└── README.md         # This file
```

## Quick Start

### 1. Import and Use

```typescript
import { locatorIntelligence } from '@/lib/locator';
import { mcpServerManager } from '@/lib/services/mcp-server-manager';

// Create executor
const executeTool = async (serverId: string, toolName: string, args: any) => {
  return await mcpServerManager.executeTool(serverId, toolName, args);
};

// Get best locators
const locators = await locatorIntelligence.getBestLocators(executeTool);

console.log(locators[0].bestLocator);
// Output: getByRole('button', { name: 'Sign up' })
```

### 2. API Usage

```bash
POST /api/locator-intelligence
{
  "action": "get-best-locators",
  "options": {
    "enableFiltering": true,
    "minConfidence": 80
  }
}
```

## Locator Examples

### Basic Locators

```typescript
// Heading
getByRole('heading', { name: 'Sign up' })

// Button with regex
getByRole('button', { name: /submit/i })

// Checkbox
getByRole('checkbox', { name: 'Subscribe' })

// Text with exact match
getByText('Welcome, John', { exact: true })
```

### Filtered Locators

```typescript
// Filter list item by text
getByRole('listitem').filter({ hasText: 'Product 2' })

// Filter out items
getByRole('listitem').filter({ hasNotText: 'Out of stock' })

// Filter by nested element
getByRole('listitem').filter({ 
  has: page.getByRole('heading', { name: 'Product 2' }) 
})
```

### Chained Locators

```typescript
// Find button inside specific list item
page
  .getByRole('listitem')
  .filter({ hasText: 'Product 2' })
  .getByRole('button', { name: 'Add to cart' })
```

### Reusable Variables

```typescript
// Store complex locator
const product = page.getByRole('listitem').filter({ hasText: 'Product 2' });

// Reuse multiple times
await product.getByRole('button', { name: 'Add to cart' }).click();
await expect(product).toHaveCount(1);
```

## Locator Priority

Locators are ranked in this strict order:

1. **getByRole+filter** - `getByRole('role').filter({ hasText: 'text' })`
2. **getByRole** - `getByRole('button', { name: 'Submit' })`
3. **getByLabel** - `getByLabel('Email address')`
4. **getByPlaceholder** - `getByPlaceholder('Enter email')`
5. **getByText** - `getByText('Welcome', { exact: true })`
6. **chained** - Complex chained locators
7. **getByTestId** - `getByTestId('submit-button')`
8. **id** - `locator('#stable-id')`
9. **css** - `locator('button[type="submit"]')` (last resort)

## Configuration

```typescript
interface LocatorOptions {
  includeAlternatives?: boolean;      // Include alternative locators
  minConfidence?: number;             // Min confidence (0-100)
  excludeStrategies?: LocatorStrategy[];  // Exclude specific strategies
  enableFiltering?: boolean;          // Enable .filter() (default: true)
  enableChaining?: boolean;           // Enable chaining (default: true)
  exactMatch?: boolean;              // Use exact: true for text
}
```

## API Reference

### Get All Locators

```typescript
const locators = await locatorIntelligence.getBestLocators(
  executeTool,
  {
    enableFiltering: true,
    minConfidence: 80
  }
);
```

### Get Single Locator

```typescript
const locator = await locatorIntelligence.getBestLocatorForElement(
  executeTool,
  'button.submit',  // CSS selector
  { enableFiltering: true }
);
```

### Enhance Playwright Action

```typescript
const enhanced = await locatorIntelligence.enhancePlaywrightAction(
  executeTool,
  {
    type: 'click',
    selector: 'button.submit'
  }
);

console.log(enhanced.locator);
// getByRole('button', { name: 'Submit' })
```

## Output Format

```typescript
interface BestLocator {
  element: ElementMetadata;
  bestLocator: string;           // "getByRole('button', { name: 'Submit' })"
  strategy: LocatorStrategy;     // "getByRole"
  confidence: number;            // 95
  alternatives: string[];        // ["getByText('Submit')", ...]
  reasoning: string;             // "Role with accessible name (most stable)"
  usesFiltering?: boolean;       // true if uses .filter()
  usesChaining?: boolean;        // true if chained
}
```

## Integration Points

### 1. Copilot SDK Context

Add to your Copilot prompts:

```typescript
const locatorGuidance = `
Use Playwright best-practice locators:
- getByRole('role', { name: 'text' })
- .filter({ hasText: 'text' })
- .filter({ has: page.getByRole() })
- getByText('text', { exact: true })
- Regex: /submit/i
`;
```

### 2. Ralph Loop Code Generation

Enhance generated code:

```typescript
// After Playwright MCP execution
const locators = await locatorIntelligence.getBestLocators(executeTool);

// Replace raw selectors with best locators
code = enhanceCodeWithLocators(code, locators);
```

### 3. MCP Tool Registration

Expose as MCP tool:

```typescript
import { LOCATOR_INTELLIGENCE_TOOL } from '@/lib/locator/mcp-tool';

// Add to your MCP server tools
tools.push(LOCATOR_INTELLIGENCE_TOOL);
```

## How It Works

### 1. Extraction

Uses `page.evaluate()` to extract element metadata:

```javascript
{
  tag: 'button',
  role: 'button',
  accessibleName: 'Submit',
  text: 'Submit',
  parentRole: 'form',
  parentText: 'Sign up form'
}
```

### 2. Candidate Generation

Generates all possible locators:

```typescript
[
  { locator: "getByRole('button', { name: 'Submit' })", confidence: 95 },
  { locator: "getByRole('button').filter({ hasText: 'Submit' })", confidence: 87 },
  { locator: "getByText('Submit')", confidence: 80 },
  { locator: "locator('button[type=\"submit\"]')", confidence: 50 }
]
```

### 3. Ranking

Sorts by:
1. Strategy priority (getByRole > getByText > CSS)
2. Confidence score (higher is better)

Returns best locator + alternatives.

## Stability Rules

The system **rejects** unstable patterns:

❌ `:nth-child(2)`  
❌ `.class-abc123` (hash-like classes)  
❌ `div > div > div > button` (deep nesting)  
❌ `#react-123` (auto-generated IDs)  
❌ Dynamic content (dates, prices, timestamps)  

It **prefers**:

✅ Semantic roles  
✅ Accessible names  
✅ Stable attributes  
✅ Filtering for specificity  

## Error Handling

```typescript
try {
  const locators = await locatorIntelligence.getBestLocators(executeTool);
} catch (error) {
  if (error.message.includes('not connected')) {
    // Playwright MCP server not connected
    await mcpServerManager.connectServer('playwright');
  } else if (error.message.includes('No interactive elements')) {
    // Page has no interactive elements
    console.warn('Page has no buttons, inputs, or links');
  } else {
    // Other error
    console.error('Locator intelligence failed:', error);
  }
}
```

## Best Practices

### DO:
✅ Enable filtering for better specificity  
✅ Use exact match for stable text  
✅ Store complex locators in variables  
✅ Prefer accessibility roles  
✅ Test locators in multiple contexts  

### DON'T:
❌ Disable filtering unless necessary  
❌ Use CSS as first choice  
❌ Rely on auto-generated IDs  
❌ Use nth-child or indices  
❌ Match on dynamic content  

## Examples from Real Pages

### Sign Up Form

```typescript
// Input field
getByLabel('Email address')
getByPlaceholder('you@example.com')

// Checkbox
getByRole('checkbox', { name: 'I agree to terms' })

// Submit button
getByRole('button', { name: /sign up/i })
```

### Product List

```typescript
// Find specific product
const product = page
  .getByRole('listitem')
  .filter({ hasText: 'Laptop Pro' });

// Click add to cart
await product.getByRole('button', { name: 'Add to cart' }).click();

// Verify
await expect(product).toBeVisible();
```

### Navigation

```typescript
// Main navigation
getByRole('navigation', { name: 'Main' })

// Link inside
getByRole('navigation')
  .getByRole('link', { name: 'Products' })
```

## Performance

- **Extraction**: ~100-200ms (depends on page size)
- **Candidate Generation**: <1ms per element
- **Ranking**: <1ms per element
- **Total**: ~100-300ms for typical page

## Testing

```bash
# Run tests (if you add them)
npm test lib/locator

# Manual testing
curl http://localhost:3000/api/locator-intelligence

# With Playwright page
curl -X POST http://localhost:3000/api/locator-intelligence \
  -H "Content-Type: application/json" \
  -d '{"action":"get-best-locators"}'
```

## Troubleshooting

### "Playwright MCP server not connected"
```typescript
await mcpServerManager.connectServer('playwright');
```

### "No interactive elements found"
- Page may not be loaded
- Check that elements exist
- Verify element visibility

### Low confidence scores
- Add aria-labels to elements
- Use semantic HTML roles
- Add data-testid attributes

### Filtering not working
- Check parent context exists
- Enable filtering: `{ enableFiltering: true }`
- Verify parent has semantic role

## Contributing

Enhance the system by:

1. Adding new locator strategies
2. Improving confidence scoring
3. Adding more filtering patterns
4. Expanding test coverage

## License

Part of TestFlowPro - All rights reserved

---

**Built with ❤️ for better test automation**

