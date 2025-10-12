import { Document } from '@langchain/core/documents'

export const UIConversionExamples = {
  getExamples(): Document[] {
    return [
      new Document({
        pageContent: `Playwright to TestFlow Examples:

BASIC ACTIONS:
page.goto('https://example.com') → {"keyword":"goto","value":"https://example.com"}
page.getByRole('button').click() → {"keyword":"click","locator":{"strategy":"role","value":"button"}}
page.getByRole('button',{name:'Submit'}).click() → {"keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Submit"}}}
page.getByRole('heading',{name:'Welcome'}).click() → {"keyword":"click","locator":{"strategy":"role","value":"heading","options":{"name":"Welcome"}}}
page.getByText('Welcome').click() → {"keyword":"click","locator":{"strategy":"text","value":"Welcome"}}
page.getByText('Search',{exact:true}).click() → {"keyword":"click","locator":{"strategy":"text","value":"Search","options":{"exact":true}}}
await expect(page.getByText('Search',{exact:true})).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"text","value":"Search","options":{"exact":true}}}
page.getByLabel('Email').fill('test@example.com') → {"keyword":"fill","locator":{"strategy":"label","value":"Email"},"value":"test@example.com"}
page.getByPlaceholder('Enter email').fill('user@test.com') → {"keyword":"fill","locator":{"strategy":"placeholder","value":"Enter email"},"value":"user@test.com"}
page.getByTestId('submit-btn').click() → {"keyword":"click","locator":{"strategy":"testId","value":"submit-btn"}}

CSS SELECTORS:
page.locator('#submit-btn').click() → {"keyword":"click","locator":{"strategy":"css","value":"#submit-btn"}}
page.locator('.btn-primary').click() → {"keyword":"click","locator":{"strategy":"css","value":".btn-primary"}}
page.locator('[data-test="login"]').click() → {"keyword":"click","locator":{"strategy":"css","value":"[data-test=\"login\"]"}}
page.locator('.listingCard').first().click() → {"keyword":"click","locator":{"strategy":"css","value":".listingCard"}}
page.locator('button:first-child').click() → {"keyword":"click","locator":{"strategy":"css","value":"button"}}
page.locator('div > span').click() → {"keyword":"click","locator":{"strategy":"css","value":"div > span"}}

FILTERS & COMPLEX SELECTORS:
page.locator('section').filter({hasText:'Login now'}).locator('span').first().click() → {"keyword":"click","locator":{"strategy":"css","value":"section span","filter":{"type":"hasText","value":"Login now"}}}

FILTER STRUCTURE RULES:
hasText filter → {"filter":{"type":"hasText","value":"text"}}
has filter → {"filter":{"type":"has","locator":{"strategy":"role","value":"button"}}}
hasNot filter → {"filter":{"type":"hasNot","locator":{"strategy":"text","value":"Disabled"}}}
page.getByText('Login now to get up to 25%').click() → {"keyword":"click","locator":{"strategy":"text","value":"Login now to get up to 25%"}}
page.getByRole('listitem').filter({has:page.getByRole('button')}).click() → {"keyword":"click","locator":{"strategy":"role","value":"listitem","filter":{"type":"has","locator":{"strategy":"role","value":"button"}}}}
page.getByRole('row').filter({hasText:'Product'}).click() → {"keyword":"click","locator":{"strategy":"role","value":"row","filter":{"type":"hasText","value":"Product"}}}
expect(page.getByText('Hold on, we\'re fetching')).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"text","value":"Hold on, we're fetching"}}

TAB/POPUP HANDLING:
const page1Promise = page.waitForEvent('popup'); await page.locator('.object-cover').first().click(); const page1 = await page1Promise; → {"keyword":"clickAndWaitForPopup","locator":{"strategy":"css","value":".object-cover"}}
Switch to first tab: {"keyword":"switchToTab","value":"0"}
Switch to second tab: {"keyword":"switchToTab","value":"1"}
All operations after clickAndWaitForPopup automatically happen in the new tab

ASSERTIONS:
expect(page.getByText('Success')).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"text","value":"Success"}}
expect(page.getByText('Search',{exact:true})).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"text","value":"Search","options":{"exact":true}}}
expect(page.getByRole('button')).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"role","value":"button"}}
expect(page.getByRole('heading',{name:'Title'})).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"role","value":"heading","options":{"name":"Title"}}}
expect(page.locator('#root')).toContainText('Flights from Dubai') → {"keyword":"assertText","locator":{"strategy":"css","value":"#root"},"value":"Flights from Dubai"}
expect(page.getByRole('textbox',{name:'Email'})).toHaveValue('test@example.com') → {"keyword":"assertValue","locator":{"strategy":"role","value":"textbox","options":{"name":"Email"}},"value":"test@example.com"}
expect(page.getByRole('checkbox')).toBeChecked() → {"keyword":"assertEnabled","locator":{"strategy":"role","value":"checkbox"}}
expect(page.locator('.error')).toBeHidden() → {"keyword":"assertHidden","locator":{"strategy":"css","value":".error"}}`,
        metadata: { type: 'ui-examples' }
      }),
      
      new Document({
        pageContent: `TestFlow JSON Structure:

CORRECT STRUCTURE:
{
  "id": "step-1",
  "keyword": "click",
  "locator": {
    "strategy": "role",
    "value": "button",
    "options": {
      "name": "Submit"
    }
  },
  "assertions": []
}

COMPLEX EXAMPLES:
page.getByRole('link',{name:'Models'}).click() → {"keyword":"click","locator":{"strategy":"role","value":"link","options":{"name":"Models"}}}
page.getByRole('textbox',{name:'Username or email'}) → {"keyword":"fill","locator":{"strategy":"role","value":"textbox","options":{"name":"Username or email"}},"value":"user@test.com"}
page.locator('xpath=//button[@class="submit"]').click() → {"keyword":"click","locator":{"strategy":"xpath","value":"//button[@class=\"submit\"]"}}
page.press('Enter') → {"keyword":"press","locator":{"strategy":"css","value":"body"},"value":"Enter"}
page.selectOption('Country','USA') → {"keyword":"select","locator":{"strategy":"css","value":"select[name=\"country\"]"},"value":"USA"}

MAKEMYTRIP PATTERNS:
page.getByText('Login now to get up to 25%').click() → {"keyword":"click","locator":{"strategy":"text","value":"Login now to get up to 25%"}}
page.locator('section').filter({hasText:'Login now'}).locator('span').first().click() → {"keyword":"click","locator":{"strategy":"css","value":"section span","filter":{"type":"hasText","value":"Login now"}}}
expect(page.getByText('Hold on, we\'re fetching')).toBeVisible() → {"keyword":"assertVisible","locator":{"strategy":"text","value":"Hold on, we're fetching"}}
page.getByRole('link',{name:'Flights Flights'}).click() → {"keyword":"click","locator":{"strategy":"role","value":"link","options":{"name":"Flights Flights"}}}

CRITICAL FILTER FIXES:
❌ WRONG - Filter in options: {"strategy":"css","value":"section","options":{"hasText":"Login"}}
✅ CORRECT - Filter property: {"strategy":"css","value":"section","filter":{"type":"hasText","value":"Login"}}
❌ WRONG - CSS selector string: {"strategy":"css","value":"section:has-text('Login') span"}
✅ CORRECT - Proper filter: {"strategy":"css","value":"section span","filter":{"type":"hasText","value":"Login"}}
❌ WRONG - getByText as role: {"strategy":"role","value":"heading","options":{"name":"Hold on"}}
✅ CORRECT - getByText as text: {"strategy":"text","value":"Hold on, we're fetching"}
❌ WRONG - Missing locator: {"keyword":"assertVisible"}
✅ CORRECT - Complete locator: {"keyword":"assertVisible","locator":{"strategy":"text","value":"expected text"}}

WRONG STRUCTURES:
❌ {"keyword":"click","value":"button","options":{"name":"Submit"}}
❌ {"keyword":"click","strategy":"role","value":"button"}
❌ {"keyword":"click","locator":"button"}
❌ {"keyword":"click","locator":{"strategy":"role","value":"Submit"}} // name in value
❌ {"locator":{"strategy":"css","value":"section","options":{"hasText":"Login"}}} // filter in options
✅ {"keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Submit"}}} // correct
✅ {"keyword":"click","locator":{"strategy":"css","value":"section","filter":{"type":"hasText","value":"Login"}}} // correct filter

VALID STRATEGIES: role, text, label, testId, css, xpath
INVALID STRATEGIES: id, class, attribute

VARIABLE STORAGE STRUCTURE:
✅ CORRECT getText: {"keyword":"getText","locator":{"strategy":"css","value":"h1"},"store":{"variableName":"$text"}}
✅ CORRECT getAttribute: {"keyword":"getAttribute","value":"data-id","locator":{"strategy":"css","value":"#user"},"store":{"variableName":"$attribute"}}
❌ WRONG - Missing store: {"keyword":"getText","locator":{"strategy":"css","value":"h1"}}
❌ WRONG - Wrong path: {"keyword":"getText","store":{"variableName":"textContent"}}
❌ WRONG - Missing value for getAttribute: {"keyword":"getAttribute","locator":{"strategy":"css","value":"#user"},"store":{"variableName":"$attribute"}}

CUSTOM CODE STRUCTURE:
✅ CORRECT customCode: {"keyword":"customCode","customCode":"await page.locator('.item').nth(0).click();"}
❌ WRONG - Missing customCode field: {"keyword":"customCode"}
❌ WRONG - Using value field: {"keyword":"customCode","value":"page.click()"}
❌ WRONG - Using locator: {"keyword":"customCode","locator":{"strategy":"css","value":".item"}}

VALID ROLE TYPES: button, link, textbox, heading, checkbox, radio, combobox, listbox, tab, dialog, banner, main, navigation, search, form, table, row, cell, list, listitem, img, section

KEYWORD MAPPING:
goto, click, fill, press, select, check, uncheck, hover, focus, assertVisible, assertHidden, assertText, assertValue, assertEnabled, assertDisabled, getText, getAttribute, customCode

VARIABLE STORAGE:
const title = await page.locator('h1').textContent() → {"keyword":"getText","locator":{"strategy":"css","value":"h1"},"store":{"pageTitle":"$text"}}
const userId = await page.locator('#user').getAttribute('data-id') → {"keyword":"getAttribute","value":"data-id","locator":{"strategy":"css","value":"#user"},"store":{"userId":"$attribute"}}
const name = await page.getByRole('heading').textContent() → {"keyword":"getText","locator":{"strategy":"role","value":"heading"},"store":{"userName":"$text"}}
const status = await page.getByTestId('status').getAttribute('data-status') → {"keyword":"getAttribute","value":"data-status","locator":{"strategy":"testId","value":"status"},"store":{"currentStatus":"$attribute"}}

VARIABLE USAGE:
page.fill('#search', title) → {"keyword":"fill","value":"{{pageTitle}}","locator":{"strategy":"css","value":"#search"}}
page.goto('/user/' + userId) → {"keyword":"goto","value":"/user/{{userId}}"}
expect(page.locator('.result')).toContainText(name) → {"keyword":"assertText","value":"{{userName}}","locator":{"strategy":"css","value":".result"}}
page.getByLabel('User ID').fill(userId) → {"keyword":"fill","value":"{{userId}}","locator":{"strategy":"label","value":"User ID"}}

RAW PLAYWRIGHT CODE (Complex scenarios):
await page.locator('.item').nth(0).click(); await page.locator('.item').nth(1).click(); → {"keyword":"customCode","customCode":"await page.locator('.item').nth(0).click();\nawait page.locator('.item').nth(1).click();"}
const count = await page.locator('.product').count(); expect(count).toBeGreaterThan(5); → {"keyword":"customCode","customCode":"const count = await page.locator('.product').count();\nexpect(count).toBeGreaterThan(5);"}
await page.waitForFunction(() => document.querySelectorAll('.loaded').length > 3); → {"keyword":"customCode","customCode":"await page.waitForFunction(() => {\n  return document.querySelectorAll('.loaded').length > 3;\n});"}

COMPLEX PATTERNS:
page.locator('section').filter({hasText:'text'}).locator('span').first() → {"strategy":"css","value":"section:has-text(\"text\") span"}
page.getByText('Search',{exact:true}) → {"strategy":"text","value":"Search","options":{"exact":true}}
page.locator('.class:first-child') → {"strategy":"css","value":".class"} // :first-child removed, .first() handled automatically
expect().toContainText() → {"keyword":"assertText","value":"expected text"}
expect().toBeVisible() → {"keyword":"assertVisible"}

WHEN TO USE CUSTOM CODE:
- Complex multi-step operations that can't be broken down
- Advanced Playwright methods not covered by keywords
- Custom wait conditions or complex assertions
- Multiple element interactions in sequence
- JavaScript execution within page context
- Complex data extraction or manipulation

FILTER EXAMPLES:
filter({hasText:'text'}) → {"filter":{"type":"hasText","value":"text"}}
filter({has:page.getByRole('button')}) → {"filter":{"type":"has","locator":{"strategy":"role","value":"button"}}}

CUSTOM CODE EXAMPLES:
Multiple clicks: await page.locator('.item').nth(0).click(); await page.locator('.item').nth(1).click(); → {"keyword":"customCode","customCode":"await page.locator('.item').nth(0).click();\nawait page.locator('.item').nth(1).click();"}
Complex assertion: const count = await page.locator('.product').count(); expect(count).toBeGreaterThan(5); → {"keyword":"customCode","customCode":"const count = await page.locator('.product').count();\nexpect(count).toBeGreaterThan(5);"}
Custom wait: await page.waitForFunction(() => document.querySelectorAll('.loaded').length > 3); → {"keyword":"customCode","customCode":"await page.waitForFunction(() => {\n  return document.querySelectorAll('.loaded').length > 3;\n});"}
Page evaluation: const result = await page.evaluate(() => window.myGlobalVar); → {"keyword":"customCode","customCode":"const result = await page.evaluate(() => window.myGlobalVar);\nconsole.log('Result:', result);"}`,
        metadata: { type: 'ui-structure' }
      }),
      
      new Document({
        pageContent: `CUSTOM CODE PATTERNS:

When standard keywords cannot handle complex Playwright operations, use customCode:

MULTI-STEP OPERATIONS:
await page.locator('.item').nth(0).click();
await page.locator('.item').nth(1).click();
→ {"keyword":"customCode","customCode":"await page.locator('.item').nth(0).click();\\nawait page.locator('.item').nth(1).click();"}

COMPLEX ASSERTIONS:
const count = await page.locator('.product').count();
expect(count).toBeGreaterThan(5);
→ {"keyword":"customCode","customCode":"const count = await page.locator('.product').count();\\nexpect(count).toBeGreaterThan(5);"}

CUSTOM WAIT CONDITIONS:
await page.waitForFunction(() => {
  return document.querySelectorAll('.loaded').length > 3;
});
→ {"keyword":"customCode","customCode":"await page.waitForFunction(() => {\\n  return document.querySelectorAll('.loaded').length > 3;\\n});"}

PAGE EVALUATION:
const result = await page.evaluate(() => window.myGlobalVar);
console.log('Result:', result);
→ {"keyword":"customCode","customCode":"const result = await page.evaluate(() => window.myGlobalVar);\\nconsole.log('Result:', result);"}

AVAILABLE VARIABLES IN CUSTOM CODE:
- page: Playwright Page object
- browser: Playwright Browser object  
- expect: Playwright expect function
- console: Console object for logging

CUSTOM CODE RULES:
✅ Use for complex operations that can't be broken into simple keywords
✅ Include proper await statements and error handling
✅ Use \\n for line breaks in JSON strings
✅ Access page, browser, expect, console variables directly
❌ Don't use for simple operations that have dedicated keywords
❌ Don't include async function wrapper (handled automatically)
❌ Don't use customCode when standard locators work fine`,
        metadata: { type: 'custom-code' }
      })
    ]
  }
}