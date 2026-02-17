/**
 * Locator Ranker
 * Ranks locator candidates using deterministic algorithm
 */

import { LocatorCandidate, LocatorStrategy, BestLocator, ElementMetadata } from './types';

/**
 * Strategy priority order (strict)
 * Lower number = higher priority
 */
const STRATEGY_PRIORITY: Record<LocatorStrategy, number> = {
  'getByRole+filter': 1,      // Filtered role locators (most precise)
  'getByRole': 2,             // Plain role locators
  'getByLabel': 3,            // Label association
  'getByPlaceholder': 4,      // Placeholder text
  'getByText': 5,             // Text content
  'chained': 6,               // Chained/complex locators
  'getByTestId': 7,           // Test IDs
  'id': 8,                    // ID selectors
  'css': 9                    // CSS selectors (last resort)
};

/**
 * Rank candidates and select the best locator
 */
export function rankLocators(
  element: ElementMetadata,
  candidates: LocatorCandidate[]
): BestLocator {
  if (candidates.length === 0) {
    return {
      element,
      bestLocator: `locator('${element.tag}')`,
      strategy: 'css',
      confidence: 20,
      alternatives: [],
      reasoning: 'No viable locator found, using generic tag selector'
    };
  }

  // Sort candidates by priority, then confidence
  const sorted = [...candidates].sort((a, b) => {
    const priorityDiff = STRATEGY_PRIORITY[a.strategy] - STRATEGY_PRIORITY[b.strategy];
    if (priorityDiff !== 0) return priorityDiff;

    // Same strategy, prefer higher confidence
    return b.confidence - a.confidence;
  });

  const best = sorted[0];
  const alternatives = sorted.slice(1, 5).map(c => c.locator);

  return {
    element,
    bestLocator: best.locator,
    strategy: best.strategy,
    confidence: best.confidence,
    alternatives,
    reasoning: best.reason,
    usesFiltering: best.usesFiltering,
    usesChaining: best.usesChaining
  };
}

/**
 * Rank multiple elements
 */
export function rankMultipleLocators(
  elements: ElementMetadata[],
  candidatesMap: Map<ElementMetadata, LocatorCandidate[]>
): BestLocator[] {
  return elements.map(element => {
    const candidates = candidatesMap.get(element) || [];
    return rankLocators(element, candidates);
  });
}

/**
 * Filter candidates by minimum confidence
 */
export function filterByConfidence(
  candidates: LocatorCandidate[],
  minConfidence: number
): LocatorCandidate[] {
  return candidates.filter(c => c.confidence >= minConfidence);
}

/**
 * Exclude specific strategies
 */
export function excludeStrategies(
  candidates: LocatorCandidate[],
  excludeList: LocatorStrategy[]
): LocatorCandidate[] {
  return candidates.filter(c => !excludeList.includes(c.strategy));
}

/**
 * Get strategy statistics for debugging
 */
export function getStrategyStats(locators: BestLocator[]): Record<LocatorStrategy, number> {
  const stats: Record<string, number> = {};

  for (const locator of locators) {
    stats[locator.strategy] = (stats[locator.strategy] || 0) + 1;
  }

  return stats as Record<LocatorStrategy, number>;
}

