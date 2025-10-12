import { ChatOllama } from '@langchain/ollama'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OllamaEmbeddings } from '@langchain/ollama'
import { RAGKnowledgeBase } from './rag-knowledge-base'
import { SmartContextManager } from './smart-context-manager'
import { CurlParser } from './curl-parser'
import { TestSuite } from '@/types/test-suite'
import { AI_CONFIG } from '@/ai-config'
import fs from 'fs'
import path from 'path'

// Simple validation function
function validateTestSuite(obj: any): TestSuite {
  return obj as TestSuite;
}

interface ChatRequest {
  message: string
  type: 'general' | 'curl' | 'swagger' | 'ui'
  provider?: 'ollama' | 'github-copilot'
}

interface GenerateRequest {
  prompt: string
  context: string
}

interface AIResponse {
  response?: string
  testSuite?: TestSuite
  status?: string
  retryCount?: number
  provider?: string
  model?: string
  tokens?: number
}

export class AIService {
  private llm: ChatOllama
  private embeddings: OllamaEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private ragChains: { [key: string]: RunnableSequence }

  constructor(testDataPath?: string) {
    this.llm = new ChatOllama({
      baseUrl: AI_CONFIG.ollama.baseUrl,
      model: AI_CONFIG.ollama.model
    })
    
    this.embeddings = new OllamaEmbeddings({
      baseUrl: AI_CONFIG.ollama.baseUrl, 
      model: AI_CONFIG.ollama.embeddingModel
    })
    
    this.ragChains = this.initializeRAGChains()
    this.initializeVectorStore(testDataPath)
  }

  private async initializeVectorStore(testDataPath?: string) {
    console.log('🚀 Initializing Smart AI Knowledge Base...')
    // Initialize with minimal base documents for similarity search
    const baseDocs = RAGKnowledgeBase.getRelevantDocuments('api ui curl conversion')
    this.vectorStore = await MemoryVectorStore.fromDocuments(baseDocs, this.embeddings)
    console.log('✅ Smart vector store initialized')
  }

