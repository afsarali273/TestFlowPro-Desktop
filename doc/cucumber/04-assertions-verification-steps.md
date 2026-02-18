# Assertion & Verification Steps

## Overview
Comprehensive assertion steps for verifying element states, text content, attributes, CSS properties, page state, and more.

## Steps Reference

### Element Visibility Assertions

#### `Then element {string} should be visible`
Asserts that an element is visible on the page.

**Parameters:**
- `locator` (string): Element locator

**Examples:**
```gherkin
Then element "#loginButton" should be visible
Then element ".success-message" should be visible
Then element "[data-testid='dashboard']" should be visible
```

---

#### `Then element {string} should not be visible`
Asserts that an element is not visible (either hidden or not in viewport).

**Parameters:**
- `locator` (string): Element locator

**Examples:**
```gherkin
Then element ".error-message" should not be visible
Then element "#hiddenField" should not be visible
```

---

### Element Existence Assertions

#### `Then element {string} should exist`
Asserts that an element exists in the DOM (regardless of visibility).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
Then element "#hiddenData" should exist
```

---

#### `Then element {string} should not exist`
Asserts that an element does NOT exist in the DOM.

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
Then element "#errorMessage" should not exist
```

---

### Text Content Assertions

#### `Then element {string} should contain text {string}`
Asserts that an element's text contains the specified string.

**Parameters:**
- `locator` (string): Element locator
- `expected` (string): Expected text (partial match)

**Examples:**
```gherkin
Then element "#welcome" should contain text "Hello"
Then element ".status" should contain text "Success"
Then element "h1" should contain text "${username}"
```

---

#### `Then element {string} text should be {string}`
Asserts that an element's text exactly matches the specified string.

**Parameters:**
- `locator` (string): Element locator
- `expected` (string): Expected exact text

**Examples:**
```gherkin
Then element "#status" text should be "Completed"
Then element ".counter" text should be "10"
Then element "h1" text should be "${expectedTitle}"
```

---

#### `Then page should contain text {string}`
Asserts that the page contains specific text anywhere in the body.

**Parameters:**
- `text` (string): Expected text

**Examples:**
```gherkin
Then page should contain text "Welcome back"
Then page should contain text "Order confirmed"
Then page should contain text "${confirmationMessage}"
```

---

### Element State Assertions

#### `Then element {string} should be enabled`
Asserts that an element is enabled (not disabled).

**Parameters:**
- `locator` (string): Element locator

**Examples:**
```gherkin
Then element "#submitButton" should be enabled
Then element "input[name='email']" should be enabled
```

---

#### `Then element {string} should be disabled`
Asserts that an element is disabled.

**Parameters:**
- `locator` (string): Element locator

**Examples:**
```gherkin
Then element "#submitButton" should be disabled
Then element "input[type='submit']" should be disabled
```

---

