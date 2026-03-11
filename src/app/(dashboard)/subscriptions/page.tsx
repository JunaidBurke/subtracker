'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { GlassButton } from '@/components/glass/glass-button'
import { GlassCard } from '@/components/glass/glass-card'
import { SubscriptionCard } from '@/components/subscriptions/subscription-card'
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal'
import type { SubscriptionStatus } from '@/types'

const statusFilters: Array<{ label: string; value: SubscriptionStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Trial', value: 'trial' },
  { label: 'Cancelled', value: 'cancelled' },
]

const categoryFilters = [
  'All', 'Streaming', 'Music', 'Productivity',
  'Cloud', 'Gaming', 'Fitness', 'News', 'Other',
]

export default function SubscriptionsPage() {
  const { subscriptions, loading, error, refetch } = useSubscriptions()
  const [modalOpen, setModalOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filtered = subscriptions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false
    if (categoryFilter !== 'All' && sub.category.toLowerCase() !== categoryFilter.toLowerCase())
      return false
    return true
  })

  async function handleCreate(data: Record<string, unknown>) {
    try {
      setSubmitLoading(true)
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create subscription')
      setModalOpen(false)
      await refetch()
    } catch {
      // Error state could be enhanced later
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </GlassButton>
      </div>

      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      {error && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between py-2">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
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
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={submitLoading}
      />
    </div>
  )
}

function FilterBar({
  statusFilter, onStatusChange, categoryFilter, onCategoryChange,
}: {
  statusFilter: SubscriptionStatus | 'all'
  onStatusChange: (v: SubscriptionStatus | 'all') => void
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
              'min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all',
              statusFilter === f.value
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-white/50 hover:text-white/80 border border-transparent',
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
              'min-h-[44px] px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              categoryFilter === c
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent',
            ].join(' ')}
          >
            {c}
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
              <div className="h-11 w-11 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="h-6 w-16 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-3 w-32 rounded bg-white/10" />
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <GlassCard hover={false}>
      <p className="text-center text-white/50 py-12">
        No subscriptions yet. Add your first one!
      </p>
    </GlassCard>
  )
}