  private initializeRAGChains() {
    const baseTemplate = `You are an expert API and UI test automation engineer for TestFlow Pro framework.

Context: {context}

User Request: {input}

Generate a valid JSON test suite that STRICTLY follows this schema:

FOR API TESTS:
{{
  "id": "unique-suite-id",
  "suiteName": "Descriptive Suite Name",
  "applicationName": "Application or Service Name",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "tags": [{{"serviceName": "@ServiceName"}}, {{"suiteType": "@regression"}}],
  "testCases": [{{
    "id": "optional-test-case-id",
    "name": "Test Case Name",
    "type": "REST",
    "status": "Not Started",
    "testData": [{{
      "name": "Test Data Name",
      "method": "POST",
      "endpoint": "/api/endpoint",
      "headers": {{"Content-Type": "application/json"}},
      "body": {{"key": "value"}},
      "assertions": [{{"type": "statusCode", "expected": 200}}],
      "store": {{"variableName": "$.jsonPath"}}
    }}],
    "testSteps": []
  }}]
}}
- Assertions: statusCode, exists, equals, contains, greaterThan, lessThan, in, notIn, length, type, regex
- PreProcess: faker.email, faker.uuid, date.now, encrypt, custom.authToken, dbQuery
- Variable usage: {{"value": "{{variableName}}"}}

FOR UI TESTS:
{{
  "id": "unique-suite-id",
  "suiteName": "Descriptive Suite Name",
  "applicationName": "Application or Service Name",
  "type": "UI",
  "baseUrl": "https://example.com",
  "tags": [{{"serviceName": "@UIService"}}, {{"suiteType": "@e2e"}}],
  "testCases": [{{
    "id": "optional-test-case-id",
    "name": "Test Case Name",
    "type": "UI",
    "status": "Not Started",
    "testData": [],
    "testSteps": [{{
      "id": "step-id-123",
      "keyword": "click",
      "locator": {{
        "strategy": "role",
        "value": "button",
        "options": {{"name": "Submit"}}
      }},
      "value": "optional-value",
      "store": {{"variableName": "$text"}},
      "skipOnFailure": false
    }}]
  }}]
}}
- Keywords: goto, click, fill, getText, assertVisible, screenshot, customCode, etc.
- Locators: {{strategy: "role|text|css|xpath", value: "...", options: {{name, exact}}}}
- Variable storage: {{"store": {{"varName": "$text|$attribute|$title|$url|$value|$count"}}}}
- Skip on failure: {{"skipOnFailure": true}}

SUITE NAMING GUIDELINES:
- Analyze the user request context to generate meaningful id and suiteName
- For API: Include service/domain name (e.g., "user-service", "payment-api")
- For UI: Include flow/feature name (e.g., "login-flow", "checkout-process")
- Add timestamp or version if needed for uniqueness
- Make suiteName human-readable and descriptive

IMPORTANT: Use double quotes for all strings and property names. Respond ONLY with valid JSON using double quotes.`

    const curlTemplate = `Convert this cURL command to TestFlow Pro API test suite JSON:

Context: {context}

cURL Command: {input}

STRICT CONVERSION RULES:
1. Extract method from -X or default to GET
2. Split URL into baseUrl (protocol + domain) and endpoint (path + query)
3. Parse -H headers, ignore browser-specific ones (sec-ch-ua, sec-fetch-*, user-agent)
4. Parse -d/--data as JSON body if possible
5. Ignore cookies (-b flag) and referer headers
6. Add timeout: 30000 for slow APIs
7. Generate descriptive test names from endpoint
8. Create unique id and suiteName based on URL/endpoint context

SUITE NAMING FROM cURL:
- Extract domain/service name from URL for id (e.g., "api-example-com-tests")
- Create descriptive suiteName from endpoint (e.g., "User API Tests", "Product Service Tests")
- Include HTTP method if relevant (e.g., "POST User Registration Test")

Required JSON Schema:
{{
  "id": "generate-from-url-context",
  "suiteName": "Generate from endpoint context",
  "type": "API",
  "baseUrl": "https://domain.com",
  "timeout": 30000,
  "tags": [{{"serviceName": "@APIService"}}, {{"suiteType": "@regression"}}],
  "testCases": [{{
    "id": "optional-test-case-id",
    "name": "Test Case Name",
    "type": "REST",
    "status": "Not Started",
    "testData": [{{
      "name": "Test Step Name",
      "method": "GET|POST|PUT|DELETE",
      "endpoint": "/path?query=value",
      "headers": {{"Content-Type": "application/json"}},
      "body": {{}},
      "assertions": [
        {{"type": "statusCode", "jsonPath": "$", "expected": 200}}
      ]
    }}],
    "testSteps": []
  }}]
}}

Respond ONLY with valid JSON using double quotes. No explanations.`

    const swaggerTemplate = `Convert this Swagger/OpenAPI spec to TestFlow Pro API test suite JSON:

Context: {context}

Swagger Spec: {input}

STRICT API SCHEMA REQUIREMENTS:
- id: Generate from API info.title (e.g., "petstore-api-v1", "user-management-service")
- suiteName: Use API info.title with "API Tests" suffix (e.g., "Pet Store API Tests", "User Management Service Tests")
- type: "API"
- baseUrl: from servers array
- testCases: array with name, type "REST", testData array with name, method, endpoint, headers, body, assertions
- Use proper API assertion types: statusCode, exists, equals, contains, greaterThan, lessThan
- Include API preprocessing functions when needed: faker.email, faker.uuid, custom.authToken

SUITE NAMING FROM SWAGGER:
- Extract API title from info.title field
- Convert to kebab-case for id (e.g., "Pet Store API" → "pet-store-api")
- Keep original title format for suiteName with "Tests" suffix
- Include version if available (e.g., "pet-store-api-v2")

Respond ONLY with valid JSON using double quotes. No explanations.`

    const uiTemplate = `Convert ALL Playwright steps to TestFlow Pro JSON:

{input}

SUPPORTED UI KEYWORDS:
- Browser: openBrowser, closeBrowser, maximize, minimize, setViewportSize, acceptAlert, dismissAlert
- Navigation: goto, reload, goBack, goForward, refresh
- Actions: click, dblClick, rightClick, type, fill, press, clear, select, check, uncheck, hover, focus, scrollTo, uploadFile
- Data Extraction: getText, getAttribute, getTitle, getUrl, getValue, getCount (with store: {{"varName": "$text|$attribute|$title|$url|$value|$count"}})
- Assertions: assertVisible, assertHidden, assertEnabled, assertDisabled, assertText, assertValue, assertChecked, assertUrl, assertTitle
- Wait: waitForTimeout, waitForSelector, waitForElement, waitForText, waitForEvent
- Tab Management: clickAndWaitForPopup, switchToTab
- Utilities: screenshot, customCode

CRITICAL LOCATOR RULES:
- page.goto(url) → {{"keyword":"goto","value":"url"}} (NO locator)
- page.getByRole('button') → {{"strategy":"role","value":"button"}}
- page.getByRole('button', {{name: 'Submit'}}) → {{"strategy":"role","value":"button","options":{{"name":"Submit"}}}}
- page.getByText('Search') → {{"strategy":"text","value":"Search"}}
- page.getByTestId('submit') → {{"strategy":"testId","value":"submit"}}
- page.locator('#id') → {{"strategy":"css","value":"#id"}}
- page.locator('.class') → {{"strategy":"css","value":".class"}}
- page.locator('xpath=//div') → {{"strategy":"xpath","value":"//div"}}
- expect().toBeVisible() → {{"keyword":"assertVisible","locator":{{"strategy":"...","value":"..."}}}}

VARIABLE STORAGE:
- const title = await page.title() → {{"keyword":"getTitle","store":{{"pageTitle":"$title"}}}}
- const text = await locator.textContent() → {{"keyword":"getText","locator":{{...}},"store":{{"textVar":"$text"}}}}
- Use variables: {{"value":"{{variableName}}"}}

SKIP ON FAILURE:
- Add "skipOnFailure": true to skip step if previous step fails

TAB/POPUP HANDLING:
- const page1Promise = page.waitForEvent('popup'); await locator.click(); const page1 = await page1Promise; → {{"keyword":"clickAndWaitForPopup","locator":{{"strategy":"css","value":".selector"}}}}
- Switch between tabs: {{"keyword":"switchToTab","value":"0"}} (0=first tab, 1=second tab)

ONLY VALID STRATEGIES: role, text, label, testId, placeholder, altText, title, css, xpath

NEW TAB OPERATIONS:
After clickAndWaitForPopup, all subsequent operations happen in the new tab automatically

SUITE NAMING FROM PLAYWRIGHT CODE:
- Analyze code context to generate meaningful names
- Extract app/feature from URLs or test descriptions (e.g., "login", "checkout", "dashboard")
- Create id like "login-flow-test", "e2e-checkout-automation"
- Create suiteName like "Login Flow Test", "E2E Checkout Automation"
- Include timestamp if needed for uniqueness

Return complete JSON:
{{
  "id": "generate-from-context",
  "suiteName": "Generate from context",
  "type": "UI",
  "baseUrl": "",
  "tags": [{{"serviceName": "@UIService"}}, {{"suiteType": "@e2e"}}],
  "testCases": [{{
    "id": "optional-test-case-id",
    "name": "Test Case",
    "type": "UI",
    "status": "Not Started",
    "testData": [],
    "testSteps": [...ALL_STEPS_WITH_IDS...]
  }}]
}}`

    return {
      general: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await SmartContextManager.getOptimalContext(input.input)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(baseTemplate),
        this.llm,
        new StringOutputParser()
      ]),
      curl: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await SmartContextManager.getOptimalContext(`curl conversion ${input.input}`)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(curlTemplate),
        this.llm,
        new StringOutputParser()
      ]),
      swagger: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await SmartContextManager.getOptimalContext(`swagger api conversion ${input.input}`)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(swaggerTemplate),
        this.llm,
        new StringOutputParser()
      ]),
      ui: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await SmartContextManager.getOptimalContext(`ui playwright conversion ${input.input}`)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return { context, input: input.input }
        },
        PromptTemplate.fromTemplate(uiTemplate),
        this.llm,
        new StringOutputParser()
      ])
    }
  }

  private validateTestSuite(obj: any): boolean {
    if (!obj || typeof obj.id !== 'string' || typeof obj.suiteName !== 'string') {
      return false
    }
    
    // Support both UI and API test suites
    if (obj.type === 'UI') {
      return Array.isArray(obj.testCases) &&
             obj.testCases.length > 0 &&
             obj.testCases.every((tc: any) => 
               tc.type === 'UI' && Array.isArray(tc.testSteps)
             )
    } else if (obj.type === 'API') {
      return Array.isArray(obj.testCases) &&
             obj.testCases.length > 0 &&
             obj.testCases.every((tc: any) => 
               (tc.type === 'REST' || tc.type === 'SOAP') && Array.isArray(tc.testData)
             )
    }
    
    return false
  }

  private fixOptionsPlacement(testSuite: any): any {
    if (!testSuite.testCases) return testSuite
    
    testSuite.testCases.forEach((testCase: any) => {
      if (!testCase.testSteps) return
      
      testCase.testSteps.forEach((step: any) => {
        // Fix options placement
        if (step.options && step.locator && !step.locator.options) {
          step.locator.options = step.options
          delete step.options
        }
        
        // Fix missing locator structure
        if (!step.locator && step.value && step.keyword !== 'goto') {
          // Detect strategy from value
          let strategy = 'role'
          let locatorValue = step.value
          
          if (step.value.startsWith('#')) {
            strategy = 'css'
          } else if (step.value.startsWith('.')) {
            strategy = 'css'
          } else if (step.value.startsWith('[')) {
            strategy = 'css'
          } else if (step.value.startsWith('//')) {
            strategy = 'xpath'
          }
          
          step.locator = {
            strategy,
            value: locatorValue
          }
          
          if (step.options) {
            step.locator.options = step.options
            delete step.options
          }
          
          delete step.value
        }
        
        // Fix missing locators for assertions that require them
        const assertionKeywordsNeedingLocator = [
          'assertVisible', 'assertHidden', 'assertText', 'assertEnabled', 'assertDisabled',
          'assertValue', 'assertAttribute', 'assertChecked', 'assertUnchecked', 'assertContainsText',
          'getText', 'getAttribute', 'getValue', 'getCount'
        ]
        
        if (assertionKeywordsNeedingLocator.includes(step.keyword) && !step.locator) {
          // These assertion keywords require a locator - try to infer from context
          if (step.value) {
            // Use the value as text locator if available
            step.locator = {
              strategy: 'text',
              value: step.value
            }
            delete step.value
          } else {
            console.warn(`Missing locator for ${step.keyword} step ${step.id}`)
          }
        }
        
        // Fix complex locator patterns
        if (step.locator?.strategy === 'role') {
          const validRoles = ['button', 'link', 'textbox', 'heading', 'checkbox', 'radio', 'combobox', 'listbox', 'tab', 'tabpanel', 'dialog', 'alertdialog', 'banner', 'main', 'navigation', 'region', 'search', 'form', 'table', 'row', 'cell', 'columnheader', 'rowheader', 'grid', 'gridcell', 'list', 'listitem', 'group', 'img', 'figure', 'article', 'section', 'complementary', 'contentinfo']
          
          // Fix section with hasText -> convert to CSS with filter
          if (step.locator.value === 'section' && step.locator.options?.hasText) {
            step.locator.strategy = 'css'
            step.locator.value = 'section'
            step.locator.filter = {
              type: 'hasText',
              value: step.locator.options.hasText as string
            }
            delete step.locator.options
          }
          // Fix invalid role values
          else if (!validRoles.includes(step.locator.value)) {
            const textValue = step.locator.value
            if (textValue === 'span') {
              step.locator.strategy = 'css'
              step.locator.value = 'span'
            } else {
              step.locator.value = 'heading'
              step.locator.options = step.locator.options || {}
              step.locator.options.name = textValue
            }
          }
        }
        
        // Fix getByText patterns misidentified as role
        if (step.locator?.strategy === 'role' && step.locator.value === 'heading' && step.locator.options?.name && typeof step.locator.options.name === 'string' && step.locator.options.name.includes('Login now')) {
          step.locator.strategy = 'text'
          step.locator.value = step.locator.options.name
          delete step.locator.options.name
        }
        
        // Fix CSS selectors and filters
        if (step.locator?.strategy === 'css') {
          if (step.locator.value?.includes(':first-child')) {
            step.locator.value = step.locator.value.replace(':first-child', '')
          }
          
          // Handle section.filter({hasText}).locator('span').first() pattern
          if (step.locator.value === 'section' && !step.locator.filter) {
            // This might be a complex filter pattern that needs manual handling
          }
        }
        
        // Fix invalid locator strategies
        if (step.locator?.strategy) {
          const strategy = step.locator.strategy
          const value = step.locator.value
          
          // Convert invalid strategies to CSS
          if (strategy === 'id') {
            step.locator.strategy = 'css'
            step.locator.value = `#${value}`
          } else if (strategy === 'class') {
            step.locator.strategy = 'css'
            step.locator.value = `.${value}`
          } else if (strategy === 'attribute') {
            step.locator.strategy = 'css'
            step.locator.value = `[${value}]`
          }
        }
      })
    })
    
    return testSuite
  }

  async generateContent(request: GenerateRequest): Promise<{ content: string }> {
    try {
      const chain = this.ragChains.general
      const response = await chain.invoke({ input: request.prompt })
      return { content: typeof response === 'string' ? response : String(response) }
    } catch (error) {
      console.error('AI Content Generation Error:', error)
      throw new Error('Failed to generate AI content')
    }
  }

  async generateResponse(request: ChatRequest, onStatusUpdate?: (status: string) => void): Promise<AIResponse> {
    try {
      // Handle GitHub Copilot provider
      if (request.provider === 'github-copilot') {
        return await this.generateCopilotResponse(request, onStatusUpdate);
      }
      
      // Default to Ollama
      onStatusUpdate?.('🏠 Using Ollama (Local)');
      
      // Handle cURL commands with AI-enhanced parser
      if (request.type === 'curl' && request.message.trim().startsWith('curl')) {
        try {
          onStatusUpdate?.('Parsing cURL command...')
          const parsed = CurlParser.parse(request.message)
          
          onStatusUpdate?.('Generating AI-powered test scenarios...')
          const testSuite = await CurlParser.generateTestSuite(parsed, true)
          
          onStatusUpdate?.('cURL converted with AI test scenarios!')
          return {
            testSuite,
            status: 'success',
            response: `Successfully converted cURL to comprehensive TestFlow Pro test suite with positive/negative scenarios for ${parsed.baseUrl}`
          }
        } catch (curlError) {
          console.warn('cURL parser failed, falling back to AI:', curlError)
          onStatusUpdate?.('cURL parser failed, using AI fallback...')
        }
      }
      
      const chain = this.ragChains[request.type] || this.ragChains.general
      let response = await chain.invoke({ input: request.message })

      // Retry with stricter prompt if needed
      let retryCount = 0
      while (retryCount < 2) {
        // Extract JSON from response - handle various formats
        let jsonStr = typeof response === 'string' ? response.trim() : String(response).trim()
        
        console.log('Raw AI response:', jsonStr.substring(0, 200))
        
        // Handle markdown code blocks first
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim()
        }
        
        // Parse the JSON (could be array or object)
        let rawData
        try {
          rawData = JSON.parse(jsonStr)
        } catch (parseError) {
          console.error('Parse failed:', parseError)
          console.log('Failed JSON string:', jsonStr.substring(0, 500))
          
          if (retryCount < 1) {
            retryCount++
            onStatusUpdate?.(`Parsing failed, retrying with stricter prompt... (${retryCount}/2)`)
            
            // Retry with more specific prompt for cURL
            if (request.type === 'curl') {
              const strictCurlPrompt = `Extract ONLY the essential parts from this cURL and create a minimal TestFlow Pro JSON:

${request.message}

Return ONLY this JSON structure with NO explanations:
{{
  "id": "api-test-${Date.now()}",
  "suiteName": "API Test Suite",
  "type": "API",
  "baseUrl": "EXTRACT_BASE_URL_HERE",
  "timeout": 30000,
  "testCases": [{{
    "name": "API Test",
    "type": "REST",
    "testData": [{{
      "name": "Test Request",
      "method": "EXTRACT_METHOD_HERE",
      "endpoint": "EXTRACT_ENDPOINT_HERE",
      "headers": {{"Accept": "application/json"}},
      "assertions": [{{"type": "statusCode", "jsonPath": "$", "expected": 200}}]
    }}]
  }}]
}}`
              
              response = await this.llm.invoke(strictCurlPrompt)
              continue
            }
            
            response = await chain.invoke({ input: `Generate a simple valid TestFlow Pro JSON for: ${request.message}` })
            continue
          }
          throw parseError
        }
        
        let rawSuite
        if (Array.isArray(rawData)) {
          // AI returned array of steps, wrap in test suite
          console.log('Converting steps array to test suite...')
          rawSuite = {
            id: `playwright-${Date.now()}`,
            suiteName: 'Playwright Test Suite',
            type: 'UI',
            baseUrl: '',
            testCases: [{
              name: 'Test Case',
              type: 'UI',
              testSteps: rawData.map((step, index) => ({
                id: `step-${index + 1}`,
                ...step,
                assertions: step.assertions || []
              }))
            }]
          }
        } else {
          rawSuite = rawData
        }
        
        try {
          
          // Fix if AI returned array instead of complete suite
          if (Array.isArray(rawSuite)) {
            console.log('AI returned array, converting to test suite...')
            rawSuite = {
              id: `generated-${Date.now()}`,
              suiteName: 'Generated Test Suite',
              type: 'UI',
              baseUrl: '',
              testCases: rawSuite
            }
          }
          
          // Fix options placement if needed
          rawSuite = this.fixOptionsPlacement(rawSuite)
          
          // Fix missing IDs
          if (!rawSuite.id) {
            rawSuite.id = `generated-suite-${Date.now()}`
          }
          
          rawSuite.testCases?.forEach((testCase: any, tcIndex: number) => {
            if (!testCase.id) {
              testCase.id = `test-case-${tcIndex + 1}`
            }
            if (!testCase.status) {
              testCase.status = 'Not Started'
            }
            
            testCase.testSteps?.forEach((step: any, index: number) => {
              if (!step.id || step.id === '') {
                step.id = `step-${index + 1}`
              }
            })
          })
          
          // Validate structure
          if (this.validateTestSuite(rawSuite)) {
            const testSuite = validateTestSuite(rawSuite)
            return { 
              testSuite, 
              status: retryCount > 0 ? `✅ Ollama Success after ${retryCount + 1} attempts` : '✅ Ollama Success',
              retryCount,
              provider: 'ollama'
            }
          } else if (retryCount < 1) {
            console.log('Invalid structure, retrying with stricter prompt...')
            onStatusUpdate?.('🔧 Invalid structure detected, retrying with template...')
            const strictPrompt = `Convert this Playwright code to valid TestFlow Pro JSON. Return ONLY this exact structure: {{"id":"test","suiteName":"Test","type":"UI","baseUrl":"","testCases":[{{"name":"Case","type":"UI","testSteps":[...]}}]}}. Input: ${request.message}`
            response = await this.llm.invoke(strictPrompt)
            retryCount++
            continue
          }
        } catch (parseError) {
          console.error('Parse error:', parseError)
          if (retryCount < 1) {
            onStatusUpdate?.('⚠️ JSON parse error, retrying...')
            retryCount++
            continue
          }
        }
        break
      }

      return { response }
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error('Failed to generate response')
    }
  }

  private async generateCopilotResponse(request: ChatRequest, onStatusUpdate?: (status: string) => void): Promise<AIResponse> {
    try {
      onStatusUpdate?.('🔗 Connecting to GitHub Copilot...');
      
      const token = await this.getCopilotToken();
      
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
          'x-github-api-version': '2025-04-01',
          'x-request-id': this.generateUUID(),
          'x-vscode-user-agent-library-version': 'electron-fetch'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request.type)
            },
            {
              role: 'user', 
              content: request.message
            }
          ],
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error('Copilot API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`GitHub Copilot API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No response generated';
      
      // Log metadata for info
      console.log('GitHub Copilot Metadata:', {
        model: data.model,
        usage: data.usage,
        id: data.id
      });
      
      onStatusUpdate?.(`✅ GitHub Copilot (${data.model}) - Tokens: ${data.usage?.total_tokens || 'N/A'}`);
      
      // Parse the response - handle various formats
      let jsonStr = content.trim();
      
      // Remove any text before JSON
      const jsonStartMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonStartMatch) {
        jsonStr = jsonStartMatch[0];
      }
      
      // Handle markdown code blocks
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      
      // Extract JSON from nested structure if needed
      if (jsonStr.includes('"testSuite"')) {
        try {
          const wrapper = JSON.parse(jsonStr);
          if (wrapper.testSuite) {
            jsonStr = JSON.stringify(wrapper.testSuite);
          }
        } catch (e) {
          // Continue with original string
        }
      }
      
      try {
        const rawData = JSON.parse(jsonStr);
        
        if (this.validateTestSuite(rawData)) {
          const testSuite = validateTestSuite(rawData);
          return { 
            testSuite, 
            status: '✅ GitHub Copilot Success',
            provider: 'github-copilot',
            model: data.model,
            tokens: data.usage?.total_tokens
          };
        }
      } catch (parseError) {
        console.error('GitHub Copilot JSON parse error:', parseError);
        console.log('Failed to parse:', jsonStr.substring(0, 200));
      }
      
      // If parsing failed, return as regular response
      return { 
        response: content,
        provider: 'github-copilot',
        model: data.model,
        tokens: data.usage?.total_tokens
      };
      
    } catch (error) {
      console.error('GitHub Copilot Error:', error);
      onStatusUpdate?.('❌ Copilot failed, falling back to Ollama...');
      
      // Fallback to Ollama
      request.provider = 'ollama';
      return await this.generateResponse(request, onStatusUpdate);
    }
  }

  private async getCopilotToken(): Promise<string> {
    try {
      const tokenFile = path.join(process.cwd(), '.github-tokens.json');
      
      if (!fs.existsSync(tokenFile)) {
        throw new Error('GitHub token not found. Please authenticate first.');
      }

      const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
      
      if (tokens.expires_at && Date.now() > tokens.expires_at) {
        throw new Error('GitHub token has expired. Please re-authenticate.');
      }

      return tokens.access_token;
    } catch (error) {
      throw new Error('Failed to get GitHub token. Please authenticate first.');
    }
  }

  private getSystemPrompt(type: string): string {
    const basePrompt = `You are an expert API test automation engineer. Generate ONLY valid TestFlow Pro JSON test suites. Respond with JSON only, no explanations, no markdown, no text before or after the JSON.`;
    
    switch (type) {
      case 'curl':
        return `${basePrompt} Convert cURL commands to TestFlow Pro JSON format with this exact structure: {"id":"suite-id","suiteName":"Suite Name","type":"API","baseUrl":"https://domain.com","testCases":[{"name":"Test Name","type":"REST","testData":[{"name":"Data Name","method":"GET","endpoint":"/path","assertions":[{"type":"statusCode","expected":200}]}]}]}`;
      case 'swagger':
        return `${basePrompt} Convert Swagger/OpenAPI to TestFlow Pro JSON format with this exact structure: {"id":"api-suite","suiteName":"API Tests","type":"API","baseUrl":"https://api.com","testCases":[{"name":"Test","type":"REST","testData":[{"name":"Request","method":"POST","endpoint":"/endpoint","body":{},"assertions":[{"type":"statusCode","expected":201}]}]}]}`;
      case 'ui':
        return `${basePrompt} Convert UI steps to TestFlow Pro JSON format with this exact structure: {"id":"ui-suite","suiteName":"UI Tests","type":"UI","baseUrl":"https://app.com","testCases":[{"name":"Test","type":"UI","testSteps":[{"id":"step-1","keyword":"goto","value":"https://app.com"},{"id":"step-2","keyword":"click","locator":{"strategy":"role","value":"button"}}]}]}`;
      default:
        return `${basePrompt} Generate TestFlow Pro JSON format: {"id":"suite","suiteName":"Test Suite","type":"API","baseUrl":"https://api.com","testCases":[{"name":"Test","type":"REST","testData":[{"name":"Request","method":"GET","endpoint":"/","assertions":[{"type":"statusCode","expected":200}]}]}]}`;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  private buildPromptForType(type: string, message: string): string {
    const basePrompt = `You are an expert API and UI test automation engineer for TestFlow Pro framework. Generate a valid JSON test suite that follows the TestFlow Pro schema.`;
    
    switch (type) {
      case 'curl':
        return `${basePrompt}\n\nConvert this cURL command to TestFlow Pro JSON:\n${message}`;
      case 'swagger':
        return `${basePrompt}\n\nConvert this Swagger/OpenAPI spec to TestFlow Pro JSON:\n${message}`;
      case 'ui':
        return `${basePrompt}\n\nConvert these UI test steps to TestFlow Pro JSON:\n${message}`;
      default:
        return `${basePrompt}\n\nUser request: ${message}`;
    }
  }
  
  private async parseAIResponse(response: string, type: string, onStatusUpdate?: (status: string) => void): Promise<AIResponse> {
    try {
      onStatusUpdate?.('📝 Parsing AI response...');
      
      let jsonStr = response.trim();
      
      // Handle markdown code blocks
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      
      const rawData = JSON.parse(jsonStr);
      
      if (this.validateTestSuite(rawData)) {
        const testSuite = validateTestSuite(rawData);
        return { testSuite, status: '✅ Success' };
      }
      
      return { response: jsonStr };
    } catch (error) {
      console.error('Parse error:', error);
      return { response };
    }
  }

  // Static method for easy access
  static async generateAIContent(prompt: string, context: string = ''): Promise<string> {
    const service = new AIService()
    const result = await service.generateContent({ prompt, context })
    return result.content
  }
}