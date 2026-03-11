'use client'

import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { GlassCard } from '@/components/glass/glass-card'
import { GlassBadge } from '@/components/glass/glass-badge'
import type { Subscription, SubscriptionStatus, BillingCycle } from '@/types'

const statusVariant: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'danger',
  trial: 'info',
}

const cycleLabel: Record<BillingCycle, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const categoryColors: Record<string, string> = {
  streaming: 'bg-[#a3816a]',
  music: 'bg-[#7a9ab5]',
  productivity: 'bg-[#c9a96e]',
  cloud: 'bg-[#7a8a6e]',
  gaming: 'bg-[#6b8a7a]',
  fitness: 'bg-[#d4a574]',
  news: 'bg-[#8b7a6e]',
  other: 'bg-[#9a8a7a]',
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface SubscriptionCardProps {
  subscription: Subscription
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const router = useRouter()
  const bgColor = categoryColors[subscription.category.toLowerCase()] ?? 'bg-[#9a8a7a]'
  const firstLetter = subscription.name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/subscriptions/${subscription.id}`)}
      className="w-full text-left min-h-[44px] cursor-pointer"
    >
      <GlassCard hover>
        <div className="flex items-center gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-surface-base font-semibold text-lg ${bgColor}`}
          >
            {firstLetter}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary font-medium truncate">
              {subscription.name}
            </h3>
            <p className="font-display text-2xl text-accent mt-1">
              {formatCurrency(subscription.amount, subscription.currency)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <GlassBadge variant={statusVariant[subscription.status]}>
              {subscription.status}
            </GlassBadge>
            <GlassBadge>{cycleLabel[subscription.billing_cycle]}</GlassBadge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-sm text-text-tertiary">
          <Calendar className="h-3.5 w-3.5" />
          <span>Renews {formatDate(subscription.next_renewal)}</span>
        </div>
      </GlassCard>
    </button>
  )
}
