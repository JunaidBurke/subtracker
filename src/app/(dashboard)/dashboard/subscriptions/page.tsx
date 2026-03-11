'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { GlassButton } from '@/components/glass/glass-button'
import { GlassCard } from '@/components/glass/glass-card'
import { SubscriptionCard } from '@/components/subscriptions/subscription-card'
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal'
import { DEFAULT_CATEGORY_OPTIONS } from '@/lib/constants/subscriptions'
import type { SubscriptionStatus } from '@/types'

const statusFilters: Array<{ label: string; value: SubscriptionStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Trial', value: 'trial' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function SubscriptionsPage() {
  const { subscriptions, loading, error, refetch } = useSubscriptions()
  const [modalOpen, setModalOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categoryFilters = useMemo(() => {
    const configured = DEFAULT_CATEGORY_OPTIONS.map((category) => category.value)
    const dynamic = subscriptions.map((subscription) => subscription.category.toLowerCase())
    return [
      'All',
      ...new Set([...configured, ...dynamic]),
    ]
  }, [subscriptions])

  const filtered = subscriptions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false
    if (categoryFilter !== 'All' && sub.category.toLowerCase() !== categoryFilter.toLowerCase())
      return false
    return true
  })

  async function handleCreate(data: Record<string, unknown>) {
    try {
      setSubmitLoading(true)
      setSubmitError(null)
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: unknown } | null
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Failed to create subscription')
      }
      setModalOpen(false)
      await refetch()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create subscription'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-text-primary">Subscriptions</h1>
        <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </GlassButton>
      </div>

      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilters={categoryFilters}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      {error && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between py-2">
            <p className="text-status-danger text-sm">{error}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="min-h-[44px] rounded-lg border border-border bg-surface-overlay px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-subtle hover:text-text-primary"
            >
              Retry
            </button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}

      <AddSubscriptionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSubmitError(null)
        }}
        onSubmit={handleCreate}
        loading={submitLoading}
        error={submitError}
      />
    </div>
  )
}

function FilterBar({
  statusFilter, onStatusChange, categoryFilters, categoryFilter, onCategoryChange,
}: {
  statusFilter: SubscriptionStatus | 'all'
  onStatusChange: (v: SubscriptionStatus | 'all') => void
  categoryFilters: string[]
  categoryFilter: string
  onCategoryChange: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onStatusChange(f.value)}
            className={[
              'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all',
              statusFilter === f.value
                ? 'bg-surface-subtle text-text-primary border border-border'
                : 'bg-transparent text-text-tertiary hover:text-text-secondary border border-transparent',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {categoryFilters.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCategoryChange(c)}
            className={[
              'min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              categoryFilter === c
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'bg-transparent text-text-tertiary hover:text-text-secondary border border-transparent',
            ].join(' ')}
          >
            {c === 'All'
              ? c
              : c
                  .split('-')
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} hover={false}>
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-surface-subtle" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-surface-subtle" />
                <div className="h-6 w-16 rounded bg-surface-subtle" />
              </div>
            </div>
            <div className="h-3 w-32 rounded bg-surface-subtle" />
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <GlassCard hover={false}>
      <p className="text-center text-text-tertiary py-12">
        No subscriptions yet. Add your first one!
      </p>
    </GlassCard>
  )
}
