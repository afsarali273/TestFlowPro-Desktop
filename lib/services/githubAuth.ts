export class GitHubAuthService {
  async checkAuthStatus(): Promise<{ hasToken: boolean; isValid: boolean }> {
    try {
      const response = await fetch('/api/github-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });
      const data = await response.json();
      return { hasToken: data.hasToken, isValid: data.isValid };
    } catch (error) {
      return { hasToken: false, isValid: false };
    }
  }

  async startDeviceFlow(): Promise<{ userCode: string; verificationUri: string; deviceCode: string; interval: number }> {
    const response = await fetch('/api/github-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'authenticate' })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to start authentication');
    }

    return data;
  }

  async pollForToken(deviceCode: string): Promise<{ success: boolean; token?: string; pending?: boolean }> {
    const response = await fetch('/api/github-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pollToken', deviceCode })
    });

    const data = await response.json();
    
    if (data.pending) {
      return { success: false, pending: true };
    }
    
    if (data.success) {
      return { success: true, token: data.token };
    }

    throw new Error(data.error || 'Failed to get token');
  }

  async setToken(token: string): Promise<void> {
    const response = await fetch('/api/github-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setToken', token })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save token');
    }
  }

  async clearTokens(): Promise<void> {
    await fetch('/api/github-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    });
  }
}