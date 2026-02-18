# Waiting & Synchronization Steps

## Overview
Comprehensive wait strategies for element visibility, clickability, text presence, page state, and custom timeouts.

## Steps Reference

### Element State Waits

#### `When wait for visible {string} for {int} seconds`
Waits until an element becomes visible within the specified timeout.

**Parameters:**
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time in seconds

**Examples:**
```gherkin
When wait for visible "#loginButton" for 10 seconds
When wait for visible ".loading-complete" for 30 seconds
When wait for visible "[data-testid='dashboard']" for 15 seconds
```

---

#### `When wait for clickable {string} for {int} seconds`
Waits until an element is both visible and clickable.

**Parameters:**
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time

**Examples:**
```gherkin
When wait for clickable "#submitBtn" for 15 seconds
When wait for clickable ".action-button" for 10 seconds
```

---

#### `When wait for invisible {string} for {int} seconds`
Waits until an element becomes invisible or is removed from DOM.

**Parameters:**
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time

**Examples:**
```gherkin
When wait for invisible ".loading-spinner" for 20 seconds
When wait for invisible "#processingModal" for 30 seconds
```

---

#### `When wait for element {string} to disappear`
Waits for an element to disappear (default 30 seconds).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When wait for element "#loadingSpinner" to disappear
```

---

#### `When wait for element {string} to disappear for {int} seconds`
Waits for an element to disappear with custom timeout.

**Parameters:**
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for element "#loadingSpinner" to disappear for 20 seconds
```

---

### Element Presence Waits

#### `When wait for element {string} to be present`
Waits for an element to exist in the DOM (not necessarily visible).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When wait for element "#dashboard" to be present
```

---

#### `When wait for element {string} to be present for {int} seconds`
Waits for element presence with custom timeout.

**Parameters:**
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for element "#dashboard" to be present for 15 seconds
```

---

### Element State Waits

#### `When wait for element {string} to be enabled`
Waits until an element becomes enabled (not disabled).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When wait for element "#loginForm" to be enabled
```

---

#### `When wait for element {string} to be enabled for {int} seconds`
Waits for element to be enabled with custom timeout.

**Parameters:**
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for element "#loginForm" to be enabled for 10 seconds
```

---

### Text Content Waits

#### `When wait for text {string} in {string} for {int} seconds`
Waits for specific text to appear within an element.

**Parameters:**
- `text` (string): Expected text
- `locator` (string): Element locator
- `seconds` (int): Maximum wait time

**Examples:**
```gherkin
When wait for text "Welcome" in ".message" for 10 seconds
When wait for text "Success" in "#status" for 15 seconds
```

---

#### `When wait for text {string} to appear`
Waits for text to appear anywhere on the page (default timeout).

**Parameters:**
- `text` (string): Expected text

**Example:**
```gherkin
When wait for text "Success" to appear
```

---

#### `When wait for text {string} to appear for {int} seconds`
Waits for text to appear with custom timeout.

**Parameters:**
- `text` (string): Expected text
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for text "Processing complete" to appear for 30 seconds
```

---

#### `When wait for text {string} to disappear`
Waits for text to disappear from the page.

**Parameters:**
- `text` (string): Text that should disappear

**Example:**
```gherkin
When wait for text "Loading..." to disappear
```

---

#### `When wait for text {string} to disappear for {int} seconds`
Waits for text to disappear with custom timeout.

**Parameters:**
- `text` (string): Text that should disappear
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for text "Processing..." to disappear for 20 seconds
```

---

### Attribute Waits

#### `When wait for attribute {string} of {string} to contain {string}`
Waits for an element's attribute to contain specific value (default timeout).

**Parameters:**
- `attribute` (string): Attribute name
- `locator` (string): Element locator
- `value` (string): Expected value

**Example:**
```gherkin
When wait for attribute "class" of "#button" to contain "active"
```

---

#### `When wait for attribute {string} of {string} to contain {string} for {int} seconds`
Waits for attribute value with custom timeout.

