# Variable Management & Data Storage Steps

## Overview
Steps for saving and retrieving dynamic data during test execution using the scenario context.

## Concept
The variable system allows you to:
- Save dynamic data from web elements
- Reuse saved values in subsequent steps
- Share data across multiple steps in a scenario
- Use variables in any step parameter with `${variableName}` syntax

## Steps Reference

### Save Element Data

#### `When save text of {string} as {string}`
Saves an element's text content to a variable.

**Parameters:**
- `locator` (string): Element locator
- `variableName` (string): Variable name to store value

**Examples:**
```gherkin
When save text of "#username" as "currentUser"
When save text of ".confirmation-code" as "code"
When save text of "//span[@id='status']" as "orderStatus"
```

**Usage:**
```gherkin
When save text of "#userId" as "userId"
# Later use it:
Then element "#userId-display" text should be "${userId}"
When type "${userId}" into "#confirm-id"
```

---

#### `When save attribute {string} of {string} as {string}`
Saves an element's attribute value to a variable.

**Parameters:**
- `attribute` (string): Attribute name
- `locator` (string): Element locator
- `variableName` (string): Variable name

**Examples:**
```gherkin
When save attribute "href" of "#downloadLink" as "downloadUrl"
When save attribute "data-id" of ".product" as "productId"
When save attribute "src" of "img.avatar" as "imageUrl"
When save attribute "value" of "input#token" as "csrfToken"
```

**Usage:**
```gherkin
When save attribute "href" of "#document" as "docUrl"
# Later navigate to it:
Given navigate to "${docUrl}"
```

---

#### `When save input value of {string} as {string}`
Saves an input field's current value to a variable.

**Parameters:**
- `locator` (string): Input field locator
- `variableName` (string): Variable name

**Examples:**
```gherkin
When save input value of "#generatedToken" as "token"
When save input value of "[name='email']" as "userEmail"
When save input value of "input[type='hidden']" as "sessionId"
```

**Usage:**
```gherkin
When save input value of "#auto-generated-id" as "recordId"
When type "${recordId}" into "#confirmation-id"
```

---

### Save Page State

#### `When save current url as {string}`
Saves the current page URL to a variable.

**Parameters:**
- `variableName` (string): Variable name

**Examples:**
```gherkin
When save current url as "homeUrl"
When save current url as "currentPage"
When save current url as "checkoutUrl"
```

**Usage:**
```gherkin
When save current url as "dashboardUrl"
# Navigate somewhere else
When navigate to "https://example.com/settings"
# Come back
Given navigate to "${dashboardUrl}"
```

---

#### `When save page title as {string}`
Saves the current page title to a variable.

**Parameters:**
- `variableName` (string): Variable name

**Examples:**
```gherkin
When save page title as "pageTitle"
When save page title as "originalTitle"
```

**Usage:**
```gherkin
When save page title as "expectedTitle"
# Navigate and verify
When navigate to "/other-page"
Then page title should not be "${expectedTitle}"
```

---

#### `When save tag name of {string} as {string}`
Saves an element's HTML tag name to a variable.

**Parameters:**
- `locator` (string): Element locator
- `variableName` (string): Variable name

**Examples:**
```gherkin
When save tag name of "#element" as "tagName"
When save tag name of ".component" as "componentTag"
```

---

### Clear Variables

#### `When clear saved variables`
Clears all variables stored in the scenario context.

**Example:**
```gherkin
When clear saved variables
```

**Usage:**
```gherkin
# Scenario 1 data
When save text of "#userId" as "userId"
When clear saved variables
# userId is now cleared
```

---

### Variable Assertions

#### `Then saved variable {string} should be {string}`
Asserts that a saved variable has a specific value.

**Parameters:**
- `variableName` (string): Variable name
- `expected` (string): Expected value

**Examples:**
```gherkin
When save text of "#status" as "orderStatus"
Then saved variable "orderStatus" should be "Completed"
Then saved variable "orderStatus" should be "${expectedStatus}"
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

## Variable Substitution Syntax

Variables can be used in ANY step parameter using `${variableName}` syntax:

### In Navigation
```gherkin
When save current url as "baseUrl"
Given navigate to "${baseUrl}/settings"
```

### In Text Input
```gherkin
When save text of "#generated-username" as "username"
When type "${username}" into "#confirm-username"
```

### In Element Locators
```gherkin
When save attribute "id" of ".dynamic-button" as "buttonId"
When click element "#${buttonId}"
```

### In Assertions
```gherkin
When save text of "#expected-message" as "message"
Then element "#actual-message" should contain text "${message}"
```

### In Wait Conditions
```gherkin
When save text of "#loading-text" as "loadingText"
When wait for text "${loadingText}" to disappear for 20 seconds
```

---

## Complete Workflow Examples

### Example 1: Order Confirmation Flow
```gherkin
Feature: Order Processing
  Scenario: Complete order and save confirmation
    Given navigate to "https://shop.example.com"
    
    # Save product info
    When save text of ".product-name" as "productName"
    And save text of ".product-price" as "productPrice"
    And click element "#add-to-cart"
    
    # Proceed to checkout
    When click element "#checkout"
    And wait for visible "#order-summary" for 10 seconds
    
    # Verify saved data appears
    Then element "#summary-product" text should be "${productName}"
    And element "#summary-price" text should be "${productPrice}"
    
    # Complete order and save confirmation
    When click element "#place-order"
    And wait for visible "#confirmation-number" for 15 seconds
    And save text of "#confirmation-number" as "orderNumber"
    
    # Verify order number
    Then saved variable "orderNumber" should not be null
    And page should contain text "${orderNumber}"
