# GitHub Copilot Instructions for TestFlowPro

## Project Context
TestFlowPro is an advanced test automation platform for API and UI testing with AI capabilities. The project uses Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Development Guidelines

### Code Standards
- **Always use TypeScript** with strict mode enabled
- Follow **React 19 best practices** and use functional components with hooks
- Use **Tailwind CSS** for all styling (no inline styles or CSS modules)
- Ensure all components are **accessible** (keyboard navigation, ARIA labels)
- Design components to be **responsive** (mobile, tablet, desktop)
- Support **dark mode** using Tailwind's dark: prefix

### Component Structure
- Place UI components in `components/ui/` folder
- Place feature components in `components/` folder
- Use shadcn/ui component patterns
- Export components as named exports
- Include proper TypeScript interfaces for props

### Code Patterns
```typescript
// Prefer functional components with hooks
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue)
  
  // Use useEffect for side effects
  useEffect(() => {
    // Effect logic
  }, [dependencies])
  
  return (
    <div className="tailwind-classes">
      {/* Component JSX */}
    </div>
  )
}
```

### File Naming Conventions
- Components: `kebab-case.tsx` (e.g., `command-palette.tsx`)
- Hooks: `use-kebab-case.tsx` (e.g., `use-keyboard-shortcuts.tsx`)
- Utilities: `kebab-case.ts` (e.g., `toast-helpers.tsx`)
- Types: Place in `types/` folder or inline with components

### State Management
- Use React hooks (useState, useEffect, useCallback, useMemo)
- Keep state as close to where it's used as possible
- Use custom hooks to share stateful logic
- Avoid prop drilling - use context or composition

### API Routes
- Place in `app/api/` folder following Next.js conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return NextResponse with proper status codes
- Include error handling with try/catch
- Validate input data

### Testing Approach
- Write tests for critical business logic
- Test user interactions and edge cases
- Use React Testing Library patterns
- Mock external dependencies

## Important Rules

### Documentation Policy ⚠️
**CRITICAL: DO NOT create markdown documentation files automatically**

- ❌ **NEVER** create `.md` files after implementing features
- ❌ **NEVER** create `*-COMPLETE.md`, `*-FIX.md`, or summary documents
- ❌ **NEVER** create documentation unless explicitly requested
- ✅ **ONLY** create documentation when user specifically asks: "please create documentation"
- ✅ **FOCUS** on implementing features and fixing issues
- ✅ **WAIT** for explicit user request before creating any documentation

### Code Generation Priorities
1. **Fix the issue** - Focus on solving the problem
2. **Write the code** - Implement the solution
3. **Test it works** - Verify compilation and functionality
4. **Stop there** - Do not create documentation unless asked

### When to Create Documentation
Only create documentation files when user explicitly says:
- "please create documentation"
- "generate docs for this"
- "write documentation"
- "create a readme"

Otherwise, skip documentation and focus on code!

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **API Routes**: Next.js API Routes
- **File System**: Node.js fs/promises
- **AI Integration**: Ollama, GitHub Copilot API

### Development Tools
- **Package Manager**: npm
- **Linting**: Next.js built-in ESLint
- **Type Checking**: TypeScript compiler

## Common Patterns

### Enhanced Toast Notifications
```typescript
import { useEnhancedToast } from '@/lib/toast-helpers'

const toast = useEnhancedToast()
toast.success('Success!', 'Description')
toast.error('Error!', 'Description')
toast.info('Info', 'Description')
```

### Keyboard Shortcuts
```typescript
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

useKeyboardShortcuts([
  {
    key: 'k',
    ctrl: true,
    description: 'Open command palette',
    action: () => setOpen(true)
  }
])
```

### Loading States
```typescript
import { DashboardSkeleton } from '@/components/ui/skeletons'

{isLoading ? <DashboardSkeleton /> : <Content />}
```

### Empty States
```typescript
import { NoTestSuitesEmptyState } from '@/components/ui/empty-states'

{items.length === 0 && (
  <NoTestSuitesEmptyState
    onCreateSuite={handleCreate}
    onImport={handleImport}
    onAIGenerate={handleAI}
  />
)}
```

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use proper focus management
- Support Tab, Enter, Escape, Arrow keys
- Provide keyboard shortcuts for common actions

### ARIA Labels
- Add aria-label for icon-only buttons
- Use aria-describedby for additional context
- Include role attributes where appropriate
- Ensure screen reader compatibility

### Visual Design
- Maintain color contrast ratio ≥ 4.5:1
- Support dark mode
- Provide visual focus indicators
- Use semantic HTML elements

## Error Handling

### Client-Side
```typescript
try {
  const result = await apiCall()
  toast.success('Success!')
} catch (error) {
  toast.error('Error', error.message)
  console.error('Error details:', error)
}
```

### API Routes
```typescript
export async function GET(request: Request) {
  try {
    // API logic
    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    )
  }
}
```

## Performance Considerations

- Use React.memo for expensive components
- Implement virtual scrolling for large lists (react-window)
- Lazy load routes and heavy components
- Optimize images and assets
- Minimize bundle size

## Project-Specific Conventions

### Test Suite Structure
- Test suites are stored as JSON files
- Each suite has testCases array with test data
- Support both API and UI test types
- Use tags for categorization

### AI Integration
- Support multiple AI providers (Ollama, GitHub Copilot)
- Use custom event system for opening AI chat
- Event: `'open-ai-chat'` to trigger AI modal

### Import System
- Support multiple import formats (Postman, Swagger, cURL, Bruno, Playwright)
- Use dedicated modal for each import type
- Validate imported data before saving

## Remember

🎯 **Focus on implementation, not documentation**
⚡ **Write code first, document only when asked**
✅ **Build features, fix issues, solve problems**
❌ **Do not auto-generate markdown files**

When in doubt, implement the feature and wait for user to request documentation!

