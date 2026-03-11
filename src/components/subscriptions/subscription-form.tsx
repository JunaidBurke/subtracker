'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { GlassInput } from '@/components/glass/glass-input'
import { GlassButton } from '@/components/glass/glass-button'
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

const categories = [
  'Streaming', 'Music', 'Productivity', 'Cloud',
  'Gaming', 'Fitness', 'News', 'Other',
]

const selectClasses = [
  'w-full rounded-xl px-4 py-3 backdrop-blur-sm',
  'bg-white/5 border border-white/10 text-white',
  'transition-all duration-200 outline-none',
  'focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/50',
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
        <SmartEntryPlaceholder />
      ) : (
        <ManualFields form={form} update={update} />
      )}

      <div className="flex gap-3 pt-2">
        <GlassButton type="submit" variant="primary" disabled={loading || tab === 'smart'}>
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
        'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all',
        active
          ? 'bg-white/10 text-white border border-white/20'
          : 'text-white/50 hover:text-white/80',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function SmartEntryPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
      <Upload className="h-10 w-10 text-white/30 mb-3" />
      <p className="text-white/40 text-sm">
        Upload a screenshot or paste receipt text
      </p>
      <p className="text-white/20 text-xs mt-1">Coming soon</p>
    </div>
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
          <label className="text-sm text-white/60 font-medium">Category</label>
          <select
            className={selectClasses}
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c.toLowerCase()} className="bg-gray-900">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-white/60 font-medium">Status</label>
          <select
            className={selectClasses}
            value={form.status}
            onChange={(e) => update('status', e.target.value as SubscriptionStatus)}
          >
            <option value="active" className="bg-gray-900">Active</option>
            <option value="paused" className="bg-gray-900">Paused</option>
            <option value="trial" className="bg-gray-900">Trial</option>
            <option value="cancelled" className="bg-gray-900">Cancelled</option>
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
          <label className="text-sm text-white/60 font-medium">Currency</label>
          <select
            className={selectClasses}
            value={form.currency}
            onChange={(e) => update('currency', e.target.value)}
          >
            <option value="USD" className="bg-gray-900">USD</option>
            <option value="EUR" className="bg-gray-900">EUR</option>
            <option value="GBP" className="bg-gray-900">GBP</option>
            <option value="CAD" className="bg-gray-900">CAD</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-white/60 font-medium">Billing Cycle</label>
        <select
          className={selectClasses}
          value={form.billing_cycle}
          onChange={(e) => update('billing_cycle', e.target.value as BillingCycle)}
        >
          <option value="weekly" className="bg-gray-900">Weekly</option>
          <option value="monthly" className="bg-gray-900">Monthly</option>
          <option value="yearly" className="bg-gray-900">Yearly</option>
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
        <label className="text-sm text-white/60 font-medium">Notes</label>
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
          className="h-5 w-5 rounded border-white/20 bg-white/5 accent-blue-500"
        />
        <span className="text-sm text-white/70">Auto-renew</span>
      </label>
    </div>
  )
}
