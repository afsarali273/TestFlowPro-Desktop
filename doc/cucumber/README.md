# Cucumber Step Definitions - Complete Reference

## 📚 Documentation Index

This knowledge base contains comprehensive documentation for all available Cucumber step definitions in the SandsAutoFramework.

### Documentation Files

1. **[Navigation & Browser Steps](./01-navigation-browser-steps.md)**
   - Browser lifecycle (open, close)
   - Page navigation (navigate, refresh, back, forward)
   - Tab/window management
   - Window operations (maximize, resize)
   - Cookie management

2. **[Element Interaction Steps](./02-element-interaction-steps.md)**
   - Click actions (click, double-click, right-click)
   - Text input (type, clear)
   - Dropdowns and select elements
   - Checkboxes and radio buttons
   - File uploads
   - Mouse actions (hover, drag-and-drop)
   - Focus and highlight

3. **[Waiting & Synchronization Steps](./03-waiting-synchronization-steps.md)**
   - Element state waits (visible, clickable, invisible)
   - Element presence waits
   - Text content waits
   - Attribute waits
   - Page state waits (URL, title)
   - Element count waits
   - Alert and frame waits
   - Fixed delays

4. **[Assertions & Verification Steps](./04-assertions-verification-steps.md)**
   - Element visibility assertions
   - Element existence assertions
   - Text content assertions
   - Element state assertions (enabled, disabled, editable)
   - Checkbox assertions
   - Attribute assertions
   - CSS property assertions
   - Page state assertions (title, URL)
   - Element count assertions
   - Input value assertions
   - Variable assertions

5. **[Variable Management Steps](./05-variable-management-steps.md)**
   - Save element data (text, attributes, input values)
   - Save page state (URL, title)
   - Clear variables
   - Variable assertions
   - Variable substitution syntax

6. **[Advanced Features Steps](./06-advanced-features-steps.md)**
   - Scroll actions
   - Keyboard actions
   - Frame/iframe management
   - Alert and dialog handling
   - JavaScript execution
   - Screenshot capture
   - Tab management

---

## 🚀 Quick Start

### Basic Test Example
```gherkin
Feature: Login Functionality
  As a user
  I want to log in to the application
  So that I can access my dashboard

  @smoke @login
  Scenario: Successful login
    Given open browser
    And navigate to "https://example.com/login"
    When type "user@example.com" into "#email"
    And type "SecurePass123" into "#password"
    And click element "#loginButton"
    And wait for visible "#dashboard" for 10 seconds
    Then page title should contain "Dashboard"
    And element "#welcome-message" should contain text "Welcome"
    And current url should contain "/dashboard"
```

---

## 📖 Core Concepts

### 1. Variable Substitution
All steps support variable substitution using `${variableName}` syntax:

```gherkin
When save text of "#userId" as "userId"
Then element "#display-id" text should be "${userId}"
When navigate to "${baseUrl}/dashboard"
```

### 2. Locator Strategies
Supported locator types:
- **CSS ID**: `#elementId`
- **CSS Class**: `.className`
- **CSS Attribute**: `[data-testid='value']`, `[name='fieldName']`
- **XPath**: `//button[@id='submit']`
- **Complex CSS**: `.parent > .child`, `form button.primary`

### 3. Framework Support
- ✅ **Selenium WebDriver**: Full support
- ✅ **Playwright**: Full support with auto-detection
- 🔄 **Auto-detection**: Based on `ConfigManager.isPlaywright()`

### 4. Wait Strategy
Always use explicit waits before interactions and assertions:
```gherkin
When wait for visible "#element" for 10 seconds
And click element "#element"
```

---

## 🎯 Common Patterns

### Pattern 1: Login Flow
```gherkin
Given open browser
And maximize window
When navigate to "${baseUrl}/login"
And type "${username}" into "#email"
And type "${password}" into "#password"
And click element "#login"
And wait for visible "#dashboard" for 10 seconds
Then page title should contain "Dashboard"
```

