export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths: Record<string, Record<string, SwaggerOperation>>;
  components?: {
    schemas?: Record<string, any>;
  };
  definitions?: Record<string, any>;
}

export interface SwaggerOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'formData' | 'body';
    required?: boolean;
    type?: string;
    schema?: any;
  }>;
  requestBody?: {
    content: Record<string, { schema: any }>;
    required?: boolean;
  };
  responses: Record<string, {
    description: string;
    schema?: any;
    content?: Record<string, { schema: any }>;
  }>;
}

export class SwaggerParser {
  private generateId(title: string): string {
    return `swagger-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  }

  private getBaseUrl(spec: SwaggerSpec): string {
    if (spec.servers && spec.servers.length > 0) {
      return spec.servers[0].url;
    }
    
    if (spec.host) {
      const scheme = spec.schemes?.[0] || 'https';
      const basePath = spec.basePath || '';
      return `${scheme}://${spec.host}${basePath}`;
    }
    
    return 'https://api.example.com';
  }

  private resolveRef(ref: string, spec: SwaggerSpec): any {
    if (!ref.startsWith('#/')) return null;
    
    const path = ref.substring(2).split('/');
    let current: any = spec;
    
    for (const segment of path) {
      current = current?.[segment];
      if (!current) return null;
    }
    
    return current;
  }

  private generateExampleFromSchema(schema: any, spec?: SwaggerSpec): any {
    if (!schema) return {};
    
    // Handle $ref
    if (schema.$ref && spec) {
      const resolved = this.resolveRef(schema.$ref, spec);
      if (resolved) {
        return this.generateExampleFromSchema(resolved, spec);
      }
    }
    
    if (schema.example) return schema.example;
    
    switch (schema.type) {
      case 'string':
        if (schema.format === 'email') return '{{faker.email}}';
        if (schema.format === 'date') return '{{date.now}}';
        if (schema.format === 'uuid') return '{{faker.uuid}}';
        return schema.enum ? schema.enum[0] : '{{faker.name}}';
      case 'number':
      case 'integer':
        return schema.minimum || 123;
      case 'boolean':
        return true;
      case 'array':
        return schema.items ? [this.generateExampleFromSchema(schema.items, spec)] : [];
      case 'object':
        if (schema.properties) {
          const obj: any = {};
          Object.keys(schema.properties).forEach(key => {
            obj[key] = this.generateExampleFromSchema(schema.properties[key], spec);
          });
          return obj;
        }
        return {};
      default:
        return null;
    }
  }

  private getContentType(operation: SwaggerOperation): string {
    if (operation.requestBody?.content) {
      const contentTypes = Object.keys(operation.requestBody.content);
      return contentTypes.includes('application/json') ? 'application/json' : contentTypes[0];
    }
    return 'application/json';
  }

  private generateAssertions(responses: Record<string, any>): Array<any> {
    const assertions = [];
    
    const successCode = Object.keys(responses).find(code => 
      code.startsWith('2') || code === 'default'
    );
    
    if (successCode && successCode !== 'default') {
      assertions.push({
        type: 'statusCode',
        expected: parseInt(successCode)
      });
    } else {
      assertions.push({
        type: 'statusCode',
        expected: 200
      });
    }
    
    assertions.push({
      type: 'exists',
      jsonPath: '$'
    });
    
    return assertions;
  }

  private generateTestData(path: string, method: string, operation: SwaggerOperation, spec: SwaggerSpec): any {
    const testData: any = {
      name: operation.summary || `${method.toUpperCase()} ${path}`,
      method: method.toUpperCase(),
      endpoint: path,
      headers: {}
    };

    const contentType = this.getContentType(operation);
    if (contentType) {
      testData.headers['Content-Type'] = contentType;
    }

    // Handle OpenAPI 3.0 requestBody
    if (operation.requestBody?.content) {
      const content = operation.requestBody.content[contentType];
      if (content?.schema) {
        testData.body = this.generateExampleFromSchema(content.schema, spec);
      }
    }

    // Handle Swagger 2.0 parameters
    if (operation.parameters) {
      const bodyParam = operation.parameters.find(p => p.in === 'body');
      if (bodyParam?.schema) {
        testData.body = this.generateExampleFromSchema(bodyParam.schema, spec);
      }

      const queryParams = operation.parameters.filter(p => p.in === 'query');
      if (queryParams.length > 0) {
        const params = queryParams.map(p => `${p.name}={{${p.name}}}`).join('&');
        testData.endpoint += `?${params}`;
      }

      const headerParams = operation.parameters.filter(p => p.in === 'header');
      headerParams.forEach(p => {
        testData.headers[p.name] = `{{${p.name}}}`;
      });
      
      const pathParams = operation.parameters.filter(p => p.in === 'path');
      pathParams.forEach(p => {
        testData.endpoint = testData.endpoint.replace(`{${p.name}}`, `{{${p.name}}}`);
      });
    }

    testData.assertions = this.generateAssertions(operation.responses);

    return testData;
  }

  public parseSwagger(swaggerSpec: SwaggerSpec): any {
    const baseUrl = this.getBaseUrl(swaggerSpec);
    const suiteName = `${swaggerSpec.info.title} API Test Suite`;
    
    const testSuite = {
      id: this.generateId(swaggerSpec.info.title),
      suiteName,
      applicationName: swaggerSpec.info.title.toLowerCase(),
      type: 'API',
      baseUrl,
      timeout: 30000,
      tags: [
        { source: '@swagger' },
        { version: swaggerSpec.info.version }
      ],
      testCases: [] as any[]
    };

    const groupedOperations: Record<string, Array<{ path: string; method: string; operation: SwaggerOperation }>> = {};

    Object.entries(swaggerSpec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation.responses) {
          const tag = operation.tags?.[0] || 'Default';
          if (!groupedOperations[tag]) {
            groupedOperations[tag] = [];
          }
          groupedOperations[tag].push({ path, method, operation });
        }
      });
    });

    Object.entries(groupedOperations).forEach(([tag, operations]) => {
      const testCase = {
        name: `${tag} Operations`,
        type: 'REST',
        testData: [] as any[],
        testSteps: []
      };

      operations.forEach(({ path, method, operation }) => {
        const positiveTest = this.generateTestData(path, method, operation, testSuite);
        testCase.testData.push(positiveTest);

        if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
          const unauthorizedTest = {
            ...positiveTest,
            name: `${operation.summary || `${method.toUpperCase()} ${path}`} - Unauthorized`,
            headers: { 'Content-Type': positiveTest.headers['Content-Type'] },
            assertions: [{ type: 'statusCode', expected: 401 }]
          };
          testCase.testData.push(unauthorizedTest);

          if (positiveTest.body) {
            const invalidTest = {
              ...positiveTest,
              name: `${operation.summary || `${method.toUpperCase()} ${path}`} - Invalid Data`,
              body: {},
              assertions: [{ type: 'statusCode', expected: 400 }]
            };
            testCase.testData.push(invalidTest);
          }
        }

        if (['get', 'delete'].includes(method.toLowerCase())) {
          const unauthorizedTest = {
            ...positiveTest,
            name: `${operation.summary || `${method.toUpperCase()} ${path}`} - Unauthorized`,
            headers: { 'Accept': 'application/json' },
            assertions: [{ type: 'statusCode', expected: 401 }]
          };
          testCase.testData.push(unauthorizedTest);
        }
      });

      testSuite.testCases.push(testCase);
    });

    return testSuite;
  }
}