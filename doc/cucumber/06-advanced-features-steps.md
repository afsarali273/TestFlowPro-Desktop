# Advanced Features & Special Steps

## Overview
Advanced step definitions for scrolling, keyboard actions, frames, alerts, JavaScript execution, and more.

## Steps Reference

### Scroll Actions

#### `When scroll to element {string}`
Scrolls the page until the element is in view.

**Parameters:**
- `locator` (string): Element locator

**Examples:**
```gherkin
When scroll to element "#footer"
When scroll to element ".section-testimonials"
When scroll to element "//div[@id='contact']"
```

---

#### `When scroll to top`
Scrolls to the top of the page.

**Example:**
```gherkin
When scroll to top
```

---

#### `When scroll to bottom`
Scrolls to the bottom of the page.

**Example:**
```gherkin
When scroll to bottom
```

---

####When scroll by {int} pixels horizontally and {int} pixels vertically`
Scrolls by specific pixel amounts.

**Parameters:**
- `x` (int): Horizontal scroll distance
- `y` (int): Vertical scroll distance

**Examples:**
```gherkin
When scroll by 0 pixels horizontally and 500 pixels vertically
When scroll by 200 pixels horizontally and 0 pixels vertically
```

---

#### `When scroll {string} into center`
Scrolls an element into the center of the viewport.

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When scroll "#targetElement" into center
```

---

### Keyboard Actions

#### `When press key {string} on element {string}`
Presses a specific key on an element.

**Parameters:**
- `key` (string): Key name (e.g., "Enter", "Escape", "Tab")
- `locator` (string): Element locator

**Examples:**
```gherkin
When press key "Escape" on element "#modal"
When press key "Enter" on element "#searchBox"
When press key "Tab" on element "#firstName"
```

---

#### `When press enter on element {string}`
Presses Enter key on an element.

**Parameters:**
- `locator` (string): Element locator

**Example:**
```gherkin
When press enter on element "#searchBox"
```

---

#### `When press keyboard key {string}`
Presses a keyboard key globally (not on specific element).

**Parameters:**
- `key` (string): Key name

**Examples:**
```gherkin
When press keyboard key "Escape"
When press keyboard key "F5"
```

---

#### `When press enter key`
Presses Enter key globally.

**Example:**
```gherkin
When press enter key
```

---

#### `When press escape key`
Presses Escape key globally.

**Example:**
```gherkin
When press escape key
```

---

#### `When press tab key`
Presses Tab key globally.

**Example:**
```gherkin
When press tab key
```

---

### Frame/iFrame Management

#### `When switch to frame {string}`
Switches context to an iframe.

**Parameters:**
- `locator` (string): Frame locator (ID, name, or CSS selector)

**Examples:**
```gherkin
When switch to frame "contentFrame"
When switch to frame "#paymentIframe"
When switch to frame "iframe[name='editor']"
```

---

#### `When switch to default content`
Switches back to main page content (exits iframe).

**Example:**
```gherkin
When switch to frame "#myIframe"
# Do something in iframe
When switch to default content
# Back to main page
```

---

### Alert & Dialog Management

#### `When accept alert`
Accepts a JavaScript alert/confirm dialog.

**Example:**
```gherkin
When click element "#deleteButton"
And wait for alert to be present
When accept alert
```

---

#### `When dismiss alert`
Dismisses/cancels a JavaScript alert/confirm dialog.

**Example:**
```gherkin
When click element "#cancelAction"
And wait for alert to be present
When dismiss alert
```

---

#### `Then alert text should be {string}`
Asserts the text of a JavaScript alert.

**Parameters:**
- `expected` (string): Expected alert text

**Example:**
```gherkin
When wait for alert to be present
Then alert text should be "Are you sure you want to delete?"
When accept alert
```

---

### JavaScript Execution

#### `When execute js {string}`
Executes JavaScript code in the browser context.

**Parameters:**
- `script` (string): JavaScript code to execute

**Examples:**
```gherkin
When execute js "alert('Hello World');"
When execute js "document.getElementById('hidden').style.display='block';"
When execute js "window.scrollTo(0, 500);"
When execute js "localStorage.setItem('key', 'value');"
```

---

### Screenshot Actions

#### `When take screenshot {string}`
Takes a full-page screenshot and saves it.

**Parameters:**
- `filePath` (string): File path to save screenshot

**Examples:**
```gherkin
When take screenshot "test-results/login-page.png"
When take screenshot "${screenshotDir}/error-state.png"
```

---

#### `When take element screenshot {string} save as {string}`
Takes a screenshot of a specific element.

**Parameters:**
- `locator` (string): Element locator
- `filePath` (string): File path to save screenshot

**Examples:**
```gherkin
When take element screenshot "#errorMessage" save as "error.png"
When take element screenshot ".chart" save as "results/chart.png"
```

---

### Close Tab

#### `When close current tab`
Closes the current browser tab.

**Example:**
```gherkin
When open new tab
And switch to latest tab
And navigate to "https://example.com/popup"
When close current tab
```

---

## Complete Workflow Examples

### Example 1: Infinite Scroll Loading
```gherkin
Feature: Product Catalog
  Scenario: Load products with infinite scroll
    Given navigate to "https://shop.example.com/products"
    When wait for visible ".product-grid" for 10 seconds
    
    # Save initial count
    And save text of ".product-count" as "initialCount"
    
    # Scroll to bottom to trigger load
    When scroll to bottom
    And wait for 2 seconds
    And scroll to bottom
    And wait for text "Loading more..." to appear
    And wait for text "Loading more..." to disappear for 20 seconds
    
    # Verify more products loaded
    Then element count of ".product-item" should be greater than 0
