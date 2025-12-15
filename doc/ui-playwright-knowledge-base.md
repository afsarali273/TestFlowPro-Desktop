# UI Testing Knowledge Base - Playwright to TestFlowPro JSON

This knowledge base is specifically for **UI testing** using Playwright. It provides conversion patterns from Playwright code to TestFlowPro JSON format.

## Locator Strategies (UI Only)

### Role-based Locators
```javascript
// Playwright
await page.getByRole('button').click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button"
  }
}
```

### Text-based Locators
```javascript
// Playwright
await page.getByText('Sign up').click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
  "locator": {
    "strategy": "text",
    "value": "Sign up"
  }
}
```

### Label-based Locators
```javascript
// Playwright
await page.getByLabel('Email').fill('test@example.com');
```
```json
// TestFlowPro JSON
{
  "keyword": "fill",
  "locator": {
    "strategy": "label",
    "value": "Email"
  },
  "value": "test@example.com"
}
```

## UI Keywords Only

### Browser Management
- `openBrowser`, `closeBrowser`, `closePage`, `maximize`, `minimize`, `setViewportSize`
- `switchToFrame`, `switchToMainFrame`, `acceptAlert`, `dismissAlert`, `getAlertText`

### Navigation
- `goto`, `waitForNavigation`, `reload`, `goBack`, `goForward`, `refresh`

### Actions
- `click`, `dblClick`, `rightClick`, `type`, `fill`, `press`, `clear`
- `select`, `check`, `uncheck`, `setChecked`, `hover`, `focus`
- `scrollIntoViewIfNeeded`, `scrollTo`, `scrollUp`, `scrollDown`
- `dragAndDrop`, `uploadFile`, `downloadFile`

### Data Extraction (with Variable Storage)
- `getText`, `getAttribute`, `getTitle`, `getUrl`, `getValue`, `getCount`

### Assertions
- `assertText`, `assertVisible`, `assertHidden`, `assertEnabled`, `assertDisabled`
- `assertCount`, `assertValue`, `assertAttribute`, `assertHaveText`, `assertHaveCount`
- `assertChecked`, `assertUnchecked`, `assertContainsText`, `assertUrl`, `assertTitle`

### Wait Operations
- `waitForSelector`, `waitForTimeout`, `waitForFunction`, `waitForElement`, `waitForText`

### Utilities
- `screenshot`, `customStep`, `customCode`

## Filter Patterns (UI Only)