**Parameters:**
- `attribute` (string): Attribute name
- `locator` (string): Element locator
- `value` (string): Expected value
- `seconds` (int): Maximum wait time

**Examples:**
```gherkin
When wait for attribute "class" of "#status" to contain "success" for 10 seconds
When wait for attribute "data-state" of ".widget" to contain "loaded" for 15 seconds
```

---

### Page State Waits

#### `When wait for URL to contain {string}`
Waits for current URL to contain specific text.

**Parameters:**
- `urlPart` (string): Expected URL fragment

**Example:**
```gherkin
When wait for URL to contain "dashboard"
```

---

#### `When wait for URL to contain {string} for {int} seconds`
Waits for URL to contain text with custom timeout.

**Parameters:**
- `urlPart` (string): Expected URL fragment
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for URL to contain "/success" for 15 seconds
```

---

#### `When wait for title to be {string}`
Waits for page title to match exactly.

**Parameters:**
- `title` (string): Expected exact title

**Example:**
```gherkin
When wait for title to be "Dashboard - MyApp"
```

---

#### `When wait for title to be {string} for {int} seconds`
Waits for exact title with custom timeout.

**Parameters:**
- `title` (string): Expected title
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for title to be "Processing Complete" for 20 seconds
```

---

#### `When wait for title to contain {string}`
Waits for page title to contain specific text.

**Parameters:**
- `titlePart` (string): Expected title fragment

**Example:**
```gherkin
When wait for title to contain "Dashboard"
```

---

#### `When wait for title to contain {string} for {int} seconds`
Waits for title to contain text with custom timeout.

**Parameters:**
- `titlePart` (string): Expected title fragment
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for title to contain "Success" for 10 seconds
```

---

#### `When wait for page load`
Waits for page to fully load (DOMContentLoaded and all resources).

**Example:**
```gherkin
Given navigate to "https://example.com"
When wait for page load
```

---

#### `When wait for page load for {int} seconds`
Waits for page load with custom timeout.

**Parameters:**
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for page load for 30 seconds
```

---

### Element Count Waits

#### `When wait for element count of {string} to be {int}`
Waits for a specific number of matching elements.

**Parameters:**
- `locator` (string): Element locator
- `count` (int): Expected element count

**Example:**
```gherkin
When wait for element count of ".product-item" to be 10
```

---

#### `When wait for element count of {string} to be {int} for {int} seconds`
Waits for element count with custom timeout.

**Parameters:**
- `locator` (string): Element locator
- `count` (int): Expected count
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for element count of ".loaded-item" to be 20 for 30 seconds
```

---

### Alert & Frame Waits

#### `When wait for alert to be present`
Waits for a JavaScript alert/confirm/prompt to appear.

**Example:**
```gherkin
When wait for alert to be present
```

---

#### `When wait for alert to be present for {int} seconds`
Waits for alert with custom timeout.

**Parameters:**
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for alert to be present for 10 seconds
```

---

#### `When wait for frame {string} to be available`
Waits for an iframe to be available for switching.

**Parameters:**
- `locator` (string): Frame locator

**Example:**
```gherkin
When wait for frame "#myFrame" to be available
```

---

#### `When wait for frame {string} to be available for {int} seconds`
Waits for frame with custom timeout.

**Parameters:**
- `locator` (string): Frame locator
- `seconds` (int): Maximum wait time

**Example:**
```gherkin
When wait for frame "iframe[name='content']" to be available for 15 seconds
```

---

### Fixed Delays

#### `When pause for {int} seconds`
Pauses test execution for a fixed duration (use sparingly).

**Parameters:**
- `seconds` (int): Pause duration

**Example:**
```gherkin
When pause for 3 seconds
```

---

#### `When wait for {int} milliseconds`
Waits for a specific millisecond duration.

**Parameters:**
- `milliseconds` (int): Wait duration in ms

**Example:**
```gherkin
When wait for 500 milliseconds
```

---

## Complete Workflow Examples

