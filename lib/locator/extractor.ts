/**
 * Element Metadata Extractor
 * Extracts structured metadata from page elements using Playwright page.evaluate
 */

import { ElementMetadata } from './types';

/**
 * Generate page.evaluate script to extract element metadata
 * Returns a script that can be executed via Playwright's page.evaluate()
 */
export function generateExtractionScript(): string {
  return `
    (() => {
      const INTERACTIVE_SELECTORS = [
        'button',
        'input',
        'textarea',
        'select',
        'a[href]',
        '[role="button"]',
        '[role="link"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="menuitem"]',
        '[role="tab"]',
        '[role="switch"]',
        '[role="textbox"]',
        '[role="combobox"]',
        '[role="searchbox"]',
        '[role="slider"]',
        '[role="spinbutton"]'
      ];

      /**
       * Get accessible name for element (ARIA spec compliant)
       */
      function getAccessibleName(element) {
        // aria-labelledby (highest priority)
        if (element.hasAttribute('aria-labelledby')) {
          const ids = element.getAttribute('aria-labelledby').split(/\\s+/);
          const labels = ids
            .map(id => document.getElementById(id))
            .filter(el => el)
            .map(el => el.textContent.trim());
          if (labels.length > 0) return labels.join(' ');
        }

        // aria-label
        if (element.hasAttribute('aria-label')) {
          const label = element.getAttribute('aria-label').trim();
          if (label) return label;
        }

        // Label element (for inputs)
        if (element.id) {
          const label = document.querySelector(\`label[for="\${element.id}"]\`);
          if (label) return label.textContent.trim();
        }

        // Wrapped in label
        const parentLabel = element.closest('label');
        if (parentLabel) {
          const clone = parentLabel.cloneNode(true);
          const input = clone.querySelector('input, textarea, select');
          if (input) input.remove();
          return clone.textContent.trim();
        }

        // Title attribute
        if (element.hasAttribute('title')) {
          return element.getAttribute('title').trim();
        }

        // Placeholder (for inputs)
        if (element.hasAttribute('placeholder')) {
          return element.getAttribute('placeholder').trim();
        }

        // Button/link text content
        if (['button', 'a'].includes(element.tagName.toLowerCase())) {
          return element.textContent.trim();
        }

        return null;
      }

      /**
       * Get implicit role for element
       */
      function getImplicitRole(element) {
        const tag = element.tagName.toLowerCase();
        const type = element.getAttribute('type');

        const roleMap = {
          'button': 'button',
          'a': element.hasAttribute('href') ? 'link' : null,
          'input': type === 'button' || type === 'submit' ? 'button' :
                   type === 'checkbox' ? 'checkbox' :
                   type === 'radio' ? 'radio' :
                   type === 'search' ? 'searchbox' :
                   'textbox',
          'textarea': 'textbox',
          'select': 'combobox',
          'h1': 'heading',
          'h2': 'heading',
          'h3': 'heading',
          'h4': 'heading',
          'h5': 'heading',
          'h6': 'heading',
          'img': 'img',
          'nav': 'navigation',
          'main': 'main',
          'header': 'banner',
          'footer': 'contentinfo'
        };

        return roleMap[tag] || null;
      }

      /**
       * Extract metadata from single element
       */
      function extractElementMetadata(element, index) {
        const style = window.getComputedStyle(element);
        const visible = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       element.offsetParent !== null;

        const role = element.getAttribute('role') || getImplicitRole(element);
        
        // Get parent context for filtering support
        let parentRole = null;
        let parentText = null;
        let parent = element.parentElement;
        while (parent && !parentRole) {
          const pRole = parent.getAttribute('role') || getImplicitRole(parent);
          if (pRole && ['listitem', 'list', 'navigation', 'main', 'article'].includes(pRole)) {
            parentRole = pRole;
            parentText = parent.textContent?.trim().substring(0, 50) || null;
            break;
          }
          parent = parent.parentElement;
        }
        
        // Get child elements
        const childElements = Array.from(element.children).map(child => {
          const childRole = child.getAttribute('role') || getImplicitRole(child);
          return childRole || child.tagName.toLowerCase();
        }).filter(Boolean);

        return {
          tag: element.tagName.toLowerCase(),
          role: role,
          label: element.getAttribute('label') || null,
          accessibleName: getAccessibleName(element),
          text: element.textContent?.trim().substring(0, 100) || null,
          placeholder: element.getAttribute('placeholder') || null,
          ariaLabel: element.getAttribute('aria-label') || null,
          ariaLabelledby: element.getAttribute('aria-labelledby') || null,
          id: element.id || null,
          name: element.getAttribute('name') || null,
          dataTestId: element.getAttribute('data-testid') || 
                     element.getAttribute('data-test-id') || 
                     element.getAttribute('data-test') || null,
          visible: visible,
          disabled: element.hasAttribute('disabled') || 
                   element.getAttribute('aria-disabled') === 'true',
          index: index,
          parentRole: parentRole,
          parentText: parentText,
          childElements: childElements
        };
      }

      // Extract all interactive elements
      const elements = document.querySelectorAll(INTERACTIVE_SELECTORS.join(', '));
      const metadata = [];

      elements.forEach((element, index) => {
        try {
          metadata.push(extractElementMetadata(element, index));
        } catch (error) {
          console.error('Failed to extract metadata:', error);
        }
      });

      return metadata;
    })();
  `;
}

/**
 * Extract elements via MCP server
 * Uses Playwright MCP's browser_evaluate tool
 */
export async function extractElementsViaMCP(
  executeTool: (serverId: string, toolName: string, args: any) => Promise<any>
): Promise<ElementMetadata[]> {
  try {
    const script = generateExtractionScript();

    const result = await executeTool('playwright', 'browser_evaluate', {
      function: script
    });

    // Parse result from MCP
    if (result?.content?.[0]?.type === 'text') {
      const text = result.content[0].text;

      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) ||
                       text.match(/### Result\n([\s\S]*?)(?:\n###|$)/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try parsing as direct JSON
      try {
        return JSON.parse(text);
      } catch {
        console.warn('Could not parse MCP response as JSON');
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error('Failed to extract elements via MCP:', error);
    throw error;
  }
}

