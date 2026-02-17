/**
 * Locator Candidate Generator
 * Generates all possible locator candidates for an element
 * Supports Playwright filtering and chaining patterns
 */

import { ElementMetadata, LocatorCandidate } from './types';

/**
 * Generate all valid locator candidates for an element
 */
export function generateCandidates(element: ElementMetadata, enableFiltering: boolean = true): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];

  // 1. getByRole - Highest priority (accessibility-first)
  if (element.role) {
    // With accessible name (exact match)
    if (element.accessibleName) {
      candidates.push({
        locator: `getByRole('${element.role}', { name: '${escapeQuotes(element.accessibleName)}' })`,
        strategy: 'getByRole',
        confidence: 95,
        reason: 'Role with accessible name (most stable)'
      });

      // Also add regex version for partial match
      if (element.accessibleName.length > 10) {
        const shortName = element.accessibleName.substring(0, 20);
        candidates.push({
          locator: `getByRole('${element.role}', { name: /${escapeRegex(shortName)}/i })`,
          strategy: 'getByRole',
          confidence: 88,
          reason: 'Role with partial name match (regex)'
        });
      }
    }
    // With visible text
    else if (element.text && element.text.length < 50) {
      // Exact match
      candidates.push({
        locator: `getByRole('${element.role}', { name: '${escapeQuotes(element.text)}' })`,
        strategy: 'getByRole',
        confidence: 90,
        reason: 'Role with visible text'
      });

      // Regex match for flexibility
      if (element.text.length > 5) {
        candidates.push({
          locator: `getByRole('${element.role}', { name: /${escapeRegex(element.text)}/i })`,
          strategy: 'getByRole',
          confidence: 85,
          reason: 'Role with regex text match'
        });
      }
    }
    // Role only (may need filtering)
    else {
      candidates.push({
        locator: `getByRole('${element.role}')`,
        strategy: 'getByRole',
        confidence: 70,
        reason: 'Role only (may match multiple elements)'
      });
    }

    // Add filtered locators if element has parent context
    if (enableFiltering && element.parentText && element.parentRole) {
      // Chain with parent filter using hasText
      candidates.push({
        locator: `getByRole('${element.parentRole}').filter({ hasText: '${escapeQuotes(element.parentText)}' }).getByRole('${element.role}')`,
        strategy: 'getByRole+filter',
        confidence: 93,
        reason: 'Role with parent context filter (hasText)',
        usesFiltering: true,
        usesChaining: true
      });

      // Alternative: filter with has (nested locator)
      if (element.accessibleName) {
        candidates.push({
          locator: `getByRole('${element.parentRole}').filter({ has: page.getByRole('${element.role}', { name: '${escapeQuotes(element.accessibleName)}' }) })`,
          strategy: 'chained',
          confidence: 91,
          reason: 'Parent role filtered by child element',
          usesFiltering: true,
          usesChaining: true
        });
      }
    }
  }

  // 2. getByLabel - For form elements
  if (element.accessibleName && isFormElement(element.tag)) {
    candidates.push({
      locator: `getByLabel('${escapeQuotes(element.accessibleName)}')`,
      strategy: 'getByLabel',
      confidence: 92,
      reason: 'Label association (accessible and stable)'
    });
  }

  // 3. getByPlaceholder - For inputs
  if (element.placeholder) {
    candidates.push({
      locator: `getByPlaceholder('${escapeQuotes(element.placeholder)}')`,
      strategy: 'getByPlaceholder',
      confidence: 85,
      reason: 'Placeholder text (fairly stable)'
    });
  }

  // 4. getByText - For elements with unique text
  if (element.text && element.text.length > 0 && element.text.length < 100) {
    const isExactMatch = !hasVariableContent(element.text);

    if (isExactMatch) {
      // Exact match with exact: true option
      candidates.push({
        locator: `getByText('${escapeQuotes(element.text)}', { exact: true })`,
        strategy: 'getByText',
        confidence: 82,
        reason: 'Exact text match with exact option'
      });

      // Without exact option (more flexible)
      candidates.push({
        locator: `getByText('${escapeQuotes(element.text)}')`,
        strategy: 'getByText',
        confidence: 80,
        reason: 'Exact text match'
      });
    } else {
      // Use regex for partial match
      const partialText = element.text.substring(0, 20);
      candidates.push({
        locator: `getByText(/${escapeRegex(partialText)}/i)`,
        strategy: 'getByText',
        confidence: 70,
        reason: 'Partial text match (may be dynamic)'
      });
    }

    // Add filter patterns for list items
    if (enableFiltering && element.role === 'listitem' && element.text) {
      // Filter list items by text
      candidates.push({
        locator: `getByRole('listitem').filter({ hasText: '${escapeQuotes(element.text)}' })`,
        strategy: 'getByRole+filter',
        confidence: 87,
        reason: 'List item filtered by text content',
        usesFiltering: true
      });

      // Store in variable pattern
      const varName = element.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      candidates.push({
        locator: `const ${varName} = page.getByRole('listitem').filter({ hasText: '${escapeQuotes(element.text)}' })`,
        strategy: 'chained',
        confidence: 85,
        reason: 'Reusable locator variable with filter',
        usesFiltering: true
      });
    }
  }

  // 5. getByTestId - For elements with data-testid
  if (element.dataTestId) {
    candidates.push({
      locator: `getByTestId('${escapeQuotes(element.dataTestId)}')`,
      strategy: 'getByTestId',
      confidence: 88,
      reason: 'Test ID (explicit test hook)'
    });
  }

  // 6. ID selector - Fallback for elements with stable IDs
  if (element.id && isStableId(element.id)) {
    candidates.push({
      locator: `locator('#${element.id}')`,
      strategy: 'id',
      confidence: 75,
      reason: 'Stable ID selector'
    });
  }

  // 7. CSS selector - Last resort (only if stable)
  const cssSelector = generateStableCssSelector(element);
  if (cssSelector && isStableCssSelector(cssSelector)) {
    candidates.push({
      locator: `locator('${cssSelector}')`,
      strategy: 'css',
      confidence: 50,
      reason: 'CSS selector (least stable, use only if necessary)'
    });
  }

  return candidates;
}

