import { Document } from '@langchain/core/documents'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Cucumber/Gherkin Knowledge Base for UI Test Automation
 * Based on SandsAutoFramework step definitions
 */
export class CucumberKnowledgeBase {
  private static uiSteps = `
# Cucumber UI Step Definitions - Complete Reference

## Navigation & Browser Control
- Given open browser
- Given navigate to "URL"
- When close browser
- When refresh page
- When navigate back
- When navigate forward

## Element Interactions
- When click element "locator"
- When click text "visible text"
- When type "text" into "locator"
- When type "text" into "locator" and press enter
- When clear "locator"
- When double click "locator"
- When right click "locator"
- When hover over "locator"
- When drag "sourceLocator" to "targetLocator"

## Form & Input Controls
- When select "option" from dropdown "locator"
- When select option by index {int} from dropdown "locator"
- When select option by value "value" from dropdown "locator"
- When upload file "filepath" to "locator"
- When check "locator"
- When uncheck "locator"

## Waiting Strategies
- When wait for visible "locator" for {int} seconds
- When wait for clickable "locator" for {int} seconds
- When wait for invisible "locator" for {int} seconds
- When wait for text "text" in "locator" for {int} seconds
- When wait for element "locator" to be present
- When wait for element "locator" to be present for {int} seconds
- When wait for element "locator" to be enabled
- When wait for element "locator" to be enabled for {int} seconds
- When wait for element "locator" to disappear
- When wait for element "locator" to disappear for {int} seconds
- When wait for text "text" to appear
- When wait for text "text" to appear for {int} seconds
- When wait for text "text" to disappear
- When wait for text "text" to disappear for {int} seconds
- When wait for attribute "attribute" of "locator" to contain "value"
- When wait for attribute "attribute" of "locator" to contain "value" for {int} seconds
- When wait for URL to contain "urlPart"
- When wait for URL to contain "urlPart" for {int} seconds
- When wait for title to be "title"
- When wait for title to be "title" for {int} seconds
- When wait for title to contain "titlePart"
- When wait for title to contain "titlePart" for {int} seconds
- When wait for element count of "locator" to be {int}
- When wait for element count of "locator" to be {int} for {int} seconds
- When wait for page load
- When wait for page load for {int} seconds
- When wait for alert to be present
- When wait for alert to be present for {int} seconds
- When wait for frame "locator" to be available
- When wait for frame "locator" to be available for {int} seconds
- When pause for {int} seconds
- When wait for {int} milliseconds

## Assertions - Element Visibility
- Then element "locator" should be visible
- Then element "locator" should not be visible
- Then element "locator" should be hidden
- Then element "locator" should exist
- Then element "locator" should not exist

## Assertions - Text Content
- Then element "locator" should contain text "text"
- Then element "locator" text should be "exactText"
- Then page should contain text "text"
- Then page should not contain text "text"
- Then element "locator" should not contain text "text"
- Then element "locator" text should not be empty
- Then element "locator" text should be empty
- Then element "locator" text should start with "prefix"
- Then element "locator" text should end with "suffix"
- Then element "locator" text should match regex "pattern"

## Assertions - Element State
- Then element "locator" should be enabled
- Then element "locator" should be disabled
- Then element "locator" should be focused
- Then element "locator" should be clickable
- Then element "locator" should not be clickable
- Then checkbox "locator" should be checked
- Then checkbox "locator" should not be checked

## Assertions - Attributes & CSS
- Then element "locator" attribute "attribute" should be "value"
- Then element "locator" attribute "attribute" should contain "value"
- Then element "locator" attribute "attribute" should not exist
- Then element "locator" attribute "attribute" should not be empty
- Then element "locator" css "property" should be "value"
- Then element "locator" css "property" should contain "value"
- Then element "locator" rect should contain "property"

## Assertions - Page State
- Then page title should be "title"
- Then page title should contain "titlePart"
- Then page title should not be empty
- Then page title should start with "prefix"
- Then page title should end with "suffix"
- Then current url should be "url"
- Then current url should contain "urlPart"
- Then current url should not contain "urlPart"
- Then current url should start with "prefix"
- Then current url should end with "suffix"
- Then current url should match regex "pattern"

## Assertions - Element Count
- Then element count of "locator" should be {int}
- Then element count of "locator" should be greater than {int}
- Then element count of "locator" should be less than {int}
- Then element count of "locator" should be greater than or equal to {int}
- Then element count of "locator" should be less than or equal to {int}
- Then element count of "locator" should not be {int}

## Variable Storage & Retrieval
- When save text of "locator" as "variableName"
- When save attribute "attribute" of "locator" as "variableName"
- When save current url as "variableName"
- When save page title as "variableName"
- When clear saved variables
- Use variables: $variableName in any step

## Screenshots
- When take screenshot "filename"
- When take element screenshot "locator" save as "filename"

## Tab/Window Management
- When open new tab
- When switch to latest tab
- When switch to tab {int}
- When close current tab

## Alerts & Dialogs
- When accept alert
- When dismiss alert
- Then alert text should be "text"

## Frame Management
- When switch to frame "locator"
- When switch to default content

## Keyboard Actions
- When press key "key" on element "locator"
- When press enter on element "locator"

## Scrolling
- When scroll to element "locator"
- When scroll to top
- When scroll to bottom

## Dropdown Assertions
- Then selected option in dropdown "locator" should be "option"

## JavaScript Execution
- When execute js "javascript code"

## Advanced Patterns
- Supports variable substitution: $variableName
- Supports CSS selectors: #id, .class, [attribute]
- Supports XPath: //div[@id='example']
- Supports Playwright locators: getByRole, getByText, getByTestId
`