```

---

### Example 2: User Profile Update
```gherkin
Feature: Profile Management
  Scenario: Update and verify profile
    Given navigate to "https://example.com/profile"
    
    # Save original values
    When save input value of "#email" as "originalEmail"
    And save input value of "#phone" as "originalPhone"
    And save current url as "profileUrl"
    
    # Update email
    When clear "#email"
    And type "newemail@example.com" into "#email"
    And click element "#save"
    And wait for text "Profile updated" to appear for 10 seconds
    
    # Verify change
    Then input value of "#email" should not be "${originalEmail}"
    
    # Navigate away and back
    When navigate to "https://example.com/dashboard"
    And navigate to "${profileUrl}"
    
    # Verify email persisted
    Then input value of "#email" should be "newemail@example.com"
```

---

### Example 3: Multi-Step Form with Dependencies
```gherkin
Feature: Registration
  Scenario: Register with generated data
    Given navigate to "https://example.com/register"
    
    # Step 1: Basic info
    When type "John Doe" into "#fullName"
    And type "john@example.com" into "#email"
    And click element "#next"
    And wait for visible "#step2" for 10 seconds
    
    # Step 2: Save generated ID
    And save text of "#generated-user-id" as "userId"
    And save text of "#activation-code" as "activationCode"
    Then saved variable "userId" should not be null
    
    # Step 3: Confirm with generated data
    When click element "#next"
    And wait for visible "#step3" for 10 seconds
    And type "${userId}" into "#confirm-user-id"
    And type "${activationCode}" into "#confirm-activation"
    And click element "#submit"
    
    # Verify registration
    Then page should contain text "Registration successful"
    And page should contain text "${userId}"
```

---

### Example 4: Dynamic Navigation
```gherkin
Feature: Dynamic URLs
  Scenario: Navigate using saved URLs
    Given navigate to "https://example.com"
    And save current url as "homeUrl"
    
    # Navigate to product
    When click element ".product-link:first-child"
    And wait for page load
    And save current url as "productUrl"
    And save attribute "data-id" of ".product" as "productId"
    
    # Go to cart
    When click element "#add-to-cart"
    And click element "#view-cart"
    And save current url as "cartUrl"
    
    # Verify product ID in cart
    Then element "[data-product-id='${productId}']" should be visible
    
    # Navigate back to product
    When navigate to "${productUrl}"
    Then current url should be "${productUrl}"
    
    # Back to home
    When navigate to "${homeUrl}"
    Then page title should contain "Home"
```

---

### Example 5: API Token Flow
```gherkin
Feature: API Integration
  Scenario: Extract and use API token
    Given navigate to "https://example.com/api/tokens"
    
    # Generate token
    When click element "#generate-token"
    And wait for visible "#token-display" for 10 seconds
    And save text of "#token-display" as "apiToken"
    And save text of "#token-expiry" as "expiryDate"
    
    # Verify token
    Then saved variable "apiToken" should not be null
    And element "#token-display" text should be "${apiToken}"
    
    # Use token in another form
    When navigate to "https://example.com/api/test"
    And type "${apiToken}" into "#auth-token"
    And click element "#test-api"
    And wait for visible ".success-response" for 10 seconds
    
    Then element ".success-response" should contain text "Authenticated"
```

---

### Example 6: Comparison Testing
```gherkin
Feature: Data Comparison
  Scenario: Compare before and after states
    Given navigate to "https://example.com/products"
    
    # Save original count
    When save text of ".product-count" as "originalCount"
    
    # Add new product
    When click element "#add-product"
    And type "New Product" into "#productName"
    And type "99.99" into "#productPrice"
    And click element "#save"
    And wait for text "Product added" to appear for 10 seconds
    
    # Refresh and get new count
    When refresh page
    And wait for visible ".product-count" for 10 seconds
    And save text of ".product-count" as "newCount"
    
    # Verify count increased
    Then saved variable "newCount" should not be "${originalCount}"
```

---

## Best Practices

### ✅ DO
- Use descriptive variable names: `userId`, `orderNumber`, `confirmationCode`
- Save data before it changes or disappears
- Verify saved variables are not null when critical
- Clear variables between independent scenarios
- Use variables for dynamic, generated, or user-specific data

### ❌ DON'T
- Don't hard-code dynamic values (order IDs, timestamps, etc.)
- Don't reuse variable names for different data in same scenario
- Don't assume variables persist across scenarios
- Don't save static data that never changes
- Don't create variables you won't use

---

## Variable Scope

### ✅ Variables ARE:
- Scoped to a single scenario
- Available across all steps within that scenario
- Cleared automatically after scenario completion
- Thread-safe for parallel execution

### ❌ Variables are NOT:
- Shared between different scenarios
- Persisted after scenario ends
- Global across feature files
- Stored permanently

---

## Common Use Cases

```gherkin
# 1. Save generated IDs
When save text of "#order-id" as "orderId"

# 2. Save authentication tokens
When save attribute "data-token" of "#auth" as "authToken"

# 3. Save URLs for navigation
When save current url as "returnUrl"

# 4. Save form values for verification
When save input value of "#generatedField" as "generatedValue"

# 5. Save text for later comparison
When save text of "#status" as "initialStatus"

# 6. Save page state
When save page title as "originalTitle"

# 7. Clear all variables
When clear saved variables
```

---

## Framework Support
- ✅ **Selenium WebDriver**: Full support
- ✅ **Playwright**: Full support
- 🔄 **Thread-safe**: Scenario-scoped context
- ✅ **Type**: Automatic String conversion

