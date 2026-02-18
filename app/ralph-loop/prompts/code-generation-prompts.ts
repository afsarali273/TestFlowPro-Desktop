/**
 * Code Generation Prompts for Ralph Loop Agent
 *
 * This file contains all AI prompts used for generating different types of code:
 * - Java (Playwright)
 * - Python (Playwright)
 * - TypeScript (Playwright)
 * - TestFlowPro JSON
 * - Cucumber/Gherkin
 */

export interface CodeGenerationContext {
  context: string
  className?: string
  functionName?: string
  testName?: string
  suiteName?: string
  applicationName?: string
  baseUrl?: string
  testType?: 'UI' | 'API'
  testCaseName?: string
}

/**
 * Generate Java (Playwright) test code prompt
 */
export const getJavaCodePrompt = ({ context, className = 'PlaywrightTest' }: CodeGenerationContext): string => {
  return `Generate a COMPLETE Java (Playwright) test file based on the context below.

Context:
${context}

CRITICAL REQUIREMENTS:

1. CLASS AND STRUCTURE:
   - Output a FULL Java file (imports + public class ${className} + main method)
   - Class name MUST be exactly: ${className} (NO timestamps, NO dates, NO random numbers)
   - Use proper Java naming conventions (PascalCase for class)

2. IMPORTS AND SETUP:
   - Use: import com.microsoft.playwright.*;
   - Use try-with-resources for Playwright.create()
   - Launch browser with: BrowserType.LaunchOptions().setHeadless(false)
   - Example structure:
     try (Playwright playwright = Playwright.create()) {
         Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
         Page page = browser.newPage();
         // Test code here
         browser.close();
     }

3. LOCATOR BEST PRACTICES:
   - Use semantic locators (PRIORITY ORDER):
     * page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Submit"))
     * page.getByText("Welcome")
     * page.getByLabel("Username")
     * page.getByPlaceholder("Enter email")
     * page.getByTestId("login-button")
   - If a locator might match multiple elements, use .first()
   - Use .filter() for complex selections
   - Examples:
     * page.getByRole(AriaRole.TEXTBOX).filter(new Locator.FilterOptions().setHasText("Search"))
     * page.locator("div").filter(new Locator.FilterOptions().setHas(page.getByText("Product")))

4. WAITS AND SYNCHRONIZATION:
   - Always wait for navigation: page.waitForLoadState()
   - Wait for elements: locator.waitFor()
   - Use explicit waits: page.waitForSelector(".element", new Page.WaitForSelectorOptions().setTimeout(30000))
   - Wait for network idle: page.waitForLoadState(LoadState.NETWORKIDLE)

5. ERROR HANDLING:
   - Handle dialogs if needed: page.onDialog(dialog -> dialog.accept())
   - Use try-catch for risky operations
   - Add meaningful error messages

6. ASSERTIONS:
   - Add assertions where sensible using AssertJ or JUnit
   - Example: assertThat(page.title()).isEqualTo("Expected Title")
   - Verify element visibility, text content, URLs

7. CODE QUALITY:
   - Add comments for complex operations
   - Use descriptive variable names
   - Keep methods focused and clean
   - Follow Java best practices

8. OUTPUT FORMAT:
   - Output ONLY valid Java code
   - NO markdown, NO explanations
   - Complete, runnable code

9. IMPORTANT REMINDER:
   - Class name "${className}" exactly as specified
   - NO timestamp-based names allowed
   - Follow all requirements above strictly`
}

/**
 * Generate Python (Playwright) test code prompt
 */
