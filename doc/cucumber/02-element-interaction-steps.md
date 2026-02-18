# Element Interaction Steps

## Overview
Step definitions for interacting with web elements: clicking, typing, selecting, uploading, drag-and-drop, and more.

## Steps Reference

### Click Actions

#### `When click element {string}`
Clicks on the specified element using standard click behavior.

**Parameters:**
- `locator` (string): CSS selector, XPath, or ID

**Examples:**
```gherkin
When click element "#submitButton"
When click element ".login-btn"
When click element "//button[@id='submit']"
When click element "[data-testid='submit-btn']"
```

---

#### `When click text {string}`
Clicks on an element containing the specified text. Uses Playwright's `getByText()` when available.

**Parameters:**
- `text` (string): Visible text content

**Examples:**
```gherkin
When click text "Login"
When click text "Sign Up"
When click text "Add to Cart"
```

---

#### `When double click {string}`
Performs a double-click on the specified element.

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When double click "#file-name"
When double click ".editable-field"
```

---

#### `When right click element {string}`
Performs a right-click (context menu) on the specified element.

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When right click element "#context-menu-trigger"
When right click element ".file-item"
```

---

#### `When click {string} with javascript`
Clicks an element using JavaScript execution (bypasses standard click).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
# Use when standard click doesn't work
When click "#hiddenButton" with javascript
```

---

#### `When click {string} if visible`
Clicks an element only if it's currently visible (doesn't fail if element is not visible).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When click ".close-modal" if visible
When click "#optional-banner-close" if visible
```

---

### Text Input

#### `When type {string} into {string}`
Types text into an input field (clears existing content first).

**Parameters:**
- `text` (string): Text to type
- `locator` (string): Input field locator

**Examples:**
```gherkin
When type "john@example.com" into "#email"
When type "password123" into "[name='password']"
When type "${username}" into "#username"
```

---

#### `When type {string} into {string} and press enter`
Types text into an input field and presses Enter key.

**Parameters:**
- `text` (string): Text to type
- `locator` (string): Input field locator

**Examples:**
```gherkin
When type "search query" into "#searchBox" and press enter
When type "${searchTerm}" into ".search-input" and press enter
```

---

#### `When type {string} into {string} without clearing`
Types text without clearing existing content (appends to current value).

**Parameters:**
- `text` (string): Text to append
- `locator` (string): Input field locator

**Example:**
```gherkin
When type "additional text" into "#textarea" without clearing
```

---

#### `When clear {string}`
Clears the content of an input field.

**Parameters:**
- `locator` (string): Input field locator

**Example:**
```gherkin
When clear "#searchBox"
When clear "[name='email']"
```

---

### Dropdown/Select

#### `When select {string} from dropdown {string}`
Selects an option from a dropdown by visible text.

**Parameters:**
- `option` (string): Visible option text
- `locator` (string): Dropdown locator

**Examples:**
```gherkin
When select "United States" from dropdown "#country"
When select "Medium" from dropdown ".size-dropdown"
```

---

### Checkboxes

#### `When check {string}`
Checks a checkbox (sets it to checked state).

**Parameters:**
- `locator` (string): Checkbox locator

**Examples:**
```gherkin
When check "#terms-and-conditions"
When check "[name='newsletter']"
```

---

#### `When uncheck {string}`
Unchecks a checkbox (sets it to unchecked state).

**Parameters:**
- `locator` (string): Checkbox locator

**Examples:**
```gherkin
When uncheck "#newsletter"
When uncheck "[name='remember-me']"
```

---

### File Upload

#### `When upload file {string} to {string}`
Uploads a single file to a file input element.

**Parameters:**
- `filePath` (string): Absolute or relative file path
- `locator` (string): File input locator

**Examples:**
```gherkin
When upload file "/path/to/document.pdf" to "#fileUpload"
When upload file "${testDataDir}/image.png" to "input[type='file']"
```

---

#### `When upload multiple files {string} to {string}`
Uploads multiple files to a file input element.

**Parameters:**
- `filePaths` (string): Comma-separated file paths
- `locator` (string): File input locator

**Examples:**
```gherkin
When upload multiple files "/path/file1.pdf,/path/file2.pdf" to "#multiFileUpload"
When upload multiple files "${dir}/doc1.pdf,${dir}/doc2.pdf" to "input[type='file']"
```