#### `Then element {string} should be editable`
Asserts that an element is editable (input/textarea/contenteditable).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
Then element "#textarea" should be editable
```

---

### Checkbox Assertions

#### `Then checkbox {string} should be checked`
Asserts that a checkbox is in checked state.

**Parameters:**
- `locator` (string): Checkbox locator

**Examples:**
```gherkin
Then checkbox "#terms" should be checked
Then checkbox "[name='newsletter']" should be checked
```

---

#### `Then checkbox {string} should not be checked`
Asserts that a checkbox is NOT checked.

**Parameters:**
- `locator` (string): Checkbox locator

**Examples:**
```gherkin
Then checkbox "#optionalFeature" should not be checked
Then checkbox "#newsletter" should not be checked
```

---

### Attribute Assertions

#### `Then element {string} attribute {string} should be {string}`
Asserts that an element's attribute has a specific value.

**Parameters:**
- `locator` (string): Element locator
- `attribute` (string): Attribute name
- `expected` (string): Expected value

**Examples:**
```gherkin
Then element "#link" attribute "href" should be "https://example.com"
Then element "input[name='email']" attribute "type" should be "email"
Then element "#image" attribute "src" should be "${expectedImageUrl}"
Then element "button" attribute "data-state" should be "active"
```

---

### CSS Property Assertions

#### `Then element {string} css {string} should be {string}`
Asserts that an element's CSS property has a specific value.

**Parameters:**
- `locator` (string): Element locator
- `property` (string): CSS property name
- `expected` (string): Expected value

**Examples:**
```gherkin
Then element "#banner" css "background-color" should be "rgba(255, 0, 0, 1)"
Then element ".hidden" css "display" should be "none"
Then element "h1" css "font-size" should be "24px"
```

---

#### `Then element {string} rect should contain {string}`
Asserts that an element's bounding rectangle contains specific values.

**Parameters:**
- `locator` (string): Element locator
- `expected` (string): Expected rect property

**Example:**
```gherkin
Then element "#box" rect should contain "width"
```

---

### Page State Assertions

#### `Then page title should be {string}`
Asserts that the page title exactly matches the specified text.

**Parameters:**
- `expected` (string): Expected exact title

**Examples:**
```gherkin
Then page title should be "Dashboard - MyApp"
Then page title should be "Login"
Then page title should be "${expectedPageTitle}"
```

---

#### `Then page title should contain {string}`
Asserts that the page title contains the specified text.

**Parameters:**
- `expected` (string): Expected title fragment

**Examples:**
```gherkin
Then page title should contain "Dashboard"
Then page title should contain "Success"
```

---

#### `Then current url should be {string}`
Asserts that the current URL exactly matches.

**Parameters:**
- `expected` (string): Expected exact URL

**Examples:**
```gherkin
Then current url should be "https://example.com/dashboard"
Then current url should be "${baseUrl}/home"
```

---

#### `Then current url should contain {string}`
Asserts that the current URL contains the specified text.

**Parameters:**
- `expected` (string): Expected URL fragment

**Examples:**
```gherkin
Then current url should contain "/dashboard"
Then current url should contain "?success=true"
Then current url should contain "${expectedPath}"
```

---

### Element Count Assertions

#### `Then element count of {string} should be {int}`
Asserts that exactly N matching elements exist.

**Parameters:**
- `locator` (string): Element locator
- `expected` (int): Expected count

**Examples:**
```gherkin
Then element count of ".product-item" should be 10
Then element count of "li.selected" should be 1
Then element count of "[data-type='error']" should be 0
```

---

#### `Then element count of {string} should be greater than {int}`
Asserts that more than N matching elements exist.

**Parameters:**
- `locator` (string): Element locator
- `expected` (int): Minimum count (exclusive)

**Examples:**
```gherkin
Then element count of ".search-result" should be greater than 0
Then element count of "tr.data-row" should be greater than 5
```

---

### Input Value Assertions

#### `Then input value of {string} should be {string}`
Asserts that an input field's value matches exactly.

**Parameters:**
- `locator` (string): Input locator
- `expected` (string): Expected value

**Examples:**
```gherkin
Then input value of "#email" should be "user@example.com"
Then input value of "[name='quantity']" should be "5"
Then input value of "#username" should be "${savedUsername}"
```

---

### Dropdown Assertions

#### `Then dropdown {string} should have {int} options`
Asserts that a dropdown has exactly N options.

**Parameters:**
- `locator` (string): Dropdown locator
- `expected` (int): Expected number of options

**Examples:**
```gherkin
Then dropdown "#country" should have 195 options
Then dropdown ".size-selector" should have 5 options
```

---

### Alert Assertions

#### `Then alert text should be {string}`
Asserts that the JavaScript alert text matches exactly.

**Parameters:**
- `expected` (string): Expected alert text

**Example:**
```gherkin
When wait for alert to be present
Then alert text should be "Are you sure?"
```

---

### Tag Name Assertions

#### `Then tag name of {string} should be {string}`
Asserts that an element's HTML tag matches.

**Parameters:**
- `locator` (string): Element locator
- `expected` (string): Expected tag name (case-insensitive)

**Examples:**
```gherkin
Then tag name of "#submitButton" should be "button"
Then tag name of ".heading" should be "h1"
```

---

### Variable Assertions

#### `Then saved variable {string} should be {string}`
Asserts that a saved variable's value matches exactly.

**Parameters:**
- `variableName` (string): Variable name
- `expected` (string): Expected value

**Examples:**
```gherkin
When save text of "#status" as "statusText"
Then saved variable "statusText" should be "Active"
Then saved variable "statusText" should be "${expectedStatus}"
```

---

#### `Then saved variable {string} should not be null`
Asserts that a saved variable exists and is not null.

**Parameters:**
- `variableName` (string): Variable name

**Example:**
```gherkin
When save text of "#userId" as "userId"
Then saved variable "userId" should not be null
```

---

## Complete Workflow Examples

### Example 1: Login Verification
```gherkin
Feature: Login
  Scenario: Successful login with assertions
    Given navigate to "https://example.com/login"
    When type "user@example.com" into "#email"
    And type "password123" into "#password"
    And click element "#login-button"
    And wait for visible "#dashboard" for 10 seconds
    
    Then page title should contain "Dashboard"
    And current url should contain "/dashboard"
    And element "#welcome-message" should be visible
    And element "#welcome-message" should contain text "Welcome back"
    And element ".error-message" should not exist
