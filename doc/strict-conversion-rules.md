# STRICT PLAYWRIGHT TO TESTFLOW CONVERSION RULES

## CRITICAL: Complete Test Suite Structure Required

### ✅ CORRECT OUTPUT FORMAT
```json
{
  "id": "playwright-test-suite",
  "suiteName": "Playwright Test Suite",
  "type": "UI",
  "baseUrl": "",
  "testCases": [{
    "name": "Test Case Name",
    "type": "UI", 
    "testSteps": [
      {
        "id": "step-1",
        "keyword": "goto",
        "value": "https://playwright.dev/"
      },
      {
        "id": "step-2",
        "keyword": "click",
        "locator": {
          "strategy": "role",
          "value": "link",
          "options": {
            "name": "Get started"
          }
        }
      }
    ]
  }]
}
```

### ❌ WRONG OUTPUT FORMATS

#### Wrong: Array of Test Cases
```json
[
  {
    "name": "Test Case Name",
    "type": "UI",
    "testSteps": [...]
  }
]
```

#### Wrong: Options Outside Locator
```json
{
  "id": "step-2",
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "link"
  },
  "options": {
    "name": "Get started"
  }
}
```

## MANDATORY CONVERSION RULES

### Rule 1: Complete Test Suite Object
- MUST start with `id`, `suiteName`, `type` fields
- MUST contain `testCases` array
- NEVER return array of test cases directly

### Rule 2: Options Placement
- Options MUST be inside `locator.options`
- NEVER put options at step level
- Example: `"locator": {"strategy": "role", "value": "button", "options": {"name": "Submit"}}`

### Rule 3: Locator Structure
```json
{
  "locator": {
    "strategy": "role|text|label|testId|placeholder|css|xpath",
    "value": "element_value",
    "options": {
      "name": "optional_name",
      "exact": true
    }
  }
}
```

### Rule 4: Action Conversions
- `page.goto('url')` → `{"keyword": "goto", "value": "url"}` (NO locator)
- `page.getByRole('button').click()` → `{"keyword": "click", "locator": {...}}`
- `page.getByRole('input').fill('text')` → `{"keyword": "fill", "locator": {...}, "value": "text"}`
- `page.getByRole('input').press('Enter')` → `{"keyword": "press", "locator": {...}, "value": "Enter"}`

## EXAMPLES WITH CORRECT STRUCTURE

### Example 1: Simple Click
```javascript
// Input
await page.getByRole('button', { name: 'Submit' }).click();

// Output
{
  "id": "playwright-test-suite",
  "suiteName": "Playwright Test Suite", 
  "type": "UI",
  "baseUrl": "",
  "testCases": [{
    "name": "Test Case",
    "type": "UI",
    "testSteps": [{
      "id": "step-1",
      "keyword": "click",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {
          "name": "Submit"
        }
      }
    }]
  }]
}
```

### Example 2: Form Fill
```javascript
// Input
await page.getByLabel('Email').fill('test@example.com');

// Output
{
  "id": "playwright-test-suite",
  "suiteName": "Playwright Test Suite",
  "type": "UI", 
  "baseUrl": "",
  "testCases": [{
    "name": "Test Case",
    "type": "UI",
    "testSteps": [{
      "id": "step-1", 
      "keyword": "fill",
      "locator": {
        "strategy": "label",
        "value": "Email"
      },
      "value": "test@example.com"
    }]
  }]
}
```

## VALIDATION CHECKLIST

Before returning JSON, verify:
- [ ] Starts with complete test suite object (not array)
- [ ] Has `id`, `suiteName`, `type` fields at root level
- [ ] Contains `testCases` array with proper structure
- [ ] All options are inside `locator.options`, not at step level
- [ ] All actions except `goto` have `locator` field
- [ ] Fill and press actions have both `locator` and `value` fields