### Pattern 2: Form Submission
```gherkin
When type "John Doe" into "#name"
And type "john@example.com" into "#email"
And select "Technical Support" from dropdown "#department"
And check "#consent"
And click element "#submit"
And wait for invisible ".loading-spinner" for 20 seconds
Then element ".success-message" should be visible
```

### Pattern 3: Dynamic Content Loading
```gherkin
When click element ".load-more"
And wait for element count of ".item" to be 20 for 15 seconds
Then element count of ".item" should be 20
```

### Pattern 4: Multi-Step Wizard
```gherkin
# Step 1
When type "Personal Info" into "#step1-data"
And click element "#next"
And wait for URL to contain "step=2" for 10 seconds

# Step 2
When type "Address" into "#step2-data"
And click element "#next"
And wait for title to contain "Step 3" for 10 seconds

# Step 3
When click element "#submit"
And wait for text "Success" to appear for 15 seconds
Then page should contain text "Completed"
```

### Pattern 5: Alert Handling
```gherkin
When click element "#delete"
And wait for alert to be present for 5 seconds
Then alert text should be "Are you sure?"
When accept alert
And wait for text "Deleted" to appear
```

### Pattern 6: iFrame Interaction
```gherkin
When switch to frame "#paymentFrame"
And type "4111111111111111" into "#cardNumber"
And switch to default content
And click element "#submit"
```

---

## 🏆 Best Practices

### ✅ DO
1. **Always use waits before interactions**
   ```gherkin
   When wait for clickable "#button" for 10 seconds
   And click element "#button"
   ```

2. **Use specific locators (ID, data-testid)**
   ```gherkin
   ✅ When click element "#submitButton"
   ✅ When click element "[data-testid='submit-btn']"
   ❌ When click element "div > div > button:nth-child(3)"
   ```

3. **Use variable substitution for dynamic data**
   ```gherkin
   When save text of "#orderId" as "orderId"
   Then page should contain text "${orderId}"
   ```

4. **Add descriptive scenario names and comments**
   ```gherkin
   @smoke @critical
   Scenario: User can complete checkout process
     # Step 1: Add product to cart
     When click element ".add-to-cart"
   ```

5. **Use appropriate wait strategies**
   ```gherkin
   # For visibility
   When wait for visible "#element" for 10 seconds
   
   # For loading to complete
   When wait for invisible ".spinner" for 20 seconds
   
   # For text to appear
   When wait for text "Success" to appear for 15 seconds
   ```

### ❌ DON'T
1. **Don't use fixed delays unless absolutely necessary**
   ```gherkin
   ❌ When pause for 5 seconds
   ✅ When wait for visible "#element" for 10 seconds
   ```

2. **Don't hard-code dynamic data**
   ```gherkin
   ❌ Then element "#orderId" text should be "12345"
   ✅ Then saved variable "orderId" should not be null
   ```

3. **Don't use overly complex locators**
   ```gherkin
   ❌ When click element "body > div:nth-child(2) > div > button"
   ✅ When click element "#submitButton"
   ```

4. **Don't assume immediate availability**
   ```gherkin
   ❌ When click element "#button"
   ✅ When wait for clickable "#button" for 10 seconds
       And click element "#button"
   ```

5. **Don't forget to clean up**
   ```gherkin
   # In hooks or last step
   When close browser
   When clear saved variables
   ```

---

## 📊 Step Categories Summary

| Category | Step Count | Common Use Cases |
|----------|------------|------------------|
| Navigation & Browser | 12 | Page navigation, browser control |
| Element Interaction | 20+ | Clicks, typing, form filling |
| Waiting | 30+ | Synchronization, loading states |
| Assertions | 25+ | Verification, validation |
| Variables | 10+ | Data storage, reuse |
| Advanced | 25+ | Scroll, keyboard, frames, alerts |

