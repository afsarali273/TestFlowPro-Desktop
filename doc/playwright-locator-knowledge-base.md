# Playwright Locator to JSON Conversion Knowledge Base

## JSON Schema Definition

```typescript
interface LocatorOptions {
    name?: string | RegExp
    exact?: boolean
    checked?: boolean
    expanded?: boolean
    pressed?: boolean
    selected?: boolean
    level?: number
    hasText?: string | RegExp
    hasNotText?: string | RegExp
}

interface FilterDefinition {
    type: "hasText" | "has" | "hasNot"
    value?: string // For hasText type
    locator?: LocatorDefinition // For has/hasNot types
}

interface LocatorDefinition {
    strategy: "role" | "label" | "text" | "placeholder" | "altText" | "title" | "testId" | "css" | "xpath"
    // NOTE: Only "css" and "xpath" for CSS/XPath selectors
    // Convert id="value" to css="#value"
    // Convert class="value" to css=".value"
    // Convert attribute selectors to css="[attr=\"value\"]"
    value: string
    options?: LocatorOptions
    filter?: FilterDefinition
}

interface TestStep {
    id: string
    keyword: TestStepKeyword
    locator?: LocatorDefinition
    value?: string
    options?: any
}
```

## Basic Locator Conversions

### Role-based Locators
```javascript
// Playwright Code
page.getByRole('button')
page.getByRole('link')
page.getByRole('textbox')

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button"
  }
}
```

### Text-based Locators
```javascript
// Playwright Code
page.getByText('Sign up')
page.getByLabel('Email')
page.getByPlaceholder('Enter email')

// JSON Conversion
{
  "locator": {
    "strategy": "text",
    "value": "Sign up"
  }
}
```

### Test ID Locators
```javascript
// Playwright Code
page.getByTestId('submit-button')

// JSON Conversion - Use testId strategy for data-testid attributes
{
  "locator": {
    "strategy": "testId",
    "value": "submit-button"
  }
}

// Alternative CSS approach for data-testid
{
  "locator": {
    "strategy": "css",
    "value": "[data-testid=\"submit-button\"]"
  }
}
```

### CSS/XPath Locators - ONLY USE "css" or "xpath" strategies
```javascript
// Playwright Code - CSS Selectors
page.locator('.btn-primary')           // Class selector
page.locator('#submit-btn')            // ID selector  
page.locator('[data-test="login"]')    // Attribute selector
page.locator('button.primary')         // Element + class

// JSON Conversion - Always use "css" strategy
{
  "locator": {
    "strategy": "css",
    "value": ".btn-primary"
  }
}
{
  "locator": {
    "strategy": "css", 
    "value": "#submit-btn"
  }
}
{
  "locator": {
    "strategy": "css",
    "value": "[data-test=\"login\"]"
  }
}

// Playwright Code - XPath Selectors
page.locator('xpath=//button[@class="submit"]')
page.locator('xpath=//div[@id="content"]//button')
page.locator('xpath=//button[contains(text(), "Save")]')

// JSON Conversion - Always use "xpath" strategy
{
  "locator": {
    "strategy": "xpath",
    "value": "//button[@class=\"submit\"]"
  }
}
{
  "locator": {
    "strategy": "xpath",
    "value": "//div[@id=\"content\"]//button"
  }
}
{
  "locator": {
    "strategy": "xpath",
    "value": "//button[contains(text(), \"Save\")]"
  }
}
```

### IMPORTANT: No "id", "class", "attribute" strategies
```javascript
// WRONG - Don't use these strategies
{ "strategy": "id", "value": "submit-btn" }        // ❌ WRONG
{ "strategy": "class", "value": "btn-primary" }    // ❌ WRONG  
{ "strategy": "attribute", "value": "data-test" }  // ❌ WRONG

// CORRECT - Convert to CSS selectors
{ "strategy": "css", "value": "#submit-btn" }       // ✅ CORRECT
{ "strategy": "css", "value": ".btn-primary" }     // ✅ CORRECT
{ "strategy": "css", "value": "[data-test=\"login\"]" } // ✅ CORRECT
```

## Locator Options Conversions

### Name Option
```javascript
// Playwright Code
page.getByRole('button', { name: 'Subscribe' })
page.getByRole('button', { name: /submit/i })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Subscribe"
    }
  }
}
```

### Exact Match Option
```javascript
// Playwright Code
page.getByText('Sign up', { exact: true })

// JSON Conversion
{
  "locator": {
    "strategy": "text",
    "value": "Sign up",
    "options": {
      "exact": true
    }
  }
}
```

### HasText Option
```javascript
// Playwright Code
page.getByRole('button', { hasText: 'Save' })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "hasText": "Save"
    }
  }
}
```

