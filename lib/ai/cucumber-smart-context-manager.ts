import { Document } from '@langchain/core/documents'
import { CucumberKnowledgeBase } from './cucumber-knowledge-base'

export class CucumberSmartContextManager {
  private static readonly MAX_CONTEXT_SIZE = 5000

  static async getOptimalContext(userInput: string): Promise<Document[]> {
    const relevantDocs = CucumberKnowledgeBase.getRelevantDocuments(userInput)
    const intent = this.detectIntent(userInput)

    // Add baseline structure guidance if user is asking for full feature output
    if (intent.isFeatureRequest) {
      const structureDocs = CucumberKnowledgeBase.getRelevantDocuments('gherkin feature scenario')
      relevantDocs.push(...structureDocs)
    }

    return this.optimizeContext(relevantDocs, userInput)
  }

  private static detectIntent(input: string) {
    const lower = input.toLowerCase()
    return {
      isFeatureRequest: /feature|scenario|gherkin|cucumber/.test(lower),
      isUiFlow: /click|type|fill|page\.|playwright|ui/.test(lower),
      isValidation: /assert|expect|verify|should/.test(lower),
      isWaiting: /wait|timeout|loading|spinner/.test(lower)
    }
  }

  private static optimizeContext(docs: Document[], userInput: string): Document[] {
    let totalSize = 0
    const optimized: Document[] = []

    const scored = docs
      .map(doc => ({ doc, score: this.calculateRelevanceScore(doc, userInput) }))
      .sort((a, b) => b.score - a.score)

    for (const { doc } of scored) {
      const docSize = doc.pageContent.length
      if (docSize === 0) continue

      if (totalSize + docSize <= this.MAX_CONTEXT_SIZE) {
        optimized.push(doc)
        totalSize += docSize
        continue
      }

      const remaining = this.MAX_CONTEXT_SIZE - totalSize
      if (remaining > 200) {
        optimized.push(
          new Document({
            pageContent: doc.pageContent.slice(0, remaining) + '...',
            metadata: { ...doc.metadata, truncated: true }
          })
        )
      }
      break
    }

    return optimized
  }

  private static calculateRelevanceScore(doc: Document, userInput: string): number {
    const content = doc.pageContent.toLowerCase()
    const words = userInput.toLowerCase().split(/\s+/)

    let score = 0
    for (const word of words) {
      if (word.length > 3 && content.includes(word)) score += 1
    }

    const docType = String(doc.metadata.type || '')
    const category = String(doc.metadata.category || '')

    if (userInput.includes('wait') && content.includes('wait')) score += 4
    if (userInput.includes('assert') && content.includes('assert')) score += 4
    if (userInput.includes('click') && content.includes('click')) score += 3
    if (userInput.includes('type') && content.includes('type')) score += 3

    if (docType.includes('reference')) score += 1
    if (category.includes('assertions')) score += 2
    if (category.includes('waiting')) score += 2
    if (category.includes('element-interaction')) score += 2

    return score
  }
}

