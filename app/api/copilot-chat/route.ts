import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';

interface GitHubTokens {
  access_token: string;
  token_type: string;
  expires_at?: number;
}

const tokenFile = path.join(process.cwd(), '.github-tokens.json');
const COPILOT_VERSION = "0.26.7";
const EDITOR_PLUGIN_VERSION = `copilot-chat/${COPILOT_VERSION}`;
const USER_AGENT = `GitHubCopilotChat/${COPILOT_VERSION}`;
const API_VERSION = "2025-04-01";

export async function POST(request: NextRequest) {
  try {
    const { message, type } = await request.json();
    
    console.log('🚀 Copilot API Request:', {
      type,
      messageLength: message?.length || 0,
      messagePreview: message?.substring(0, 100)
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('🔑 Getting Copilot token...');
    const token = await getCopilotToken();
    console.log('✅ Token retrieved, length:', token?.length || 0);
    
    const context = getKnowledgeBaseContext(type, message);
    
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(type, context)
        },
        {
          role: 'user', 
          content: message
        }
      ],
      model: 'gpt-4.1',
      temperature: 0.7,
      max_tokens: 4000
    };
    
    console.log('📡 Making request to GitHub Copilot API:', {
      bodySize: JSON.stringify(requestBody).length,
      tokenPrefix: token.substring(0, 10) + '...'
    });
    
    const response = await fetch('https://api.githubcopilot.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'content-type': 'application/json',
        'copilot-integration-id': 'vscode-chat',
        'editor-version': 'vscode/1.95.0',
        'editor-plugin-version': 'copilot-chat/0.26.7',
        'user-agent': 'GitHubCopilotChat/0.26.7',
        'openai-intent': 'conversation-panel',
        'x-github-api-version': API_VERSION,
        'x-request-id': randomUUID(),
        'x-vscode-user-agent-library-version': 'electron-fetch'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 GitHub Copilot Response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GitHub Copilot API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('Failed to parse error response as JSON');
      }
      
      return NextResponse.json({ 
        error: `GitHub Copilot API error: ${response.status} - ${errorData.error?.message || errorText || 'Unknown error'}`,
        details: { status: response.status, statusText: response.statusText }
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    
    // Extract metadata for info purposes
    const metadata = {
      model: data.model,
      usage: data.usage,
      id: data.id,
      system_fingerprint: data.system_fingerprint
    };
    
    return NextResponse.json({ 
      response: content,
      metadata 
    });
    
  } catch (error: any) {
    console.error('Copilot Chat Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate response' 
    }, { status: 500 });
  }
}

async function getCopilotToken(): Promise<string> {
  try {
    if (!fs.existsSync(tokenFile)) {
      throw new Error('GitHub token not found. Please authenticate first.');
    }

    const tokens: GitHubTokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
    
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      throw new Error('GitHub token has expired. Please re-authenticate.');
    }

    return tokens.access_token;
  } catch (error) {
    throw new Error('Failed to get GitHub token. Please authenticate first.');
  }
}

function getKnowledgeBaseContext(type: string, message: string): string {
  const ragContext = `TestFlow Pro Framework - Complete Knowledge Base:

=== EXACT JSON STRUCTURE ===
{"id":"suite-id","suiteName":"Suite Name","applicationName":"App Name","type":"UI","baseUrl":"https://domain.com","testCases":[{"name":"Test Name","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://domain.com"},{"id":"step-2","keyword":"assertVisible","locator":{"strategy":"testId","value":"element-id"}},{"id":"step-3","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Submit","exact":true}}}]}]}

=== CRITICAL FIELD MAPPINGS ===
playwright → testflow
page.getByRole('button',{name:'X'}) → {"strategy":"role","value":"button","options":{"name":"X"}}
page.getByTestId('id') → {"strategy":"testId","value":"id"}
expect().toBeVisible() → {"keyword":"assertVisible"}
.click() → {"keyword":"click"}

=== FORBIDDEN FIELDS ===
NEVER USE: attributes, additionalAttributes, filters, verifyVisible, expectVisible
ALWAYS USE: options, assertVisible

=== WORKING EXAMPLES ===
CORRECT ROLE LOCATOR:
{"strategy":"role","value":"textbox","options":{"name":"Email address"}}

CORRECT BUTTON LOCATOR:
{"strategy":"role","value":"button","options":{"name":"Continue","exact":true}}

CORRECT TESTID LOCATOR:
{"strategy":"testId","value":"SearchField.search"}

=== COMPLETE UI KEYWORDS ===
goto, click, fill, assertVisible, assertHidden, getText, screenshot, waitForTimeout

=== MANDATORY FIELDS ===
- testData: [] (empty array for UI tests)
- applicationName: string (generate from context)
- options: {} (for role locators with name/exact)

=== REAL EXAMPLES FROM CODEBASE ===
${getExampleSuites()}`;
  
  switch (type) {
    case 'ui':
      return `${ragContext}

=== UI CONVERSION RULES ===
1. Convert each Playwright action to TestFlow step
2. Use sequential step IDs: step-1, step-2, etc.
3. Role locators MUST have options field
4. Use assertVisible for expect().toBeVisible()
5. testData must be empty array []
6. Generate meaningful applicationName from URL`;
    default:
      return ragContext;
  }
}