/**
 * Check if element is a form element
 */
function isFormElement(tag: string): boolean {
  return ['input', 'textarea', 'select'].includes(tag);
}

/**
 * Check if text contains dynamic/variable content
 */
function hasVariableContent(text: string): boolean {
  // Check for numbers, dates, timestamps that might change
  const dynamicPatterns = [
    /\d{4}-\d{2}-\d{2}/, // Dates
    /\d{1,2}:\d{2}/, // Times
    /\$\d+/, // Prices
    /\d+%/, // Percentages
    /^\d+$/, // Pure numbers
  ];

  return dynamicPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if ID is stable (not auto-generated)
 */
function isStableId(id: string): boolean {
  // Reject IDs that look auto-generated
  const unstablePatterns = [
    /^[a-f0-9]{8,}$/i, // Hash-like IDs
    /^\d+$/, // Pure numbers
    /^uid-/, // UID prefixes
    /^gen-/, // Generated prefixes
    /-\d{10,}$/, // Timestamp suffixes
    /^react-/, // React auto IDs
    /^mui-/, // Material-UI auto IDs
  ];

  return !unstablePatterns.some(pattern => pattern.test(id));
}

/**
 * Generate stable CSS selector
 */
function generateStableCssSelector(element: ElementMetadata): string | null {
  const parts: string[] = [element.tag];

  // Add stable attributes only
  if (element.name && !element.name.match(/^\d+$/)) {
    parts.push(`[name="${element.name}"]`);
  }

  if (element.tag === 'input' && element.placeholder) {
    parts.push(`[placeholder="${element.placeholder}"]`);
  }

  // Only return if we have meaningful selectors
  if (parts.length > 1) {
    return parts.join('');
  }

  return null;
}

/**
 * Check if CSS selector is stable
 */
function isStableCssSelector(selector: string): boolean {
  // Reject selectors with unstable patterns
  const unstablePatterns = [
    /:nth-child/,
    /:nth-of-type/,
    /\[\d+]/,      // Array indices
    /\.[a-z0-9]{6,}/, // Hash-like classes
    />.*>.*>/,     // Deep nesting (fragile)
  ];

  return !unstablePatterns.some(pattern => pattern.test(selector));
}

/**
 * Escape quotes in strings
 */
function escapeQuotes(str: string): string {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