```

---

### Example 2: iFrame Interaction
```gherkin
Feature: Payment Processing
  Scenario: Enter credit card in iframe
    Given navigate to "https://checkout.example.com"
    When wait for visible "#payment-section" for 10 seconds
    
    # Switch to payment iframe
    And switch to frame "iframe[name='paymentFrame']"
    And wait for visible "#cardNumber" for 10 seconds
    
    # Fill payment details
    And type "4111111111111111" into "#cardNumber"
    And type "12/25" into "#expiry"
    And type "123" into "#cvv"
    
    # Switch back to main content
    And switch to default content
    
    # Complete checkout
    And click element "#completeCheckout"
    Then element ".success-message" should be visible
```

---

### Example 3: Alert Handling
```gherkin
Feature: Account Deletion
  Scenario: Delete account with confirmation
    Given navigate to "https://example.com/settings"
    And wait for visible "#deleteAccount" for 10 seconds
    
    # Trigger delete
    When click element "#deleteAccount"
    And wait for alert to be present for 5 seconds
    
    # Verify and accept alert
    Then alert text should be "Are you sure you want to delete your account?"
    When accept alert
    And wait for text "Account deleted" to appear for 10 seconds
    
    Then page should contain text "Your account has been successfully deleted"
```

---

### Example 4: Keyboard Navigation
```gherkin
Feature: Accessibility
  Scenario: Navigate form using keyboard
    Given navigate to "https://example.com/form"
    When click element "#firstName"
    And type "John" into "#firstName"
    
    # Tab to next field
    And press tab key
    And type "Doe" into "#lastName"
    
    # Tab to submit and press enter
    And press tab key
    And press tab key
    And press enter key
    
    Then element ".success-message" should be visible
```

---

### Example 5: Scroll to Lazy-Loaded Content
```gherkin
Feature: Lazy Loading
  Scenario: Load images by scrolling
    Given navigate to "https://blog.example.com"
    
    # Scroll to trigger lazy load
    When scroll to element ".article:nth-child(10)"
    And wait for 2 seconds
    And scroll to element ".article:nth-child(20)"
    And wait for 2 seconds
    
    # Verify images loaded
    Then element count of "img[data-loaded='true']" should be greater than 15
