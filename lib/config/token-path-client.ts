/**
 * Client-safe token path utilities
 * These functions can be used in both client and server environments
 */

/**
 * Get platform-specific default token path for display in UI
 * This is safe for both client and server environments
 */
export function getDefaultTokenPath(): string {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) {
      return '%APPDATA%\\TestFlowPro\\github-tokens.json';
    } else if (platform.includes('mac')) {
      return '~/.testflowpro/github-tokens.json';
    } else {
      return '~/.config/testflowpro/github-tokens.json';
    }
  }

  // Server-side detection
  if (typeof process !== 'undefined') {
    const platform = process.platform;

    if (platform === 'win32') {
      return '%APPDATA%\\TestFlowPro\\github-tokens.json';
    } else if (platform === 'darwin') {
      return '~/.testflowpro/github-tokens.json';
    } else {
      return '~/.config/testflowpro/github-tokens.json';
    }
  }

  // Fallback
  return '~/.testflowpro/github-tokens.json';
}

