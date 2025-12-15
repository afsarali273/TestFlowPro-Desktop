# Playwright Locator to JSON Mapping Guide

This guide shows how to convert complex Playwright locator patterns into our JSON-based test framework format.

## Basic Locators

### Simple Locators
```javascript
// Playwright
await page.getByLabel('User Name').fill('John');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByText('Welcome, John!').toBeVisible();
```

```json
// JSON Format
{
  "keyword": "fill",
  "locator": {
    "strategy": "label",
    "value": "User Name"
  },
  "value": "John"
}

{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": { "name": "Sign in" }
  }
}

{
  "keyword": "assertVisible",
  "locator": {
    "strategy": "text",
    "value": "Welcome, John!"
  }
}
```

### Locators with Options
```javascript
// Playwright
await expect(page.getByText('Welcome, John', { exact: true })).toBeVisible();
await expect(page.getByText(/welcome, [A-Za-z]+$/i)).toBeVisible();
```

```json
// JSON Format
{
  "keyword": "assertVisible",
  "locator": {
    "strategy": "text",
    "value": "Welcome, John",
    "options": { "exact": true }
  }
}

{
  "keyword": "assertVisible",
  "locator": {
    "strategy": "text",
    "value": "/welcome, [A-Za-z]+$/i"
  }
}
```

### Other Locator Types
```javascript
// Playwright
await page.getByPlaceholder('name@example.com').fill('playwright@microsoft.com');
await page.getByAltText('playwright logo').click();
await page.getByTitle('Issues count').toHaveText('25 issues');
await page.getByTestId('directions').click();
```

```json
// JSON Format
{
  "keyword": "fill",
  "locator": {
    "strategy": "placeholder",
    "value": "name@example.com"
  },
  "value": "playwright@microsoft.com"
}

{
  "keyword": "click",
  "locator": {
    "strategy": "altText",
    "value": "playwright logo"
  }
}

{
  "keyword": "assertHaveText",
  "locator": {
    "strategy": "title",
    "value": "Issues count"
  },
  "value": "25 issues"
}

{
  "keyword": "click",
  "locator": {
    "strategy": "testId",
    "value": "directions"
  }
}
```

## CSS and XPath Locators

```javascript
// Playwright
await page.locator('css=button').click();
await page.locator('xpath=//button').click();
await page.locator('button').click();
await page.locator('//button').click();
```

```json
// JSON Format
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

{
  "keyword": "click",
  "locator": {
    "strategy": "css",
    "value": "button"
  }
}

{
  "keyword": "click",
  "locator": {
    "strategy": "xpath",
    "value": "//button"
  }
}
```

## Simple Filtering

### hasText Filter
```javascript
// Playwright
await page.locator('x-details', { hasText: 'Details' }).click();
await expect(page.locator('x-details')).toContainText('Details');
```

```json
// JSON Format
{
  "keyword": "click",
  "locator": {
    "strategy": "css",
    "value": "x-details",
    "options": { "hasText": "Details" }
  }
}

{
  "keyword": "assertContainsText",
  "locator": {
    "strategy": "css",
    "value": "x-details"
  },
  "value": "Details"
}
```

## Complex Chaining and Filtering

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
// JSON Format
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

### Regex Filter Chain
```javascript
// Playwright
await page
    .getByRole('listitem')
    .filter({ hasText: /Product 2/ })
    .getByRole('button', { name: 'Add to cart' })
    .click();
```

```json
// JSON Format
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
          "value": "/Product 2/"
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

### hasNotText Filter
```javascript
// Playwright
await expect(page.getByRole('listitem').filter({ hasNotText: 'Out of stock' })).toHaveCount(5);
```

```json
// JSON Format
{
  "keyword": "assertHaveCount",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filter": {
      "type": "hasNotText",
      "value": "Out of stock"
    }
  },
  "value": "5"
}
```

### Complex has Filter
```javascript
// Playwright
await page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Product 2' }) })
    .getByRole('button', { name: 'Add to cart' })
    .click();
```

```json
// JSON Format
{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "chain": [
      {
        "operation": "filter",
        "filter": {
          "type": "has",
          "locator": {
            "strategy": "role",
            "value": "heading",
            "options": { "name": "Product 2" }
          }
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

### hasNot Filter
```javascript
// Playwright
await expect(page
    .getByRole('listitem')
    .filter({ hasNot: page.getByText('Product 2') }))
    .toHaveCount(1);
```

```json
// JSON Format
{
  "keyword": "assertHaveCount",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filter": {
      "type": "hasNot",
      "locator": {
        "strategy": "text",
        "value": "Product 2"
      }
    }
  },
  "value": "1"
}
```

### Visibility Filter
```javascript
// Playwright
await page.locator('button').filter({ visible: true }).click();
```

```json
// JSON Format
{
  "keyword": "click",
  "locator": {
    "strategy": "css",
    "value": "button",
    "filter": {
      "type": "visible"
    }
  }
}
```

## Multiple Filters

### Multiple Filter Chain
```javascript
// Playwright
await page
    .getByRole('listitem')
    .filter({ hasText: 'Mary' })
    .filter({ has: page.getByRole('button', { name: 'Say goodbye' }) })
    .screenshot({ path: 'screenshot.png' });
```

```json
// JSON Format
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

## Index Selection

### nth() Selection
```javascript
// Playwright
const banana = await page.getByRole('listitem').nth(1);
```

```json
// JSON Format
{
  "keyword": "getText",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "index": 1
  },
  "store": {
    "banana": "$text"
  }
}
```

### first() and last()
```javascript
// Playwright
await page.getByRole('listitem').first().click();
await page.getByRole('listitem').last().click();
```

```json
// JSON Format
{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "index": "first"
  }
}

{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "index": "last"
  }
}
```

## Array Assertions

### toHaveText with Array
```javascript
// Playwright
await expect(page.getByRole('listitem')).toHaveText(['apple', 'banana', 'orange']);
```

```json
// JSON Format
{
  "keyword": "assertHaveText",
  "locator": {
    "strategy": "role",
    "value": "listitem"
  },
  "value": ["apple", "banana", "orange"]
}
```

## Complex Real-World Examples

### E-commerce Product Selection
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
// JSON Format
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

### Table Row Selection
```javascript
// Playwright
const rowLocator = page.getByRole('listitem');
await rowLocator
    .filter({ hasText: 'Mary' })
    .filter({ has: page.getByRole('button', { name: 'Say goodbye' }) })
    .getByRole('button', { name: 'Delete' })
    .click();
```

```json
// JSON Format
{
  "keyword": "click",
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
    ],
    "chain": [
      {
        "operation": "locator",
        "locator": {
          "strategy": "role",
          "value": "button",
          "options": { "name": "Delete" }
        }
      }
    ]
  }
}
```

## Migration Tips

1. **Start Simple**: Begin with basic locators and gradually add complexity
2. **Use Filters**: Prefer `filters` array for multiple conditions
3. **Chain Operations**: Use `chain` array for complex locator building
4. **Index Last**: Apply `index` after all filters and chains
5. **Test Incrementally**: Build complex locators step by step

## Backward Compatibility

The enhanced structure maintains backward compatibility:
- Single `filter` still works alongside new `filters` array
- Existing `index` property continues to work
- All existing locator strategies remain supported