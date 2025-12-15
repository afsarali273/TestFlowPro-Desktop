# TestFlow Pro UI Features Guide

## 🎨 Dashboard Overview

### Professional Design
- **Slate Color Scheme**: Eye-friendly professional colors replacing bright gradients
- **Subtle Shadows**: Clean visual hierarchy without overwhelming effects
- **Responsive Layout**: Works seamlessly across different screen sizes

### Application Organization
- **Application Grouping**: Test suites organized by applicationName
- **Expandable Sidebar**: Navigate through applications and suites
- **Visual Indicators**: UI/API badges and test case counts
- **Search & Filter**: Find suites by name, tags, or test cases

## 📥 Import Features

### cURL Import
```bash
# Example cURL command that can be imported
curl -X POST "https://api.example.com/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name": "John", "email": "john@example.com"}'
```

**Features:**
- **Test Before Import**: Execute cURL and see actual API response
- **Smart Parsing**: Automatically extracts all components
- **Add to Existing**: Choose existing suite or create new one
- **Response Preview**: 160px height response box for better readability

### Swagger/OpenAPI Import
**Input Methods:**
- **URL Import**: Fetch directly from Swagger endpoint
- **File Upload**: Upload JSON/YAML files
- **Manual Paste**: Copy-paste Swagger specification

**Generated Test Cases:**
- **Positive Scenarios**: Valid requests with expected responses
- **Negative Scenarios**: Invalid data, unauthorized access
- **Schema Validation**: Request/response schema assertions
- **Multiple Endpoints**: All API endpoints converted to test cases

### Postman Collection Import
**Supported Features:**
- **Collection v2.1**: Full Postman format compatibility
- **Nested Folders**: Maintains folder organization
- **Variables**: Collection and environment variables
- **Pre-request Scripts**: Converted to preProcess functions
- **Test Scripts**: Converted to assertions
- **Authentication**: Bearer, Basic, API Key support

### Bruno Collection Import
**Import Options:**
- **Individual Files**: Select .bru and .env files
- **Folder Upload**: Upload entire Bruno collection directory
- **Environment Support**: Automatic .env file parsing
- **File Preview**: Shows loaded files before conversion

## ⚙️ Environment Variables Manager

### Access
Settings Dropdown → "Environment Variables"

### Features
- **Multi-Environment Tabs**: Switch between .env.dev, .env.qa, .env.prod
- **Visual Editor**: Add, edit, delete variables with forms
- **Real-time Editing**: Changes reflected immediately
- **File Operations**: Direct read/write to .env files in project root

### Usage Example
```env
# .env.qa
BASE_URL=https://qa-api.example.com
API_KEY=qa_key_123
DB_HOST=qa-db.example.com
PARALLEL_THREADS=2
```

## 🎯 Test Suite Management

### Creation & Editing
- **Visual Editor**: Rich form-based test case creation
- **Syntax Highlighting**: JSON preview with proper formatting
- **Validation**: Real-time validation of test case structure
- **Auto-save**: Automatic saving with file path management

### Execution & Results
- **Run Individual Cases**: Execute specific test cases
- **Suite Execution**: Run entire test suites
- **Real-time Progress**: Live execution status updates
- **Result Details**: Always show response details for passed/failed tests

### View Modes
- **Grid View**: Card-based layout for visual browsing
- **List View**: Compact table format for detailed information
- **Folder View**: Hierarchical folder-based navigation

## 📊 Reporting Features

### HTML Report Export
- **Beautiful Styling**: Professional report design
- **Complete Details**: Test execution, assertions, response data
- **Individual Suites**: Export specific suite results
- **Full Runs**: Export complete test run with all suites
- **Shareable Format**: Easy to share with stakeholders

### Test Result Details
- **Always Visible**: Response details for both passed and failed tests
- **Response Body**: Complete API response capture
- **Execution Timing**: Performance metrics and duration
- **Assertion Results**: Detailed assertion pass/fail information

## 🔧 Configuration

### Path Management
- **Test Suite Path**: Configure where test suites are stored
- **Framework Path**: Set TestFlow Pro framework location
- **Auto-detection**: Automatic path discovery and validation

### Settings Access
- **Settings Dropdown**: Centralized configuration access
- **Path Configuration**: Visual path selection dialogs
- **Import Options**: All import methods in one place

## 🚀 Workflow Examples

### Creating Test Suite from cURL
1. Click "cURL" button in header
2. Paste cURL command
3. Click "Test cURL" to validate
4. Review response and conversion preview
5. Choose "Create New Suite" or add to existing
6. Save and edit in visual editor

### Managing Environment Variables
1. Settings → "Environment Variables"
2. Select environment tab (dev/qa/prod)
3. Add/edit variables using form interface
4. Click "Save" to write to .env file
5. Variables immediately available in test execution

### Importing Postman Collection
1. Settings → "Import Postman"
2. Choose paste JSON, file upload, or URL
3. Review conversion preview
4. Import creates complete test suite
5. Edit and customize in visual editor

This UI provides a complete no-code solution for API test automation with professional design and comprehensive import capabilities.