```

---

### Example 6: JavaScript Manipulation
```gherkin
Feature: JavaScript Testing
  Scenario: Test JavaScript interactions
    Given navigate to "https://example.com"
    
    # Show hidden element via JS
    When execute js "document.querySelector('.hidden-menu').classList.remove('hidden');"
    And wait for 1 seconds
    Then element ".hidden-menu" should be visible
    
    # Trigger custom event
    When execute js "window.dispatchEvent(new Event('customEvent'));"
    And wait for text "Event triggered" to appear
    
    # Set localStorage
    When execute js "localStorage.setItem('testMode', 'true');"
    And refresh page
    Then page should contain text "Test Mode Active"
```

---

### Example 7: Multi-Window Screenshot Capture
```gherkin
Feature: Visual Regression
  Scenario: Capture screenshots at different scroll positions
    Given navigate to "https://example.com/long-page"
    
    # Capture top
    When take screenshot "screenshots/page-top.png"
    
    # Scroll and capture middle
    And scroll by 0 pixels horizontally and 800 pixels vertically
    And take screenshot "screenshots/page-middle.png"
    
    # Scroll and capture bottom
    And scroll to bottom
    And take screenshot "screenshots/page-bottom.png"
    
    # Capture specific element
    And scroll to element "#important-section"
    And take element screenshot "#important-section" save as "screenshots/important.png"
```

---

### Example 8: Complex Frame Navigation
```gherkin
Feature: Nested iFrames
  Scenario: Navigate nested frames
    Given navigate to "https://example.com/frames"
    
    # Enter first frame
    When switch to frame "#outerFrame"
    And wait for visible "#content" for 10 seconds
    
    # Enter nested frame
    And switch to frame "#innerFrame"
    And wait for visible "#data" for 10 seconds
    And save text of "#data" as "frameData"
    
    # Back to parent frame
    And switch to default content
    And switch to frame "#outerFrame"
    Then element "#content" should be visible
    
    # Back to main
    And switch to default content
    And type "${frameData}" into "#mainInput"
```

---

## Best Practices

### ✅ DO
- Wait for frames/elements before switching
- Switch back to default content after iframe operations
- Handle alerts immediately after they appear
- Use descriptive screenshot filenames with timestamps
- Use scroll actions for lazy-loaded content
- Press Escape to close modals/dialogs

### ❌ DON'T
- Don't forget to switch back from iframes
- Don't execute complex JS when step definitions exist
- Don't use excessive JavaScript execution
- Don't take screenshots without proper waits
- Don't assume alerts appear immediately

---

## Keyboard Key Reference

### Common Keys
```gherkin
When press keyboard key "Enter"
When press keyboard key "Escape"
When press keyboard key "Tab"
When press keyboard key "Space"
When press keyboard key "Backspace"
When press keyboard key "Delete"
```

### Arrow Keys
```gherkin
When press keyboard key "ArrowUp"
When press keyboard key "ArrowDown"
When press keyboard key "ArrowLeft"
When press keyboard key "ArrowRight"
```

### Function Keys
```gherkin
When press keyboard key "F1"
When press keyboard key "F5"
When press keyboard key "F11"
When press keyboard key "F12"
```

### Modifier Keys
```gherkin
When press keyboard key "Shift"
When press keyboard key "Control"
When press keyboard key "Alt"
When press keyboard key "Meta"
```

---

## JavaScript Execution Examples

```gherkin
# Scroll to position
When execute js "window.scrollTo(0, 1000);"

# Show hidden element
When execute js "document.getElementById('hidden').style.display='block';"

# Click hidden element
When execute js "document.querySelector('.hidden-btn').click();"

# Set value
When execute js "document.getElementById('field').value='test';"

# localStorage
When execute js "localStorage.setItem('key', 'value');"
When execute js "localStorage.clear();"

# sessionStorage
When execute js "sessionStorage.setItem('key', 'value');"

# Trigger events
When execute js "document.dispatchEvent(new Event('customEvent'));"

# Change attributes
When execute js "document.querySelector('img').setAttribute('src', 'new.jpg');"
```

---

## Framework Support
- ✅ **Selenium WebDriver**: Full support
- ✅ **Playwright**: Full support with enhanced features
- 🔄 **Auto-detection**: Framework-specific implementations
- ✅ **Cross-browser**: Works on Chrome, Firefox, Edge, Safari