### Multiple Options
```javascript
// Playwright Code
page.getByRole('button', { name: 'Submit', exact: true, hasText: 'Save' })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Submit",
      "exact": true,
      "hasText": "Save"
    }
  }
}
```

## Filter Conversions

### HasText Filter
```javascript
// Playwright Code
page.getByRole('button').filter({ hasText: 'Save' })
page.locator('div').filter({ hasText: /product/i })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "filter": {
      "type": "hasText",
      "value": "Save"
    }
  }
}
```

### Has Filter (Child Locator)
```javascript
// Playwright Code
page.getByRole('listitem').filter({ has: page.getByRole('button') })
page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Delete' }) })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filter": {
      "type": "has",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Delete"
        }
      }
    }
  }
}
```

### HasNot Filter (Negative Child Locator)
```javascript
// Playwright Code
page.getByRole('button').filter({ hasNot: page.getByText('Disabled') })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "button",
    "filter": {
      "type": "hasNot",
      "locator": {
        "strategy": "text",
        "value": "Disabled"
      }
    }
  }
}
```

## Complex Nested Examples

### Complex Filter with Options
```javascript
// Playwright Code
page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Say goodbye' }) })

// JSON Conversion
{
  "locator": {
    "strategy": "role",
    "value": "listitem",
    "filter": {
      "type": "has",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Say goodbye"
        }
      }
    }
  }
}
```

### Multiple Filters (Chained)
```javascript
// Playwright Code
page.getByRole('row').filter({ hasText: 'Product' }).filter({ has: page.getByRole('button', { name: 'Edit' }) })

// JSON Conversion (First filter only - chaining requires multiple steps)
{
  "locator": {
    "strategy": "role",
    "value": "row",
    "filter": {
      "type": "hasText",
      "value": "Product"
    }
  }
}
```

## Action Conversions

### Click Actions - CORRECT STRUCTURE
```javascript
// Playwright Code
await page.getByRole('button', { name: 'Submit' }).click()

// CORRECT JSON Conversion - options INSIDE locator
{
  "id": "step1",
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Submit"
    }
  }
}

// WRONG - options outside locator
{
  "id": "step1",
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button"
  },
  "options": {
    "name": "Submit"
  }
}
```

### Fill Actions
```javascript
// Playwright Code
await page.getByLabel('Email').fill('user@example.com')

// JSON Conversion
{
  "id": "step2",
  "keyword": "fill",
  "locator": {
    "strategy": "label",
    "value": "Email"
  },
  "value": "user@example.com"
}
```

### Assertion Actions
```javascript
// Playwright Code
await expect(page.getByText('Welcome')).toBeVisible()
await expect(page.getByRole('button')).toHaveText('Submit')

// JSON Conversion
{
  "id": "step3",
  "keyword": "assertVisible",
  "locator": {
    "strategy": "text",
    "value": "Welcome"
  }
}
```

## Conversion Patterns

### Pattern 1: Basic Locator
```
Input: page.getByRole('button')
Output: { "strategy": "role", "value": "button" }
```

### Pattern 2: Locator with Options
```
Input: page.getByRole('button', { name: 'Submit' })
Output: { "strategy": "role", "value": "button", "options": { "name": "Submit" } }
```

### Pattern 3: CSS Selector Conversion
```
Input: page.locator('#login-form')
Output: { "strategy": "css", "value": "#login-form" }

Input: page.locator('.btn-primary')
Output: { "strategy": "css", "value": ".btn-primary" }

Input: page.locator('[data-testid="submit"]')
Output: { "strategy": "css", "value": "[data-testid=\"submit\"]" }
```

### Pattern 4: XPath Selector Conversion
```
Input: page.locator('xpath=//button[@id="submit"]')
Output: { "strategy": "xpath", "value": "//button[@id=\"submit\"]" }

Input: page.locator('xpath=//div[contains(@class, "error")]')
Output: { "strategy": "xpath", "value": "//div[contains(@class, \"error\")]" }
```

### Pattern 5: Locator with Filter
```
Input: page.getByRole('button').filter({ hasText: 'Save' })
Output: { "strategy": "role", "value": "button", "filter": { "type": "hasText", "value": "Save" } }
```

### Pattern 6: Complex Filter Chain
```
Input: page.locator('section').filter({ hasText: 'Login now' }).locator('span').first()
Output: { "strategy": "css", "value": "section span", "filter": { "type": "hasText", "value": "Login now" } }
```

## FILTER EXAMPLES

### HasText Filter
```javascript
page.locator('div').filter({ hasText: 'Product' })
→ { "strategy": "css", "value": "div", "filter": { "type": "hasText", "value": "Product" } }
```

