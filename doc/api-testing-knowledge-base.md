# API Testing Knowledge Base - Multiple Formats to TestFlowPro JSON

This knowledge base is specifically for **API testing** supporting conversion from cURL, natural language, Swagger/OpenAPI, Postman, and Bruno collections to TestFlowPro JSON format.

## 🆕 New Import Features

### Bruno Collection Import
- **File-based Collections**: Import .bru files and environment files
- **Folder Upload**: Upload entire Bruno collection directories  
- **Environment Variables**: Automatic .env file parsing
- **Git-friendly Format**: Plain text .bru files with version control support

### Enhanced cURL Import
- **Test Before Import**: Execute cURL commands and see actual API responses
- **Response Preview**: 160px height response box for better readability
- **Smart URL Parsing**: Fixed regex to handle quoted and unquoted URLs
- **Add to Existing**: Choose existing suite or create new one

### Swagger/OpenAPI Import
- **Multiple Input Methods**: URL, file upload, or paste JSON/YAML
- **Comprehensive Conversion**: Generates positive and negative test scenarios
- **Schema Validation**: Includes request/response schema validation
- **Real-time Preview**: See converted test suite before importing

### Postman Collection Import  
- **v2.1 Format Support**: Full Postman Collection v2.1 compatibility
- **Variables & Scripts**: Converts collection variables and test scripts
- **Folder Structure**: Maintains organization with nested folders
- **Multiple Scenarios**: Generates positive and negative test cases

### Environment Variables Management
- **Visual Editor**: Edit .env.dev, .env.qa, .env.prod files directly from UI
- **Multi-Environment**: Switch between different environments seamlessly
- **Real-time Editing**: Changes reflected immediately in project files
- **CRUD Operations**: Add, edit, delete environment variables with forms

## cURL to TestFlowPro JSON

### Basic GET Request
```bash
# cURL
curl -X GET "https://api.example.com/users" -H "Authorization: Bearer token123"
```
```json
// TestFlowPro JSON
{
  "method": "GET",
  "endpoint": "/users",
  "headers": {
    "Authorization": "Bearer token123"
  }
}
```

### Complex cURL with Browser Headers
```bash
curl 'https://www.propertyguru.com.sg/api/consumer/recommendation?type=ldp&locale=en' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -b 'cookies=ignored' \
  -H 'user-agent: Mozilla/5.0'
```
```json
{
  "id": "propertyguru-test",
  "suiteName": "PropertyGuru API Test",
  "type": "API",
  "baseUrl": "https://www.propertyguru.com.sg",
  "timeout": 30000,
  "testCases": [{
    "name": "Get Recommendations",
    "type": "REST",
    "testData": [{
      "name": "GET Request",
      "method": "GET",
      "endpoint": "/api/consumer/recommendation?type=ldp&locale=en",
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9"
      },
      "assertions": [
        {"type": "statusCode", "jsonPath": "$", "expected": 200}
      ]
    }]
  }]
}
```

