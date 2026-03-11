'use client'

import { useState, useCallback } from 'react'
import { GlassInput } from '@/components/glass/glass-input'
import { GlassButton } from '@/components/glass/glass-button'
import { SmartEntry } from '@/components/subscriptions/smart-entry'
import { DEFAULT_CATEGORY_OPTIONS } from '@/lib/constants/subscriptions'
import type { Subscription, BillingCycle, SubscriptionStatus } from '@/types'

interface SubscriptionFormData {
  name: string
  category: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_renewal: string
  start_date: string
  status: SubscriptionStatus
  notes: string
  payment_method: string
  auto_renew: boolean
}

interface SubscriptionFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Subscription>
  onSubmit: (data: SubscriptionFormData) => void
  onCancel: () => void
  loading?: boolean
}

const selectClasses = [
  'w-full rounded-lg px-4 py-3',
  'bg-surface-overlay border border-border text-text-primary',
  'transition-all duration-200 outline-none',
  'focus:border-accent/40 focus:ring-1 focus:ring-accent/30',
].join(' ')

export function SubscriptionForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: SubscriptionFormProps) {
  const [tab, setTab] = useState<'manual' | 'smart'>('manual')
  const [form, setForm] = useState<SubscriptionFormData>({
    name: initialData?.name ?? '',
    category: initialData?.category ?? 'other',
    amount: initialData?.amount ?? 0,
    currency: initialData?.currency ?? 'USD',
    billing_cycle: initialData?.billing_cycle ?? 'monthly',
    next_renewal: initialData?.next_renewal ?? '',
    start_date: initialData?.start_date ?? '',
    status: initialData?.status ?? 'active',
    notes: initialData?.notes ?? '',
    payment_method: initialData?.payment_method ?? '',
    auto_renew: initialData?.auto_renew ?? true,
  })

  function update<K extends keyof SubscriptionFormData>(
    key: K,
    value: SubscriptionFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleParsed = useCallback((data: {
    name: string | null
    amount: number | null
    currency: string | null
    billing_cycle: BillingCycle | null
    category: string | null
    next_renewal: string | null
  }) => {
    setForm((prev) => ({
      ...prev,
      name: data.name ?? prev.name,
      amount: data.amount ?? prev.amount,
      currency: data.currency ?? prev.currency,
      billing_cycle: data.billing_cycle ?? prev.billing_cycle,
      category: data.category ?? prev.category,
      next_renewal: data.next_renewal ?? prev.next_renewal,
    }))
    setTab('manual')
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2 mb-4">
        <TabButton active={tab === 'manual'} onClick={() => setTab('manual')}>
          Manual Entry
        </TabButton>
        <TabButton active={tab === 'smart'} onClick={() => setTab('smart')}>
          Smart Entry
        </TabButton>
      </div>

      {tab === 'smart' ? (
        <SmartEntry onParsed={handleParsed} />
      ) : (
        <ManualFields form={form} update={update} />
      )}

      <div className="flex gap-3 pt-2">
        <GlassButton type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : mode === 'create' ? 'Add Subscription' : 'Save Changes'}
        </GlassButton>
        <GlassButton type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </GlassButton>
      </div>
    </form>
  )
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-surface-subtle text-text-primary border border-border'
          : 'text-text-tertiary hover:text-text-secondary',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ManualFields({
  form, update,
}: {
  form: SubscriptionFormData
  update: <K extends keyof SubscriptionFormData>(k: K, v: SubscriptionFormData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <GlassInput
        label="Name"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="e.g. Netflix"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-text-secondary font-medium">Category</label>
          <select
            className={selectClasses}
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            {DEFAULT_CATEGORY_OPTIONS.map((category) => (
              <option
                key={category.value}
                value={category.value}
                className="bg-surface-raised"
              >
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-text-secondary font-medium">Status</label>
          <select
            className={selectClasses}
            value={form.status}
            onChange={(e) => update('status', e.target.value as SubscriptionStatus)}
          >
            <option value="active" className="bg-surface-raised">Active</option>
            <option value="paused" className="bg-surface-raised">Paused</option>
            <option value="trial" className="bg-surface-raised">Trial</option>
            <option value="cancelled" className="bg-surface-raised">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <GlassInput
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          value={form.amount || ''}
          onChange={(e) => update('amount', parseFloat(e.target.value) || 0)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-text-secondary font-medium">Currency</label>
          <select
            className={selectClasses}
            value={form.currency}
            onChange={(e) => update('currency', e.target.value)}
          >
            <option value="USD" className="bg-surface-raised">USD</option>
            <option value="EUR" className="bg-surface-raised">EUR</option>
            <option value="GBP" className="bg-surface-raised">GBP</option>
            <option value="CAD" className="bg-surface-raised">CAD</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary font-medium">Billing Cycle</label>
        <select
          className={selectClasses}
          value={form.billing_cycle}
          onChange={(e) => update('billing_cycle', e.target.value as BillingCycle)}
        >
          <option value="weekly" className="bg-surface-raised">Weekly</option>
          <option value="monthly" className="bg-surface-raised">Monthly</option>
          <option value="yearly" className="bg-surface-raised">Yearly</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <GlassInput
          label="Start Date"
          type="date"
          value={form.start_date}
          onChange={(e) => update('start_date', e.target.value)}
          required
        />
        <GlassInput
          label="Next Renewal"
          type="date"
          value={form.next_renewal}
          onChange={(e) => update('next_renewal', e.target.value)}
          required
        />
      </div>
      <GlassInput
        label="Payment Method"
        value={form.payment_method}
        onChange={(e) => update('payment_method', e.target.value)}
        placeholder="e.g. Visa ending 4242"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary font-medium">Notes</label>
        <textarea
          className={[selectClasses, 'resize-none min-h-[80px]'].join(' ')}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Optional notes..."
        />
      </div>
      <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          checked={form.auto_renew}
          onChange={(e) => update('auto_renew', e.target.checked)}
          className="h-5 w-5 rounded border-border bg-surface-overlay accent-accent"
        />
        <span className="text-sm text-text-secondary">Auto-renew</span>
      </label>
    </div>
  )
}