  private static locatorStrategies = `
# Locator Strategies for Cucumber Gherkin

## CSS Selectors (Most Common)
- By ID: #elementId
- By Class: .className
- By Attribute: [data-testid='value']
- By Tag: button, input, div
- Combinators: .parent > .child, .sibling + .next
- Examples:
  * "#loginButton"
  * ".submit-btn"
  * "button[type='submit']"
  * "#header .nav-menu a"

## XPath
- Absolute: /html/body/div/button
- Relative: //button[@id='submit']
- Text-based: //button[text()='Submit']
- Contains: //div[contains(@class, 'alert')]
- Examples:
  * "//button[@id='login']"
  * "//input[@name='email']"
  * "//div[contains(text(), 'Welcome')]"

## Playwright-Style Selectors (Auto-converted)
- By Role: getByRole('button', {name: 'Submit'}) → "button:has-text('Submit')"
- By Text: getByText('Login') → "text=Login"
- By Test ID: getByTestId('submit-btn') → "[data-testid='submit-btn']"
- By Placeholder: getByPlaceholder('Email') → "[placeholder='Email']"
- By Label: getByLabel('Username') → "label:has-text('Username')"

## Best Practices
1. Prefer data-testid for stable tests
2. Use text-based selectors for user-facing content
3. Avoid complex XPath with multiple levels
4. Use CSS over XPath when possible for better performance
5. Add explicit waits before assertions
`

