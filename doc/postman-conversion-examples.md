# Postman Collection to TestFlow Pro Conversion

## Complete Postman Collection Example

### Input: Postman Collection
```json
{
  "info": {
    "name": "Demo API Collection",
    "_postman_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "description": "Comprehensive demo collection with multiple APIs"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"demo\",\n  \"password\": \"password123\"\n}"
            },
            "url": { "raw": "{{baseUrl}}/auth/login", "host": ["{{baseUrl}}"], "path": ["auth", "login"] }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Login successful\", function () {",
                  "  pm.response.to.have.status(200);",
                  "  var json = pm.response.json();",
                  "  pm.expect(json.token).to.exist;",
                  "  pm.environment.set(\"authToken\", json.token);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "header": [
              { "key": "Authorization", "value": "Bearer {{authToken}}" }
            ],
            "url": { "raw": "{{baseUrl}}/users", "host": ["{{baseUrl}}"], "path": ["users"] }
          }
        },
        {
          "name": "Create User",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{authToken}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\"\n}"
            },
            "url": { "raw": "{{baseUrl}}/users", "host": ["{{baseUrl}}"], "path": ["users"] }
          }
        }
      ]
    }
  ],
  "variable": [
    { "key": "baseUrl", "value": "https://api.example.com" }
  ]
}
```

### Output: Complete TestFlow Pro Test Suite
```json
{
  "id": "demo-api-collection-test",
  "suiteName": "Demo API Collection Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "tags": [
    {"source": "@postman"},
    {"collection": "@demo-api"}
  ],
  "testCases": [
    {
      "name": "Authentication Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Login - Valid Credentials",
          "method": "POST",
          "endpoint": "/auth/login",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "username": "demo",
            "password": "password123"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$.token"}
          ],
          "store": {
            "authToken": "$.token"
          }
        },
        {
          "name": "Login - Invalid Credentials",
          "method": "POST",
          "endpoint": "/auth/login",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "username": "demo",
            "password": "wrongpassword"
          },
          "assertions": [
            {"type": "statusCode", "expected": 401}
          ]
        }
      ]
    },
    {
      "name": "User Management Operations",
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
            {"type": "type", "jsonPath": "$", "expected": "array"}
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
        },
        {
          "name": "Create User - Valid Data",
          "method": "POST",
          "endpoint": "/users",
          "headers": {
            "Authorization": "Bearer {{authToken}}",
            "Content-Type": "application/json"
          },
          "body": {
            "name": "John Doe",
            "email": "john@example.com"
          },
          "assertions": [
            {"type": "statusCode", "expected": 201},
            {"type": "exists", "jsonPath": "$.id"},
            {"type": "equals", "jsonPath": "$.name", "expected": "John Doe"}
          ],
          "store": {
            "userId": "$.id"
          }
        },
        {
          "name": "Create User - Duplicate Email",
          "method": "POST",
          "endpoint": "/users",
          "headers": {
            "Authorization": "Bearer {{authToken}}",
            "Content-Type": "application/json"
          },
          "body": {
            "name": "Jane Doe",
            "email": "john@example.com"
          },
          "assertions": [
            {"type": "statusCode", "expected": 409}
          ]
        }
      ]
    }
  ]
}
```

## Postman Folder Structure Conversion

### Input: Nested Postman Folders
```json
{
  "name": "E-commerce API",
  "item": [
    {
      "name": "Products",
      "item": [
        {
          "name": "List Products",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products?limit=10&category=electronics",
              "query": [
                {"key": "limit", "value": "10"},
                {"key": "category", "value": "electronics"}
              ]
            }
          }
        },
        {
          "name": "Get Product by ID",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/products/{{productId}}"
          }
        }
      ]
    },
    {
      "name": "Orders",
      "item": [
        {
          "name": "Create Order",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Authorization", "value": "Bearer {{token}}"},
              {"key": "Content-Type", "value": "application/json"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productId\": \"{{productId}}\",\n  \"quantity\": 2\n}"
            },
            "url": "{{baseUrl}}/orders"
          }
        }
      ]
    }
  ]
}
```

### Output: TestFlow Pro with Multiple Test Cases
```json
{
  "id": "ecommerce-api-test",
  "suiteName": "E-commerce API Test Suite",
  "type": "API",
  "baseUrl": "{{baseUrl}}",
  "timeout": 30000,
  "testCases": [
    {
      "name": "Product Operations",
      "type": "REST",
      "testData": [
        {
          "name": "List Products - With Filters",
          "method": "GET",
          "endpoint": "/products?limit=10&category=electronics",
          "headers": {
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "type", "jsonPath": "$", "expected": "array"},
            {"type": "lessThan", "jsonPath": "$.length", "expected": 11}
          ]
        },
        {
          "name": "List Products - No Filters",
          "method": "GET",
          "endpoint": "/products",
          "headers": {
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "type", "jsonPath": "$", "expected": "array"}
          ]
        },
        {
          "name": "Get Product by ID - Valid ID",
          "method": "GET",
          "endpoint": "/products/{{productId}}",
          "headers": {
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$.id"},
            {"type": "exists", "jsonPath": "$.name"}
          ]
        },
        {
          "name": "Get Product by ID - Invalid ID",
          "method": "GET",
          "endpoint": "/products/999999",
          "headers": {
            "Accept": "application/json"
          },
          "assertions": [
            {"type": "statusCode", "expected": 404}
          ]
        }
      ]
    },
    {
      "name": "Order Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Create Order - Valid Data",
          "method": "POST",
          "endpoint": "/orders",
          "headers": {
            "Authorization": "Bearer {{token}}",
            "Content-Type": "application/json"
          },
          "body": {
            "productId": "{{productId}}",
            "quantity": 2
          },
          "assertions": [
            {"type": "statusCode", "expected": 201},
            {"type": "exists", "jsonPath": "$.orderId"},
            {"type": "equals", "jsonPath": "$.quantity", "expected": 2}
          ]
        },
        {
          "name": "Create Order - Missing Authorization",
          "method": "POST",
          "endpoint": "/orders",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "productId": "{{productId}}",
            "quantity": 2
          },
          "assertions": [
            {"type": "statusCode", "expected": 401}
          ]
        },
        {
          "name": "Create Order - Invalid Product ID",
          "method": "POST",
          "endpoint": "/orders",
          "headers": {
            "Authorization": "Bearer {{token}}",
            "Content-Type": "application/json"
          },
          "body": {
            "productId": "invalid-id",
            "quantity": 2
          },
          "assertions": [
            {"type": "statusCode", "expected": 400}
          ]
        }
      ]
    }
  ]
}
```