---

### Mouse Actions

#### `When hover over {string}`
Moves mouse over an element (triggers hover effects).

**Parameters:**
- `locator` (string): Element locator

**Examples:**
```gherkin
When hover over ".dropdown-menu"
When hover over "#tooltip-trigger"
```

---

#### `When drag {string} to {string}`
Drags an element from source to target.

**Parameters:**
- `source` (string): Source element locator
- `target` (string): Target element locator

**Examples:**
```gherkin
When drag "#draggable-item" to "#drop-zone"
When drag ".kanban-card" to ".done-column"
```

---

### Focus & Highlight

#### `When focus element {string}`
Sets keyboard focus on the specified element.

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When focus element "#username"
```

---

#### `When highlight element {string}`
Visually highlights an element (useful for debugging/demos).

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When highlight element "#important-field"
```

---

## Complete Workflow Examples

### Example 1: Login Form
```gherkin
Feature: User Login
  Scenario: Successful login
    Given navigate to "https://example.com/login"
    When type "user@example.com" into "#email"
    And type "SecurePass123" into "#password"
    And check "#remember-me"
    And click element "#login-button"
    Then element "#dashboard" should be visible
```

---

### Example 2: Search with Auto-Submit
```gherkin
Feature: Product Search
  Scenario: Search for products
    Given navigate to "https://shop.example.com"
    When type "laptop" into "#searchBox" and press enter
    And wait for visible ".search-results" for 5 seconds
    Then element count of ".product-item" should be greater than 0
```

---

### Example 3: Form with Dropdown
```gherkin
Feature: Contact Form
  Scenario: Submit contact form
    Given navigate to "https://example.com/contact"
    When type "John Doe" into "#name"
    And type "john@example.com" into "#email"
    And select "Technical Support" from dropdown "#department"
    And type "Need help with product" into "#message"
    And check "#consent"
    And click element "#submit"
    Then element ".success-message" should be visible
```

---

### Example 4: File Upload
```gherkin
Feature: Document Upload
  Scenario: Upload profile picture
    Given navigate to "https://example.com/profile"
    When click element "#upload-button"
    And upload file "${testData}/profile.jpg" to "input[type='file']"
    And wait for visible ".upload-success" for 10 seconds
    Then element ".profile-image" should be visible
```

---

### Example 5: Drag and Drop
```gherkin
Feature: Kanban Board
  Scenario: Move task to done
    Given navigate to "https://example.com/kanban"
    When drag ".task-item:first-child" to ".done-column"
    And wait for 2 seconds
    Then element count of ".done-column .task-item" should be 1
```

---

### Example 6: Conditional Click
```gherkin
Feature: Modal Handling
  Scenario: Close optional popup
    Given navigate to "https://example.com"
    When wait for 2 seconds
    And click ".popup-close" if visible
    Then element "#main-content" should be visible
```

---

## Best Practices

### ✅ DO
- Use specific locators (ID, data-testid) over generic CSS selectors
- Wait for elements to be visible/clickable before interacting
- Use "click text" for user-facing text (more resilient)
- Use variable substitution for dynamic test data
- Clear fields before typing to avoid concatenation issues

### ❌ DON'T
- Don't use complex XPath unless necessary
- Don't assume elements are immediately interactable
- Don't hard-code test data - use variables
- Don't click invisible elements
- Don't chain multiple actions without waits

---

## Variable Substitution Support

All interaction steps support variable substitution:

```gherkin
When save text of "#username-field" as "savedUsername"
When type "${savedUsername}" into "#confirm-username"
When upload file "${documentsPath}/resume.pdf" to "#file-input"
```

---

## Locator Strategies

### Supported Locator Types
```gherkin
# ID
When click element "#loginButton"

# CSS Class
When click element ".submit-btn"

# CSS Attribute
When click element "[data-testid='submit']"
When click element "[name='email']"

# XPath
When click element "//button[@id='submit']"
When click element "//div[contains(@class, 'button')]"

# Complex CSS
When click element "form > button.primary"
When click element ".modal .close-button"
```

---

## Framework Support
- ✅ **Selenium WebDriver**: Full support
- ✅ **Playwright**: Full support with enhanced features (getByText, etc.)
- 🔄 **Auto-detection**: Framework selected based on configuration

