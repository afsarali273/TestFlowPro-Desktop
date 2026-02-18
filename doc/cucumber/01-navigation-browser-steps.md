# Navigation & Browser Control Steps

## Overview
Step definitions for browser management, page navigation, and window operations.

## Steps Reference

### Browser Lifecycle

#### `Given open browser`
Opens a new browser instance (Selenium or Playwright based on configuration).

**Example:**
```gherkin
Given open browser
```

---

#### `When close browser`
Closes the current browser instance and all associated windows.

**Example:**
```gherkin
When close browser
```

---

### Page Navigation

#### `Given navigate to {string}`
Navigates to the specified URL. Supports variable substitution.

**Parameters:**
- `url` (string): The URL to navigate to

**Examples:**
```gherkin
Given navigate to "https://example.com"
Given navigate to "https://example.com/login"
Given navigate to "${baseUrl}/dashboard"
```

**Variable Substitution:**
```gherkin
# After saving baseUrl
When save current url as "baseUrl"
Given navigate to "${baseUrl}/settings"
```

---

#### `When refresh page`
Refreshes the current page.

**Example:**
```gherkin
When refresh page
```

---

#### `When navigate back`
Navigates back to the previous page in browser history.

**Example:**
```gherkin
When navigate back
```

---

#### `When navigate forward`
Navigates forward to the next page in browser history.

**Example:**
```gherkin
When navigate forward
```

---

### Tab/Window Management

#### `When open new tab`
Opens a new browser tab.

**Example:**
```gherkin
When open new tab
```

---

#### `When switch to latest tab`
Switches focus to the most recently opened tab.

**Example:**
```gherkin
When open new tab
And switch to latest tab
```

---

#### `When switch to tab {int}`
Switches to a specific tab by index (0-based).

**Parameters:**
- `index` (int): Zero-based tab index

**Examples:**
```gherkin
When switch to tab 0
When switch to tab 1
```

---

### Window Operations

#### `When maximize window`
Maximizes the browser window to full screen.

**Example:**
```gherkin
Given open browser
When maximize window
```

---

#### `When set window size to {int}x{int}`
Sets the browser window to a specific size.

**Parameters:**
- `width` (int): Window width in pixels
- `height` (int): Window height in pixels

**Examples:**
```gherkin
When set window size to 1920x1080
When set window size to 1366x768
When set window size to 375x667
```

**Common Resolutions:**
```gherkin
# Desktop Full HD
When set window size to 1920x1080

# Laptop
When set window size to 1366x768

# Mobile iPhone
When set window size to 375x667

# Tablet iPad
When set window size to 768x1024
```

---

### Cookie Management

#### `When add cookie {string} with value {string}`
Adds a cookie to the current domain.

**Parameters:**
- `name` (string): Cookie name
- `value` (string): Cookie value

**Example:**
```gherkin
When add cookie "sessionId" with value "abc123"
When add cookie "theme" with value "dark"
```

---

#### `When delete all cookies`
Deletes all cookies from the current domain.

**Example:**
```gherkin
When delete all cookies
```

---

## Complete Workflow Examples

### Example 1: Basic Navigation Flow
```gherkin
Feature: User Login
  Scenario: Navigate to login page
    Given open browser
    And maximize window
    When navigate to "https://example.com"
    And navigate to "https://example.com/login"
    Then page title should contain "Login"
```

---

### Example 2: Multi-Tab Workflow
```gherkin
Feature: Multi-Tab Navigation
  Scenario: Open multiple tabs
    Given open browser
    And navigate to "https://example.com"
    When save current url as "homeUrl"
    And open new tab
    And switch to latest tab
    And navigate to "https://example.com/products"
    Then current url should contain "/products"
    When switch to tab 0
    Then current url should be "${homeUrl}"
```

---

### Example 3: Responsive Testing
```gherkin
Feature: Responsive Design
  Scenario Outline: Test different screen sizes
    Given open browser
    When set window size to <width>x<height>
    And navigate to "https://example.com"
    Then element ".mobile-menu" should be visible
    
    Examples:
      | width | height |
      | 375   | 667    |
      | 768   | 1024   |
      | 1920  | 1080   |
```

---

### Example 4: Cookie Management
```gherkin
Feature: Cookie Handling
  Scenario: Set and verify cookies
    Given open browser
    When navigate to "https://example.com"
    And add cookie "user_preference" with value "dark_mode"
    And add cookie "language" with value "en"
    And refresh page
    Then page should contain text "Dark Mode Enabled"
    When delete all cookies
    And refresh page
    Then page should contain text "Light Mode"
```

---

## Best Practices

### ✅ DO
- Always `open browser` at the start of each scenario
- Use `maximize window` for consistent UI testing
- Use variable substitution for dynamic URLs: `${baseUrl}/path`
- Close browser in hooks or teardown for cleanup
- Use meaningful variable names when saving URLs

### ❌ DON'T
- Don't navigate without opening browser first
- Don't assume window size - set it explicitly for consistency
- Don't hard-code URLs - use variables for flexibility
- Don't leave browsers open between scenarios

---

## Variable Substitution Support

All navigation steps support variable substitution using `${variableName}` syntax:

```gherkin
When save current url as "dashboardUrl"
# Later use it:
Given navigate to "${dashboardUrl}"
Given navigate to "${dashboardUrl}/settings"
```

---

## Framework Support
- ✅ **Selenium WebDriver**: Full support
- ✅ **Playwright**: Full support (auto-detected from configuration)
- 🔄 **Framework auto-detection**: Based on `ConfigManager.isPlaywright()`

