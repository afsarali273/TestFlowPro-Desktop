import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { method, endpoint, headers = {}, body } = await request.json();
    
    if (!method || !endpoint) {
      return NextResponse.json({ error: 'Method and endpoint are required' }, { status: 400 });
    }

    // Get base URL from environment or use a default
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    const startTime = Date.now();
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      if (typeof body === 'string') {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }
    
    // Make the API request
    const response = await fetch(fullUrl, fetchOptions);
    const endTime = Date.now();
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      time: endTime - startTime,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    });
    
  } catch (error: any) {
    console.error('API test error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to test API',
      status: 0,
      data: null,
      time: 0
    }, { status: 500 });
  }
}