export const getPythonCodePrompt = ({ context, functionName = 'test_generated' }: CodeGenerationContext): string => {
  return `Generate a COMPLETE Python (Playwright) test file based on the context below.

Context:
${context}

CRITICAL REQUIREMENTS:

1. FUNCTION AND STRUCTURE:
   - Output a FULL Python file (imports + def ${functionName}() function)
   - Function name MUST be exactly: ${functionName} (NO timestamps, NO dates, NO random numbers)
   - Use snake_case for function names

2. IMPORTS AND SETUP:
   - Use: from playwright.sync_api import sync_playwright, expect
   - Use sync_playwright() context manager
   - Launch with headless=False
   - Example structure:
     def ${functionName}():
         with sync_playwright() as p:
             browser = p.chromium.launch(headless=False)
             page = browser.new_page()
             # Test code here
             browser.close()

3. LOCATOR BEST PRACTICES:
   - Use semantic locators (PRIORITY ORDER):
     * page.get_by_role("button", name="Submit")
     * page.get_by_text("Welcome")
     * page.get_by_label("Username")
     * page.get_by_placeholder("Enter email")
     * page.get_by_test_id("login-button")
   - If locator matches multiple elements, use .first
   - Use .filter() for complex selections
   - Examples:
     * page.get_by_role("textbox").filter(has_text="Search")
     * page.locator("div").filter(has=page.get_by_text("Product"))

4. WAITS AND SYNCHRONIZATION:
   - Always wait for load: page.wait_for_load_state()
   - Wait for elements: locator.wait_for()
   - Use explicit waits: page.wait_for_selector(".element", timeout=30000)
   - Wait for network idle: page.wait_for_load_state("networkidle")

5. ERROR HANDLING:
   - Handle dialogs: page.on("dialog", lambda dialog: dialog.accept())
   - Use try-except for error-prone operations
   - Add descriptive error messages

6. ASSERTIONS:
   - Use expect() for assertions:
     * expect(page).to_have_title("Expected Title")
     * expect(locator).to_be_visible()
     * expect(locator).to_have_text("Expected Text")
     * expect(locator).to_be_enabled()

7. CODE QUALITY:
   - Follow PEP 8 style guide
   - Use descriptive variable names
   - Add docstrings for functions
   - Keep code clean and readable

8. OUTPUT FORMAT:
   - Output ONLY valid Python code
   - NO markdown, NO explanations
   - Complete, runnable code

9. IMPORTANT REMINDER:
   - Function name "${functionName}" exactly as specified
   - NO timestamp-based names allowed
   - Follow all requirements strictly`
}

/**
 * Generate TypeScript (Playwright) test code prompt
 */
export const getTypeScriptCodePrompt = ({ context, testName = 'Generated Test' }: CodeGenerationContext): string => {
  return `Generate a COMPLETE TypeScript (Playwright) test file based on the context below.

Context:
${context}

CRITICAL REQUIREMENTS:

1. TEST STRUCTURE:
   - Output a FULL Playwright test file (imports + test wrapper + body)
   - Use: import { test, expect } from '@playwright/test';
   - Use: test('${testName.trim()}', async ({ page }) => { ... });
   - Test name MUST be exactly: "${testName.trim()}" (NO timestamps, NO dates, NO random numbers)

2. SYNTAX AND FORMATTING:
   - Ensure ALL parentheses (), braces {}, and brackets [] are CLOSED
   - Use proper TypeScript types where applicable
   - Use async/await for all asynchronous operations
   - ALL async operations MUST use await

3. LOCATOR BEST PRACTICES (PRIORITY ORDER):
   a) getByRole - Most recommended for accessibility:
      * page.getByRole('button', { name: 'Submit' })
      * page.getByRole('textbox', { name: 'Search' })
      * page.getByRole('link', { name: 'Home' })
      
   b) getByText - For visible text:
      * page.getByText('Welcome back')
      * page.getByText(/hello/i)
      
   c) getByLabel - For form fields:
      * page.getByLabel('Username')
      * page.getByLabel(/email/i)
      
   d) getByPlaceholder - For inputs:
      * page.getByPlaceholder('Enter email')
      
   e) getByTestId - For data-testid:
      * page.getByTestId('login-button')

4. HANDLING MULTIPLE ELEMENTS:
   - If locator matches multiple, use .first() or .nth(0)
   - Use .filter() for complex selections:
     * page.getByRole('listitem').filter({ hasText: 'Product' })
     * page.locator('div').filter({ has: page.getByText('Price') })
   - Use exact matching when needed:
     * page.getByText('Submit', { exact: true })

5. WAITS AND SYNCHRONIZATION:
   - Wait for page load: await page.waitForLoadState()
   - Wait for network idle: await page.waitForLoadState('networkidle')
   - Wait for elements: await element.waitFor()
   - Auto-wait is built-in for most actions (click, fill, etc.)

6. DIALOG AND POPUP HANDLING:
   - Handle dialogs at the start if needed:
     page.on('dialog', dialog => dialog.accept())
   - Handle popups:
     const popup = await page.waitForEvent('popup')

7. ASSERTIONS:
   - Use expect() for all assertions:
     * await expect(page).toHaveTitle('Expected Title')
     * await expect(locator).toBeVisible()
     * await expect(locator).toHaveText('Expected')
     * await expect(locator).toBeEnabled()
     * await expect(page).toHaveURL(/pattern/)

8. ERROR HANDLING:
   - Add try-catch for risky operations
   - Use soft assertions when needed: await expect.soft(...)
   - Add meaningful error messages

9. BEST PRACTICES:
   - Use page fixtures from test function
   - Keep tests isolated and independent
   - Use descriptive variable names
   - Add comments for complex logic
   - Use Page Object Model for complex apps (if applicable)

10. EXAMPLE STRUCTURE:
    import { test, expect } from '@playwright/test';

    test('${testName.trim()}', async ({ page }) => {
      // Navigate
      await page.goto('https://example.com');
      
      // Interact
      await page.getByRole('button', { name: 'Click me' }).click();
      
      // Assert
      await expect(page.getByText('Success')).toBeVisible();
    });

11. OUTPUT FORMAT:
    - Output ONLY valid TypeScript code
    - NO markdown, NO explanations
    - Complete, runnable test

12. IMPORTANT REMINDER:
    - Test name "${testName.trim()}" exactly as specified
    - NO timestamp-based names allowed
    - Follow all requirements strictly`
}