  private static conversionRules = `
# Playwright to Cucumber Conversion Rules

## Navigation
page.goto(url) → Given navigate to "url"
page.goBack() → When navigate back
page.goForward() → When navigate forward
page.reload() → When refresh page

## Element Actions
page.click(locator) → When click element "locator"
page.locator(locator).click() → When click element "locator"
page.getByRole('button').click() → When click element "button[role='button']"
page.getByText('login').click() → When click text "login"
page.fill(locator, text) → When type "text" into "locator"
page.locator(locator).fill(text) → When type "text" into "locator"
page.type(locator, text) → When type "text" into "locator"
page.press(locator, 'Enter') → When type "text" into "locator" and press enter
page.selectOption(locator, option) → When select "option" from dropdown "locator"
page.check(locator) → When check "locator"
page.uncheck(locator) → When uncheck "locator"
page.hover(locator) → When hover over "locator"
page.dblclick(locator) → When double click "locator"
page.dragAndDrop(source, target) → When drag "source" to "target"
page.setInputFiles(locator, path) → When upload file "path" to "locator"

## Waiting
page.waitForSelector(locator, {state: 'visible'}) → When wait for visible "locator" for 30 seconds
page.waitForSelector(locator, {state: 'hidden'}) → When wait for invisible "locator" for 30 seconds
page.waitForLoadState() → When wait for page load
page.waitForTimeout(ms) → When wait for {ms} milliseconds
locator.waitFor() → When wait for element "locator" to be present

## Assertions (expect)
expect(locator).toBeVisible() → Then element "locator" should be visible
expect(locator).toBeHidden() → Then element "locator" should not be visible
expect(locator).toHaveText(text) → Then element "locator" text should be "text"
expect(locator).toContainText(text) → Then element "locator" should contain text "text"
expect(locator).toBeEnabled() → Then element "locator" should be enabled
expect(locator).toBeDisabled() → Then element "locator" should be disabled
expect(locator).toBeChecked() → Then checkbox "locator" should be checked
expect(locator).toHaveAttribute(attr, val) → Then element "locator" attribute "attr" should be "val"
expect(locator).toHaveCSS(prop, val) → Then element "locator" css "prop" should be "val"
expect(page).toHaveTitle(title) → Then page title should be "title"
expect(page).toHaveURL(url) → Then current url should be "url"
expect(locator).toHaveCount(n) → Then element count of "locator" should be {n}

## Variable Storage
const text = await locator.textContent() → When save text of "locator" as "variableName"
const attr = await locator.getAttribute(name) → When save attribute "name" of "locator" as "variableName"
const url = page.url() → When save current url as "variableName"
const title = await page.title() → When save page title as "variableName"

## Screenshots
await page.screenshot({path: 'file.png'}) → When take screenshot "file"
await locator.screenshot({path: 'file.png'}) → When take element screenshot "locator" save as "file"

## Tabs & Frames
const newPage = await context.newPage() → When open new tab
await page.switchTo().frame(locator) → When switch to frame "locator"
await page.switchTo().defaultContent() → When switch to default content

## Alerts
page.on('dialog', dialog => dialog.accept()) → When accept alert
page.on('dialog', dialog => dialog.dismiss()) → When dismiss alert

## Keyboard
await page.keyboard.press('Enter') → When press key "Enter" on element "locator"
await locator.press('Enter') → When press enter on element "locator"

## Scrolling
await locator.scrollIntoViewIfNeeded() → When scroll to element "locator"

## Complex Locators
page.locator('div').filter({hasText: 'text'}) → "div:has-text('text')"
page.locator('button').nth(0) → "button:nth-of-type(1)"
page.locator('button').first() → "button:first-of-type"
page.locator('button').last() → "button:last-of-type"
`

  private static gherkinStructure = `
# Gherkin Feature File Structure

## Basic Template
Feature: Feature Name
  As a [role]
  I want [feature]
  So that [benefit]
  
  Background:
    Given prerequisite step
    And another prerequisite step
  
  Scenario: Scenario Name
    Given initial context
    When action is performed
    Then outcome is verified
  
  Scenario Outline: Parameterized Scenario
    Given I am on "<page>"
    When I enter "<input>"
    Then I should see "<result>"
    
    Examples:
      | page    | input     | result   |
      | login   | user@mail | Welcome  |
      | signup  | new@mail  | Verified |

## Tags for Organization
@smoke @regression @ui
Feature: Login Feature
  
  @critical @priority-high
  Scenario: Valid login
    Given navigate to "/login"
    When type "user@example.com" into "#email"
    And type "Password123" into "#password"
    And click element "#loginButton"
    Then element "#dashboard" should be visible

## Best Practices
1. Use descriptive feature and scenario names
2. Keep scenarios focused (test one thing)
3. Use Background for common setup steps
4. Use Scenario Outline for data-driven tests
5. Tag scenarios for selective execution
6. Write from user perspective
7. Keep steps reusable and atomic
8. Use And/But for readability
9. Avoid technical details in step text
10. Use variables for dynamic data: $variableName
`

