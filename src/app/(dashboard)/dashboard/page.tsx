'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, Sparkles } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { GlassCard } from '@/components/glass'
import { SpendDonut } from '@/components/charts/spend-donut'
import { MonthlyTrend } from '@/components/charts/monthly-trend'
import { AIWorkbench } from '@/components/ai/ai-workbench'
import { InsightCard } from '@/components/insights/insight-card'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { useInsights } from '@/hooks/use-insights'
import {
  totalMonthlySpend,
  calculateMonthlyAmount,
} from '@/lib/utils/spend'
import type { Subscription } from '@/types'

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-border bg-surface-raised p-6 ${className}`}
    >
      <div className="mb-3 h-4 w-24 rounded bg-surface-subtle" />
      <div className="h-8 w-32 rounded bg-surface-subtle" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard className="max-w-md text-center" hover={false}>
        <div className="mb-4 font-display text-4xl text-accent">+</div>
        <h2 className="mb-2 font-display text-xl text-text-primary">
          No subscriptions yet
        </h2>
        <p className="text-sm text-text-secondary">
          Add your first subscription to see your dashboard come to life.
        </p>
      </GlassCard>
    </div>
  )
}

function SpendCard({ total }: { total: number }) {
  return (
    <GlassCard hover={false} className="col-span-1">
      <p className="mb-1 text-sm text-text-tertiary">Total Monthly Spend</p>
      <motion.p
        className="font-display text-3xl text-text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-accent"
        >
          ${total.toFixed(2)}
        </motion.span>
      </motion.p>
      <div className="mt-3 flex items-center gap-1.5 text-sm text-text-tertiary">
        {total > 0 ? (
          <TrendingUp className="h-4 w-4 text-status-active" />
        ) : (
          <TrendingDown className="h-4 w-4 text-text-muted" />
        )}
        <span>per month</span>
      </div>
    </GlassCard>
  )
}

function NextRenewalCard({
  subscriptions,
}: {
  subscriptions: Subscription[]
}) {
  const nextRenewal = useMemo(() => {
    const now = new Date()
    return subscriptions
      .filter((s) => s.status === 'active')
      .sort(
        (a, b) =>
          parseISO(a.next_renewal).getTime() -
          parseISO(b.next_renewal).getTime()
      )
      .find((s) => parseISO(s.next_renewal) >= now)
  }, [subscriptions])

  if (!nextRenewal) {
    return (
      <GlassCard hover={false}>
        <p className="mb-1 text-sm text-text-tertiary">Next Renewal</p>
        <p className="text-sm text-text-muted">No upcoming renewals</p>
      </GlassCard>
    )
  }

  const daysUntil = differenceInDays(
    parseISO(nextRenewal.next_renewal),
    new Date()
  )

  return (
    <GlassCard hover={false}>
      <p className="mb-1 text-sm text-text-tertiary">Next Renewal</p>
      <p className="text-lg font-medium text-text-primary">{nextRenewal.name}</p>
      <p className="font-display text-2xl text-accent">
        ${calculateMonthlyAmount(nextRenewal).toFixed(2)}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-sm text-text-tertiary">
        <Calendar className="h-4 w-4" />
        <span>
          {daysUntil === 0
            ? 'Today'
            : daysUntil === 1
              ? 'Tomorrow'
              : `In ${daysUntil} days`}
        </span>
      </div>
    </GlassCard>
  )
}

function UpcomingRenewals({
  subscriptions,
}: {
  subscriptions: Subscription[]
}) {
  const upcoming = useMemo(() => {
    const now = new Date()
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return subscriptions
      .filter((s) => {
        if (s.status !== 'active') return false
        const renewal = parseISO(s.next_renewal)
        return renewal >= now && renewal <= sevenDays
      })
      .sort(
        (a, b) =>
          parseISO(a.next_renewal).getTime() -
          parseISO(b.next_renewal).getTime()
      )
  }, [subscriptions])

  return (
    <GlassCard hover={false}>
      <h3 className="mb-4 font-display text-lg text-text-primary">
        Upcoming Renewals
      </h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          No renewals in the next 7 days.
        </p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{sub.name}</p>
                <p className="text-xs text-text-tertiary">
                  {format(parseISO(sub.next_renewal), 'MMM d')}
                </p>
              </div>
              <p className="text-sm font-semibold text-accent">
                ${sub.amount.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}

function AIInsightsPreview() {
  const { insights, loading, markRead, dismiss } = useInsights(undefined, 2)

  return (
    <GlassCard glow hover={false}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg text-text-primary">AI Insights</h3>
      </div>
      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-border bg-surface-overlay"
            />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">
          No insights yet. Add subscriptions to unlock AI-powered
          recommendations.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
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
    </GlassCard>
  )
}

export default function DashboardPage() {
  const { subscriptions, loading, error } = useSubscriptions()

  const total = useMemo(
    () => totalMonthlySpend(subscriptions),
    [subscriptions]
  )

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="md:col-span-1" />
        <SkeletonCard className="md:col-span-1" />
        <SkeletonCard className="md:col-span-2" />
      </div>
    )
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md text-center" hover={false}>
          <p className="mb-4 text-sm text-status-danger">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-lg border border-border bg-surface-overlay px-6 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-subtle hover:text-text-primary"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SpendCard total={total} />
      <NextRenewalCard subscriptions={subscriptions} />
      <SpendDonut subscriptions={subscriptions} />
      <UpcomingRenewals subscriptions={subscriptions} />
      <div className="md:col-span-2">
        <MonthlyTrend subscriptions={subscriptions} />
      </div>
      <div className="md:col-span-2">
        <AIInsightsPreview />
      </div>
      <div className="md:col-span-2">
        <AIWorkbench />
      </div>
    </div>
  )
}
