# Playwright to JSON Examples

## Summary

The TestFlow Pro framework now supports complex Playwright locator patterns through enhanced JSON structure. Here are the key improvements:

### Enhanced Type Definitions

```typescript
// New enhanced locator definition
export interface LocatorDefinition {
  strategy: "role" | "label" | "text" | "placeholder" | "altText" | "title" | "testId" | "css" | "xpath" | "locator"
  value: string
  options?: LocatorOptions
  filter?: FilterDefinition // Single filter (backward compatibility)
  filters?: FilterDefinition[] // Multiple filters for complex scenarios
  chain?: ChainStep[] // Chain operations for complex locator building
  index?: "first" | "last" | number
}

// New filter types
export type FilterType = "hasText" | "hasNotText" | "has" | "hasNot" | "visible" | "hidden"

// New chain operations
export interface ChainStep {
  operation: "filter" | "locator" | "nth" | "first" | "last"
  locator?: LocatorDefinition
  filter?: FilterDefinition
  index?: number
}
```

## Simple Examples

### Basic Locators
```javascript
// Playwright
await page.getByLabel('User Name').fill('John');
```

```json
{
  "keyword": "fill",
  "locator": {
    "strategy": "label",
    "value": "User Name"
  },
  "value": "John"
}
```

### Raw Locators
```javascript
// Playwright
await page.locator('css=button').click();
await page.locator('xpath=//button').click();
```

```json
{
  "keyword": "click",
  "locator": {
    "strategy": "locator",
    "value": "css=button"
  }
}

{
  "keyword": "click",
  "locator": {
    "strategy": "locator",
    "value": "xpath=//button"
  }
}
```

## Complex Chaining Examples

### Single Filter Chain
```javascript
// Playwright
await page
    .getByRole('listitem')
    .filter({ hasText: 'Product 2' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
```

```json
{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "chain": [
      {
        "operation": "filter",
        "filter": {
          "type": "hasText",
          "value": "Product 2"
        }
      },
      {
        "operation": "locator",
        "locator": {
          "strategy": "role",
          "value": "button",
          "options": { "name": "Add to cart" }
        }
      }
    ]
  }
}
```

### Multiple Filters
```javascript
// Playwright
await page
    .getByRole('listitem')
    .filter({ hasText: 'Mary' })
    .filter({ has: page.getByRole('button', { name: 'Say goodbye' }) })
    .screenshot({ path: 'screenshot.png' });
```

```json
{
  "keyword": "screenshot",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filters": [
      {
        "type": "hasText",
        "value": "Mary"
      },
      {
        "type": "has",
        "locator": {
          "strategy": "role",
          "value": "button",
          "options": { "name": "Say goodbye" }
        }
      }
    ]
  },
  "value": "screenshot.png"
}
```

### Complex E-commerce Example
```javascript
// Playwright
await page
    .getByRole('listitem')
    .filter({ hasText: 'Product 2' })
    .filter({ hasNotText: 'Out of stock' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
```

```json
{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filters": [
      {
        "type": "hasText",
        "value": "Product 2"
      },
      {
        "type": "hasNotText",
        "value": "Out of stock"
      }
    ],
    "chain": [
      {
        "operation": "locator",
        "locator": {
          "strategy": "role",
          "value": "button",
          "options": { "name": "Add to cart" }
        }
      }
    ]
  }
}
```

## Backend Support

The UI test runner (`src/ui-test.ts`) now supports:

1. **Raw Locator Strategy**: `css=button`, `xpath=//button`
2. **Multiple Filters**: Array of filter conditions
3. **Chain Operations**: Complex locator building
4. **Enhanced Filter Types**: `hasText`, `hasNotText`, `has`, `hasNot`, `visible`, `hidden`

## UI Editor Support

The test case editor provides:

1. **Basic Locator UI**: Strategy, value, and index selection
2. **Quick Filter**: Single filter for common scenarios
3. **Advanced Notice**: Guidance to use JSON view for complex patterns
4. **Raw Locator Support**: New "Raw Locator" strategy option

## Migration Path

1. **Existing Tests**: Continue to work with backward compatibility
2. **Simple Enhancements**: Use the UI editor for basic improvements
3. **Complex Patterns**: Use JSON view or import from Playwright code
4. **Documentation**: Reference the mapping guide for conversion patterns

The framework now handles all the complex Playwright locator patterns you provided while maintaining backward compatibility and providing a clear upgrade path.