# Custom Steps - Backend Function Integration

## Overview

Custom steps allow you to execute complex backend functions and page object methods directly from your TestFlow Pro JSON test suites. This enables reusable, maintainable test logic following the Page Object Model pattern.

## Custom Step JSON Format

### Basic Custom Function
```json
{
  "id": "step-1",
  "keyword": "customStep",
  "customFunction": {
    "function": "loginUser",
    "args": ["admin", "password123"],
    "mapTo": {
      "userId": "userId",
      "loginSuccess": "success"
    }
  }
}
```

### Page Object Method
```json
{
  "id": "step-2", 
  "keyword": "customStep",
  "customFunction": {
    "function": "LoginPage.login",
    "args": ["{{username}}", "{{password}}"],
    "mapTo": {
      "currentUserId": "userId",
      "isLoggedIn": "success"
    }
  }
}
```

### Complex Data Extraction
```json
{
  "id": "step-3",
  "keyword": "customStep", 
  "customFunction": {
    "function": "DataTablePage.searchUser",
    "args": ["john@example.com"],
    "mapTo": {
      "searchResults": "users",
      "resultCount": "count"
    }
  }
}
```

## Complete Test Suite Examples

### Login Flow with Custom Steps
```json
{
  "id": "login-flow-test",
  "suiteName": "Login Flow Test Suite",
  "type": "UI",
  "baseUrl": "https://app.example.com",
  "testCases": [
    {
      "name": "User Authentication",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "{{baseUrl}}/login"
        },
        {
          "id": "step-2",
          "keyword": "customStep",
          "customFunction": {
            "function": "LoginPage.login",
            "args": ["admin@example.com", "securePassword123"],
            "mapTo": {
              "userId": "userId",
              "loginSuccess": "success"
            }
          },
          "assertions": [
            {
              "type": "equals",
              "jsonPath": "$.success",
              "expected": true
            }
          ]
        },
        {
          "id": "step-3",
          "keyword": "assertVisible",
          "locator": {
            "strategy": "testId",
            "value": "dashboard"
          }
        },
        {
          "id": "step-4",
          "keyword": "customStep",
          "customFunction": {
            "function": "LoginPage.logout"
          }
        }
      ]
    }
  ]
}
```

### E-commerce Checkout Flow
```json
{
  "id": "ecommerce-checkout-test",
  "suiteName": "E-commerce Checkout Test Suite", 
  "type": "UI",
  "baseUrl": "https://shop.example.com",
  "testCases": [
    {
      "name": "Complete Purchase Flow",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "{{baseUrl}}/products"
        },
        {
          "id": "step-2",
          "keyword": "customStep",
          "customFunction": {
            "function": "EcommercePage.addToCart",
            "args": ["PROD-123", 2],
            "mapTo": {
              "cartItemId": "cartItemId",
              "totalItems": "totalItems"
            }
          }
        },
        {
          "id": "step-3",
          "keyword": "customStep",
          "customFunction": {
            "function": "EcommercePage.applyDiscountCode",
            "args": ["SAVE20"],
            "mapTo": {
              "discountApplied": "applied",
              "discountAmount": "discount"
            }
          }
        },
        {
          "id": "step-4",
          "keyword": "customStep",
          "customFunction": {
            "function": "EcommercePage.checkout",
            "args": [
              {
                "cardNumber": "4111111111111111",
                "expiryDate": "12/25",
                "cvv": "123",
                "billingAddress": {
                  "street": "123 Main St",
                  "city": "New York",
                  "zipCode": "10001"
                }
              }
            ],
            "mapTo": {
              "orderId": "orderId",
              "checkoutSuccess": "success",
              "orderTotal": "total"
            }
          },
          "assertions": [
            {
              "type": "equals",
              "jsonPath": "$.success", 
              "expected": true
            },
            {
              "type": "exists",
              "jsonPath": "$.orderId"
            }
          ]
        }
      ]
    }
  ]
}
```

### User Management with Data Operations
```json
{
  "id": "user-management-test",
  "suiteName": "User Management Test Suite",
  "type": "UI", 
  "baseUrl": "https://admin.example.com",
  "testCases": [
    {
      "name": "User CRUD Operations",
      "type": "UI",
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "{{baseUrl}}/users"
        },
        {
          "id": "step-2",
          "keyword": "customStep",
          "customFunction": {
            "function": "UserManagementPage.createUser",
            "args": [
              {
                "firstName": "John",
                "lastName": "Doe", 
                "email": "john.doe@example.com",
                "role": "editor"
              }
            ],
            "mapTo": {
              "newUserId": "userId",
              "userCreated": "success"
            }
          },
          "assertions": [
            {
              "type": "equals",
              "jsonPath": "$.success",
              "expected": true
            }
          ]
        },
        {
          "id": "step-3",
          "keyword": "customStep",
          "customFunction": {
            "function": "UserManagementPage.searchUser", 
            "args": ["john.doe@example.com"],
            "mapTo": {
              "foundUsers": "users",
              "searchCount": "count"
            }
          },
          "assertions": [
            {
              "type": "greaterThan",
              "jsonPath": "$.count",
              "expected": 0
            }
          ]
        },
        {
          "id": "step-4",
          "keyword": "customStep",
          "customFunction": {
            "function": "UserManagementPage.deleteUser",
            "args": ["{{newUserId}}"],
            "mapTo": {
              "userDeleted": "deleted"
            }
          },
          "assertions": [
            {
              "type": "equals",
              "jsonPath": "$.deleted",
              "expected": true
            }
          ]
        }
      ]
    }
  ]
}
```

