import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface GitHubTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type: string;
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

const tokenFile = path.join(process.cwd(), '.github-tokens.json');
const GITHUB_CLIENT_ID = 'Iv1.b507a08c87ecfe98';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'authenticate') {
      return await authenticateWithGitHub();
    } else if (action === 'check') {
      return checkExistingToken();
    } else if (action === 'clear') {
      return clearTokens();
    } else if (action === 'setToken') {
      return setManualToken(body);
    } else if (action === 'pollToken') {
      return pollTokenStatus(body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('GitHub Auth Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

async function authenticateWithGitHub() {
  try {
    const deviceCode = await getDeviceCode();
    return NextResponse.json({ 
      deviceCode: deviceCode.device_code,
      userCode: deviceCode.user_code,
      verificationUri: deviceCode.verification_uri,
      interval: deviceCode.interval
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to start GitHub authentication',
      needsManualAuth: true
    }, { status: 400 });
  }
}

async function getDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user copilot'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get device code');
  }

  return await response.json();
}

async function pollForToken(deviceCode: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
  });

  const data = await response.json();
  
  if (data.error) {
    if (data.error === 'authorization_pending') {
      throw new Error('PENDING');
    }
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

function checkExistingToken() {
  try {
    if (fs.existsSync(tokenFile)) {
      const tokens: GitHubTokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
      const isValid = !tokens.expires_at || Date.now() < tokens.expires_at;
      
      return NextResponse.json({ 
        hasToken: true, 
        isValid,
        expiresAt: tokens.expires_at 
      });
    }
    
    return NextResponse.json({ hasToken: false });
  } catch (error) {
    return NextResponse.json({ hasToken: false, error: 'Failed to check token' });
  }
}

async function pollTokenStatus(body: any) {
  try {
    const { deviceCode } = body;
    
    if (!deviceCode) {
      return NextResponse.json({ error: 'Device code is required' }, { status: 400 });
    }
    
    const token = await pollForToken(deviceCode);
    
    const tokens: GitHubTokens = {
      access_token: token,
      token_type: 'Bearer',
      expires_at: Date.now() + (24 * 60 * 60 * 1000)
    };
    
    fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    if (error.message === 'PENDING') {
      return NextResponse.json({ pending: true });
    }
    return NextResponse.json({ error: error.message || 'Failed to get token' }, { status: 500 });
  }
}

async function setManualToken(body: any) {
  try {
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    const tokens: GitHubTokens = {
      access_token: token,
      token_type: 'Bearer',
      expires_at: Date.now() + (24 * 60 * 60 * 1000)
    };
    
    fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}

function clearTokens() {
  try {
    if (fs.existsSync(tokenFile)) {
      fs.unlinkSync(tokenFile);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear tokens' }, { status: 500 });
  }
}