### hasText Filter
```javascript
// Playwright
await page.getByRole('button').filter({ hasText: 'Save' }).click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
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

### has Filter (Nested Locator)
```javascript
// Playwright
await page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Delete' }) }).click();
```
```json
// TestFlowPro JSON
{
  "keyword": "click",
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

## Conversion Rules (UI Only)

1. **Locator Strategy Mapping**:
   - `getByRole` → `"strategy": "role"`
   - `getByText` → `"strategy": "text"`
   - `getByLabel` → `"strategy": "label"`
   - `getByTestId` → `"strategy": "testId"`
   - `getByPlaceholder` → `"strategy": "placeholder"`
   - `locator` → `"strategy": "css"` or `"strategy": "xpath"`

2. **Action Mapping**:
   - `.click()` → `"keyword": "click"`
   - `.fill(value)` → `"keyword": "fill", "value": value`
   - `.check()` → `"keyword": "check"`
   - `.selectOption(value)` → `"keyword": "select", "value": value`

3. **Assertion Mapping**:
   - `expect().toBeVisible()` → `"keyword": "assertVisible"`
   - `expect().toHaveText(text)` → `"keyword": "assertHaveText", "value": text`
   - `expect().toHaveCount(count)` → `"keyword": "assertHaveCount", "value": count`

## Complex UI Scenarios

### Multi-step Form
```javascript
// Playwright
await page.goto('https://example.com/form');
await page.getByLabel('First Name').fill('John');
await page.getByRole('button', { name: 'Submit' }).click();
```

```json
// TestFlowPro JSON
[
  {
    "keyword": "goto",
    "value": "https://example.com/form"
  },
  {
    "keyword": "fill",
    "locator": {
      "strategy": "label",
      "value": "First Name"
    },
    "value": "John"
  },
  {
    "keyword": "click",
    "locator": {
      "strategy": "role",
      "value": "button",
      "options": {
        "name": "Submit"
      }
    }
  }
]
```

## Variable Storage (UI Only)

### Extract Text Content
```javascript
// Playwright
const title = await page.locator('h1').textContent();
```
```json
// TestFlowPro JSON
{
  "keyword": "getText",
  "locator": {
    "strategy": "css",
    "value": "h1"
  },
  "store": {
    "pageTitle": "$text"
  }
}
```

### Extract Attribute Value
```javascript
// Playwright
const userId = await page.locator('#user').getAttribute('data-id');
```
```json
// TestFlowPro JSON
{
  "keyword": "getAttribute",
  "locator": {
    "strategy": "css",
    "value": "#user"
  },
  "value": "data-id",
  "store": {
    "userId": "$attribute"
  }
}
```

### Extract Page Title
```javascript
// Playwright
const title = await page.title();
```
```json
// TestFlowPro JSON
{
  "keyword": "getTitle",
  "store": {
    "pageTitle": "$title"
  }
}
```

### Extract Current URL
```javascript
// Playwright
const url = page.url();
```
```json
// TestFlowPro JSON
{
  "keyword": "getUrl",
  "store": {
    "currentUrl": "$url"
  }
}
```

### Extract Input Value
```javascript
// Playwright
const value = await page.locator('#input').inputValue();
```
```json
// TestFlowPro JSON
{
  "keyword": "getValue",
  "locator": {
    "strategy": "css",
    "value": "#input"
  },
  "store": {
    "inputValue": "$value"
  }
}
```

### Count Elements
```javascript
// Playwright
const count = await page.locator('.item').count();
```
```json
// TestFlowPro JSON
{
  "keyword": "getCount",
  "locator": {
    "strategy": "css",
    "value": ".item"
  },
  "store": {
    "itemCount": "$count"
  }
}
```

### Use Stored Variables
```javascript
// Playwright
await page.fill('#search', title);
await page.goto(`/user/${userId}`);
```
```json
// TestFlowPro JSON
[
  {
    "keyword": "fill",
    "locator": {
      "strategy": "css",
      "value": "#search"
    },
    "value": "{{pageTitle}}"
  },
  {
    "keyword": "goto",
    "value": "/user/{{userId}}"
  }
]
```

### Variable Storage Rules
1. **getText**: Always use `"store": {"variableName": "$text"}`
2. **getAttribute**: Always use `"store": {"variableName": "$attribute"}` and specify attribute name in `"value"`
3. **getTitle**: Always use `"store": {"variableName": "$title"}`
4. **getUrl**: Always use `"store": {"variableName": "$url"}`
5. **getValue**: Always use `"store": {"variableName": "$value"}`
6. **getCount**: Always use `"store": {"variableName": "$count"}`
7. **Variable Usage**: Use `{{variableName}}` syntax in any `"value"` field
8. **Scope**: Variables persist across all test steps in the same test case

## Important Notes

- This knowledge base is **UI testing specific** - do not apply these patterns to API testing
- All examples use Playwright locators and UI interactions
- Filters and options are specific to DOM element selection
- Keywords are focused on browser automation actions
- Variable storage enables data-driven UI testing scenarios

## Custom Code (Complex Operations)

For complex Playwright operations that cannot be represented with standard keywords, use the `customCode` keyword:

### Multi-step Operations
```javascript
// Playwright
await page.locator('.item').nth(0).click();
await page.locator('.item').nth(1).click();
```
```json
// TestFlowPro JSON
{
  "keyword": "customCode",
  "customCode": "await page.locator('.item').nth(0).click();\nawait page.locator('.item').nth(1).click();"
}
```

### Complex Assertions
```javascript
// Playwright
const count = await page.locator('.product').count();
expect(count).toBeGreaterThan(5);
```
```json
// TestFlowPro JSON
{
  "keyword": "customCode",
  "customCode": "const count = await page.locator('.product').count();\nexpect(count).toBeGreaterThan(5);"
}
```

### Custom Wait Conditions
```javascript
// Playwright
await page.waitForFunction(() => {
  return document.querySelectorAll('.loaded').length > 3;
});
```
```json
// TestFlowPro JSON
{
  "keyword": "customCode",
  "customCode": "await page.waitForFunction(() => {\n  return document.querySelectorAll('.loaded').length > 3;\n});"
}
```

### Available Variables in Custom Code
- `page`: Playwright Page object
- `browser`: Playwright Browser object
- `expect`: Playwright expect function
- `console`: Console object for logging

### When to Use Custom Code
- Complex multi-step operations that can't be broken down
- Advanced Playwright methods not covered by keywords
- Custom wait conditions or complex assertions
- Multiple element interactions in sequence
- JavaScript execution within page context