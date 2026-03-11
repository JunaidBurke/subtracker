'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Brain } from 'lucide-react'
import { GlassPanel } from '@/components/glass/glass-panel'
import { GlassCard } from '@/components/glass/glass-card'
import { GlassButton } from '@/components/glass/glass-button'
import { GlassBadge } from '@/components/glass/glass-badge'
import { SubscriptionForm } from '@/components/subscriptions/subscription-form'
import { PriceHistoryChart } from '@/components/charts/price-history-chart'
import { InsightCard } from '@/components/insights/insight-card'
import type {
  AIInsight,
  Subscription,
  PriceHistory,
  SubscriptionStatus,
} from '@/types'

const statusVariant: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'danger',
  trial: 'info',
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const SUBSCRIPTIONS_ROUTE = '/dashboard/subscriptions'

interface SubscriptionDetailResponse {
  subscription: Subscription
  price_history: PriceHistory[]
  related_insights: AIInsight[]
}

export default function SubscriptionDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [relatedInsights, setRelatedInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchSub = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/subscriptions/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data: SubscriptionDetailResponse = await res.json()
      setSub(data.subscription)
      setPriceHistory(data.price_history)
      setRelatedInsights(data.related_insights)
    } catch {
      setSub(null)
      setPriceHistory([])
      setRelatedInsights([])
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchSub()
  }, [fetchSub])

  async function handleUpdate(data: Record<string, unknown>) {
    try {
      setSaving(true)
      setFormError(null)
      const res = await fetch(`/api/subscriptions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: unknown } | null
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Failed to update subscription')
      }
      setEditing(false)
      await fetchSub()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to update subscription'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setFormError(null)
    const res = await fetch(`/api/subscriptions/${params.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      router.push(SUBSCRIPTIONS_ROUTE)
      return
    }

    setFormError('Failed to remove subscription')
  }

  async function markInsightRead(id: string) {
    const res = await fetch('/api/insights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_read: true }),
    })

    if (!res.ok) return

    setRelatedInsights((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    )
  }

  async function dismissInsight(id: string) {
    const res = await fetch('/api/insights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_dismissed: true }),
    })

    if (!res.ok) return

    setRelatedInsights((current) => current.filter((item) => item.id !== id))
  }

  if (loading) return <DetailSkeleton />
  if (!sub) {
    return (
      <div className="text-center py-20">
        <p className="text-text-tertiary">Subscription not found.</p>
        <GlassButton variant="ghost" onClick={() => router.push(SUBSCRIPTIONS_ROUTE)} className="mt-4">
          Back to list
        </GlassButton>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push(SUBSCRIPTIONS_ROUTE)}
        className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Subscriptions
      </button>

      {editing ? (
        <GlassPanel>
          <h2 className="font-display text-xl text-text-primary mb-4">Edit Subscription</h2>
          <SubscriptionForm
            mode="edit"
            initialData={sub}
            onSubmit={(data) => handleUpdate(data as unknown as Record<string, unknown>)}
            onCancel={() => setEditing(false)}
            loading={saving}
          />
          {formError ? (
            <p className="mt-4 rounded-lg border border-status-danger/20 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
              {formError}
            </p>
          ) : null}
        </GlassPanel>
      ) : (
        <DetailView
          sub={sub}
          onEdit={() => setEditing(true)}
          onDelete={handleDelete}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          error={formError}
        />
      )}

      <PriceHistoryChart data={priceHistory} />

      <GlassCard hover={false}>
        <div className="flex items-center gap-3 mb-3">
          <Brain className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg text-text-primary">Related AI Insights</h3>
        </div>
        {relatedInsights.length === 0 ? (
          <p className="text-text-tertiary text-sm">
            No insights for this subscription yet.
          </p>
        ) : (
          <div className="space-y-3">
            {relatedInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={dismissInsight}
                onMarkRead={markInsightRead}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function DetailView({
  sub, onEdit, onDelete, confirmDelete, setConfirmDelete, error,
}: {
  sub: Subscription
  onEdit: () => void
  onDelete: () => void
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  error: string | null
}) {
  return (
    <GlassPanel>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-text-primary">{sub.name}</h1>
          <p className="text-text-tertiary text-sm mt-1 capitalize">{sub.category}</p>
        </div>
        <div className="flex gap-2">
          <GlassButton size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </GlassButton>
          {confirmDelete ? (
            <div className="flex gap-2">
              <GlassButton size="sm" variant="danger" onClick={onDelete}>
                Confirm
              </GlassButton>
              <GlassButton size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </GlassButton>
            </div>
          ) : (
            <GlassButton size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </GlassButton>
          )}
        </div>
      </div>

      {error ? (
        <p className="mb-6 rounded-lg border border-status-danger/20 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <DetailField label="Amount" value={formatCurrency(sub.amount, sub.currency)} highlight />
        <DetailField label="Status">
          <GlassBadge variant={statusVariant[sub.status]}>{sub.status}</GlassBadge>
        </DetailField>
        <DetailField label="Billing Cycle" value={sub.billing_cycle} />
        <DetailField label="Next Renewal" value={formatDate(sub.next_renewal)} />
        <DetailField label="Start Date" value={formatDate(sub.start_date)} />
        <DetailField label="Auto Renew" value={sub.auto_renew ? 'Yes' : 'No'} />
        {sub.payment_method && (
          <DetailField label="Payment Method" value={sub.payment_method} />
        )}
      </div>

      {sub.notes && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-text-tertiary mb-1">Notes</p>
          <p className="text-text-secondary text-sm">{sub.notes}</p>
        </div>
      )}
    </GlassPanel>
  )
}

function DetailField({
  label, value, children, highlight = false,
}: { label: string; value?: string; children?: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      {children ?? (
        <p className={[
          'font-medium capitalize',
          highlight ? 'text-accent font-display text-lg' : 'text-text-primary',
        ].join(' ')}>
          {value}
        </p>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <GlassPanel>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-surface-subtle" />
        <div className="h-4 w-24 rounded bg-surface-subtle" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-surface-subtle" />
              <div className="h-5 w-24 rounded bg-surface-subtle" />
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}