### API Integration with Custom Steps
```json
{
  "id": "api-integration-test",
  "suiteName": "API Integration Test Suite",
  "type": "UI",
  "baseUrl": "https://app.example.com",
  "testCases": [
    {
      "name": "UI with API Validation",
      "type": "UI", 
      "testSteps": [
        {
          "id": "step-1",
          "keyword": "goto",
          "value": "{{baseUrl}}/dashboard"
        },
        {
          "id": "step-2",
          "keyword": "click",
          "locator": {
            "strategy": "testId",
            "value": "refresh-data-button"
          }
        },
        {
          "id": "step-3",
          "keyword": "customStep",
          "customFunction": {
            "function": "waitForApiResponse",
            "args": ["/api/dashboard/data", 10000],
            "mapTo": {
              "apiData": "responseData",
              "apiStatus": "status"
            }
          },
          "assertions": [
            {
              "type": "equals",
              "jsonPath": "$.status",
              "expected": 200
            }
          ]
        },
        {
          "id": "step-4",
          "keyword": "customStep",
          "customFunction": {
            "function": "DataTablePage.filterTable",
            "args": [
              {
                "status": "active",
                "department": "engineering"
              }
            ],
            "mapTo": {
              "filteredRows": "filteredCount"
            }
          }
        },
        {
          "id": "step-5",
          "keyword": "customStep",
          "customFunction": {
            "function": "DataTablePage.exportData",
            "args": ["csv"],
            "mapTo": {
              "exportSuccess": "exported",
              "exportFile": "filename"
            }
          },
          "assertions": [
            {
              "type": "equals",
              "jsonPath": "$.exported",
              "expected": true
            }
          ]
        }
      ]
    }
  ]
}
```

## Built-in Custom Functions

### Authentication Functions
- `loginUser(username, password)` - Basic login functionality
- `LoginPage.login(username, password)` - Page object login method
- `LoginPage.logout()` - Page object logout method
- `LoginPage.forgotPassword(email)` - Password reset functionality

### Data Management Functions  
- `fillUserForm(userData)` - Complex form filling
- `UserManagementPage.createUser(userData)` - Create user with validation
- `UserManagementPage.searchUser(searchTerm)` - Search and return results
- `UserManagementPage.deleteUser(userId)` - Delete user operation

### E-commerce Functions
- `EcommercePage.addToCart(productId, quantity)` - Add items to cart
- `EcommercePage.checkout(paymentInfo)` - Complete checkout process
- `EcommercePage.applyDiscountCode(code)` - Apply discount codes

### Data Table Functions
- `DataTablePage.sortByColumn(columnName, direction)` - Sort table data
- `DataTablePage.filterTable(filters)` - Apply multiple filters
- `DataTablePage.exportData(format)` - Export table data

### Utility Functions
- `waitForApiResponse(endpoint, timeout)` - Wait for specific API calls
- `extractTableData(tableSelector)` - Extract data from tables

## Custom Function Registration

### Register Standalone Function
```typescript
import { customStepHandler } from './custom-steps/custom-step-handler';

customStepHandler.registerFunction('myCustomFunction', async (page, arg1, arg2) => {
  // Your custom logic here
  await page.click('[data-testid="custom-button"]');
  const result = await page.textContent('[data-testid="result"]');
  return { customResult: result };
});
```

### Register Page Object
```typescript
import { customStepHandler } from './custom-steps/custom-step-handler';
import { MyPageObject } from './page-objects/my-page-object';

customStepHandler.registerPageObject('MyPageObject', MyPageObject);
```

## Variable Integration

Custom steps fully integrate with TestFlow Pro's variable system:

### Using Variables in Arguments
```json
{
  "customFunction": {
    "function": "loginUser",
    "args": ["{{username}}", "{{password}}"]
  }
}
```

### Storing Results in Variables
```json
{
  "customFunction": {
    "function": "createUser",
    "args": [{"name": "John", "email": "john@example.com"}],
    "mapTo": {
      "userId": "userId",
      "userEmail": "email"
    }
  }
}
```

### Chaining Custom Steps
```json
[
  {
    "id": "step-1",
    "keyword": "customStep",
    "customFunction": {
      "function": "createUser",
      "mapTo": {"newUserId": "userId"}
    }
  },
  {
    "id": "step-2", 
    "keyword": "customStep",
    "customFunction": {
      "function": "assignRole",
      "args": ["{{newUserId}}", "admin"]
    }
  }
]
```

## Error Handling

Custom steps include comprehensive error handling:

- **Function Not Found**: Clear error messages with available functions
- **Page Object Not Found**: Lists registered page objects
- **Method Not Found**: Shows available methods in page object
- **Execution Errors**: Proper error propagation with context
- **Variable Mapping Errors**: Validation of mapTo configurations

## Best Practices

1. **Use Page Objects**: Organize related functionality into page objects
2. **Return Structured Data**: Always return objects for better variable mapping
3. **Handle Async Operations**: Use proper async/await patterns
4. **Validate Inputs**: Check arguments before execution
5. **Meaningful Names**: Use descriptive function and method names
6. **Error Handling**: Include proper error handling in custom functions
7. **Documentation**: Document custom functions and their expected inputs/outputs