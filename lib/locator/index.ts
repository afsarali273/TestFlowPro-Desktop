/**
 * Locator Intelligence Service
 * Main orchestrator for intelligent Playwright locator generation
 */

import { ElementMetadata, BestLocator, LocatorOptions } from './types';
import { extractElementsViaMCP } from './extractor';
import { generateCandidates } from './candidates';
import { rankLocators, filterByConfidence, excludeStrategies } from './ranker';

export class LocatorIntelligence {
  /**
   * Get best locators for all interactive elements on the page
   */
  async getBestLocators(
    executeTool: (serverId: string, toolName: string, args: any) => Promise<any>,
    options: LocatorOptions = {}
  ): Promise<BestLocator[]> {
    try {
      // Step 1: Extract element metadata from page
      const elements = await extractElementsViaMCP(executeTool);

      if (elements.length === 0) {
        console.warn('No interactive elements found on page');
        return [];
      }

      console.log(`📊 Found ${elements.length} interactive elements`);

      // Default to enable filtering and chaining
      const enableFiltering = options.enableFiltering !== false;
      const enableChaining = options.enableChaining !== false;

      // Step 2: Generate and rank locators for each element
      const results: BestLocator[] = [];

      for (const element of elements) {
        // Generate all possible locator candidates with filtering support
        let candidates = generateCandidates(element, enableFiltering);

        // Apply filters if specified
        if (options.minConfidence) {
          candidates = filterByConfidence(candidates, options.minConfidence);
        }

        if (options.excludeStrategies && options.excludeStrategies.length > 0) {
          candidates = excludeStrategies(candidates, options.excludeStrategies);
        }

        // Rank and select best locator
        const bestLocator = rankLocators(element, candidates);
        results.push(bestLocator);
      }

      return results;
    } catch (error) {
      console.error('Failed to generate best locators:', error);
      throw error;
    }
  }

  /**
   * Get best locator for a single element by selector
   */
  async getBestLocatorForElement(
    executeTool: (serverId: string, toolName: string, args: any) => Promise<any>,
    selector: string,
    options: LocatorOptions = {}
  ): Promise<BestLocator | null> {
    try {
      // Get metadata for specific element
      const script = `
        (() => {
          const element = document.querySelector('${selector}');
          if (!element) return null;
          
          const style = window.getComputedStyle(element);
          const visible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         element.offsetParent !== null;
          
          const role = element.getAttribute('role') || getImplicitRole(element);
          
          function getImplicitRole(el) {
            const tag = el.tagName.toLowerCase();
            const type = el.getAttribute('type');
            const roleMap = {
              'button': 'button',
              'a': el.hasAttribute('href') ? 'link' : null,
              'input': type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : 'textbox',
              'textarea': 'textbox',
              'select': 'combobox'
            };
            return roleMap[tag] || null;
          }
          
          function getAccessibleName(el) {
            if (el.hasAttribute('aria-label')) {
              return el.getAttribute('aria-label').trim();
            }
            if (el.id) {
              const label = document.querySelector(\`label[for="\${el.id}"]\`);
              if (label) return label.textContent.trim();
            }
            return null;
          }
          
          return {
            tag: element.tagName.toLowerCase(),
            role: role,
            label: element.getAttribute('label') || null,
            accessibleName: getAccessibleName(element),
            text: element.textContent?.trim() || null,
            placeholder: element.getAttribute('placeholder') || null,
            ariaLabel: element.getAttribute('aria-label') || null,
            ariaLabelledby: element.getAttribute('aria-labelledby') || null,
            id: element.id || null,
            name: element.getAttribute('name') || null,
            dataTestId: element.getAttribute('data-testid') || null,
            visible: visible,
            disabled: element.hasAttribute('disabled')
          };
        })();
      `;

      const result = await executeTool('playwright', 'browser_evaluate', {
        function: script
      });

      if (!result) return null;

      // Parse element metadata from result
      let elementData: ElementMetadata | null = null;

      if (result?.content?.[0]?.type === 'text') {
        const text = result.content[0].text;
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) ||
                         text.match(/### Result\n([\s\S]*?)(?:\n###|$)/);

        if (jsonMatch) {
          elementData = JSON.parse(jsonMatch[1].trim());
        } else {
          try {
            elementData = JSON.parse(text);
          } catch {
            return null;
          }
        }
      }

      if (!elementData) return null;

      // Generate and rank locators
      let candidates = generateCandidates(elementData);

      if (options.minConfidence) {
        candidates = filterByConfidence(candidates, options.minConfidence);
      }

      if (options.excludeStrategies) {
        candidates = excludeStrategies(candidates, options.excludeStrategies);
      }

      return rankLocators(elementData, candidates);
    } catch (error) {
      console.error('Failed to get locator for element:', error);
      return null;
    }
  }

  /**
   * Convert raw Playwright action to use best locator
   */
  async enhancePlaywrightAction(
    executeTool: (serverId: string, toolName: string, args: any) => Promise<any>,
    action: { type: string; selector?: string; locator?: string; [key: string]: any }
  ): Promise<{ type: string; locator: string; [key: string]: any }> {
    const selector = action.selector || action.locator;

    if (!selector) {
      return action as any;
    }

    const bestLocator = await this.getBestLocatorForElement(executeTool, selector);

    if (bestLocator) {
      return {
        ...action,
        locator: bestLocator.bestLocator,
        originalSelector: selector,
        strategy: bestLocator.strategy,
        confidence: bestLocator.confidence
      };
    }

    return action as any;
  }
}

// Export singleton instance
export const locatorIntelligence = new LocatorIntelligence();

// Export types and utilities
export * from './types';
export * from './extractor';
export * from './candidates';
export * from './ranker';