/**
 * Generate TestFlowPro JSON suite prompt (from TypeScript code)
 */
export const getTestFlowConversionPrompt = ({
  context,
  suiteName = 'Test Suite',
  applicationName = 'Application',
  baseUrl = 'https://example.com',
  testCaseName = 'Test Case'
}: CodeGenerationContext): string => {
  // Extract baseUrl from context if not provided or if it's the default
  let finalBaseUrl = baseUrl
  if (!finalBaseUrl || finalBaseUrl === 'https://example.com') {
    const urlMatch = context.match(/https?:\/\/[^\s)"']+/)
    if (urlMatch) {
      const fullUrl = urlMatch[0]
      const urlParts = fullUrl.match(/(https?:\/\/[^\/\s)"']+)/)
      if (urlParts) {
        finalBaseUrl = urlParts[1]
      }
    }
  }

  const suiteId = suiteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return `Convert this Playwright TypeScript code to TestFlowPro UI Test Suite JSON.

${context}

CRITICAL - USE EXACTLY THESE VALUES (DO NOT CHANGE OR GENERATE NEW ONES):
- Suite Name: "${suiteName}"
- Test Case Name: "${testCaseName}"
- Application Name: "${applicationName}"
- Suite ID: "${suiteId}"
- Base URL: "${finalBaseUrl}"

REQUIRED JSON STRUCTURE:
{
  "id": "${suiteId}",
  "suiteName": "${suiteName}",
  "applicationName": "${applicationName}",
  "type": "UI",
  "baseUrl": "${finalBaseUrl}",
  "testCases": [
    {
      "id": "test-1",
      "name": "${testCaseName}",
      "description": "Automated test generated from Playwright code",
      "testSteps": [
        // Convert Playwright steps here
      ]
    }
  ]
}

CONVERSION REQUIREMENTS:
1. MUST use suiteName "${suiteName}" - DO NOT CHANGE
2. MUST use testCaseName "${testCaseName}" - DO NOT CHANGE  
3. MUST use applicationName "${applicationName}" - DO NOT CHANGE
4. MUST use baseUrl "${finalBaseUrl}" - DO NOT CHANGE
5. Convert ALL Playwright steps to testSteps array
6. Use proper locator strategies:
   - role (preferred for accessibility)
   - text (for visible text matching)
   - placeholder (for input fields)
   - label (for form labels)
   - testId (for data-testid attributes)
   - css (only if above don't work)
   - xpath (last resort)
7. Map Playwright actions to TestFlowPro keywords:
   - page.goto() → keyword: "goto"
   - page.click() → keyword: "click"
   - page.fill() → keyword: "fill"
   - page.type() → keyword: "type"
   - expect().toBeVisible() → keyword: "assertVisible"
   - expect().toHaveText() → keyword: "assertText"
   - page.waitForSelector() → keyword: "wait"
   - page.screenshot() → keyword: "screenshot"
8. Preserve all assertions and validations
9. Extract dynamic data into variables where applicable

OUTPUT REQUIREMENTS:
- Output ONLY valid JSON, no markdown or explanations
- Ensure suiteName, testCaseName, and applicationName match exactly what was specified
- Complete and valid TestFlowPro schema compliance`
}

/**
 * Generate TestFlowPro JSON suite prompt (from requirements)
 */
export const getTestFlowGenerationPrompt = ({
  context,
  suiteName = 'Test Suite',
  applicationName = 'Application',
  baseUrl = 'https://example.com',
  testType = 'UI' as 'UI' | 'API',
  testCaseName = 'Test Case'
}: CodeGenerationContext): string => {
  // Extract baseUrl from context if not provided or if it's the default
  let finalBaseUrl = baseUrl
  if (!finalBaseUrl || finalBaseUrl === 'https://example.com') {
    const urlMatch = context.match(/https?:\/\/[^\s)"']+/)
    if (urlMatch) {
      const fullUrl = urlMatch[0]
      const urlParts = fullUrl.match(/(https?:\/\/[^\/\s)"']+)/)
      if (urlParts) {
        finalBaseUrl = urlParts[1]
      }
    }
  }

  const suiteId = suiteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return `Generate a TestFlowPro Test Suite JSON for the following context.

Context:
${context}

CRITICAL - USE EXACTLY THESE VALUES (DO NOT CHANGE OR GENERATE NEW ONES):
- Suite Name: "${suiteName}"
- Test Case Name: "${testCaseName}"
- Application Name: "${applicationName}"
- Suite ID: "${suiteId}"
- Base URL: "${finalBaseUrl}"
- Test Type: "${testType}"

REQUIRED JSON STRUCTURE:
{
  "id": "${suiteId}",
  "suiteName": "${suiteName}",
  "applicationName": "${applicationName}",
  "type": "${testType}",
  "baseUrl": "${finalBaseUrl}",
  "testCases": [
    {
      "id": "test-1",
      "name": "${testCaseName}",
      "description": "Automated test case",
      "${testType === 'UI' ? 'testSteps' : 'testData'}": [
        // Generate test content here
      ]
    }
  ]
}

GENERATION REQUIREMENTS:
1. MUST use suiteName "${suiteName}" - DO NOT CHANGE OR GENERATE NEW NAMES
2. MUST use testCaseName "${testCaseName}" - DO NOT CHANGE OR GENERATE NEW NAMES
3. MUST use applicationName "${applicationName}" - DO NOT CHANGE
4. MUST use baseUrl "${finalBaseUrl}" - DO NOT CHANGE
5. MUST use type "${testType}" - DO NOT CHANGE

${testType === 'UI' 
  ? `UI TEST GENERATION REQUIREMENTS:
1. Generate testSteps array with proper keywords:
   - goto: Navigate to URL (e.g., {keyword: "goto", url: "/search"})
   - click: Click element (e.g., {keyword: "click", locator: {strategy: "role", value: "button"}})
   - fill: Fill input field (e.g., {keyword: "fill", locator: {...}, value: "text"})
   - type: Type into field with delay
   - getText: Extract text from element
   - assertVisible: Assert element is visible
   - assertHidden: Assert element is not visible
   - assertText: Assert element contains text
   - wait: Wait for element or condition
   - screenshot: Take screenshot
   - selectOption: Select from dropdown
   - check/uncheck: Checkbox operations
2. Use semantic locators (role, text, placeholder, label, testId).
3. Add proper wait strategies and assertions.
4. Include error handling and retry logic where needed.`
  : `API TEST GENERATION REQUIREMENTS:
1. Generate testData array with:
   - method: HTTP method (GET, POST, PUT, DELETE, PATCH)
   - endpoint: API endpoint path
   - headers: Request headers object
   - body: Request body (for POST/PUT/PATCH)
   - expectedStatus: Expected HTTP status code
   - assertions: Array of response validations
2. Include authentication headers if needed.
3. Add response body validations.
4. Handle error responses appropriately.`}

OUTPUT REQUIREMENTS:
- Output ONLY valid JSON
- NO markdown, NO explanations, just pure JSON
- Ensure suiteName, testCaseName, and applicationName match EXACTLY as specified
- Complete and valid TestFlowPro schema compliance
- CRITICAL: Use the exact suite/test/app names provided above`
}

/**
 * Generate Cucumber/Gherkin feature file prompt
 */
export const getCucumberCodePrompt = ({ context }: CodeGenerationContext): string => {
  return `Convert this test execution context to Cucumber/Gherkin feature file.

Context:
${context}

CRITICAL CUCUMBER REQUIREMENTS:

1. USE ONLY PREDEFINED STEP DEFINITIONS:
   Given Steps (Setup):
   - Given open browser
   - Given navigate to "{url}"
   - Given I am on "{page}" page
   - Given wait for {seconds} seconds
   
   When Steps (Actions):
   - When type "{text}" into "{locator}"
   - When click on "{locator}"
   - When press enter key
   - When press {key} key
   - When select "{option}" from "{locator}"
   - When upload file "{filePath}" to "{locator}"
   - When switch to iframe "{locator}"
   - When switch to default content
   - When hover over "{locator}"
   - When drag "{source}" to "{target}"
   
   Then Steps (Assertions):
   - Then element "{locator}" should be visible
   - Then element "{locator}" should be hidden
   - Then element "{locator}" should contain text "{text}"
   - Then current url should contain "{text}"
   - Then page title should be "{title}"
   - Then element "{locator}" should be enabled
   - Then element "{locator}" should be disabled

2. FEATURE FILE STRUCTURE:
   - Feature: [Business-focused description]
   - Background: [Common setup steps for all scenarios]
   - @tags (use @smoke, @regression, @ui, @critical, @slow)
   - Scenario: [User-focused scenario name]
   - Given/When/Then with proper flow

3. LOCATOR FORMAT:
   - Use CSS selectors: [name='q']
   - Use XPath: //button[@id='submit']
   - Use role-based: [role='button'][name='Submit']
   - Use data attributes: [data-testid='login-button']

4. VARIABLES:
   - Use \${varName} for dynamic data
   - Example: type "\${username}" into "[name='username']"

5. BEST PRACTICES:
   - Add explicit waits before assertions
   - One action per step (no "and" abuse)
   - Use Background for common setup
   - Keep scenarios independent
   - Use meaningful scenario names
   - Add comments for complex steps

6. EXAMPLE OUTPUT FORMAT:
   Feature: User Authentication
     As a user
     I want to log in to the application
     So that I can access my account
     
     Background:
       Given open browser
       And navigate to "https://example.com"
     
     @smoke @regression
     Scenario: Successful login with valid credentials
       When type "\${username}" into "[name='username']"
       And wait for visible "[name='username']" for 30 seconds
       And type "\${password}" into "[name='password']"
       And click on "[type='submit']"
       Then element "[class='dashboard']" should be visible
       And current url should contain "/dashboard"

Output ONLY the Gherkin feature file. No explanations, no markdown fences, just the feature file content.`
}

/**
 * Get the appropriate prompt based on code generation type
 */
export const getCodePrompt = (
  type: 'java' | 'python' | 'typescript' | 'testflow' | 'cucumber',
  context: CodeGenerationContext
): string => {
  switch (type) {
    case 'java':
      return getJavaCodePrompt(context)
    case 'python':
      return getPythonCodePrompt(context)
    case 'typescript':
      return getTypeScriptCodePrompt(context)
    case 'testflow':
      // Determine if we're converting code or generating from requirements
      const hasTypeScriptCode = context.context.includes('page.') ||
                                context.context.includes('await ') ||
                                context.context.includes('playwright')
      return hasTypeScriptCode
        ? getTestFlowConversionPrompt(context)
        : getTestFlowGenerationPrompt(context)
    case 'cucumber':
      return getCucumberCodePrompt(context)
    default:
      return getTypeScriptCodePrompt(context)
  }
}

