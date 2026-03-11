'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GlassPanel } from '@/components/glass/glass-panel'
import { NotificationPrefs } from '@/components/settings/notification-prefs'
import { CategoryManager } from '@/components/settings/category-manager'
import { AIProviderManager } from '@/components/settings/ai-provider-manager'
import type { UserSettings } from '@/types'

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Failed to load settings')
        const data: UserSettings = await res.json()
        setSettings(data)
        setError('')
      } catch {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [])

  const saveSettings = useCallback(async (updates: Partial<UserSettings>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data: UserSettings = await res.json()
      setSettings(data)
      setError('')
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [])

  const debouncedSave = useCallback(
    (updates: Partial<UserSettings>) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(() => saveSettings(updates), 400)
    },
    [saveSettings],
  )

  function handleNotificationUpdate(updates: Partial<UserSettings>) {
    if (!settings) return
    const next = { ...settings, ...updates }
    setSettings(next)
    saveSettings(updates)
  }

  function handleCategoryUpdate(categories: string[]) {
    if (!settings) return
    setSettings({ ...settings, categories })
    debouncedSave({ categories })
  }

  function handleCurrencyChange(currency: string) {
    if (!settings) return
    setSettings({ ...settings, currency })
    saveSettings({ currency })
  }

  if (loading) return <SettingsSkeleton />

  if (error && !settings) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl text-text-primary">Settings</h1>
        <GlassPanel>
          <p className="text-status-danger text-sm text-center py-8">{error}</p>
        </GlassPanel>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-text-primary">Settings</h1>
        {saving && (
          <span className="text-xs text-text-tertiary animate-pulse">Saving...</span>
        )}
      </div>

      <GlassPanel>
        <h2 className="font-display text-lg text-text-primary mb-4">Notifications</h2>
        <NotificationPrefs settings={settings} onUpdate={handleNotificationUpdate} />
      </GlassPanel>

      <GlassPanel>
        <h2 className="font-display text-lg text-text-primary mb-4">Categories</h2>
        <CategoryManager
          categories={settings.categories}
          onUpdate={handleCategoryUpdate}
        />
      </GlassPanel>

      <GlassPanel>
        <h2 className="font-display text-lg text-text-primary mb-4">AI Providers</h2>
        <AIProviderManager />
      </GlassPanel>

      <GlassPanel>
        <h2 className="font-display text-lg text-text-primary mb-4">Currency</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {CURRENCIES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => handleCurrencyChange(code)}
              className={[
                'min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium',
                'transition-all duration-200 text-left',
                settings.currency === code
                  ? 'bg-accent/15 text-accent border border-accent/20 shadow-[var(--shadow-accent)]'
                  : 'bg-surface-overlay text-text-secondary border border-border hover:bg-surface-subtle hover:text-text-primary',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-text-primary">Settings</h1>
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassPanel key={i}>
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-28 rounded bg-surface-subtle" />
            <div className="h-10 w-full rounded bg-surface-subtle" />
            <div className="h-10 w-3/4 rounded bg-surface-subtle" />
          </div>
        </GlassPanel>
      ))}
    </div>
  )
}
