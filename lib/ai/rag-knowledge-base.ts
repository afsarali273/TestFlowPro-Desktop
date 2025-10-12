import { Document } from '@langchain/core/documents'
import fs from 'fs/promises'
import path from 'path'

type ConversionType = 'api' | 'ui' | 'curl' | 'postman' | 'playwright'
type UserIntent = {
  type: ConversionType
  keywords: string[]
  hasCode: boolean
}

export class RAGKnowledgeBase {
  static async loadTestSuiteExamples(testDataPath: string): Promise<Document[]> {
    const documents: Document[] = []
    
    try {
      console.log(`🔍 Loading test examples from: ${testDataPath}`)
      await fs.access(testDataPath)
      const files = await fs.readdir(testDataPath)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      console.log(`📁 Found ${jsonFiles.length} JSON files: ${jsonFiles.join(', ')}`)
      
      for (const file of jsonFiles.slice(0, 1)) { // Limit to 1 example
        try {
          const filePath = path.join(testDataPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const testSuite = JSON.parse(content)
          
          // Truncate large test suites
          const truncatedSuite = {
            suiteName: testSuite.suiteName,
            type: testSuite.type,
            testCases: testSuite.testCases?.slice(0, 1) // Only first test case
          }
          
          documents.push(new Document({
            pageContent: `Example: ${JSON.stringify(truncatedSuite, null, 2)}`,
            metadata: { 
              type: 'example',
              suiteType: testSuite.type || 'API',
              fileName: file,
              suiteName: testSuite.suiteName
            }
          }))
          console.log(`✅ Loaded example: ${file} (${testSuite.type || 'API'} - ${testSuite.suiteName})`)
        } catch (error) {
          console.warn(`❌ Failed to load ${file}:`, error)
        }
      }
      console.log(`📚 Total test examples loaded: ${documents.length}`)
    } catch (error) {
      console.warn('⚠️ TestData directory not found, using framework docs only')
    }
    
    return documents
  }

  static async loadKnowledgeBase(docsPath: string, type: 'ui' | 'api'): Promise<Document[]> {
    const documents: Document[] = []
    
    try {
      console.log(`🧠 Loading ${type.toUpperCase()} knowledge base from: ${docsPath}`)
      const knowledgeFiles = {
        ui: [
          'ui-playwright-knowledge-base.md',
          'ui-playwright-conversion-examples.json', 
          'ui-testflow-schema.json',
          'strict-conversion-rules.md'
        ],
        api: [
          'api-testing-knowledge-base.md', 
          'api-conversion-examples.json',
          'api-testflow-schema.json',
          'api-testdata-format.md',
          'curl-conversion-rules.md',
          'postman-conversion-examples.md'
        ]
      }
      
      for (const fileName of knowledgeFiles[type]) {
        try {
          const filePath = path.join(docsPath, fileName)
          const content = await fs.readFile(filePath, 'utf-8')
          const contentSize = Math.round(content.length / 1024)
          
          documents.push(new Document({
            pageContent: content,
            metadata: {
              type: `${type}-knowledge`,
              fileName,
              source: 'knowledge-base'
            }
          }))
          console.log(`✅ Loaded ${type} knowledge: ${fileName} (${contentSize}KB)`)
        } catch (error) {
          console.warn(`❌ Failed to load ${fileName}:`, error)
        }
      }
      console.log(`🎯 Total ${type} knowledge files loaded: ${documents.length}`)
    } catch (error) {
      console.warn('⚠️ Knowledge base files not found')
    }
    
    return documents
  }

  static getRelevantDocuments(userInput: string): Document[] {
    const intent = this.analyzeUserIntent(userInput)
    const docs: Document[] = []
    
    // Add only relevant documents based on intent
    if (intent.type === 'api' || userInput.includes('curl') || userInput.includes('POST') || userInput.includes('GET')) {
      docs.push(new Document({
        pageContent: `API Schema:
{
  "id": "unique-suite-id",
  "suiteName": "Descriptive Suite Name",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "tags": [{"serviceName": "@ServiceName"}, {"suiteType": "@regression"}],
  "testCases": [{
    "id": "optional-test-case-id",
    "name": "Test Case Name",
    "type": "REST",
    "status": "Not Started",
    "testData": [{
      "name": "Test Data Name",
      "method": "POST",
      "endpoint": "/api/endpoint",
      "headers": {"Content-Type": "application/json"},
      "body": {"key": "value"},
      "assertions": [{"type": "statusCode", "expected": 200}],
      "store": {"variableName": "$.jsonPath"}
    }],
    "testSteps": []
  }]
}

Suite Naming: Generate unique id from URL/service context (e.g., "user-api-tests", "payment-service-v1")
Create descriptive suiteName from endpoint context (e.g., "User Management API Tests", "Payment Service Tests")`,
        metadata: { type: 'api-format' }
      }))
    }
    
    if (intent.type === 'curl' || userInput.includes('curl')) {
      docs.push(new Document({
        pageContent: `cURL: method(-X), URL→baseUrl+endpoint, headers(-H), body(-d)
Suite Naming: Extract domain/service from URL for id (e.g., "api-example-com-tests")
Generate suiteName from endpoint (e.g., "User API Tests", "Product Service Tests")`,
        metadata: { type: 'curl' }
      }))
    }
    
    if (intent.type === 'ui' || userInput.includes('playwright') || userInput.includes('page.')) {
      docs.push(new Document({
        pageContent: `UI Schema:
{
  "id": "unique-suite-id",
  "suiteName": "Descriptive Suite Name",
  "type": "UI",
  "baseUrl": "https://example.com",
  "tags": [{"serviceName": "@UIService"}, {"suiteType": "@e2e"}],
  "testCases": [{
    "id": "optional-test-case-id",
    "name": "Test Case Name",
    "type": "UI",
    "status": "Not Started",
    "testData": [],
    "testSteps": [{
      "id": "step-id-123",
      "keyword": "click",
      "locator": {
        "strategy": "role",
        "value": "button",
        "options": {"name": "Submit"}
      },
      "value": "optional-value",
      "store": {"variableName": "$text"},
      "skipOnFailure": false
    }]
  }]
}

UI Examples:
page.goto('url') → {"keyword":"goto","value":"url"}
page.getByRole('button',{name:'Submit'}) → {"keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Submit"}}}
page.locator('#id') → {"keyword":"click","locator":{"strategy":"css","value":"#id"}}
expect().toBeVisible() → {"keyword":"assertVisible","locator":{...}}

Variable Storage:
page.locator('h1').textContent() → {"keyword":"getText","locator":{"strategy":"css","value":"h1"},"store":{"pageTitle":"$text"}}
page.locator('#user').getAttribute('data-id') → {"keyword":"getAttribute","value":"data-id","locator":{"strategy":"css","value":"#user"},"store":{"userId":"$attribute"}}
Use variables: {"keyword":"fill","value":"{{pageTitle}} - {{userId}}","locator":{...}}

Tab/Popup Handling:
const page1Promise = page.waitForEvent('popup'); await locator.click(); const page1 = await page1Promise; → {"keyword":"clickAndWaitForPopup","locator":{"strategy":"css","value":".selector"}}
Switch to tab 0: {"keyword":"switchToTab","value":"0"}
All operations after clickAndWaitForPopup happen in new tab automatically

Custom Code (complex operations):
await page.locator('.item').nth(0).click(); await page.locator('.item').nth(1).click(); → {"keyword":"customCode","customCode":"await page.locator('.item').nth(0).click();\nawait page.locator('.item').nth(1).click();"}
const count = await page.locator('.product').count(); expect(count).toBeGreaterThan(5); → {"keyword":"customCode","customCode":"const count = await page.locator('.product').count();\nexpected(count).toBeGreaterThan(5);"}

Skip on Failure:
Add "skipOnFailure": true to skip step if previous steps failed

Suite Naming Guidelines:
- Generate unique id from context: "login-flow-test", "checkout-e2e-automation"
- Create descriptive suiteName: "Login Flow Test", "E2E Checkout Automation"
- For API: Include service name like "user-api-tests", "payment-service-regression"
- Extract context from URLs, endpoints, or test descriptions`,
        metadata: { type: 'ui-format' }
      }))
    }
    
    console.log(`📖 Relevant documents: ${docs.length} for intent: ${intent.type}`)
    return docs
  }
  
  private static analyzeUserIntent(input: string): UserIntent {
    const lower = input.toLowerCase()
    
    // Detect conversion type
    let type: ConversionType = 'api'
    if (lower.includes('curl') || lower.includes('-x ') || lower.includes('-h ')) type = 'curl'
    else if (lower.includes('playwright') || lower.includes('page.') || lower.includes('getby')) type = 'playwright'
    else if (lower.includes('postman')) type = 'postman'
    else if (lower.includes('ui') || lower.includes('click') || lower.includes('fill')) type = 'ui'
    
    return {
      type,
      keywords: lower.split(/\s+/).filter(w => w.length > 3),
      hasCode: /[{}\[\]();]/.test(input)
    }
  }
  
  static getConversionRules(type: ConversionType): Document | null {
    const rules = {
      playwright: `Complete Schema with IDs:
{
  "id": "login-flow-test",
  "suiteName": "Login Flow Test",
  "type": "UI",
  "testCases": [{
    "id": "login-test-case",
    "name": "User Login Test",
    "type": "UI",
    "testSteps": [{
      "id": "step-goto-login",
      "keyword": "goto",
      "value": "https://example.com/login"
    }, {
      "id": "step-fill-username",
      "keyword": "fill",
      "locator": {"strategy": "css", "value": "#username"},
      "value": "testuser"
    }]
  }]
}

Complete Examples:
page.getByRole('button',{name:'Submit'}).click() → {"id":"step-click-submit","keyword":"click","locator":{"strategy":"role","value":"button","options":{"name":"Submit"}}}
page.locator('#submit-btn').click() → {"id":"step-click-btn","keyword":"click","locator":{"strategy":"css","value":"#submit-btn"}}
page.getByText('Welcome').toBeVisible() → {"id":"step-assert-welcome","keyword":"assertVisible","locator":{"strategy":"text","value":"Welcome"}}

Variable Storage:
const title = await page.locator('h1').textContent() → {"id":"step-get-title","keyword":"getText","locator":{"strategy":"css","value":"h1"},"store":{"pageTitle":"$text"}}
const userId = await page.locator('#user').getAttribute('data-id') → {"id":"step-get-userid","keyword":"getAttribute","value":"data-id","locator":{"strategy":"css","value":"#user"},"store":{"userId":"$attribute"}}
page.fill('#search', title) → {"id":"step-search","keyword":"fill","value":"{{pageTitle}}","locator":{"strategy":"css","value":"#search"}}

Tab/Popup Handling:
const page1Promise = page.waitForEvent('popup'); await locator.click(); const page1 = await page1Promise; → {"id":"step-popup","keyword":"clickAndWaitForPopup","locator":{"strategy":"css","value":".selector"}}
Switch tabs: {"id":"step-switch","keyword":"switchToTab","value":"0"} (0=first, 1=second)

Raw Playwright Code:
await page.locator('.item').nth(0).click(); await page.locator('.item').nth(1).click(); → {"id":"step-custom","keyword":"customCode","customCode":"await page.locator('.item').nth(0).click();\nawait page.locator('.item').nth(1).click();"}
const count = await page.locator('.product').count(); expect(count).toBeGreaterThan(5); → {"id":"step-count-check","keyword":"customCode","customCode":"const count = await page.locator('.product').count();\nexpect(count).toBeGreaterThan(5);"}

Skip on Failure:
{"id":"step-optional","keyword":"click","locator":{...},"skipOnFailure":true}

Suite Naming: Generate unique id from context ("login-flow-test", "checkout-e2e"), descriptive suiteName ("Login Flow Test", "E2E Checkout")`,
      curl: `curl -X METHOD url -H header -d body → {method,endpoint,headers,body}`,
      api: `REST: {name,method,endpoint,headers,body,assertions}`,
      ui: `Structure: {"keyword":"action","locator":{"strategy":"type","value":"selector","options":{...}}}`,
      postman: `Postman→TestFlow: request→testData, tests→assertions`
    }
    
    const content = rules[type]
    return content ? new Document({
      pageContent: content,
      metadata: { type: `${type}-rules` }
    }) : null
  }
}