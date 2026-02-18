import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Sparkles, FileText, Compass, Zap, Clock } from 'lucide-react'

interface PlanModeSelectorProps {
  planMode: 'manual' | 'exploratory'
  setPlanMode: (mode: 'manual' | 'exploratory') => void
  requirementsInput: string
  setRequirementsInput: (value: string) => void
  explorationUrl: string
  setExplorationUrl: (value: string) => void
  explorationContext: string
  setExplorationContext: (value: string) => void
  isGeneratingPlan: boolean
  isExploring: boolean
  onGeneratePlan: () => void
  onExploreAndGenerate: (url: string, context?: string) => void
}

export function PlanModeSelector({
  planMode,
  setPlanMode,
  requirementsInput,
  setRequirementsInput,
  explorationUrl,
  setExplorationUrl,
  explorationContext,
  setExplorationContext,
  isGeneratingPlan,
  isExploring,
  onGeneratePlan,
  onExploreAndGenerate
}: PlanModeSelectorProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-white/10 backdrop-blur-xl shadow-2xl">
      <div className="flex gap-4 mb-6">
        <Button
          variant={planMode === 'manual' ? 'default' : 'outline'}
          onClick={() => setPlanMode('manual')}
          className={planMode === 'manual'
            ? 'flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/50'
            : 'flex-1 border-white/20 hover:bg-white/5'}
        >
          <FileText className="h-4 w-4 mr-2" />
          Manual Plan
        </Button>
        <Button
          variant={planMode === 'exploratory' ? 'default' : 'outline'}
          onClick={() => setPlanMode('exploratory')}
          className={planMode === 'exploratory'
            ? 'flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/50'
            : 'flex-1 border-white/20 hover:bg-white/5'}
        >
          <Compass className="h-4 w-4 mr-2" />
          Exploratory Test
        </Button>
      </div>

      {planMode === 'manual' ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Define Your Requirements
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Describe step-by-step what you want to test or automate
            </p>
          </div>

          <Textarea
            placeholder="Example:
1. Open https://example.com
2. Click on login button
3. Enter credentials
4. Verify dashboard loads"
            value={requirementsInput}
            onChange={(e) => setRequirementsInput(e.target.value)}
            className="min-h-[200px] bg-slate-700/50 border-white/10 text-white placeholder-white/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg"
            disabled={isGeneratingPlan}
          />

          <Button
            onClick={onGeneratePlan}
            disabled={isGeneratingPlan || !requirementsInput.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
            size="lg"
          >
            {isGeneratingPlan ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate Plan with AI
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-400" />
              Exploratory Testing
            </h3>
            <p className="text-sm text-white/60 mb-4">
              AI will explore the website and discover test scenarios for you
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">Website URL *</label>
              <Input
                placeholder="https://example.com"
                value={explorationUrl}
                onChange={(e) => setExplorationUrl(e.target.value)}
                className="bg-slate-700/50 border-white/10 text-white placeholder-white/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                disabled={isExploring}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Exploration Context (Optional)
              </label>
              <Textarea
                placeholder="e.g., Focus on checkout flow, Test admin dashboard features, Explore after login..."
                value={explorationContext}
                onChange={(e) => setExplorationContext(e.target.value)}
                className="min-h-[100px] bg-slate-700/50 border-white/10 text-white placeholder-white/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                disabled={isExploring}
              />
            </div>
          </div>

          <Button
            onClick={() => onExploreAndGenerate(explorationUrl, explorationContext)}
            disabled={isExploring || !explorationUrl.trim()}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
            size="lg"
          >
            {isExploring ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Exploring Website...
              </>
            ) : (
              <>
                <Compass className="h-5 w-5 mr-2" />
                Explore & Generate Scenarios
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}

