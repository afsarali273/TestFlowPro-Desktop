# Enhanced Exploratory Testing AI Prompt

## Overview

This document describes the comprehensive AI prompt system for intelligent exploratory testing in TestFlowPro. The enhanced prompt guides the AI agent to perform deep, systematic exploration of web applications and generate detailed test scenarios.

## Key Improvements

### 1. **Intelligent Website Analysis (Phase 1)**

The AI now starts by understanding the application before testing:

- **Metadata Analysis**: Examines page title, meta tags, Open Graph tags, and schema.org data
- **Application Type Detection**: Identifies whether the site is e-commerce, SaaS, blog, documentation, portfolio, etc.
- **Domain Understanding**: Determines business domain, purpose, target users, and main features
- **Architecture Analysis**: Maps navigation structure, user roles, and application workflows

**Benefits**:
- Context-aware testing based on application type
- Prioritized test coverage based on application purpose
- Better test scenario categorization

---

### 2. **Systematic Exploration Strategy (Phase 2)**

The AI performs targeted exploration across 9 comprehensive categories:

#### A. Navigation & Information Architecture
- Tests all navigation elements (header, footer, sidebar, mega-menus)
- Verifies breadcrumbs, browser back/forward functionality
- Checks mobile/responsive navigation

#### B. Search & Filter Functionality
- Performs searches with various inputs (valid, empty, special characters, long queries)
- Tests autocomplete, filters, sorting, and pagination
- Covers edge cases and validation

#### C. Forms & Input Fields
- Identifies all forms (login, registration, contact, checkout, etc.)
- Tests validation rules, error messages, success flows
- Tests various input types (text, email, phone, date, file upload)
- Checks character limits and special character handling

#### D. Interactive Elements & User Actions
- Tests buttons, modals, accordions, tabs, tooltips
- Interacts with carousels, galleries, sliders
- Tests drag-and-drop, media players, interactive charts

#### E. E-commerce Specific (if applicable)
- Browses products, categories, and filters
- Tests cart operations (add, update, remove)
- Explores checkout process, coupons, and reviews
- Tests account creation and login

#### F. Content & Media
- Navigates content pages, blog posts, articles
- Tests comments, social sharing, tags
- Verifies media loading (images, videos, embedded content)

#### G. Dashboard & User Account (if present)
- Tests authentication flows
- Explores profile, settings, preferences
- Tests password reset and notifications

#### H. Data Tables & Lists
- Tests sorting, pagination, bulk actions
- Verifies inline editing and export features

#### I. Edge Cases & Error Scenarios
- Tests error pages (404, 500)
- Verifies browser navigation (back/forward, refresh)
- Tests session timeout and network errors

---

### 3. **Intelligent Test Scenario Generation (Phase 3)**

The AI generates scenarios across 4 priority tiers:

#### 1. Critical Path Testing (High Priority)
- Main user journeys (homepage → goal completion)
- Revenue-generating flows (checkout, sign-ups)
- Core features that define the application

#### 2. Feature Testing (Medium Priority)
- Navigation and routing
- Search and filtering
- Forms and data entry
- Content interaction

#### 3. Edge Cases & Validation (Medium/Low Priority)
- Input validation and error handling
- Boundary conditions
- Empty states and no-data scenarios

#### 4. UI/UX Testing (Low/Medium Priority)
- Responsive behavior
- Accessibility features
- Visual consistency
- Loading states

---

## Prompt Structure

### Dynamic Context Handling

```typescript
**📋 USER CONTEXT**: ${context?.trim() || 'Perform systematic and comprehensive exploration of the entire application'}
```

**If user provides specific context**:
- 70% exploration time on specified areas
- 30% on general application coverage
- Focused, deep testing of mentioned features

**If no context provided**:
- Broad exploration (8-12 key pages/sections)
- Balanced coverage across all categories
- Critical user journeys prioritized

---

## Output Format

The AI returns structured JSON with detailed test scenarios:

```json
{
  "scenarios": [
    {
      "title": "Verify product search with filters",
      "description": "Test that users can search for products and apply multiple filters to refine results",
      "page": "Products page",
      "category": "Search",
      "priority": "high",
      "steps": [
        "Step 1: Navigate to products page",
        "Step 2: Enter 'laptop' in search box with placeholder 'Search products...'",
        "Step 3: Click 'Search' button",
        "Step 4: Click 'Filters' dropdown and select 'Price: $500-$1000'",
        "Step 5: Verify results show only laptops in specified price range"
      ]
    }
  ]
}
```

---

## Quality Criteria for Generated Scenarios

Each scenario must include:

1. ✅ **Specific, action-oriented title** (e.g., "Verify product search with filters")
2. ✅ **Detailed description** explaining what to test and why it's important
3. ✅ **Exact page/URL** where testing occurs
4. ✅ **Clear category** (Navigation, Search, Forms, Login, etc.)
5. ✅ **Business-aligned priority** (high, medium, low)
6. ✅ **Actionable steps** with specific:
   - Element identifiers (button text, placeholder, aria-label)
   - Realistic test data
   - Expected results with verification criteria

**Coverage Goals**:
- Minimum 15-30 scenarios for comprehensive coverage
- Mix of positive and negative test cases
- Grouped by logical categories

