import { ChatOllama } from '@langchain/ollama'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OllamaEmbeddings } from '@langchain/ollama'
import { CucumberKnowledgeBase } from './cucumber-knowledge-base'
import { AI_CONFIG } from '@/ai-config'
import { CucumberSmartContextManager } from './cucumber-smart-context-manager'

interface CucumberRequest {
  message: string
  type: 'playwright' | 'manual' | 'general'
  provider?: 'ollama' | 'github-copilot'
}

interface CucumberResponse {
  feature: string
  scenarios?: Array<{
    name: string
    steps: string[]
  }>
  status?: string
  provider?: string
  model?: string
  tokens?: number
}

export class CucumberAIService {
  private llm: ChatOllama
  private embeddings: OllamaEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private ragChains: { [key: string]: RunnableSequence }

  constructor() {
    this.llm = new ChatOllama({
      baseUrl: AI_CONFIG.ollama.baseUrl,
      model: AI_CONFIG.ollama.model
    })

    this.embeddings = new OllamaEmbeddings({
      baseUrl: AI_CONFIG.ollama.baseUrl,
      model: AI_CONFIG.ollama.embeddingModel
    })

    this.ragChains = this.initializeRAGChains()
    this.initializeVectorStore()
  }

  private async initializeVectorStore() {
    console.log('🥒 Initializing Cucumber Knowledge Base...')
    const docs = CucumberKnowledgeBase.getAllDocuments()
    this.vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings)
    console.log('✅ Cucumber vector store initialized with', docs.length, 'documents')
  }

  private initializeRAGChains() {
    const playwrightTemplate = `You are an expert Cucumber/Gherkin test automation engineer. Convert Playwright TypeScript code to Cucumber Gherkin feature files.

Context: {context}

Playwright Code:
{input}

CRITICAL CONVERSION RULES:
1. Use ONLY the predefined Cucumber step definitions from the context
2. Convert Playwright locators to appropriate CSS/XPath selectors
3. page.goto(url) → Given navigate to "url"
4. page.click(locator) → When click element "locator"
5. page.fill(locator, text) → When type "text" into "locator"
6. expect(locator).toBeVisible() → Then element "locator" should be visible
7. expect(locator).toHaveText(text) → Then element "locator" text should be "text"
8. page.waitForSelector(locator) → When wait for visible "locator" for 30 seconds
9. Use variables for dynamic data (like $variableName in steps)
10. Add explicit waits before assertions

LOCATOR CONVERSION:
- getByRole('button', (name: 'Submit')) → "button:has-text('Submit')" or "[role='button']:has-text('Submit')"
- getByText('Login') → "text=Login" or use: When click text "Login"
- getByTestId('submit-btn') → "[data-testid='submit-btn']"
- getByPlaceholder('Email') → "[placeholder='Email']"
- page.locator('#id') → "#id"
- page.locator('.class') → ".class"

GHERKIN STRUCTURE:
Feature: [Extract feature name from test context]
  As a [user role]
  I want [feature description]
  So that [business value]
  
  @smoke @regression
  Scenario: [Descriptive scenario name]
    Given [initial context]
    When [user actions]
    And [additional actions]
    Then [expected outcomes]
    And [additional assertions]

BEST PRACTICES:
- Use Background for common setup (browser open, navigation)
- Group related assertions with And
- Add @tags for test organization (@UI , @smoke, @regression, @critical)
- Use descriptive scenario names
- Keep steps focused and atomic
- Add waits before assertions
- Use Scenario Outline for data-driven tests

Output ONLY the complete Gherkin feature file. No explanations, no markdown code blocks.`

    const manualTemplate = `You are an expert Cucumber/Gherkin test automation engineer. Create Cucumber feature files from manual test descriptions.

Context: {context}

Test Description:
{input}

AVAILABLE STEP DEFINITIONS:
Use ONLY these predefined steps from the context. Do not invent new step definitions.

GHERKIN STRUCTURE:
Feature: [Feature name based on description]
  As a [user role]
  I want [feature]
  So that [benefit]
  
  Background:
    Given open browser
    And navigate to "URL"
  
  @smoke @regression
  Scenario: [Descriptive scenario name]
    Given [initial state]
    When [user performs action]
    And [additional actions]
    Then [verify outcome]
    And [verify additional outcomes]
  
  Scenario Outline: [Parameterized test name]
    Given navigate to "<page>"
    When type "<input>" into "#field"
    Then element "#result" should contain text "<expected>"
    
    Examples:
      | page  | input      | expected |
      | /home | test@email | Success  |

BEST PRACTICES:
- Extract feature name and business value from description
- Use appropriate tags (@smoke, @regression, @critical, @priority-high)
- Add Background for common setup steps
- Use Scenario Outline for multiple test cases with different data
- Add explicit waits before assertions
- Use variables for reusable data (like $varName)
- Group related steps with And
- Make scenarios independent (can run in any order)
- Use descriptive names that explain the test goal

Output ONLY the complete Gherkin feature file. No explanations, no markdown code blocks.`

    const generalTemplate = `You are an expert Cucumber/Gherkin test automation engineer.

Context: {context}

Request:
{input}

Create a Cucumber feature file using ONLY the predefined step definitions from the context.

GHERKIN STRUCTURE:
Feature: [Feature Name]
  As a [role]
  I want [feature]
  So that [benefit]
  
  Background:
    Given open browser
    And navigate to "URL"
  
  @tag1 @tag2
  Scenario: Scenario Name
    Given initial context
    When action performed
    Then outcome verified

AVAILABLE STEPS:
- Navigation: Given navigate to "URL", When refresh page
- Actions: When click element "locator", When type "text" into "locator"
- Assertions: Then element "locator" should be visible, Then element "locator" text should be "text"
- Waits: When wait for visible "locator" for (int) seconds
- Variables: When save text of "locator" as "varName", use variables in steps with $varName syntax

Use descriptive names, appropriate tags, and well-structured scenarios.

Output ONLY the complete Gherkin feature file. No explanations.`

    const sanitizePromptText = (text: string) => text.replace(/\{/g, '(').replace(/\}/g, ')')
    const formatPrompt = (template: string, context: string, input: string) =>
      template
        .replace('{context}', sanitizePromptText(context))
        .replace('{input}', sanitizePromptText(input))

    return {
      playwright: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await CucumberSmartContextManager.getOptimalContext(`playwright conversion ${input.input}`)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return formatPrompt(playwrightTemplate, context, input.input)
        },
        this.llm,
        new StringOutputParser()
      ]),
      manual: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await CucumberSmartContextManager.getOptimalContext(`manual test ${input.input}`)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return formatPrompt(manualTemplate, context, input.input)
        },
        this.llm,
        new StringOutputParser()
      ]),
      general: RunnableSequence.from([
        async (input: { input: string }) => {
          const contextDocs = await CucumberSmartContextManager.getOptimalContext(input.input)
          const context = contextDocs.map(doc => doc.pageContent).join('\n\n')
          return formatPrompt(generalTemplate, context, input.input)
        },
        this.llm,
        new StringOutputParser()
      ])
    }
  }

  async generateCucumberFeature(
    request: CucumberRequest,
    onStatusUpdate?: (status: string) => void
  ): Promise<CucumberResponse> {
    try {
      onStatusUpdate?.('🥒 Generating Cucumber feature...')

      const chain = this.ragChains[request.type] || this.ragChains.general
      const response = await chain.invoke({ input: request.message })

      // Clean up response
      let feature = typeof response === 'string' ? response.trim() : String(response).trim()

      // Remove markdown code blocks if present
      const codeBlockMatch = feature.match(/\`\`\`(?:gherkin|cucumber)?\s*([\\s\\S]*?)\`\`\`/)
      if (codeBlockMatch) {
        feature = codeBlockMatch[1].trim()
      }

      // Extract scenarios for metadata
      const scenarios = this.extractScenarios(feature)

      onStatusUpdate?.('✅ Cucumber feature generated successfully')

      return {
        feature,
        scenarios,
        status: '✅ Success',
        provider: 'ollama',
        model: AI_CONFIG.ollama.model
      }
    } catch (error) {
      console.error('Cucumber AI Error:', error)
      throw new Error('Failed to generate Cucumber feature')
    }
  }

  private extractScenarios(feature: string): Array<{ name: string; steps: string[] }> {
    const scenarios: Array<{ name: string; steps: string[] }> = []
    const lines = feature.split('\n')

    let currentScenario: { name: string; steps: string[] } | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      // Scenario or Scenario Outline
      if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
        if (currentScenario) {
          scenarios.push(currentScenario)
        }
        const name = trimmed.replace(/^Scenario( Outline)?:\s*/, '')
        currentScenario = { name, steps: [] }
      } else if (currentScenario && /^(Given|When|Then|And|But)\s/.test(trimmed)) {
        currentScenario.steps.push(trimmed)
      } else if (trimmed.startsWith('Feature:') || trimmed.startsWith('Examples:')) {
        if (currentScenario) {
          scenarios.push(currentScenario)
          currentScenario = null
        }
      }
    }

    if (currentScenario) {
      scenarios.push(currentScenario)
    }

    return scenarios
  }

  // Static method for easy access
  static async generateFeature(code: string, type: 'playwright' | 'manual' | 'general' = 'playwright'): Promise<string> {
    const service = new CucumberAIService()
    const result = await service.generateCucumberFeature({ message: code, type })
    return result.feature
  }
}
