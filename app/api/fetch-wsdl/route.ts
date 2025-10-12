import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { wsdlUrl } = await request.json();
    
    if (!wsdlUrl) {
      return NextResponse.json({ error: 'WSDL URL is required' }, { status: 400 });
    }

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(wsdlUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TestFlow-Pro/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: `Failed to fetch WSDL: ${response.status} ${response.statusText}`,
          operations: []
        }, { status: 200 }); // Return 200 with empty operations instead of error
      }

      const wsdlContent = await response.text();
      
      // Simple WSDL parsing to extract operations
      const operations = extractOperationsFromWsdl(wsdlContent);
      
      return NextResponse.json({
        operations,
        wsdlContent: wsdlContent.substring(0, 1000) // Return first 1000 chars for preview
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          error: 'Request timeout - WSDL fetch took too long',
          operations: []
        }, { status: 200 });
      }
      
      return NextResponse.json({ 
        error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        operations: []
      }, { status: 200 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request',
      operations: []
    }, { status: 200 }); // Return 200 with error message instead of 500
  }
}

function extractOperationsFromWsdl(wsdlContent: string): string[] {
  const operations: string[] = [];
  
  // Extract operations from WSDL using regex patterns
  const operationPatterns = [
    /<wsdl:operation[^>]+name="([^"]+)"/g,
    /<operation[^>]+name="([^"]+)"/g,
    /<soap:operation[^>]+soapAction="[^"]*\/([^"\/]+)"/g
  ];
  
  operationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(wsdlContent)) !== null) {
      const operationName = match[1];
      if (operationName && !operations.includes(operationName)) {
        operations.push(operationName);
      }
    }
  });
  
  // If no operations found, try to extract from method names
  if (operations.length === 0) {
    const methodPattern = /<xs:element[^>]+name="([^"]+)"/g;
    let match;
    while ((match = methodPattern.exec(wsdlContent)) !== null) {
      const methodName = match[1];
      if (methodName && !operations.includes(methodName)) {
        operations.push(methodName);
      }
    }
  }
  
  return operations.slice(0, 20); // Limit to first 20 operations
}