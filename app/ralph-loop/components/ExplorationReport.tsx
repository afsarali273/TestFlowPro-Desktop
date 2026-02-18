import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { FileText, ArrowUp, CheckCircle2 } from 'lucide-react'
import { Plan } from '../types'

interface ExplorationReportProps {
  plan: Plan
}

export function ExplorationReport({ plan }: ExplorationReportProps) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    setShowScrollTop(target.scrollTop > 300)
  }

  const scrollToTop = () => {
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
    viewport?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const highCount = plan.discoveredScenarios?.filter(s => s.priority === 'high').length || 0
  const mediumCount = plan.discoveredScenarios?.filter(s => s.priority === 'medium').length || 0
  const lowCount = plan.discoveredScenarios?.filter(s => s.priority === 'low').length || 0

  return (
    <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-cyan-50 to-blue-50 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FileText className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Exploration Summary</h3>
              <p className="text-sm text-slate-600">{plan.explorationUrl}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700">
                🔴 {highCount} High
              </div>
            )}
            {mediumCount > 0 && (
              <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-700">
                🟡 {mediumCount} Medium
              </div>
            )}
            {lowCount > 0 && (
              <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                🟢 {lowCount} Low
              </div>
            )}
            <div className="px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-medium text-cyan-700">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              {plan.discoveredScenarios?.length || 0} Scenarios
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[700px] bg-white" onScrollCapture={handleScroll}>
        <div className="p-8">
          <style dangerouslySetInnerHTML={{
            __html: `
              .exploration-prose details {
                border: 2px solid rgb(203 213 225);
                border-radius: 0.75rem;
                padding: 1rem;
                margin: 2rem 0;
                background: rgb(248 250 252);
                transition: all 0.3s ease;
              }
              .exploration-prose details:hover {
                border-color: rgb(14 165 233);
                box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.1);
              }
              .exploration-prose details[open] {
                border-color: rgb(6 182 212);
                background: rgb(236 254 255);
              }
              .exploration-prose summary {
                cursor: pointer;
                font-weight: 600;
                color: rgb(6 182 212);
                padding: 0.5rem;
                margin: -0.5rem;
                border-radius: 0.5rem;
                list-style: none;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
              }
              .exploration-prose summary::-webkit-details-marker {
                display: none;
              }
              .exploration-prose summary::before {
                content: '▶';
                display: inline-block;
                transition: transform 0.3s ease;
                color: rgb(6 182 212);
                font-size: 0.875rem;
              }
              .exploration-prose details[open] summary::before {
                transform: rotate(90deg);
              }
              .exploration-prose summary:hover {
                background: rgb(224 242 254);
                color: rgb(8 145 178);
              }
              .exploration-prose summary strong {
                color: inherit;
              }
            `
          }} />

          <div className="exploration-prose max-w-5xl mx-auto prose prose-lg prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h1:mb-8 prose-h1:border-b-2 prose-h1:border-cyan-300 prose-h1:pb-4 prose-h1:text-cyan-700 prose-h1:font-extrabold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-cyan-600 prose-h2:font-bold prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-cyan-600 prose-h3:font-bold prose-h4:text-xl prose-h4:mt-8 prose-h4:mb-3 prose-h4:text-slate-800 prose-h4:font-semibold prose-h5:text-lg prose-h5:mt-6 prose-h5:mb-2 prose-h5:text-slate-700 prose-h5:font-semibold prose-h6:text-base prose-h6:mt-4 prose-h6:mb-2 prose-h6:text-slate-600 prose-h6:font-medium prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-3 prose-p:text-base prose-a:text-cyan-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:text-cyan-700 hover:prose-a:underline prose-a:transition-colors prose-strong:text-slate-900 prose-strong:font-bold prose-em:text-slate-600 prose-em:italic prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-2.5 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:border prose-code:border-pink-200 prose-code:font-semibold prose-pre:bg-slate-50 prose-pre:border-2 prose-pre:border-slate-200 prose-pre:rounded-xl prose-pre:p-6 prose-pre:text-slate-800 prose-pre:shadow-inner prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-700 prose-ol:my-5 prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-700 prose-li:text-slate-700 prose-li:my-2.5 prose-li:leading-relaxed prose-li:text-base prose-li::marker:text-cyan-600 prose-li::marker:font-bold prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-4 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-slate-700 prose-blockquote:bg-cyan-50 prose-blockquote:rounded-r-lg prose-blockquote:shadow-sm prose-table:w-full prose-table:border-collapse prose-table:my-10 prose-table:overflow-hidden prose-table:rounded-xl prose-table:border-2 prose-table:border-slate-300 prose-table:shadow-lg prose-thead:bg-gradient-to-r prose-thead:from-cyan-100 prose-thead:to-blue-100 prose-th:bg-transparent prose-th:border-b-2 prose-th:border-r prose-th:border-slate-300 prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:text-cyan-900 prose-th:text-base prose-th:last:border-r-0 prose-tr:border-b prose-tr:border-slate-200 prose-tr:transition-colors hover:prose-tr:bg-slate-50 prose-tbody:bg-white prose-tbody:divide-y prose-tbody:divide-slate-200 prose-td:border-r prose-td:border-slate-200 prose-td:p-4 prose-td:text-slate-700 prose-td:text-base prose-td:last:border-r-0 prose-hr:border-0 prose-hr:h-0.5 prose-hr:bg-gradient-to-r prose-hr:from-transparent prose-hr:via-slate-400 prose-hr:to-transparent prose-hr:my-12 prose-img:rounded-xl prose-img:border-2 prose-img:border-slate-300 prose-img:shadow-xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {plan.explorationSummary}
            </ReactMarkdown>
          </div>
        </div>
      </ScrollArea>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </Card>
  )
}
