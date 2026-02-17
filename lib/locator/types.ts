/**
 * Locator Intelligence Types
 * Core type definitions for intelligent Playwright locator generation
 */

export interface ElementMetadata {
  tag: string;
  role: string | null;
  label: string | null;
  accessibleName: string | null;
  text: string | null;
  placeholder: string | null;
  ariaLabel: string | null;
  ariaLabelledby: string | null;
  id: string | null;
  name: string | null;
  dataTestId: string | null;
  visible: boolean;
  disabled: boolean;
  index?: number;
  parentRole?: string | null;
  parentText?: string | null;
  childElements?: string[];
  siblingText?: string[];
}

export type LocatorStrategy =
  | 'getByRole'
  | 'getByLabel'
  | 'getByPlaceholder'
  | 'getByText'
  | 'getByTestId'
  | 'getByRole+filter'
  | 'chained'
  | 'id'
  | 'css';

export interface LocatorCandidate {
  locator: string;
  strategy: LocatorStrategy;
  confidence: number;
  reason: string;
  usesFiltering?: boolean;
  usesChaining?: boolean;
}

export interface BestLocator {
  element: ElementMetadata;
  bestLocator: string;
  strategy: LocatorStrategy;
  confidence: number;
  alternatives: string[];
  reasoning?: string;
  usesFiltering?: boolean;
  usesChaining?: boolean;
}

export interface LocatorOptions {
  includeAlternatives?: boolean;
  minConfidence?: number;
  excludeStrategies?: LocatorStrategy[];
  enableFiltering?: boolean;
  enableChaining?: boolean;
  exactMatch?: boolean;
}

export interface FilterOptions {
  hasText?: string;
  hasNotText?: string;
  has?: string;
  exact?: boolean;
}

