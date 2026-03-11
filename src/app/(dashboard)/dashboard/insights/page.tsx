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
  const { insights, loading, error, markRead, dismiss, refetch } = useInsights(activeFilter)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-text-primary">AI Insights</h1>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveFilter(tab.value)}
            className={[
              'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeFilter === tab.value
                ? 'bg-surface-subtle text-text-primary border border-border'
                : 'bg-transparent text-text-tertiary hover:text-text-secondary border border-transparent',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
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
            <div className="h-10 w-10 rounded-lg bg-surface-subtle shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-24 rounded bg-surface-subtle" />
              <div className="h-4 w-48 rounded bg-surface-subtle" />
              <div className="h-3 w-full rounded bg-surface-subtle" />
              <div className="h-3 w-2/3 rounded bg-surface-subtle" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <GlassCard hover={false}>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-4 text-sm text-status-danger">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] rounded-lg border border-border bg-surface-overlay px-6 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-subtle hover:text-text-primary"
        >
          Retry
        </button>
      </div>
    </GlassCard>
  )
}

function EmptyState() {
  return (
    <GlassCard hover={false}>
      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
        <Sparkles className="h-10 w-10 mb-4 opacity-50" />
        <p className="text-sm text-center max-w-xs">
          No insights yet. AI will analyze your subscriptions and provide
          recommendations here.
        </p>
      </div>
    </GlassCard>
  )
}
