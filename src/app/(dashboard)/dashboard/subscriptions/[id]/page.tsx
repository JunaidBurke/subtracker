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
import type {
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

export default function SubscriptionDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchSub = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/subscriptions/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data: Subscription = await res.json()
      setSub(data)
    } catch {
      setSub(null)
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
      const res = await fetch(`/api/subscriptions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update')
      setEditing(false)
      await fetchSub()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/subscriptions/${params.id}`, {
      method: 'DELETE',
    })
    if (res.ok) router.push('/subscriptions')
  }

  if (loading) return <DetailSkeleton />
  if (!sub) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50">Subscription not found.</p>
        <GlassButton variant="ghost" onClick={() => router.push('/subscriptions')} className="mt-4">
          Back to list
        </GlassButton>
      </div>
    )
  }

  const priceHistory: PriceHistory[] = [
    { id: '1', subscription_id: sub.id, amount: sub.amount, recorded_at: sub.start_date },
    { id: '2', subscription_id: sub.id, amount: sub.amount, recorded_at: sub.next_renewal },
  ]

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/subscriptions')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Subscriptions
      </button>

      {editing ? (
        <GlassPanel>
          <h2 className="text-xl font-semibold text-white mb-4">Edit Subscription</h2>
          <SubscriptionForm
            mode="edit"
            initialData={sub}
            onSubmit={(data) => handleUpdate(data as unknown as Record<string, unknown>)}
            onCancel={() => setEditing(false)}
            loading={saving}
          />
        </GlassPanel>
      ) : (
        <DetailView
          sub={sub}
          onEdit={() => setEditing(true)}
          onDelete={handleDelete}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
        />
      )}

      <PriceHistoryChart data={priceHistory} />

      <GlassCard hover={false}>
        <div className="flex items-center gap-3 mb-3">
          <Brain className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Related AI Insights</h3>
        </div>
        <p className="text-white/40 text-sm">
          No insights for this subscription yet.
        </p>
      </GlassCard>
    </div>
  )
}

function DetailView({
  sub, onEdit, onDelete, confirmDelete, setConfirmDelete,
}: {
  sub: Subscription
  onEdit: () => void
  onDelete: () => void
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
}) {
  return (
    <GlassPanel>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{sub.name}</h1>
          <p className="text-white/50 text-sm mt-1 capitalize">{sub.category}</p>
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <DetailField label="Amount" value={formatCurrency(sub.amount, sub.currency)} />
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
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-white/50 mb-1">Notes</p>
          <p className="text-white/80 text-sm">{sub.notes}</p>
        </div>
      )}
    </GlassPanel>
  )
}

function DetailField({
  label, value, children,
}: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      {children ?? <p className="text-white font-medium capitalize">{value}</p>}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <GlassPanel>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-white/10" />
              <div className="h-5 w-24 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}
