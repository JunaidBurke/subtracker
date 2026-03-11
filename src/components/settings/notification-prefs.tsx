'use client'

import type { UserSettings } from '@/types'

interface NotificationPrefsProps {
  settings: UserSettings
  onUpdate: (updates: Partial<UserSettings>) => void
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full',
          'border transition-all duration-200 min-h-[44px] min-w-[48px] items-center',
          checked
            ? 'bg-blue-500/40 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
            : 'bg-white/10 border-white/10',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 rounded-full',
            'bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export function NotificationPrefs({ settings, onUpdate }: NotificationPrefsProps) {
  return (
    <div className="divide-y divide-white/[0.06]">
      <ToggleRow
        label="Weekly email digest"
        description="Receive a weekly summary of your subscriptions and spending"
        checked={settings.email_digest}
        onChange={(checked) => onUpdate({ email_digest: checked })}
      />
      <ToggleRow
        label="Email alerts"
        description="Get notified by email about upcoming renewals and price changes"
        checked={settings.email_alerts}
        onChange={(checked) => onUpdate({ email_alerts: checked })}
      />
      <ToggleRow
        label="In-app alerts"
        description="Show notification badges and alerts within the app"
        checked={settings.in_app_alerts}
        onChange={(checked) => onUpdate({ in_app_alerts: checked })}
      />
    </div>
  )
}
