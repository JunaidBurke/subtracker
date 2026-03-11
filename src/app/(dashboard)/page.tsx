'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, Sparkles } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { GlassCard } from '@/components/glass'
import { SpendDonut } from '@/components/charts/spend-donut'
import { MonthlyTrend } from '@/components/charts/monthly-trend'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import {
  totalMonthlySpend,
  calculateMonthlyAmount,
} from '@/lib/utils/spend'
import type { Subscription } from '@/types'

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}
    >
      <div className="mb-3 h-4 w-24 rounded bg-white/10" />
      <div className="h-8 w-32 rounded bg-white/10" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassCard className="max-w-md text-center" hover={false}>
        <div className="mb-4 text-4xl">+</div>
        <h2 className="mb-2 text-xl font-semibold text-white">
          No subscriptions yet
        </h2>
        <p className="text-sm text-white/60">
          Add your first subscription to see your dashboard come to life.
        </p>
      </GlassCard>
    </div>
  )
}

function SpendCard({ total }: { total: number }) {
  return (
    <GlassCard hover={false} className="col-span-1">
      <p className="mb-1 text-sm text-white/60">Total Monthly Spend</p>
      <motion.p
        className="text-3xl font-bold text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          ${total.toFixed(2)}
        </motion.span>
      </motion.p>
      <div className="mt-2 flex items-center gap-1 text-sm text-white/50">
        {total > 0 ? (
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-white/30" />
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
        <p className="mb-1 text-sm text-white/60">Next Renewal</p>
        <p className="text-sm text-white/40">No upcoming renewals</p>
      </GlassCard>
    )
  }

  const daysUntil = differenceInDays(
    parseISO(nextRenewal.next_renewal),
    new Date()
  )

  return (
    <GlassCard hover={false}>
      <p className="mb-1 text-sm text-white/60">Next Renewal</p>
      <p className="text-lg font-semibold text-white">{nextRenewal.name}</p>
      <p className="text-2xl font-bold text-white">
        ${calculateMonthlyAmount(nextRenewal).toFixed(2)}
      </p>
      <div className="mt-2 flex items-center gap-1 text-sm text-white/50">
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
      <h3 className="mb-4 text-lg font-semibold text-white">
        Upcoming Renewals
      </h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-white/50">
          No renewals in the next 7 days.
        </p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-white">{sub.name}</p>
                <p className="text-xs text-white/50">
                  {format(parseISO(sub.next_renewal), 'MMM d')}
                </p>
              </div>
              <p className="text-sm font-semibold text-white">
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
  return (
    <GlassCard glow hover={false}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI Insights</h3>
      </div>
      <p className="mt-2 text-sm text-white/50">
        No insights yet. Add subscriptions to unlock AI-powered
        recommendations.
      </p>
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
    return <EmptyState />
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
    </div>
  )
}
