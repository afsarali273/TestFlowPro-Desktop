import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { soapRequest } = await request.json();
    
    if (!soapRequest?.url || !soapRequest?.body) {
      return NextResponse.json({ error: 'Missing SOAP URL or body' }, { status: 400 });
    }

    const startTime = Date.now();
    
    const response = await fetch(soapRequest.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        ...soapRequest.headers
      },
      body: soapRequest.body
    });

    const endTime = Date.now();
    const responseText = await response.text();
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      time: endTime - startTime,
      data: responseText,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to execute SOAP request' 
    }, { status: 500 });
  }
}