  static getRelevantDocuments(query: string): Document[] {
    const docs: Document[] = []
    const lowerQuery = query.toLowerCase()

    // Always include UI steps reference
    docs.push(
      new Document({
        pageContent: this.sanitizeContent(this.uiSteps),
        metadata: { source: 'cucumber-ui-steps', type: 'reference' }
      })
    )

    // Add locator strategies if query mentions selectors/locators
    if (
      lowerQuery.includes('locator') ||
      lowerQuery.includes('selector') ||
      lowerQuery.includes('xpath') ||
      lowerQuery.includes('css') ||
      lowerQuery.includes('find')
    ) {
      docs.push(
        new Document({
          pageContent: this.sanitizeContent(this.locatorStrategies),
          metadata: { source: 'locator-strategies', type: 'reference' }
        })
      )
    }

    // Add conversion rules if converting from Playwright
    if (
      lowerQuery.includes('playwright') ||
      lowerQuery.includes('convert') ||
      lowerQuery.includes('page.') ||
      lowerQuery.includes('locator.') ||
      lowerQuery.includes('expect(')
    ) {
      docs.push(
        new Document({
          pageContent: this.sanitizeContent(this.conversionRules),
          metadata: { source: 'conversion-rules', type: 'reference' }
        })
      )
    }

    // Add Gherkin structure if creating features
    if (
      lowerQuery.includes('feature') ||
      lowerQuery.includes('scenario') ||
      lowerQuery.includes('gherkin') ||
      lowerQuery.includes('given') ||
      lowerQuery.includes('when') ||
      lowerQuery.includes('then')
    ) {
      docs.push(
        new Document({
          pageContent: this.sanitizeContent(this.gherkinStructure),
          metadata: { source: 'gherkin-structure', type: 'reference' }
        })
      )
    }

    return docs
  }

  static getAllDocuments(): Document[] {
    const docs: Document[] = []

    // Try to load external documentation files
    const externalDocs = this.loadExternalDocumentation()
    if (externalDocs.length > 0) {
      console.log(`✅ Loaded ${externalDocs.length} external Cucumber documentation files`)
      docs.push(...externalDocs)
    } else {
      // Fallback to embedded documentation
      console.log('📚 Using embedded Cucumber documentation')
      docs.push(
        new Document({
          pageContent: this.sanitizeContent(this.uiSteps),
          metadata: { source: 'cucumber-ui-steps', type: 'reference' }
        }),
        new Document({
          pageContent: this.sanitizeContent(this.locatorStrategies),
          metadata: { source: 'locator-strategies', type: 'reference' }
        }),
        new Document({
          pageContent: this.sanitizeContent(this.conversionRules),
          metadata: { source: 'conversion-rules', type: 'reference' }
        }),
        new Document({
          pageContent: this.sanitizeContent(this.gherkinStructure),
          metadata: { source: 'gherkin-structure', type: 'reference' }
        })
      )
    }

    return docs
  }

  /**
   * Load external markdown documentation files from doc/cucumber/ directory
   */
  private static loadExternalDocumentation(): Document[] {
    const docs: Document[] = []
    const docDir = join(process.cwd(), 'doc', 'cucumber')

    const files = [
      '01-navigation-browser-steps.md',
      '02-element-interaction-steps.md',
      '03-waiting-synchronization-steps.md',
      '04-assertions-verification-steps.md',
      '05-variable-management-steps.md',
      '06-advanced-features-steps.md',
      'README.md'
    ]

    for (const file of files) {
      try {
        const filePath = join(docDir, file)
        if (existsSync(filePath)) {
          let content = readFileSync(filePath, 'utf-8')

          // Sanitize content to prevent LangChain template variable errors
          // Replace {name: 'value'} patterns with (name: 'value') to avoid being interpreted as template vars
          content = this.sanitizeContent(content)

          docs.push(
            new Document({
              pageContent: content,
              metadata: {
                source: `cucumber-docs-${file}`,
                type: 'external-reference',
                category: file.replace('.md', '').replace(/^\d+-/, '')
              }
            })
          )
        }
      } catch (error) {
        console.warn(`Could not load ${file}:`, error)
      }
    }

    return docs
  }

  /**
   * Sanitize markdown content to prevent LangChain template variable errors
   */
  private static sanitizeContent(content: string): string {
    // Replace Playwright-style options objects and step placeholders that trigger LangChain f-string parsing.
    let sanitized = content
      .replace(/\{name:\s*'[^']*'\}/g, '(name: value)')
      .replace(/\{hasText:\s*'[^']*'\}/g, '(hasText: value)')
      .replace(/\{hasNotText:\s*'[^']*'\}/g, '(hasNotText: value)')
      .replace(/\{int\}/g, '(int)')
      .replace(/\{string\}/g, '(string)')

    // Escape any remaining curly braces to avoid PromptTemplate parsing.
    sanitized = sanitized.replace(/\{/g, '{{').replace(/\}/g, '}}')
    return sanitized
  }
}