function getExampleSuites(): string {
  return `
EXAMPLE 1 - Login Test:
{"id":"login-test","suiteName":"Login Tests","applicationName":"Web App","type":"UI","baseUrl":"https://app.com","testCases":[{"name":"Valid Login","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://app.com/login"},{"id":"step-2","keyword":"fill","locator":{"strategy":"role","value":"textbox","options":{"name":"Email"}},"value":"user@test.com"},{"id":"step-3","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Login"}}},{"id":"step-4","keyword":"assertVisible","locator":{"strategy":"testId","value":"dashboard"}}]}]}

EXAMPLE 2 - Registration Test:
{"id":"reg-test","suiteName":"Registration","applicationName":"Portal","type":"UI","baseUrl":"https://portal.com","testCases":[{"name":"Sign Up","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://portal.com/signup"},{"id":"step-2","keyword":"assertVisible","locator":{"strategy":"role","value":"textbox","options":{"name":"Email address"}}},{"id":"step-3","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Continue","exact":true}}}]}]}`;
}

function getSystemPrompt(type: string, context: string): string {
    const basePrompt = `You are a TestFlow Pro JSON generator with access to complete framework documentation. You MUST follow the exact format specification from the knowledge base. Any deviation will cause system failure.
Knowledge Base Context:
${context}`;

    switch (type) {
      case 'curl':
        return `${basePrompt}

Convert cURL commands to TestFlow Pro JSON format. REQUIRED STRUCTURE:
{"id":"suite-id","suiteName":"Suite Name","applicationName":"App Name","type":"API","baseUrl":"https://domain.com","testCases":[{"name":"Test Name","type":"REST","testData":[{"name":"Data Name","method":"GET","endpoint":"/path","headers":{},"assertions":[{"type":"statusCode","expected":200}]}],"testSteps":[]}]}`;
      case 'swagger':
        return `${basePrompt}

Convert Swagger/OpenAPI to TestFlow Pro JSON format. REQUIRED STRUCTURE:
{"id":"api-suite","suiteName":"API Tests","applicationName":"API Service","type":"API","baseUrl":"https://api.com","testCases":[{"name":"Test","type":"REST","testData":[{"name":"Request","method":"POST","endpoint":"/endpoint","headers":{"Content-Type":"application/json"},"body":{},"assertions":[{"type":"statusCode","expected":201}]}],"testSteps":[]}]}`;
      case 'ui':
        return `${basePrompt}

You MUST use this EXACT JSON structure. Copy this format exactly:

{"id":"ui-suite","suiteName":"UI Tests","applicationName":"SmartBear Community","type":"UI","baseUrl":"https://community.smartbear.com","testCases":[{"name":"Test Case","type":"UI","testData":[],"testSteps":[{"id":"step-1","keyword":"goto","value":"https://community.smartbear.com/"},{"id":"step-2","keyword":"assertVisible","locator":{"strategy":"testId","value":"SearchField.search"}},{"id":"step-3","keyword":"assertVisible","locator":{"strategy":"role","value":"textbox","options":{"name":"Email address"}}},{"id":"step-4","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Continue","exact":true}}}]}]}

CRITICAL ERROR PREVENTION:
WRONG: attributes, additionalAttributes, filters, verifyVisible
CORRECT: options, assertVisible

WRONG: {"strategy":"role","value":"button","attributes":{"name":"Submit"}}
CORRECT: {"strategy":"role","value":"button","options":{"name":"Submit"}}

WRONG: keyword verifyVisible
CORRECT: keyword assertVisible

You MUST use options field for role locators. Using attributes will break the system.`;
      default:
        return `${basePrompt}

Generate TestFlow Pro JSON format based on the provided context and examples.`;
    }
  }