**Total: 120+ predefined step definitions**

---

## 🔍 Search Tips

### Find Steps By Action
- **Navigate**: Search "navigate to", "refresh", "back", "forward"
- **Click**: Search "click element", "click text", "double click"
- **Type**: Search "type into", "clear"
- **Wait**: Search "wait for visible", "wait for clickable"
- **Assert**: Search "should be visible", "should contain text"
- **Save**: Search "save text", "save attribute", "save url"

### Find Steps By Element Type
- **Input**: `type into`, `clear`, `save input value`
- **Button**: `click element`, `wait for clickable`
- **Checkbox**: `check`, `uncheck`, `should be checked`
- **Dropdown**: `select from dropdown`
- **Alert**: `accept alert`, `dismiss alert`, `alert text`
- **Frame**: `switch to frame`, `switch to default content`

---

## 🎨 Example Test Suites

### E-Commerce Suite
```gherkin
Feature: E-Commerce Checkout
  @smoke @checkout
  Scenario: Complete purchase flow
    Given open browser
    And navigate to "${shopUrl}"
    
    # Browse and add to cart
    When click element ".product:first-child"
    And save text of ".product-name" as "productName"
    And click element "#addToCart"
    
    # View cart
    And click element "#viewCart"
    And wait for visible ".cart-item" for 10 seconds
    Then element ".cart-item .name" text should be "${productName}"
    
    # Checkout
    When click element "#checkout"
    And wait for visible "#checkout-form" for 10 seconds
    And type "John Doe" into "#name"
    And type "john@example.com" into "#email"
    And click element "#placeOrder"
    
    # Confirmation
    And wait for visible "#confirmation" for 20 seconds
    And save text of "#orderNumber" as "orderNumber"
    Then page should contain text "${orderNumber}"
    And element ".success-icon" should be visible
```

### Form Validation Suite
```gherkin
Feature: Form Validation
  @validation
  Scenario: Validate required fields
    Given navigate to "${formUrl}"
    
    # Initial state
    Then element "#submit" should be disabled
    
    # Try submit without filling
    When click element "#submit" if visible
    Then element ".error-required" should be visible
    
    # Fill form
    When type "test@example.com" into "#email"
    And type "Test User" into "#name"
    And check "#terms"
    
    # Submit enabled
    Then element "#submit" should be enabled
    And element ".error-required" should not be visible
```

---

## 🛠️ Troubleshooting

### Common Issues

**Issue**: Element not found
```gherkin
# Add waits
When wait for visible "#element" for 10 seconds
When wait for element "#element" to be present for 10 seconds
```

**Issue**: Element not clickable
```gherkin
# Wait for clickable state
When wait for clickable "#button" for 10 seconds
# Or scroll into view
When scroll to element "#button"
```

**Issue**: Stale element
```gherkin
# Add waits after page changes
When click element "#link"
And wait for page load
```

**Issue**: Alert not found
```gherkin
# Wait for alert
When wait for alert to be present for 10 seconds
```

**Issue**: Frame content not accessible
```gherkin
# Switch to frame first
When switch to frame "#iframe"
# Do actions
When switch to default content
```

---

## 📝 Contributing

When adding new step definitions:
1. Follow existing naming conventions
2. Support variable substitution with `replaceVariables()`
3. Add comprehensive JavaDoc comments
4. Include multiple usage examples
5. Update this documentation

---

## 📞 Support

For issues or questions:
- Check relevant documentation section above
- Review example scenarios
- Verify locator strategy
- Ensure proper waits are used
- Check framework compatibility (Selenium vs Playwright)

---

## 📄 License

Part of SandsAutoFramework - Comprehensive Cucumber Step Library for UI Automation

---

**Last Updated**: February 18, 2026  
**Version**: 1.0  
**Total Steps**: 120+  
**Frameworks**: Selenium WebDriver, Playwright