---

## Example Use Cases

### Use Case 1: E-commerce Website
**User Input**: "https://example-shop.com"

**AI Behavior**:
1. Analyzes metadata → detects "e-commerce" site
2. Focuses on: product browsing, search, filters, cart, checkout
3. Generates scenarios like:
   - "Add product to cart and update quantity"
   - "Apply coupon code at checkout"
   - "Filter products by price range"
   - "Sort products by rating"

### Use Case 2: SaaS Dashboard (with context)
**User Input**: 
- URL: "https://saas-app.com"
- Context: "Focus on user management and reporting features"

**AI Behavior**:
1. Analyzes metadata → detects "SaaS application"
2. Spends 70% time on user management & reporting
3. Spends 30% time on general features (login, navigation, settings)
4. Generates scenarios like:
   - "Create new user with admin role"
   - "Generate monthly sales report"
   - "Export user list to CSV"
   - "Edit user permissions"

### Use Case 3: Blog/Content Site
**User Input**: "https://tech-blog.com"

**AI Behavior**:
1. Analyzes metadata → detects "blog/content site"
2. Focuses on: navigation, content browsing, search, comments
3. Generates scenarios like:
   - "Search articles by keyword"
   - "Filter posts by category"
   - "Navigate to post details and read content"
   - "Submit comment on blog post"

---

## Best Practices for Users

### 1. Provide Specific Context (Optional but Recommended)

**Good Context Examples**:
```
"Focus on checkout flow, payment methods, and order confirmation"
"Test search functionality, filters, and product comparison"
"Explore admin dashboard, user roles, and permissions"
"Check responsive behavior on mobile and tablet viewports"
```

**Why**: Specific context helps the AI prioritize relevant scenarios and go deeper into areas you care about.

### 2. Review and Refine Generated Scenarios

- Check that scenarios align with your testing goals
- Add or remove scenarios as needed
- Adjust priorities based on business requirements
- Enhance steps with environment-specific data

### 3. Iterate for Better Coverage

- Run exploration multiple times with different contexts
- Combine scenarios from multiple exploration sessions
- Focus on one area at a time for deep coverage

---

## Technical Implementation

### Location
File: `/app/ralph-loop/services/explorationService.ts`
Function: `exploreAndGenerateScenarios()`

### Tools Used
- **Playwright MCP**: For browser automation and interaction
- **GitHub Copilot API**: For AI-powered analysis and scenario generation
- **ReactMarkdown**: For rendering exploration reports

### Key Features
- Dynamic prompt generation based on user context
- Metadata extraction for intelligent analysis
- Systematic exploration across multiple categories
- Structured JSON output for easy parsing
- Detailed exploration summary with statistics

---

## Metrics & Expected Results

### Scenario Coverage

| Application Type | Expected Scenarios | Key Categories |
|-----------------|-------------------|----------------|
| E-commerce | 25-40 | Search, Filters, Cart, Checkout, Products |
| SaaS Dashboard | 20-35 | Navigation, Forms, Data Tables, Settings |
| Blog/Content | 15-25 | Navigation, Search, Content, Comments |
| Portfolio/Landing | 10-20 | Navigation, Contact Forms, Responsive |

### Exploration Depth

- **Pages Explored**: 8-12 pages (without context), 10-15 pages (with context)
- **Interactions Tested**: 20-40 interactions per session
- **Categories Covered**: 6-9 categories on average
- **Priority Distribution**: ~30% high, ~50% medium, ~20% low

---

## Troubleshooting

### Issue: Too Few Scenarios Generated

**Solutions**:
- Ensure MCP servers are running
- Verify the website is accessible
- Provide more specific context
- Check for popups/modals blocking exploration

### Issue: Scenarios Not Relevant

**Solutions**:
- Provide clearer context about what to test
- Re-run exploration with focused instructions
- Manually add/edit scenarios after generation

### Issue: Exploration Taking Too Long

**Solutions**:
- Provide specific context to narrow scope
- Limit exploration to critical pages only
- Check for infinite scrolling or dynamic loading issues

---

## Future Enhancements

Potential improvements for the exploration prompt:

1. **Visual Regression Detection**: Compare screenshots across exploration sessions
2. **Accessibility Testing**: Include WCAG compliance checks
3. **Performance Metrics**: Measure page load times, resource sizes
4. **API Exploration**: Discover and test backend APIs alongside UI
5. **Mobile-First Exploration**: Dedicated mobile device testing
6. **Multi-Language Testing**: Detect and test localized versions
7. **Authentication Flows**: Support for login credentials and session management
8. **State-Based Exploration**: Track application state changes during exploration

---

## Conclusion

The enhanced exploratory testing prompt provides:

✅ **Intelligence**: Understands application context before testing  
✅ **Comprehensiveness**: Covers 9 major testing categories  
✅ **Flexibility**: Adapts based on user context and application type  
✅ **Quality**: Generates detailed, actionable test scenarios  
✅ **Efficiency**: Balances breadth and depth of coverage  

This system empowers QA teams to discover comprehensive test scenarios automatically, significantly reducing manual effort while improving test coverage.