### POST Request with JSON Body
```bash
# cURL
curl -X POST "https://api.example.com/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```
```json
// TestFlowPro JSON
{
  "method": "POST",
  "endpoint": "/users",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### PUT Request with Query Parameters
```bash
# cURL
curl -X PUT "https://api.example.com/users/123?active=true" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'
```
```json
// Complete TestFlowPro Test Suite
{
  "id": "update-user-test",
  "suiteName": "Update User API Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "User Update Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Update User - Valid Data",
          "method": "PUT",
          "endpoint": "/users/123?active=true",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "name": "Jane Doe"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "equals", "jsonPath": "$.name", "expected": "Jane Doe"}
          ]
        }
      ]
    }
  ]
}
```

## Natural Language to TestFlowPro JSON

### Simple API Call
```
Natural Language: "Get all users from the API with authorization token"
```
```json
// Complete TestFlowPro Test Suite
{
  "id": "get-users-test",
  "suiteName": "Get Users API Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "Get Users Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Get All Users - Authorized",
          "method": "GET",
          "endpoint": "/users",
          "headers": {
            "Authorization": "Bearer {{authToken}}"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$"}
          ]
        },
        {
          "name": "Get All Users - Unauthorized",
          "method": "GET",
          "endpoint": "/users",
          "headers": {
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 401}
          ]
        }
      ]
    }
  ]
}
```

### Create User Request
```
Natural Language: "Create a new user with name 'John Doe' and email 'john@example.com'"
```
```json
// TestFlowPro JSON
{
  "method": "POST",
  "endpoint": "/users",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Update User with Validation
```
Natural Language: "Update user ID 123 with new email and verify the response contains the updated email"
```
```json
// TestFlowPro JSON
{
  "method": "PUT",
  "endpoint": "/users/123",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "email": "newemail@example.com"
  },
  "assertions": [
    {
      "type": "statusCode",
      "expected": 200
    },
    {
      "type": "equals",
      "jsonPath": "$.email",
      "expected": "newemail@example.com"
    }
  ]
}
```

## Swagger/OpenAPI to TestFlowPro JSON

### From OpenAPI Specification
```yaml
# OpenAPI
paths:
  /users:
    post:
      summary: Create user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
      responses:
        '201':
          description: User created
```
```json
// TestFlowPro JSON
{
  "method": "POST",
  "endpoint": "/users",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{{faker.name}}",
    "email": "{{faker.email}}"
  },
  "assertions": [
    {
      "type": "statusCode",
      "expected": 201
    }
  ]
}
```

## Postman Collection to TestFlowPro JSON

### Simple Postman Request
```json
// Postman Collection Item
{
  "name": "Get User",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{token}}"
      }
    ],
    "url": {
      "raw": "{{baseUrl}}/users/{{userId}}",
      "host": ["{{baseUrl}}"],
      "path": ["users", "{{userId}}"]
    }
  }
}
```
```json
// Complete TestFlow Pro Test Suite
{
  "id": "get-user-postman-test",
  "suiteName": "Get User Test Suite",
  "type": "API",
  "baseUrl": "{{baseUrl}}",
  "timeout": 30000,
  "tags": [
    {"source": "@postman"},
    {"collection": "@user-api"}
  ],
  "testCases": [
    {
      "name": "User Retrieval Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Get User - Valid ID with Auth",
          "method": "GET",
          "endpoint": "/users/{{userId}}",
          "headers": {
            "Authorization": "Bearer {{token}}"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$.id"}
          ]
        },
        {
          "name": "Get User - Unauthorized Access",
          "method": "GET",
          "endpoint": "/users/{{userId}}",
          "headers": {
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 401}
          ]
        },
        {
          "name": "Get User - Invalid User ID",
          "method": "GET",
          "endpoint": "/users/999999",
          "headers": {
            "Authorization": "Bearer {{token}}"
          },
          "assertions": [
            {"type": "statusCode", "expected": 404}
          ]
        }
      ]
    }
  ]
}
```

## API-Specific Assertions

### Status Code Validation
```json
{
  "assertions": [
    {
      "type": "statusCode",
      "expected": 200
    }
  ]
}
```

### Response Body Validation
```json
{
  "assertions": [
    {
      "type": "equals",
      "jsonPath": "$.status",
      "expected": "success"
    },
    {
      "type": "exists",
      "jsonPath": "$.data.id"
    },
    {
      "type": "contains",
      "jsonPath": "$.message",
      "expected": "created successfully"
    }
  ]
}
```

### Schema Validation
```json
{
  "responseSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "number" },
      "name": { "type": "string" },
      "email": { "type": "string", "format": "email" }
    },
    "required": ["id", "name", "email"]
  }
}
```

## API Preprocessing Functions

### Authentication Token
```json
{
  "preProcess": [
    {
      "var": "authToken",
      "function": "custom.authToken"
    }
  ]
}
```

### Database Query
```json
{
  "preProcess": [
    {
      "function": "dbQuery",
      "args": ["SELECT id FROM users WHERE email = 'test@example.com'"],
      "db": "userDb",
      "mapTo": {
        "userId": "id"
      }
    }
  ]
}
```

### Faker Data Generation
```json
{
  "preProcess": [
    {
      "var": "randomEmail",
      "function": "faker.email"
    },
    {
      "var": "randomUUID",
      "function": "faker.uuid"
    }
  ]
}
```

## Bruno Collection to TestFlowPro JSON

### Basic Bruno Request (.bru file)
```
meta {
  name: Get User
  type: http
}

get {
  url: https://api.example.com/users/123
}

headers {
  Authorization: Bearer {{token}}
  Accept: application/json
}
```
```json
// Complete TestFlowPro Test Suite
{
  "id": "bruno-import-1234567890",
  "suiteName": "Bruno Collection",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "tags": [
    {"serviceName": "@BrunoImport"},
    {"suiteType": "@imported"}
  ],
  "testCases": [
    {
      "name": "Get User",
      "testData": [
        {
          "name": "Get User",
          "method": "GET",
          "endpoint": "/users/123",
          "headers": {
            "Authorization": "Bearer {{token}}",
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200}
          ]
        }
      ]
    }
  ]
}
```

### Bruno POST Request with Body
```
meta {
  name: Create User
  type: http
}

post {
  url: https://api.example.com/users
}

headers {
  Content-Type: application/json
  Authorization: Bearer {{authToken}}
}

body {
  {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}

auth {
  bearer: {{authToken}}
}
```
```json
// TestFlowPro JSON
{
  "name": "Create User",
  "testData": [
    {
      "name": "Create User",
      "method": "POST",
      "endpoint": "/users",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer {{authToken}}"
      },
      "body": {
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "assertions": [
        {"type": "statusCode", "expected": 201}
      ]
    }
  ]
}
```

### Bruno Environment Variables (.env file)
```env
# .env file in Bruno collection
API_BASE_URL=https://api.example.com
AUTH_TOKEN=bearer_token_123
USER_ID=12345
```
```json
// TestFlowPro JSON with variables
{
  "suiteName": "Bruno Collection",
  "baseUrl": "https://api.example.com",
  "variables": {
    "API_BASE_URL": "https://api.example.com",
    "AUTH_TOKEN": "bearer_token_123",
    "USER_ID": "12345"
  },
  "testCases": [...]
}
```

## Enhanced Import Features

### cURL Test Execution
```bash
# Test this cURL before importing
curl -X GET "https://jsonplaceholder.typicode.com/users/1" \
  -H "Accept: application/json"
```
**Response Preview (160px height):**
```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz"
}
```
**Converted TestFlowPro:**
```json
{
  "method": "GET",
  "endpoint": "/users/1",
  "headers": {
    "Accept": "application/json"
  },
  "assertions": [
    {"type": "statusCode", "expected": 200}
  ]
}
```

### Environment Variables UI Management
**Access:** Settings → "Environment Variables"

**Features:**
- **Multi-Environment Tabs**: Switch between .env.dev, .env.qa, .env.prod
- **Visual Forms**: Add/edit variables with key-value inputs
- **Real-time Save**: Direct file writing to project root
- **Validation**: Prevents empty keys and provides feedback

**Example Usage:**
```env
# .env.qa (managed through UI)
BASE_URL=https://qa-api.example.com
API_KEY=qa_api_key_123
DB_HOST=qa-database.example.com
PARALLEL_THREADS=2
TIMEOUT=30000
```

## Conversion Rules (API Only)

1. **HTTP Method Mapping**:
   - cURL `-X GET` → `"method": "GET"`
   - cURL `-X POST` → `"method": "POST"`
   - cURL `-X PUT` → `"method": "PUT"`
   - cURL `-X DELETE` → `"method": "DELETE"`

2. **Header Mapping**:
   - cURL `-H "Key: Value"` → `"headers": {"Key": "Value"}`
   - **Skip browser headers**: `sec-ch-ua*`, `sec-fetch-*`, `user-agent`, `referer`
   - **Ignore cookies**: `-b` flag content for security
   - Postman headers → `"headers": {}`

3. **Body Mapping**:
   - cURL `-d 'json'` → `"body": {}`
   - Postman body → `"body": {}`

4. **URL Mapping**:
   - Extract path from full URL → `"endpoint": "/path"`
   - Preserve query parameters in endpoint

5. **Timeout Handling**:
   - Add `"timeout": 30000` for external APIs
   - Handle HeadersTimeoutError with retry logic
   - Use dedicated cURL parser for complex commands

## SOAP API Support

### Basic SOAP Request - GetUser
```xml
<!-- SOAP Envelope -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetUser xmlns="http://example.com/users">
      <UserId>123</UserId>
    </GetUser>
  </soap:Body>
</soap:Envelope>
```
```json
// Complete TestFlowPro SOAP Test Suite
{
  "id": "soap-user-service-test",
  "suiteName": "SOAP User Service Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "User SOAP Operations",
      "type": "SOAP",
      "testData": [
        {
          "name": "Get User - Valid ID",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "GetUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><GetUser xmlns=\"http://example.com/users\"><UserId>123</UserId></GetUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "contains", "jsonPath": "$", "expected": "<UserId>123</UserId>"}
          ]
        },
        {
          "name": "Get User - Invalid ID",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "GetUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><GetUser xmlns=\"http://example.com/users\"><UserId>999</UserId></GetUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 500},
            {"type": "contains", "jsonPath": "$", "expected": "soap:Fault"}
          ]
        }
      ]
    }
  ]
}
```

### SOAP Request - CreateUser with Authentication
```xml
<!-- SOAP Envelope with Authentication -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthHeader xmlns="http://example.com/auth">
      <Username>admin</Username>
      <Password>secret</Password>
    </AuthHeader>
  </soap:Header>
  <soap:Body>
    <CreateUser xmlns="http://example.com/users">
      <User>
        <Name>John Doe</Name>
        <Email>john@example.com</Email>
        <Role>User</Role>
      </User>
    </CreateUser>
  </soap:Body>
</soap:Envelope>
```
```json
// Complete TestFlowPro SOAP Test Suite
{
  "id": "soap-create-user-test",
  "suiteName": "SOAP Create User Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "Create User SOAP Operations",
      "type": "SOAP",
      "testData": [
        {
          "name": "Create User - Valid Data with Auth",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "CreateUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Header><AuthHeader xmlns=\"http://example.com/auth\"><Username>admin</Username><Password>secret</Password></AuthHeader></soap:Header><soap:Body><CreateUser xmlns=\"http://example.com/users\"><User><Name>John Doe</Name><Email>john@example.com</Email><Role>User</Role></User></CreateUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "contains", "jsonPath": "$", "expected": "<CreateUserResponse>"},
            {"type": "exists", "jsonPath": "$", "expected": "UserId"}
          ]
        },
        {
          "name": "Create User - Missing Authentication",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "CreateUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><CreateUser xmlns=\"http://example.com/users\"><User><Name>John Doe</Name><Email>john@example.com</Email><Role>User</Role></User></CreateUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 401},
            {"type": "contains", "jsonPath": "$", "expected": "soap:Fault"}
          ]
        },
        {
          "name": "Create User - Invalid Email Format",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "CreateUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Header><AuthHeader xmlns=\"http://example.com/auth\"><Username>admin</Username><Password>secret</Password></AuthHeader></soap:Header><soap:Body><CreateUser xmlns=\"http://example.com/users\"><User><Name>John Doe</Name><Email>invalid-email</Email><Role>User</Role></User></CreateUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 400},
            {"type": "contains", "jsonPath": "$", "expected": "ValidationError"}
          ]
        }
      ]
    }
  ]
}
```

### SOAP Request - UpdateUser with Complex Data
```xml
<!-- SOAP Envelope for Update Operation -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <UpdateUser xmlns="http://example.com/users">
      <UserId>123</UserId>
      <UserData>
        <Name>Jane Smith</Name>
        <Email>jane@example.com</Email>
        <Profile>
          <Department>Engineering</Department>
          <Position>Senior Developer</Position>
          <Salary>75000</Salary>
        </Profile>
      </UserData>
    </UpdateUser>
  </soap:Body>
</soap:Envelope>
```
```json
// Complete TestFlowPro SOAP Test Suite
{
  "id": "soap-update-user-test",
  "suiteName": "SOAP Update User Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "Update User SOAP Operations",
      "type": "SOAP",
      "testData": [
        {
          "name": "Update User - Complete Profile",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "UpdateUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><UpdateUser xmlns=\"http://example.com/users\"><UserId>123</UserId><UserData><Name>Jane Smith</Name><Email>jane@example.com</Email><Profile><Department>Engineering</Department><Position>Senior Developer</Position><Salary>75000</Salary></Profile></UserData></UpdateUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "contains", "jsonPath": "$", "expected": "<UpdateUserResponse>"},
            {"type": "contains", "jsonPath": "$", "expected": "Jane Smith"}
          ]
        },
        {
          "name": "Update User - Non-existent User",
          "method": "POST",
          "endpoint": "/soap/users",
          "headers": {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "UpdateUser"
          },
          "body": "<?xml version=\"1.0\"?><soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><UpdateUser xmlns=\"http://example.com/users\"><UserId>999</UserId><UserData><Name>Jane Smith</Name><Email>jane@example.com</Email></UserData></UpdateUser></soap:Body></soap:Envelope>",
          "assertions": [
            {"type": "statusCode", "expected": 404},
            {"type": "contains", "jsonPath": "$", "expected": "UserNotFound"}
          ]
        }
      ]
    }
  ]
}
```

## SOAP-Specific Features

### SOAP Fault Handling
```json
{
  "assertions": [
    {
      "type": "contains",
      "jsonPath": "$",
      "expected": "soap:Fault"
    },
    {
      "type": "contains", 
      "jsonPath": "$",
      "expected": "faultcode"
    },
    {
      "type": "contains",
      "jsonPath": "$", 
      "expected": "faultstring"
    }
  ]
}
```

### SOAP Headers and Authentication
```json
{
  "headers": {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": "urn:GetUserDetails",
    "Authorization": "Basic {{base64Credentials}}"
  }
}
```

### SOAP Preprocessing for Dynamic Data
```json
{
  "preProcess": [
    {
      "var": "userId",
      "function": "faker.uuid"
    },
    {
      "var": "timestamp",
      "function": "date.now"
    },
    {
      "function": "dbQuery",
      "args": ["SELECT username FROM users WHERE active = 1 LIMIT 1"],
      "db": "userDb",
      "mapTo": {
        "activeUser": "username"
      }
    }
  ]
}ap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body><GetUser xmlns=\"http://example.com/users\"><UserId>123</UserId></GetUser></soap:Body></soap:Envelope>"
}
```

## UI Features Integration

### Professional Dashboard Design
- **Slate Color Scheme**: Professional colors replacing bright gradients
- **Application Grouping**: Test suites organized by applicationName
- **Grid/List Views**: Multiple viewing options for test suites
- **Folder Navigation**: Browse test suites by folder structure

### HTML Report Export
- **Beautiful Styling**: Professional report design with comprehensive details
- **Individual Suites**: Export specific suite results
- **Complete Runs**: Export entire test run with all suites
- **Response Capture**: Always store response body for passed and failed tests

### Import Workflow
1. **Access Import**: Settings dropdown or dedicated buttons
2. **Choose Method**: cURL, Swagger, Postman, Bruno
3. **Test/Preview**: Validate input and see conversion preview
4. **Import Options**: Create new suite or add to existing
5. **Edit & Customize**: Use visual editor for further modifications

## Important Notes

- This knowledge base is **API testing specific** - do not apply these patterns to UI testing
- All examples focus on HTTP requests, responses, and API validations
- Supports REST, SOAP, and GraphQL API patterns with Bruno collection support
- Preprocessing functions are designed for API data preparation
- Assertions are focused on HTTP status codes and JSON/XML response validation
- SOAP APIs use POST method with XML body and specific Content-Type headers
- SOAP responses should be validated for both success elements and fault elements
- Always include SOAPAction header for SOAP requests
- SOAP test suites should use "type": "SOAP" in testCases for proper identification
- **New Import Features**: Bruno collections, enhanced cURL testing, comprehensive Swagger/Postman support
- **Environment Management**: Direct .env file editing through UI with multi-environment support
- **Professional UI**: Slate color scheme with improved user experience and visual hierarchy