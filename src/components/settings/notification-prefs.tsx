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
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
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
            ? 'bg-accent/30 border-accent/40'
            : 'bg-surface-subtle border-border',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 rounded-full',
            'shadow-sm transition-transform duration-200',
            checked ? 'translate-x-6 bg-accent' : 'translate-x-1 bg-text-tertiary',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export function NotificationPrefs({ settings, onUpdate }: NotificationPrefsProps) {
  return (
    <div className="divide-y divide-border">
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
