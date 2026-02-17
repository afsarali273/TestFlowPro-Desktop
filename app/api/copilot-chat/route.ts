import { NextRequest, NextResponse } from 'next/server';
import { copilotSDK } from '@/lib/services/copilot-sdk-service';


export async function POST(request: NextRequest) {
  try {
    const { message, type, useSDK = true, action, model, agentMode, mcpTools } = await request.json();

    // Handle authentication actions for SDK
    if (action === 'check-auth') {
      const isAuth = copilotSDK.isAuthenticated();
      return NextResponse.json({ authenticated: isAuth });
    }

    if (action === 'authenticate') {
      try {
        const authInfo = await copilotSDK.startAuthentication();
        return NextResponse.json({
          success: true,
          userCode: authInfo.userCode,
          verificationUri: authInfo.verificationUri,
          deviceCode: authInfo.deviceCode,
          interval: authInfo.interval
        });
      } catch (error: any) {
        return NextResponse.json({
          error: error.message
        }, { status: 500 });
      }
    }

    if (action === 'poll-token') {
      try {
        const { deviceCode, interval, expiresIn } = await request.json();
        const success = await copilotSDK.completeAuthentication(deviceCode, interval, expiresIn);
        return NextResponse.json({ success });
      } catch (error: any) {
        return NextResponse.json({
          error: error.message
        }, { status: 500 });
      }
    }

    if (action === 'clear-auth') {
      copilotSDK.clearAuth();
      return NextResponse.json({ success: true });
    }

    // Regular chat functionality
    console.log('🚀 Copilot API Request:', {
      type,
      messageLength: message?.length || 0,
      messagePreview: message?.substring(0, 100),
      useSDK: useSDK ? 'yes (OAuth auto-auth)' : 'no (legacy)',
      agentMode: agentMode || false,
      mcpToolsCount: mcpTools?.length || 0
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Try using new GitHub Copilot SDK first (with auto-auth)
    if (useSDK) {
      try {
        console.log('✨ Using GitHub Copilot SDK with OAuth auto-auth...');
        const result = await copilotSDK.chat({
          message,
          type,
          model: model || 'gpt-4o',
          agentMode: agentMode || false,
          mcpTools: mcpTools || []
        });

        console.log('✅ SDK Response received');
        return NextResponse.json(result);
      } catch (sdkError: any) {
        console.warn('⚠️ SDK failed:', sdkError.message);

        // If it's an auth error, start auth flow and return info to UI
        if (sdkError.message.includes('authenticate at') || sdkError.message.includes('No valid token')) {
          try {
            const authInfo = await copilotSDK.startAuthentication();
            return NextResponse.json({
              error: 'Authentication required',
              needsAuth: true,
              authInfo: {
                userCode: authInfo.userCode,
                verificationUri: authInfo.verificationUri,
                deviceCode: authInfo.deviceCode,
                interval: authInfo.interval
              }
            }, { status: 401 });
          } catch (authError: any) {
            return NextResponse.json({
              error: 'Failed to start authentication',
              message: authError.message
            }, { status: 500 });
          }
        }

        // Re-throw other errors
        return NextResponse.json({
          error: sdkError.message || 'Failed to generate response'
        }, { status: 500 });
      }
    }

    // OAuth is now required
    return NextResponse.json({
      error: 'OAuth authentication required. Please use the SDK with OAuth.'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Copilot Chat Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate response' 
    }, { status: 500 });
  }
}