## Postman Test Scripts to TestFlow Pro Assertions

### Input: Postman Test Script
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has user data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.name).to.exist;
    pm.expect(jsonData.email).to.include("@");
    pm.expect(jsonData.id).to.be.a('number');
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

### Output: TestFlow Pro Assertions
```json
{
  "assertions": [
    {"type": "statusCode", "expected": 200},
    {"type": "exists", "jsonPath": "$.name"},
    {"type": "contains", "jsonPath": "$.email", "expected": "@"},
    {"type": "type", "jsonPath": "$.id", "expected": "number"}
  ]
}
```

## Postman Variables to TestFlow Pro Variables

### Input: Postman Variables and Pre-request Scripts
```json
{
  "variable": [
    {"key": "baseUrl", "value": "https://api.example.com"},
    {"key": "userId", "value": ""},
    {"key": "authToken", "value": ""}
  ],
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "exec": [
          "pm.environment.set('randomEmail', 'user' + Math.random() + '@example.com');",
          "pm.environment.set('timestamp', Date.now());"
        ]
      }
    }
  ]
}
```

### Output: TestFlow Pro PreProcess
```json
{
  "preProcess": [
    {"var": "randomEmail", "function": "faker.email"},
    {"var": "timestamp", "function": "date.now"},
    {"var": "randomId", "function": "faker.uuid"}
  ]
}
```

## Complex Postman Collection with Authentication Flow

### Input: Multi-step Authentication
```json
{
  "item": [
    {
      "name": "Get Auth Token",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/auth/token",
        "body": {
          "mode": "raw",
          "raw": "{\"clientId\": \"{{clientId}}\", \"clientSecret\": \"{{clientSecret}}\"}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "var response = pm.response.json();",
              "pm.environment.set('accessToken', response.access_token);"
            ]
          }
        }
      ]
    },
    {
      "name": "Protected Resource",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{accessToken}}"}
        ],
        "url": "{{baseUrl}}/protected/data"
      }
    }
  ]
}
```

### Output: TestFlow Pro with Chained Requests
```json
{
  "id": "auth-flow-test",
  "suiteName": "Authentication Flow Test Suite",
  "type": "API",
  "baseUrl": "{{baseUrl}}",
  "timeout": 30000,
  "testCases": [
    {
      "name": "Authentication and Protected Access",
      "type": "REST",
      "testData": [
        {
          "name": "Get Auth Token",
          "method": "POST",
          "endpoint": "/auth/token",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "clientId": "{{clientId}}",
            "clientSecret": "{{clientSecret}}"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$.access_token"}
          ],
          "store": {
            "accessToken": "$.access_token"
          }
        },
        {
          "name": "Access Protected Resource - Valid Token",
          "method": "GET",
          "endpoint": "/protected/data",
          "headers": {
            "Authorization": "Bearer {{accessToken}}"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$.data"}
          ]
        },
        {
          "name": "Access Protected Resource - Invalid Token",
          "method": "GET",
          "endpoint": "/protected/data",
          "headers": {
            "Authorization": "Bearer invalid-token"
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

## Postman Conversion Rules

### 1. Collection Structure Mapping
- `collection.info.name` → `suiteName`
- `collection.item[]` → `testCases[]`
- Nested folders become separate test cases
- Individual requests become `testData[]` entries

### 2. Request Mapping
- `request.method` → `method`
- `request.url` → `endpoint` (extract path from full URL)
- `request.header[]` → `headers` object
- `request.body.raw` → `body` (parse JSON if possible)

### 3. Variable Mapping
- `{{variableName}}` → Keep as `{{variableName}}`
- Collection variables → Use in baseUrl or preProcess
- Environment variables → Convert to preProcess functions

### 4. Test Script Mapping
- `pm.response.to.have.status(code)` → `{"type": "statusCode", "expected": code}`
- `pm.expect(json.field).to.exist` → `{"type": "exists", "jsonPath": "$.field"}`
- `pm.expect(json.field).to.equal(value)` → `{"type": "equals", "jsonPath": "$.field", "expected": value}`

### 5. Authentication Handling
- Bearer tokens → `Authorization: Bearer {{token}}`
- API keys → Custom headers
- Basic auth → `Authorization: Basic {{base64Credentials}}`

### 6. Generate Test Scenarios
- Always create positive test case from original request
- Add negative test cases (unauthorized, invalid data, missing fields)
- Add edge cases (empty values, boundary conditions)
- Include validation scenarios based on expected response structure