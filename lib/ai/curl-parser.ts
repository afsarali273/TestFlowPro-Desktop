export interface ParsedCurl {
  method: string
  url: string
  baseUrl: string
  endpoint: string
  headers: Record<string, string>
  body?: any
  queryParams?: Record<string, string>
}

export interface AITestCase {
  name: string
  method: string
  endpoint: string
  headers: Record<string, string>
  body?: any
  assertions: Array<{
    type: string
    jsonPath?: string
    expected: any
  }>
}

export class CurlParser {
  static parse(curlCommand: string): ParsedCurl {
    // Clean up the curl command
    const cleanCommand = curlCommand
      .replace(/\\\s*\n\s*/g, ' ') // Remove line breaks with backslashes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Extract method
    const methodMatch = cleanCommand.match(/-X\s+(\w+)/i)
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET'

    // Extract URL - handle various formats
    let urlMatch = cleanCommand.match(/curl\s+'([^']+)'/)
    if (!urlMatch) {
      urlMatch = cleanCommand.match(/curl\s+"([^"]+)"/)
    }
    if (!urlMatch) {
      urlMatch = cleanCommand.match(/curl\s+(https?:\/\/[^\s]+)/)
    }
    if (!urlMatch) {
      throw new Error('Could not extract URL from cURL command')
    }
    
    const url = urlMatch[1]
    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`
    const endpoint = urlObj.pathname + urlObj.search

    // Extract headers
    const headers: Record<string, string> = {}
    const headerMatches = cleanCommand.matchAll(/-H\s+['"]([^'"]+)['"]/g)
    
    for (const match of headerMatches) {
      const headerStr = match[1]
      const colonIndex = headerStr.indexOf(':')
      if (colonIndex > 0) {
        const key = headerStr.substring(0, colonIndex).trim()
        const value = headerStr.substring(colonIndex + 1).trim()
        
        // Skip browser-specific headers that cause issues
        if (!this.shouldSkipHeader(key)) {
          headers[key] = value
        }
      }
    }

    // Extract body data
    let body: any
    const dataMatch = cleanCommand.match(/-d\s+['"]([^'"]+)['"]|--data\s+['"]([^'"]+)['"]/);
    if (dataMatch) {
      const bodyStr = dataMatch[1] || dataMatch[2]
      try {
        body = JSON.parse(bodyStr)
      } catch {
        // If not JSON, keep as string
        body = bodyStr
      }
    }

    // Extract query parameters
    const queryParams: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    return {
      method,
      url,
      baseUrl,
      endpoint,
      headers,
      body,
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
    }
  }

  private static shouldSkipHeader(headerName: string): boolean {
    const skipHeaders = [
      'sec-ch-ua',
      'sec-ch-ua-mobile', 
      'sec-ch-ua-platform',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
      'user-agent',
      'cookie',
      'referer',
      'cf_clearance',
      '__cf_bm'
    ]
    
    return skipHeaders.some(skip => 
      headerName.toLowerCase().includes(skip.toLowerCase())
    )
  }

  static async generateTestSuite(parsed: ParsedCurl, useAI: boolean = true): Promise<any> {
    const suiteName = this.generateSuiteName(parsed.endpoint)
    const testName = this.generateTestName(parsed.method, parsed.endpoint)
    
    if (useAI) {
      return await this.generateAITestSuite(parsed, suiteName, testName)
    }
    
    return {
      id: `curl-test-${Date.now()}`,
      suiteName,
      type: "API",
      baseUrl: parsed.baseUrl,
      timeout: 30000,
      testCases: [{
        name: testName,
        type: "REST",
        testData: [{
          name: `${parsed.method} Request`,
          method: parsed.method,
          endpoint: parsed.endpoint,
          headers: Object.keys(parsed.headers).length > 0 ? parsed.headers : {"Accept": "application/json"},
          ...(parsed.body && { body: parsed.body }),
          assertions: [
            { type: "statusCode", jsonPath: "$", expected: parsed.method === 'POST' ? 201 : 200 },
            { type: "exists", jsonPath: "$" }
          ]
        }]
      }]
    }
  }

  private static async generateAITestSuite(parsed: ParsedCurl, suiteName: string, testName: string): Promise<any> {
    const { AIService } = await import('./ai-service')
    
    const structuredData = {
      method: parsed.method,
      baseUrl: parsed.baseUrl,
      endpoint: parsed.endpoint,
      headers: parsed.headers,
      body: parsed.body,
      queryParams: parsed.queryParams
    }
    
    const prompt = `Generate TestFlow Pro API testData array for this cURL request:

${JSON.stringify(structuredData, null, 2)}

IMPORTANT: Follow STRICT API testData format from knowledge base.

Return ONLY JSON array of testData objects (NO nested testCases, NO suite structure):