### Has Filter
```javascript
page.getByRole('row').filter({ has: page.getByRole('button') })
→ { "strategy": "role", "value": "row", "filter": { "type": "has", "locator": { "strategy": "role", "value": "button" } } }
```

### HasNot Filter
```javascript
page.getByRole('button').filter({ hasNot: page.getByText('Disabled') })
→ { "strategy": "role", "value": "button", "filter": { "type": "hasNot", "locator": { "strategy": "text", "value": "Disabled" } } }
``` page.getByRole('button').filter({ hasText: 'Save' })
Output: { "strategy": "role", "value": "button", "filter": { "type": "hasText", "value": "Save" } }
```

### Pattern 6: Complex Nested Filter
```
Input: page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Delete' }) })
Output: { 
  "strategy": "role", 
  "value": "listitem", 
  "filter": { 
    "type": "has", 
    "locator": { 
      "strategy": "role", 
      "value": "button", 
      "options": { "name": "Delete" } 
    } 
  } 
}
```

## Regex Patterns for Conversion

### Extract Role Locator
```regex
page\.getByRole\('([^']+)'(?:,\s*\{([^}]+)\})?\)
```

### Extract CSS Locator
```regex
page\.locator\('([^']+)'\)(?!\.filter)
```

### Extract XPath Locator
```regex
page\.locator\('xpath=([^']+)'\)
```

### Extract Filter
```regex
\.filter\(\{\s*([^:]+):\s*([^}]+)\s*\}\)
```

### Extract Options
```regex
\{\s*([^:]+):\s*'([^']+)'\s*\}
```

## Common Codegen Patterns

### Simple Click
```javascript
await page.getByRole('button', { name: 'Sign up' }).click();
```
→ `{ "keyword": "click", "locator": { "strategy": "role", "value": "button", "options": { "name": "Sign up" } } }`

### CSS Selector Click
```javascript
await page.locator('#submit-button').click();
await page.locator('.btn-primary').click();
await page.locator('[data-test="login-btn"]').click();
```
→ `{ "keyword": "click", "locator": { "strategy": "css", "value": "#submit-button" } }`
→ `{ "keyword": "click", "locator": { "strategy": "css", "value": ".btn-primary" } }`
→ `{ "keyword": "click", "locator": { "strategy": "css", "value": "[data-test=\"login-btn\"]" } }`

### XPath Selector Click
```javascript
await page.locator('xpath=//button[@id="submit"]').click();
await page.locator('xpath=//div[contains(@class, "modal")]//button').click();
```
→ `{ "keyword": "click", "locator": { "strategy": "xpath", "value": "//button[@id=\"submit\"]" } }`
→ `{ "keyword": "click", "locator": { "strategy": "xpath", "value": "//div[contains(@class, \"modal\")]//button" } }`

### Form Fill
```javascript
await page.getByLabel('Email').fill('test@example.com');
await page.locator('#email-input').fill('test@example.com');
```
→ `{ "keyword": "fill", "locator": { "strategy": "label", "value": "Email" }, "value": "test@example.com" }`
→ `{ "keyword": "fill", "locator": { "strategy": "css", "value": "#email-input" }, "value": "test@example.com" }`

### Complex Selection
```javascript
await page.getByRole('row').filter({ hasText: 'John' }).getByRole('button', { name: 'Edit' }).click();
```
→ Multiple steps with intermediate locators

## Strategy Mapping Summary

| Playwright Method | JSON Strategy | Example |
|------------------|---------------|----------|
| `getByRole()` | `"role"` | `{ "strategy": "role", "value": "button" }` |
| `getByText()` | `"text"` | `{ "strategy": "text", "value": "Sign up" }` |
| `getByLabel()` | `"label"` | `{ "strategy": "label", "value": "Email" }` |
| `getByTestId()` | `"testId"` | `{ "strategy": "testId", "value": "submit-btn" }` |
| `getByPlaceholder()` | `"placeholder"` | `{ "strategy": "placeholder", "value": "Enter email" }` |
| `locator('.class')` | `"css"` | `{ "strategy": "css", "value": ".btn-primary" }` |
| `locator('#id')` | `"css"` | `{ "strategy": "css", "value": "#submit-btn" }` |
| `locator('[attr]')` | `"css"` | `{ "strategy": "css", "value": "[data-test=\"login\"]" }` |
| `locator('xpath=...')` | `"xpath"` | `{ "strategy": "xpath", "value": "//button[@id=\"submit\"]" }` |

This knowledge base provides comprehensive patterns for converting any Playwright codegen output to the appropriate JSON structure for TestFlowPro.