### Example 1: Ajax Form Submission
```gherkin
Feature: Contact Form
  Scenario: Submit and wait for confirmation
    Given navigate to "https://example.com/contact"
    When type "John Doe" into "#name"
    And type "john@example.com" into "#email"
    And click element "#submit"
    And wait for invisible ".loading-spinner" for 10 seconds
    And wait for visible ".success-message" for 5 seconds
    Then element ".success-message" should contain text "Thank you"
```

---

### Example 2: Dynamic Content Loading
```gherkin
Feature: Product Catalog
  Scenario: Wait for all products to load
    Given navigate to "https://shop.example.com/products"
    When wait for page load
    And wait for element count of ".product-card" to be 24 for 15 seconds
    And wait for text "Showing all products" to appear
    Then element count of ".product-card" should be 24
```

---

### Example 3: Multi-Step Process
```gherkin
Feature: Wizard Form
  Scenario: Complete multi-step wizard
    Given navigate to "https://example.com/wizard"
    
    # Step 1
    When type "Personal Info" into "#step1-data"
    And click element "#next-step"
    And wait for URL to contain "step=2" for 10 seconds
    
    # Step 2
    And type "Address Details" into "#step2-data"
    And click element "#next-step"
    And wait for title to contain "Step 3" for 10 seconds
    
    # Step 3
    And click element "#submit"
    And wait for text "Processing..." to appear
    And wait for text "Processing..." to disappear for 30 seconds
    
    Then element ".success" should be visible
```

---

### Example 4: Conditional Element Waiting
```gherkin
Feature: Dynamic UI
  Scenario: Handle conditional elements
    Given navigate to "https://example.com/dashboard"
    When wait for clickable "#action-button" for 10 seconds
    And wait for attribute "disabled" of "#action-button" to contain "false" for 5 seconds
    And click element "#action-button"
    And wait for element "#processing-modal" to be present for 5 seconds
    And wait for element "#processing-modal" to disappear for 20 seconds
    Then page should contain text "Action completed"
```

---

### Example 5: Alert Handling
```gherkin
Feature: JavaScript Alerts
  Scenario: Handle confirmation dialog
    Given navigate to "https://example.com/delete-account"
    When click element "#delete-button"
    And wait for alert to be present for 5 seconds
    And accept alert
    And wait for text "Account deleted" to appear for 10 seconds
    Then page should contain text "Account deleted successfully"
```

---

## Best Practices

### ✅ DO
- Always wait for elements before interacting
- Use explicit waits over fixed delays
- Choose appropriate wait strategies for the situation
- Set reasonable timeouts based on expected behavior
- Wait for loading indicators to disappear before assertions

### ❌ DON'T
- Don't use fixed delays (`pause`) unless absolutely necessary
- Don't use extremely long timeouts (>60 seconds)
- Don't assume elements are immediately available
- Don't wait for invisible elements to be clickable
- Don't chain multiple actions without intermediate waits

---

## Wait Strategy Decision Guide

```gherkin
# Element needs to be visible AND clickable
When wait for clickable "#button" for 10 seconds

# Element just needs to exist in DOM
When wait for element "#hidden-field" to be present for 5 seconds

# Waiting for AJAX/loading to complete
When wait for invisible ".loading-spinner" for 20 seconds

# Waiting for text to update
When wait for text "Updated" in "#status" for 10 seconds

# Waiting for navigation/redirect
When wait for URL to contain "/success" for 15 seconds

# Waiting for page title change
When wait for title to contain "Dashboard" for 10 seconds

# Waiting for attribute change (e.g., class added)
When wait for attribute "class" of "#widget" to contain "loaded" for 10 seconds

# Fixed delay (last resort only)
When pause for 2 seconds
```

---

## Variable Substitution Support

All wait steps support variable substitution:

```gherkin
When save text of "#expected-text" as "waitText"
When wait for text "${waitText}" to appear for 10 seconds
```

---

## Framework Support
- ✅ **Selenium WebDriver**: Full support with explicit waits
- ✅ **Playwright**: Full support with built-in auto-waiting
- 🔄 **Auto-detection**: Framework-specific wait implementations