Required format:
[
  {
    "name": "Valid Request",
    "method": "${parsed.method}",
    "endpoint": "${parsed.endpoint}",
    "headers": ${JSON.stringify(parsed.headers)},
    "assertions": [{"type": "statusCode", "expected": 200}]
  }
]

Generate 3-4 test scenarios with different assertions. Return ONLY the testData array.`

    try {
      const aiService = new AIService()
      const aiResult = await aiService.generateContent({ prompt, context: 'curl-test-generation' })
      
      // Parse AI response and structure as test suite
      return {
        id: `curl-test-${Date.now()}`,
        suiteName,
        type: "API",
        baseUrl: parsed.baseUrl,
        timeout: 30000,
        testCases: [{
          name: testName,
          type: "REST",
          testData: this.parseAITestData(aiResult.content, parsed)
        }]
      }
    } catch (error) {
      console.warn('AI generation failed, falling back to structured test cases:', error)
      return {
        id: `curl-test-${Date.now()}`,
        suiteName,
        type: "API",
        baseUrl: parsed.baseUrl,
        timeout: 30000,
        testCases: [{
          name: testName,
          type: "REST",
          testData: this.generateStructuredTestCases('', parsed)
        }]
      }
    }
  }

  private static parseAITestData(aiContent: string, parsed: ParsedCurl): any[] {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[1])
        return this.extractTestDataFromAI(aiData)
      }
      
      // Try parsing without code blocks
      const directJson = JSON.parse(aiContent.trim())
      return this.extractTestDataFromAI(directJson)
      
    } catch (error) {
      console.warn('Failed to parse AI response, using fallback')
      return this.generateFallbackTestCases(parsed)
    }
  }

  private static extractTestDataFromAI(aiData: any): any[] {
    // Direct array of testData objects
    if (Array.isArray(aiData) && aiData[0]?.name && aiData[0]?.method) {
      return aiData
    }
    
    // Single testData object
    if (aiData.name && aiData.method) {
      return [aiData]
    }
    
    // Nested structure: aiData.testCases[0].testCases[].testData
    if (aiData.testCases && Array.isArray(aiData.testCases)) {
      const nestedTestCases = aiData.testCases[0]?.testCases
      if (Array.isArray(nestedTestCases)) {
        return nestedTestCases.map((tc: any) => tc.testData).filter(Boolean)
      }
    }
    
    // Fallback: return empty array
    return []
  }

  private static generateStructuredTestCases(aiContent: string, parsed: ParsedCurl): any[] {
    const testCases = []
    
    // Positive test case
    testCases.push({
      name: "Valid Request",
      method: parsed.method,
      endpoint: parsed.endpoint,
      headers: parsed.headers,
      ...(parsed.body && { body: parsed.body }),
      assertions: [
        { type: "statusCode", expected: parsed.method === 'POST' ? 201 : 200 },
        { type: "exists", jsonPath: "$" }
      ]
    })

    // Negative test cases based on method
    if (parsed.method === 'POST' || parsed.method === 'PUT') {
      testCases.push({
        name: "Invalid Data Format",
        method: parsed.method,
        endpoint: parsed.endpoint,
        headers: parsed.headers,
        body: "invalid-json",
        assertions: [
          { type: "statusCode", expected: 400 }
        ]
      })
      
      if (parsed.body) {
        testCases.push({
          name: "Missing Required Fields",
          method: parsed.method,
          endpoint: parsed.endpoint,
          headers: parsed.headers,
          body: {},
          assertions: [
            { type: "statusCode", expected: 400 }
          ]
        })
      }
    }

    // Unauthorized test
    testCases.push({
      name: "Unauthorized Request",
      method: parsed.method,
      endpoint: parsed.endpoint,
      headers: { "Content-Type": "application/json" },
      ...(parsed.body && { body: parsed.body }),
      assertions: [
        { type: "statusCode", expected: 401 }
      ]
    })

    return testCases
  }

  private static generateFallbackTestCases(parsed: ParsedCurl): any[] {
    return [{
      name: `${parsed.method} Request`,
      method: parsed.method,
      endpoint: parsed.endpoint,
      headers: Object.keys(parsed.headers).length > 0 ? parsed.headers : {"Accept": "application/json"},
      ...(parsed.body && { body: parsed.body }),
      assertions: [
        { type: "statusCode", expected: parsed.method === 'POST' ? 201 : 200 },
        { type: "exists", jsonPath: "$" }
      ]
    }]
  }

  private static generateSuiteName(endpoint: string): string {
    const pathParts = endpoint.split('/').filter(part => part && !part.includes('?'))
    const mainResource = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'API'
    return `${mainResource.charAt(0).toUpperCase() + mainResource.slice(1)} API Test Suite`
  }

  private static generateTestName(method: string, endpoint: string): string {
    const pathParts = endpoint.split('/').filter(part => part && !part.includes('?'))
    const resource = pathParts[pathParts.length - 1] || 'Resource'
    return `${method} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`
  }
}