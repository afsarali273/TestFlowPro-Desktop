import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { BookOpen, TrendingUp, Clock, Cpu } from 'lucide-react'
import { LearningEntry } from '../types'

interface LearningTabProps {
  learningEntries: LearningEntry[]
  totalTokensUsed: number
  successRate: number
}

export function LearningTab({
  learningEntries,
  totalTokensUsed,
  successRate
}: LearningTabProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Stats Cards */}
      <div className="col-span-3 grid grid-cols-3 gap-4">
        <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{learningEntries.length}</div>
              <div className="text-sm text-white/60">Learning Entries</div>
            </div>
          </div>
        </div>

        <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <Cpu className="h-10 w-10 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{totalTokensUsed.toLocaleString()}</div>
              <div className="text-sm text-white/60">Tokens Used</div>
            </div>
          </div>
        </div>

        <div className="border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{successRate}%</div>
              <div className="text-sm text-white/60">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Entries List */}
      <div className="col-span-3 border border-white/10 rounded-xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Learning Journal
        </h3>

        {learningEntries.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {learningEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-white/10 rounded-lg p-4 bg-slate-900/50 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-blue-500/20 text-blue-100">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Badge>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {entry.executionTime}s
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Cpu className="h-3 w-3 mr-1" />
                        {entry.tokensUsed} tokens
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {entry.whatWorked.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-green-400 mb-1">✅ What Worked</div>
                        <ul className="text-sm text-white/70 space-y-1">
                          {entry.whatWorked.map((item, idx) => (
                            <li key={idx} className="ml-4">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.whatFailed.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-red-400 mb-1">❌ What Failed</div>
                        <ul className="text-sm text-white/70 space-y-1">
                          {entry.whatFailed.map((item, idx) => (
                            <li key={idx} className="ml-4">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.insights && (
                      <div>
                        <div className="text-xs font-semibold text-blue-400 mb-1">💡 Insights</div>
                        <p className="text-sm text-white/70 italic">{entry.insights}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/60 mb-2">No learning entries yet</p>
              <p className="text-sm text-white/40">Execute plans to build your learning journal</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

