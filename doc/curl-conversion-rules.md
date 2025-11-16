# cURL to TestFlow Pro Conversion Rules

## STRICT CONVERSION FORMAT

When converting cURL commands to TestFlow Pro, generate ONLY testData array objects.

### Input: cURL Command
```bash
curl 'https://api.example.com/users' -H 'Accept: application/json' -H 'Authorization: Bearer token'
```

### Output: Complete TestFlow Pro Test Suite
```json
{
  "id": "api-users-test",
  "suiteName": "Users API Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "User Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Valid Request",
          "method": "GET",
          "endpoint": "/users",
          "headers": {
            "Accept": "application/json",
            "Authorization": "Bearer token"
          },
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$"}
          ]
        },
        {
          "name": "Unauthorized Request",
          "method": "GET",
          "endpoint": "/users",
          "headers": {"Accept": "application/json"},
          "assertions": [{"type": "statusCode", "expected": 401}]
        }
      ]
    }
  ]
}
```

## CRITICAL RULES

### ✅ DO Generate
- Flat array of testData objects
- Multiple test scenarios (positive, negative, edge cases)
- Proper field structure (name, method, endpoint, headers, assertions)
- Realistic test variations

### ❌ DO NOT Generate
- Nested test suite structures
- testCases inside testData
- Complete test suite with id, suiteName, baseUrl
- Any wrapper objects around testData array

## Test Scenario Types

### 1. Positive Test Cases
- Valid request with all proper headers
- Expected successful response codes (200, 201, etc.)

### 2. Negative Test Cases  
- Missing authentication/authorization
- Invalid parameters
- Malformed requests
- Expected error response codes (400, 401, 403, 404, etc.)

### 3. Edge Cases
- Empty parameters
- Boundary values
- Special characters
- Large payloads

## Complete Multi-Scenario Test Suite Example
```json
{
  "id": "search-api-test",
  "suiteName": "Search API Test Suite",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "timeout": 30000,
  "testCases": [
    {
      "name": "Search Operations",
      "type": "REST",
      "testData": [
        {
          "name": "Valid Search Query",
          "method": "GET",
          "endpoint": "/api/search?q=test&limit=10",
          "headers": {"Accept": "application/json"},
          "assertions": [
            {"type": "statusCode", "expected": 200},
            {"type": "exists", "jsonPath": "$.results"}
          ]
        },
        {
          "name": "Empty Search Query",
          "method": "GET",
          "endpoint": "/api/search?q=&limit=10",
          "headers": {"Accept": "application/json"},
          "assertions": [{"type": "statusCode", "expected": 400}]
        },
        {
          "name": "Invalid Limit Parameter",
          "method": "GET",
          "endpoint": "/api/search?q=test&limit=-1",
          "headers": {"Accept": "application/json"},
          "assertions": [{"type": "statusCode", "expected": 400}]
        }
      ]
    }
  ]
}
```