import { Document } from '@langchain/core/documents'
import { RAGKnowledgeBase } from './rag-knowledge-base'
import { UIConversionExamples } from './ui-conversion-examples'

export class SmartContextManager {
  private static readonly MAX_CONTEXT_SIZE = 8000 // characters - increased for better coverage
  
  static async getOptimalContext(userInput: string): Promise<Document[]> {
    const relevantDocs = RAGKnowledgeBase.getRelevantDocuments(userInput)
    const intent = this.detectIntent(userInput)
    
    console.log(`🔍 Initial docs: ${relevantDocs.length}, Intent: ${intent.conversionType}`)
    
    // Add UI examples for playwright/ui requests
    if (intent.conversionType === 'ui' || intent.conversionType === 'playwright') {
      const uiExamples = UIConversionExamples.getExamples()
      console.log(`📚 Adding ${uiExamples.length} UI examples`)
      relevantDocs.push(...uiExamples)
    }
    
    // Add conversion rules only if needed
    if (intent.needsConversion) {
      const rules = RAGKnowledgeBase.getConversionRules(intent.conversionType)
      if (rules) {
        console.log(`📋 Adding conversion rules for ${intent.conversionType}`)
        relevantDocs.push(rules)
      }
    }
    
    console.log(`📚 Total docs before optimization: ${relevantDocs.length}`)
    
    // Filter and truncate to stay within limits
    return this.optimizeContext(relevantDocs, userInput)
  }
  
  private static detectIntent(input: string) {
    const lower = input.toLowerCase()
    
    return {
      needsConversion: /convert|transform|change|from|to/.test(lower),
      conversionType: this.getConversionType(lower),
      isCreating: /create|generate|make|build/.test(lower),
      isEditing: /edit|modify|update|change/.test(lower)
    }
  }
  
  private static getConversionType(input: string): 'api' | 'ui' | 'curl' | 'postman' | 'playwright' {
    if (input.includes('curl')) return 'curl'
    if (input.includes('playwright') || input.includes('page.')) return 'playwright'
    if (input.includes('postman')) return 'postman'
    if (input.includes('ui') || input.includes('click')) return 'ui'
    return 'api'
  }
  
  private static optimizeContext(docs: Document[], userInput: string): Document[] {
    let totalSize = 0
    const optimized: Document[] = []
    
    // Prioritize by relevance score
    const scored = docs.map(doc => ({
      doc,
      score: this.calculateRelevanceScore(doc, userInput)
    })).sort((a, b) => b.score - a.score)
    
    for (const { doc, score } of scored) {
      const docSize = doc.pageContent.length
      console.log(`📄 Doc: ${doc.metadata.type}, Size: ${docSize}, Score: ${score}, Content: ${doc.pageContent.substring(0, 50)}...`)
      
      if (docSize === 0) {
        console.warn(`⚠️ Empty document found: ${doc.metadata.type}`)
        continue
      }
      
      if (totalSize + docSize <= this.MAX_CONTEXT_SIZE) {
        optimized.push(doc)
        totalSize += docSize
      } else {
        // Truncate if partially fits
        const remaining = this.MAX_CONTEXT_SIZE - totalSize
        if (remaining > 100) {
          optimized.push(new Document({
            pageContent: doc.pageContent.substring(0, remaining) + '...',
            metadata: { ...doc.metadata, truncated: true }
          }))
          totalSize += remaining
        }
        break
      }
    }
    
    console.log(`🎯 Optimized context: ${optimized.length} docs, ${totalSize} chars`)
    return optimized
  }
  
  private static calculateRelevanceScore(doc: Document, userInput: string): number {
    const docContent = doc.pageContent.toLowerCase()
    const inputWords = userInput.toLowerCase().split(/\s+/)
    
    let score = 0
    
    // Keyword matching
    for (const word of inputWords) {
      if (word.length > 3 && docContent.includes(word)) {
        score += 1
      }
    }
    
    // Type-specific bonuses
    const docType = doc.metadata.type
    if (userInput.includes('curl') && docType?.includes('curl')) score += 5
    if (userInput.includes('api') && docType?.includes('api')) score += 5
    if (userInput.includes('ui') && docType?.includes('ui')) score += 5
    if (userInput.includes('locator') && docType?.includes('ui')) score += 3
    if (userInput.includes('css') && docType?.includes('ui')) score += 3
    if (userInput.includes('xpath') && docType?.includes('ui')) score += 3
    
    return score
  }
}