```

---

### Example 2: Form Validation
```gherkin
Feature: Form Validation
  Scenario: Verify form state
    Given navigate to "https://example.com/register"
    
    # Initial state
    Then element "#submit" should be disabled
    And checkbox "#terms" should not be checked
    And input value of "#email" should be ""
    
    # Fill form
    When type "test@example.com" into "#email"
    And type "SecurePass123" into "#password"
    And check "#terms"
    
    # Verify updated state
    Then element "#submit" should be enabled
    And checkbox "#terms" should be checked
    And input value of "#email" should be "test@example.com"
```

---

### Example 3: Dynamic Content
```gherkin
Feature: Product Search
  Scenario: Verify search results
    Given navigate to "https://shop.example.com"
    When type "laptop" into "#searchBox" and press enter
    And wait for visible ".search-results" for 10 seconds
    
    Then page title should contain "Search Results"
    And current url should contain "?q=laptop"
    And element count of ".product-card" should be greater than 0
    And element ".no-results" should not be visible
    And page should contain text "Search Results for"
```

---

### Example 4: Element State Verification
```gherkin
Feature: Button States
  Scenario: Verify conditional button states
    Given navigate to "https://example.com/form"
    
    Then element "#submitBtn" should be visible
    And element "#submitBtn" should be disabled
    And element "#submitBtn" attribute "type" should be "submit"
    And element "#submitBtn" css "background-color" should be "rgba(128, 128, 128, 1)"
    
    When type "test@example.com" into "#email"
    And wait for element "#submitBtn" to be enabled for 5 seconds
    
    Then element "#submitBtn" should be enabled
    And element "#submitBtn" css "background-color" should be "rgba(0, 128, 0, 1)"
```

---

### Example 5: Multi-Element Verification
```gherkin
Feature: Dashboard
  Scenario: Verify dashboard elements
    Given navigate to "https://example.com/dashboard"
    And wait for page load
    
    # Header verification
    Then element "header h1" should be visible
    And element "header h1" text should be "Dashboard"
    And element "header .user-menu" should be visible
    
    # Widget count
    And element count of ".widget" should be 4
    
    # Footer verification
    And element "footer" should be visible
    And element "footer" should contain text "© 2025"
    
    # Verify no errors
    And element ".error-banner" should not exist
```

---

## Best Practices

### ✅ DO
- Always wait for elements before asserting
- Use specific assertions (exact match vs. contains)
- Combine multiple assertions to verify complete state
- Use variable substitution for dynamic expected values
- Verify both positive and negative cases

### ❌ DON'T
- Don't assert on elements that might not be loaded
- Don't use overly generic locators for assertions
- Don't hard-code expected values when they're dynamic
- Don't assume assertion order doesn't matter
- Don't over-assert (keep it focused and relevant)

---

## Assertion Strategy Guide

```gherkin
# Verify element is present and visible
Then element "#dashboard" should be visible

# Verify element doesn't exist at all
Then element ".error-popup" should not exist

# Verify exact text match
Then element "#status" text should be "Active"

# Verify partial text match
Then element "#message" should contain text "Welcome"

# Verify page-wide text
Then page should contain text "Order confirmed"

# Verify element state
Then element "#submitBtn" should be enabled
Then checkbox "#agree" should be checked

# Verify attributes
Then element "#link" attribute "href" should be "https://example.com"

# Verify CSS properties
Then element ".alert" css "display" should be "block"

# Verify page state
Then page title should contain "Dashboard"
Then current url should contain "/success"

# Verify element count
Then element count of ".item" should be 10
Then element count of ".error" should be 0

# Verify input values
Then input value of "#username" should be "${expectedUser}"

# Verify saved variables
Then saved variable "userId" should not be null
```

---

## Variable Substitution in Assertions

All assertion steps support variable substitution:

```gherkin
# Save expected values
When save text of "#expected-status" as "expectedStatus"
When save attribute "href" of "#link" as "expectedHref"

# Use in assertions
Then element "#actual-status" text should be "${expectedStatus}"
Then element "#actual-link" attribute "href" should be "${expectedHref}"
Then page should contain text "${expectedStatus}"
```

---

## Framework Support
- ✅ **Selenium WebDriver**: Full support
- ✅ **Playwright**: Full support with auto-waiting
- 🔄 **Auto-detection**: Framework-specific assertion methods

