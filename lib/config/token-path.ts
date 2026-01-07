import { homedir } from 'os';
import path from 'path';

/**
 * Get the GitHub token file path
 * Priority:
 * 1. Custom path from environment variable or request
 * 2. Platform-specific default path
 */
export function getGitHubTokenPath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  // Check environment variable
  if (process.env.GITHUB_TOKEN_PATH) {
    return process.env.GITHUB_TOKEN_PATH;
  }

  // Platform-specific defaults
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows: %APPDATA%\TestFlowPro\github-tokens.json
    const appData = process.env.APPDATA || path.join(homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'TestFlowPro', 'github-tokens.json');
  } else if (platform === 'darwin') {
    // macOS: ~/.testflowpro/github-tokens.json
    return path.join(homedir(), '.testflowpro', 'github-tokens.json');
  } else {
    // Linux: ~/.config/testflowpro/github-tokens.json
    return path.join(homedir(), '.config', 'testflowpro', 'github-tokens.json');
  }
}

/**
 * Get platform-specific default token path for display
 */
export function getDefaultTokenPath(): string {
  const platform = process.platform;

  if (platform === 'win32') {
    return '%APPDATA%\\TestFlowPro\\github-tokens.json';
  } else if (platform === 'darwin') {
    return '~/.testflowpro/github-tokens.json';
  } else {
    return '~/.config/testflowpro/github-tokens.json';
  }
}

/**
 * Ensure the token directory exists
 */
export async function ensureTokenDirectory(tokenPath: string): Promise<void> {
  const fs = await import('fs');
  const dir = path.dirname(tokenPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

