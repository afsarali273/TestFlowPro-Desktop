# API TestData Format - TestFlow Pro

## STRICT FORMAT RULES

### ✅ CORRECT testData Structure
```json
"testData": [
  {
    "name": "Valid Request",
    "method": "GET",
    "endpoint": "/api/users",
    "headers": {"Accept": "application/json"},
    "assertions": [{"type": "statusCode", "expected": 200}]
  },
  {
    "name": "Invalid Request", 
    "method": "GET",
    "endpoint": "/api/users",
    "headers": {"Accept": "application/json"},
    "assertions": [{"type": "statusCode", "expected": 400}]
  }
]
```

### ❌ INCORRECT Patterns to AVOID
- NEVER nest testCases inside testData
- NEVER add id, suiteName, type, baseUrl inside testData objects
- NEVER create nested test suite structure in testData
- testData should be FLAT array of test objects

### Required testData Object Fields
- `name`: string (required)
- `method`: string (required) 
- `endpoint`: string (required)
- `headers`: object (required)
- `assertions`: array (required)
- `body`: object (optional)
- `preProcess`: array (optional)
- `store`: object (optional)

### Multiple Test Scenarios Example
```json
"testData": [
  {
    "name": "Positive - Valid Data",
    "method": "POST",
    "endpoint": "/api/users",
    "headers": {"Content-Type": "application/json"},
    "body": {"name": "John", "email": "john@example.com"},
    "assertions": [
      {"type": "statusCode", "expected": 201},
      {"type": "exists", "jsonPath": "$.id"}
    ]
  },
  {
    "name": "Negative - Missing Required Field",
    "method": "POST", 
    "endpoint": "/api/users",
    "headers": {"Content-Type": "application/json"},
    "body": {"name": "John"},
    "assertions": [{"type": "statusCode", "expected": 400}]
  },
  {
    "name": "Negative - Invalid Data Type",
    "method": "POST",
    "endpoint": "/api/users", 
    "headers": {"Content-Type": "application/json"},
    "body": {"name": 123, "email": "invalid"},
    "assertions": [{"type": "statusCode", "expected": 400}]
  }
]
```