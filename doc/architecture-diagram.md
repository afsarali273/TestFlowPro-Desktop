# TestFlow Pro - Architecture Diagram

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Local Development Environment"
        subgraph "Frontend UI (React/Next.js)"
            UI[Test Designer UI<br/>Port: 3000]
            DASH[Dashboard<br/>- Suite Management<br/>- Application Grouping<br/>- Grid/List Views]
            EDITOR[Visual Editor<br/>- Test Case Creation<br/>- JSON Preview<br/>- Validation]
            IMPORT[Import Modules<br/>- cURL Parser<br/>- Swagger/OpenAPI<br/>- Postman Collections<br/>- Bruno Collections]
            ENV[Environment Manager<br/>- .env File Editor<br/>- Multi-Environment<br/>- Variable CRUD]
            RESULTS[Results Dashboard<br/>- HTML Reports<br/>- Test Details<br/>- Response Capture]
        end
        
        subgraph "Backend Core (TypeScript/Node.js)"
            RUNNER[Test Runner<br/>src/runner.ts]
            EXECUTOR[Test Executor<br/>src/executor.ts]
            PREPROC[PreProcessor<br/>src/preProcessor.ts]
            REPORTER[HTML Reporter<br/>src/htmlReporter.ts]
            PARSER[Parsers<br/>- cURL Parser<br/>- Swagger Parser<br/>- Postman Parser<br/>- Bruno Parser]
        end
        
        subgraph "File System"
            TESTDATA[Test Suites<br/>testData/*.json]
            ENVFILES[Environment Files<br/>.env.dev<br/>.env.qa<br/>.env.prod]
            REPORTS[Reports<br/>reports/*.json<br/>reports/*.html]
            SCREENSHOTS[Screenshots<br/>screenshots/*.png]
        end
        
        subgraph "External Integrations"
            DB[(Database<br/>MySQL/ODBC/DB2)]
            APIS[External APIs<br/>REST/SOAP/GraphQL]
            BROWSER[Browser<br/>Playwright/Selenium]
        end
    end
    
    subgraph "CI/CD Pipeline Environment"
        subgraph "Azure DevOps"
            ADO_PIPELINE[Azure Pipeline<br/>azure-pipelines.yml]
            ADO_AGENT[Build Agent<br/>- Node.js Runtime<br/>- TestFlow Pro CLI]
            ADO_ARTIFACTS[Pipeline Artifacts<br/>- Test Reports<br/>- Screenshots<br/>- Logs]
        end
        
        subgraph "GitHub Actions"
            GH_WORKFLOW[GitHub Workflow<br/>.github/workflows/test.yml]
            GH_RUNNER[GitHub Runner<br/>- Node.js Runtime<br/>- TestFlow Pro CLI]
            GH_ARTIFACTS[Action Artifacts<br/>- Test Reports<br/>- Screenshots<br/>- Logs]
        end
        
        subgraph "Jenkins"
            JENKINS_JOB[Jenkins Job<br/>Jenkinsfile]
            JENKINS_AGENT[Jenkins Agent<br/>- Node.js Runtime<br/>- TestFlow Pro CLI]
            JENKINS_ARTIFACTS[Build Artifacts<br/>- Test Reports<br/>- Screenshots<br/>- Logs]
        end
    end
    
    subgraph "Shared Components"
        CLI[Command Line Interface<br/>npx ts-node src/runner.ts<br/>--serviceName=@UserService<br/>--suiteType=@smoke]
        CONFIG[Configuration<br/>- Environment Variables<br/>- Database Connections<br/>- API Endpoints<br/>- Parallel Execution]
    end
    
    %% Local Environment Connections
    UI --> DASH
    UI --> EDITOR
    UI --> IMPORT
    UI --> ENV
    UI --> RESULTS
    
    DASH --> TESTDATA
    EDITOR --> TESTDATA
    IMPORT --> PARSER
    ENV --> ENVFILES
    RESULTS --> REPORTS
    
    PARSER --> TESTDATA
    RUNNER --> EXECUTOR
    RUNNER --> PREPROC
    RUNNER --> REPORTER
    RUNNER --> CLI
    
    EXECUTOR --> DB
    EXECUTOR --> APIS
    EXECUTOR --> BROWSER
    EXECUTOR --> REPORTS
    EXECUTOR --> SCREENSHOTS
    
    PREPROC --> DB
    PREPROC --> ENVFILES
    
    REPORTER --> REPORTS
    
    %% CI/CD Environment Connections
    ADO_PIPELINE --> ADO_AGENT
    ADO_AGENT --> CLI
    ADO_AGENT --> CONFIG
    ADO_AGENT --> ADO_ARTIFACTS
    
    GH_WORKFLOW --> GH_RUNNER
    GH_RUNNER --> CLI
    GH_RUNNER --> CONFIG
    GH_RUNNER --> GH_ARTIFACTS
    
    JENKINS_JOB --> JENKINS_AGENT
    JENKINS_AGENT --> CLI
    JENKINS_AGENT --> CONFIG
    JENKINS_AGENT --> JENKINS_ARTIFACTS
    
    CLI --> RUNNER
    CONFIG --> ENVFILES
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef storage fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef cicd fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef shared fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class UI,DASH,EDITOR,IMPORT,ENV,RESULTS frontend
    class RUNNER,EXECUTOR,PREPROC,REPORTER,PARSER backend
    class TESTDATA,ENVFILES,REPORTS,SCREENSHOTS storage
    class DB,APIS,BROWSER external
    class ADO_PIPELINE,ADO_AGENT,ADO_ARTIFACTS,GH_WORKFLOW,GH_RUNNER,GH_ARTIFACTS,JENKINS_JOB,JENKINS_AGENT,JENKINS_ARTIFACTS cicd
    class CLI,CONFIG shared
```

## 🔄 Data Flow Diagrams

### Local Development Workflow

```mermaid
sequenceDiagram
    participant QA as QA Engineer
    participant UI as Test Designer UI
    participant Parser as Import Parsers
    participant FS as File System
    participant Runner as Test Runner
    participant Executor as Test Executor
    participant Reporter as HTML Reporter
    
    QA->>UI: Access Dashboard (localhost:3000)
    QA->>UI: Import cURL/Swagger/Postman/Bruno
    UI->>Parser: Parse imported data
    Parser->>FS: Save test suite JSON
    QA->>UI: Edit test cases visually
    UI->>FS: Update test suite JSON
    QA->>UI: Configure environment variables
    UI->>FS: Update .env files
    QA->>UI: Run test suite
    UI->>Runner: Execute test suite
    Runner->>Executor: Run individual test cases
    Executor->>Executor: PreProcess (faker, dbQuery, custom)
    Executor->>External: Make API calls
    External-->>Executor: API responses
    Executor->>FS: Store results & screenshots
    Executor->>Reporter: Generate HTML report
    Reporter->>FS: Save HTML report
    Reporter-->>UI: Display results
    UI-->>QA: Show test results & reports
```

### CI/CD Pipeline Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Repo as Git Repository
    participant Pipeline as CI/CD Pipeline
    participant Agent as Build Agent
    participant CLI as TestFlow CLI
    participant Runner as Test Runner
    participant Artifacts as Artifacts Store
    
    Dev->>Repo: Push code changes
    Repo->>Pipeline: Trigger pipeline
    Pipeline->>Agent: Provision build agent
    Agent->>Agent: Install Node.js & dependencies
    Agent->>CLI: Execute test command
    Note over CLI: npx ts-node src/runner.ts<br/>--serviceName=@UserService<br/>--suiteType=@smoke
    CLI->>Runner: Load test suites
    Runner->>Runner: Execute tests in parallel
    Runner->>External: API calls & validations
    External-->>Runner: Test results
    Runner->>Agent: Generate reports
    Agent->>Artifacts: Upload test reports
    Agent->>Artifacts: Upload screenshots
    Agent->>Pipeline: Report test results
    Pipeline-->>Dev: Notify test completion
```

## 🏛️ Component Architecture

### Frontend Architecture (React/Next.js)

```mermaid
graph TB
    subgraph "Pages & Routing"
        PAGE[app/page.tsx<br/>Main Dashboard]
        API_ROUTES[app/api/*<br/>- Test Suites<br/>- Environment Variables<br/>- Import Parsers]
    end
    
    subgraph "Components"
        DASHBOARD[Dashboard Components<br/>- Suite Cards<br/>- Application Grouping<br/>- Search & Filter]
        EDITOR[Editor Components<br/>- Test Suite Editor<br/>- Test Case View<br/>- JSON Preview]
        MODALS[Modal Components<br/>- Import Modals<br/>- Environment Manager<br/>- Results Dashboard]
        UI_COMP[UI Components<br/>- Buttons, Forms<br/>- Tabs, Dialogs<br/>- Tables, Cards]
    end
    
    subgraph "State Management"
        STATE[React State<br/>- Test Suites<br/>- Selected Suite<br/>- UI States]
        HOOKS[Custom Hooks<br/>- useToast<br/>- File Operations]
    end
    
    subgraph "Utilities"
        PARSERS[Client Parsers<br/>- cURL Parser<br/>- Swagger Parser<br/>- Postman Parser<br/>- Bruno Parser]
        UTILS[Utility Functions<br/>- File Handling<br/>- Validation<br/>- Formatting]
    end
    
    PAGE --> DASHBOARD
    PAGE --> EDITOR
    PAGE --> MODALS
    DASHBOARD --> UI_COMP
    EDITOR --> UI_COMP
    MODALS --> UI_COMP
    
    PAGE --> STATE
    DASHBOARD --> STATE
    EDITOR --> STATE
    MODALS --> STATE
    
    STATE --> HOOKS
    MODALS --> PARSERS
    API_ROUTES --> PARSERS
    PARSERS --> UTILS
```

### Backend Architecture (Node.js/TypeScript)

```mermaid
graph TB
    subgraph "Core Engine"
        RUNNER[runner.ts<br/>- CLI Entry Point<br/>- Suite Orchestration<br/>- Parallel Execution]
        EXECUTOR[executor.ts<br/>- Test Execution<br/>- API Calls<br/>- Assertions<br/>- Response Capture]
        PREPROC[preProcessor.ts<br/>- Faker Functions<br/>- Database Queries<br/>- Custom Logic<br/>- Variable Injection]
    end
    
    subgraph "Reporting"
        REPORTER[reporter.ts<br/>- JSON Reports<br/>- Test Statistics]
        HTML_REPORTER[htmlReporter.ts<br/>- Beautiful HTML Reports<br/>- Response Details<br/>- Export Functionality]
        GENERATE_HTML[generateHtmlReport.ts<br/>- Report Generation<br/>- Template Processing]
    end
    
    subgraph "Parsers & Utilities"
        CURL_PARSER[curlParser.ts<br/>- cURL Command Parsing<br/>- Header Extraction<br/>- URL Processing]
        SWAGGER_PARSER[swaggerParser.ts<br/>- OpenAPI Specification<br/>- Test Case Generation<br/>- Schema Validation]
        POSTMAN_PARSER[postmanParser.ts<br/>- Collection v2.1<br/>- Variables & Scripts<br/>- Folder Structure]
        BRUNO_PARSER[brunoParser.ts<br/>- .bru File Parsing<br/>- Environment Variables<br/>- Request Conversion]
    end
    
    subgraph "Database Integration"
        DB_UTILS[db/index.ts<br/>- MySQL Connection<br/>- ODBC Support<br/>- DB2 Integration<br/>- Query Execution]
    end
    
    subgraph "Custom Extensions"
        CUSTOM_STEPS[custom-steps/<br/>- Custom Functions<br/>- Business Logic<br/>- Integration Points]
    end
    
    subgraph "Type Definitions"
        TYPES[types.ts<br/>- TestSuite Interface<br/>- TestCase Interface<br/>- Assertion Types<br/>- Configuration Types]
    end
    
    RUNNER --> EXECUTOR
    RUNNER --> PREPROC
    RUNNER --> REPORTER
    RUNNER --> HTML_REPORTER
    
    EXECUTOR --> DB_UTILS
    EXECUTOR --> CUSTOM_STEPS
    
    PREPROC --> DB_UTILS
    PREPROC --> CUSTOM_STEPS
    
    HTML_REPORTER --> GENERATE_HTML
    
    RUNNER --> TYPES
    EXECUTOR --> TYPES
    PREPROC --> TYPES
    REPORTER --> TYPES
```

## 🚀 Deployment Scenarios

### Scenario 1: Local QA Testing

```mermaid
graph LR
    subgraph "QA Workstation"
        QA[QA Engineer]
        BROWSER[Web Browser<br/>localhost:3000]
        NODE[Node.js Runtime]
        FILES[Local File System<br/>- Test Suites<br/>- Environment Files<br/>- Reports]
    end
    
    subgraph "External Services"
        API[Test APIs<br/>- Development<br/>- QA Environment]
        DB[(Test Database)]
    end
    
    QA --> BROWSER
    BROWSER --> NODE
    NODE --> FILES
    NODE --> API
    NODE --> DB
    
    style QA fill:#e3f2fd
    style BROWSER fill:#f3e5f5
    style NODE fill:#e8f5e8
    style FILES fill:#fff3e0
    style API fill:#fce4ec
    style DB fill:#f1f8e9
```

### Scenario 2: CI/CD Pipeline Integration

```mermaid
graph TB
    subgraph "Source Control"
        REPO[Git Repository<br/>- Test Suites<br/>- Pipeline Config<br/>- Environment Files]
    end
    
    subgraph "CI/CD Platform"
        TRIGGER[Pipeline Trigger<br/>- Push Events<br/>- Scheduled Runs<br/>- Manual Trigger]
        AGENT[Build Agent<br/>- Node.js Runtime<br/>- TestFlow Pro CLI<br/>- Environment Setup]
        PARALLEL[Parallel Execution<br/>- Multiple Test Suites<br/>- Tag-based Filtering<br/>- Resource Optimization]
    end
    
    subgraph "Test Execution"
        CLI_EXEC[CLI Execution<br/>npx ts-node src/runner.ts<br/>--serviceName=@UserService<br/>--suiteType=@regression]
        TEST_RUN[Test Execution<br/>- API Calls<br/>- Database Queries<br/>- Assertions<br/>- Screenshots]
    end
    
    subgraph "Results & Artifacts"
        REPORTS[Test Reports<br/>- JSON Results<br/>- HTML Reports<br/>- Screenshots<br/>- Logs]
        PUBLISH[Publish Results<br/>- Pipeline Dashboard<br/>- Email Notifications<br/>- Slack Integration]
    end
    
    subgraph "Target Environment"
        TARGET_API[Target APIs<br/>- Staging<br/>- Production<br/>- Integration]
        TARGET_DB[(Target Database)]
    end
    
    REPO --> TRIGGER
    TRIGGER --> AGENT
    AGENT --> PARALLEL
    PARALLEL --> CLI_EXEC
    CLI_EXEC --> TEST_RUN
    TEST_RUN --> TARGET_API
    TEST_RUN --> TARGET_DB
    TEST_RUN --> REPORTS
    REPORTS --> PUBLISH
    
    style REPO fill:#e3f2fd
    style TRIGGER fill:#f3e5f5
    style AGENT fill:#e8f5e8
    style PARALLEL fill:#fff3e0
    style CLI_EXEC fill:#fce4ec
    style TEST_RUN fill:#f1f8e9
    style REPORTS fill:#e0f2f1
    style PUBLISH fill:#fef7e0
    style TARGET_API fill:#fce4ec
    style TARGET_DB fill:#f1f8e9
```

## 📋 Technology Stack

### Frontend Stack
- **Framework**: React 18 with Next.js 14
- **Styling**: Tailwind CSS with custom slate theme
- **Components**: Radix UI primitives
- **State Management**: React hooks and context
- **Build Tool**: Next.js with TypeScript

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Testing Engine**: Custom test executor
- **Database**: MySQL, ODBC, DB2 support
- **Browser Automation**: Playwright integration
- **Reporting**: Custom HTML/JSON reporters

### DevOps & CI/CD
- **Version Control**: Git (GitHub, Azure DevOps)
- **CI/CD Platforms**: Azure Pipelines, GitHub Actions, Jenkins
- **Package Management**: npm with package-lock.json
- **Environment Management**: .env files with multi-environment support

### External Integrations
- **API Testing**: REST, SOAP, GraphQL support
- **Import Formats**: cURL, Swagger/OpenAPI, Postman v2.1, Bruno collections
- **Database Connectivity**: MySQL, ODBC, DB2 drivers
- **Reporting**: HTML export with professional styling

This architecture provides a comprehensive view of TestFlow Pro's structure, supporting both local development workflows and enterprise CI/CD pipeline integration.