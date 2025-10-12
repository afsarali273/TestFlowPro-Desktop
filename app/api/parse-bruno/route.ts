import { NextRequest, NextResponse } from 'next/server';

interface BrunoRequest {
  name: string;
  type: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  auth?: any;
  script?: {
    pre?: string;
    post?: string;
  };
}

class BrunoParser {
  static parseBruFile(content: string): BrunoRequest {
    const lines = content.split('\n');
    const request: BrunoRequest = {
      name: '',
      type: 'http',
      method: 'GET',
      url: ''
    };

    let currentSection = '';
    let sectionContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('meta {')) {
        currentSection = 'meta';
        continue;
      } else if (trimmed.match(/^(get|post|put|patch|delete|head|options) \{$/)) {
        currentSection = 'request';
        request.method = trimmed.split(' ')[0].toUpperCase();
        continue;
      } else if (trimmed.startsWith('headers {')) {
        currentSection = 'headers';
        continue;
      } else if (trimmed.startsWith('body {')) {
        currentSection = 'body';
        continue;
      } else if (trimmed.startsWith('auth {')) {
        currentSection = 'auth';
        continue;
      } else if (trimmed.startsWith('script {')) {
        currentSection = 'script';
        continue;
      } else if (trimmed === '}') {
        this.processSection(request, currentSection, sectionContent);
        currentSection = '';
        sectionContent = [];
        continue;
      }

      if (currentSection && trimmed) {
        sectionContent.push(trimmed);
      }
    }

    return request;
  }

  private static processSection(request: BrunoRequest, section: string, content: string[]) {
    switch (section) {
      case 'meta':
        for (const line of content) {
          if (line.startsWith('name:')) {
            request.name = line.substring(5).trim();
          } else if (line.startsWith('type:')) {
            request.type = line.substring(5).trim();
          }
        }
        break;

      case 'request':
        for (const line of content) {
          if (line.startsWith('url:')) {
            request.url = line.substring(4).trim();
          }
        }
        break;

      case 'headers':
        request.headers = {};
        for (const line of content) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            request.headers[key.trim()] = valueParts.join(':').trim();
          }
        }
        break;

      case 'body':
        const bodyContent = content.join('\n');
        try {
          request.body = JSON.parse(bodyContent);
        } catch {
          request.body = bodyContent;
        }
        break;

      case 'auth':
        request.auth = {};
        for (const line of content) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            request.auth[key.trim()] = valueParts.join(':').trim();
          }
        }
        break;
    }
  }

  static parseCollection(files: { name: string; content: string }[]) {
    const requests = files
      .filter(f => f.name.endsWith('.bru'))
      .map(f => ({
        ...this.parseBruFile(f.content),
        fileName: f.name
      }));

    const envFiles = files.filter(f => f.name.includes('.env'));
    const variables: Record<string, string> = {};

    envFiles.forEach(envFile => {
      const lines = envFile.content.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            variables[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    });

    return { requests, variables };
  }

  static convertToTestFlowPro(files: { name: string; content: string }[], suiteName: string = 'Bruno Collection') {
    const { requests, variables } = this.parseCollection(files);
    
    if (requests.length === 0) {
      throw new Error('No .bru files found in the collection');
    }

    const firstUrl = requests[0]?.url || '';
    const baseUrl = firstUrl.match(/^https?:\/\/[^\/]+/)?.[0] || '';

    const testCases = requests.map(req => {
      const baseTestData = {
        name: req.name || req.fileName.replace('.bru', ''),
        method: req.method,
        endpoint: req.url.replace(baseUrl, '') || '/',
        headers: req.headers || {},
        ...(req.body && { body: req.body }),
        assertions: [
          { type: 'statusCode', expected: req.method === 'POST' ? 201 : 200 }
        ]
      };

      if (req.auth?.bearer) {
        baseTestData.headers = {
          ...baseTestData.headers,
          'Authorization': `Bearer ${req.auth.bearer}`
        };
      }

      return {
        name: req.name || req.fileName.replace('.bru', ''),
        testData: [baseTestData]
      };
    });

    return {
      suiteName,
      baseUrl,
      tags: [
        { serviceName: '@BrunoImport' },
        { suiteType: '@imported' }
      ],
      ...(Object.keys(variables).length > 0 && { variables }),
      testCases
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { files, suiteName } = await request.json();
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 });
    }

    const result = BrunoParser.convertToTestFlowPro(files, suiteName);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bruno parsing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse Bruno collection' },
      { status: 500 }
    );
  }
}