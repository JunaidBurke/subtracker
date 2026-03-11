'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useInsights } from '@/hooks/use-insights'
import { GlassCard } from '@/components/glass/glass-card'
import { InsightCard } from '@/components/insights/insight-card'
import type { InsightType } from '@/types'

const filterTabs: Array<{ label: string; value: InsightType | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Optimizations', value: 'optimization' },
  { label: 'Forecasts', value: 'forecast' },
  { label: 'Alerts', value: 'alert' },
]

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState<InsightType | undefined>(undefined)
  const { insights, loading, markRead, dismiss } = useInsights(activeFilter)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">AI Insights</h1>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveFilter(tab.value)}
            className={[
              'min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeFilter === tab.value
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-white/50 hover:text-white/80 border border-transparent',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards />
      ) : insights.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={dismiss}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard key={i} hover={false}>
          <div className="animate-pulse flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-24 rounded bg-white/10" />
              <div className="h-4 w-48 rounded bg-white/10" />
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-2/3 rounded bg-white/10" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <GlassCard hover={false}>
      <div className="flex flex-col items-center justify-center py-12 text-white/40">
        <Sparkles className="h-10 w-10 mb-4 opacity-50" />
        <p className="text-sm text-center max-w-xs">
          No insights yet. AI will analyze your subscriptions and provide
          recommendations here.
        </p>
      </div>
    </GlassCard>
  )
}
