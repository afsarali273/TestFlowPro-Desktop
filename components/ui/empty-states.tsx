import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Upload, Sparkles, Search } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  }>
  image?: string
}

export function EmptyState({ icon, title, description, actions, image }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {image ? (
        <img src={image} alt="" className="w-64 h-64 mb-6 opacity-50" />
      ) : (
        <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          {icon || <FileText className="h-10 w-10 text-slate-400" />}
        </div>
      )}

      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">{description}</p>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// Pre-built empty states
export function NoTestSuitesEmptyState({
  onCreateSuite,
  onImport,
  onAIGenerate
}: {
  onCreateSuite: () => void
  onImport: () => void
  onAIGenerate: () => void
}) {
  return (
    <EmptyState
      icon={<FileText className="h-10 w-10 text-slate-400" />}
      title="No test suites yet"
      description="Get started by creating your first test suite, importing from existing tools, or using AI to generate tests."
      actions={[
        {
          label: 'Create Suite',
          icon: <Plus className="h-4 w-4 mr-2" />,
          onClick: onCreateSuite,
          variant: 'default'
        },
        {
          label: 'Import',
          icon: <Upload className="h-4 w-4 mr-2" />,
          onClick: onImport,
          variant: 'outline'
        },
        {
          label: 'AI Generate',
          icon: <Sparkles className="h-4 w-4 mr-2" />,
          onClick: onAIGenerate,
          variant: 'outline'
        }
      ]}
    />
  )
}

export function NoTestSuitesFound({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-10 w-10 text-slate-400" />}
      title="No test suites found"
      description="Try adjusting your search or filters to find what you're looking for."
      actions={[
        {
          label: 'Clear Filters',
          onClick: onClearFilters,
          variant: 'outline'
        }
      ]}
    />
  )
}

export function NoResultsYet() {
  return (
    <EmptyState
      icon={<FileText className="h-10 w-10 text-slate-400" />}
      title="No test results yet"
      description="Run your test suites to see results and analytics here."
    />
  )
}

