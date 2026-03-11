'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, KeyRound, Loader2, PlugZap, Trash2 } from 'lucide-react'
import { GlassButton } from '@/components/glass/glass-button'
import { GlassInput } from '@/components/glass/glass-input'
import { getDefaultModelForProvider } from '@/lib/ai/catalog'
import type {
  AIExecutionResult,
  AIProviderCatalogItem,
  AIProviderCredentialSummary,
  AIProviderId,
  AIProviderSettingsPayload,
} from '@/types'

const selectClasses = [
  'w-full rounded-lg px-4 py-3',
  'bg-surface-overlay border border-border text-text-primary',
  'transition-all duration-200 outline-none',
  'focus:border-accent/40 focus:ring-1 focus:ring-accent/30',
].join(' ')

interface ProviderState {
  providers: AIProviderCatalogItem[]
  credentials: AIProviderCredentialSummary[]
  default_provider: AIProviderId
  default_model: string
}

function getInitialModel(
  provider: AIProviderCatalogItem | undefined,
  state: ProviderState | null
) {
  if (!provider) {
    return ''
  }

  if (state?.default_provider === provider.id) {
    return state.default_model
  }

  return provider.models[0]?.id ?? getDefaultModelForProvider(provider.id)
}

export function AIProviderManager() {
  const [state, setState] = useState<ProviderState | null>(null)
  const [selectedProviderId, setSelectedProviderId] =
    useState<AIProviderId>('anthropic')
  const [selectedModel, setSelectedModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [testResult, setTestResult] = useState<AIExecutionResult | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/ai/providers')
        if (!res.ok) {
          throw new Error('Failed to load AI provider settings')
        }

        const payload: AIProviderSettingsPayload = await res.json()
        const nextState: ProviderState = {
          providers: payload.providers,
          credentials: payload.credentials,
          default_provider: payload.default_provider,
          default_model: payload.default_model,
        }

        setState(nextState)
        setSelectedProviderId(payload.default_provider)
        const defaultProvider = payload.providers.find(
          (provider) => provider.id === payload.default_provider
        )
        setSelectedModel(getInitialModel(defaultProvider, nextState))
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load AI provider settings'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const selectedProvider = useMemo(
    () => state?.providers.find((provider) => provider.id === selectedProviderId),
    [selectedProviderId, state?.providers]
  )

  const selectedCredential = useMemo(
    () =>
      state?.credentials.find(
        (credential) => credential.provider === selectedProviderId
      ) ?? null,
    [selectedProviderId, state?.credentials]
  )

  function resetMessages() {
    setError('')
    setNotice('')
    setTestResult(null)
  }

  function handleProviderChange(providerId: AIProviderId) {
    setSelectedProviderId(providerId)
    const provider = state?.providers.find((item) => item.id === providerId)
    setSelectedModel(getInitialModel(provider, state))
    setApiKey('')
    resetMessages()
  }

  async function refreshState(nextState?: AIProviderSettingsPayload) {
    if (nextState) {
      setState({
        providers: nextState.providers,
        credentials: nextState.credentials,
        default_provider: nextState.default_provider,
        default_model: nextState.default_model,
      })
      return
    }

    const res = await fetch('/api/ai/providers')
    if (!res.ok) {
      throw new Error('Failed to refresh provider settings')
    }

    const payload: AIProviderSettingsPayload = await res.json()
    setState({
      providers: payload.providers,
      credentials: payload.credentials,
      default_provider: payload.default_provider,
      default_model: payload.default_model,
    })
  }

  async function handleSave() {
    if (!selectedProvider || !apiKey.trim()) {
      setError('Enter an API key before saving.')
      return
    }

    resetMessages()
    setSaving(true)

    try {
      const res = await fetch(`/api/ai/providers/${selectedProvider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error ?? 'Failed to save API key')
      }

      await refreshState(payload as AIProviderSettingsPayload)
      setApiKey('')
      setNotice(`${selectedProvider.label} key saved securely.`)
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save API key'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!selectedProvider) {
      return
    }

    resetMessages()
    setSaving(true)

    try {
      const res = await fetch(`/api/ai/providers/${selectedProvider.id}`, {
        method: 'DELETE',
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error ?? 'Failed to remove API key')
      }

      await refreshState(payload as AIProviderSettingsPayload)
      setNotice(`${selectedProvider.label} key removed.`)
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Failed to remove API key'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!selectedProvider) {
      return
    }

    resetMessages()
    setTesting(true)

    try {
      const res = await fetch(`/api/ai/providers/${selectedProvider.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          model: selectedModel,
        }),
      })

      const payload = (await res.json()) as AIExecutionResult | { error?: string }
      if (!res.ok || ('error' in payload && typeof payload.error === 'string')) {
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : 'Connection test failed'
        )
      }

      setTestResult(payload as AIExecutionResult)
      setNotice(`Connection test succeeded for ${selectedProvider.label}.`)
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : 'Failed to test AI provider'
      )
    } finally {
      setTesting(false)
    }
  }

  async function handleSetDefault() {
    if (!selectedProvider || !selectedModel) {
      return
    }

    resetMessages()
    setSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_ai_provider: selectedProvider.id,
          default_ai_model: selectedModel,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error ?? 'Failed to update default AI model')
      }

      await refreshState()
      setNotice(
        `${selectedProvider.label} · ${selectedModel} is now your default AI model.`
      )
    } catch (defaultError) {
      setError(
        defaultError instanceof Error
          ? defaultError.message
          : 'Failed to update default AI model'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-36 animate-pulse rounded bg-surface-subtle" />
        <div className="h-12 w-full animate-pulse rounded bg-surface-subtle" />
        <div className="h-24 w-full animate-pulse rounded bg-surface-subtle" />
      </div>
    )
  }

  if (!state || !selectedProvider) {
    return (
      <p className="text-sm text-status-danger">
        {error || 'AI settings unavailable.'}
      </p>
    )
  }

  const selectedModelMeta = selectedProvider.models.find(
    (model) => model.id === selectedModel
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {state.providers.map((provider) => {
          const saved = state.credentials.find(
            (credential) => credential.provider === provider.id
          )?.has_key

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderChange(provider.id)}
              className={[
                'min-h-[44px] rounded-full border px-3 py-2 text-sm transition-all',
                selectedProviderId === provider.id
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-border bg-surface-overlay text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              <span>{provider.label}</span>
              {saved ? (
                <span className="ml-2 text-xs text-status-active">Saved</span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-surface-overlay/70 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {selectedProvider.label}
            </p>
            <p className="text-xs text-text-tertiary">
              Save a provider key on the server, test it, and set a default model.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className={selectClasses}
              >
                {selectedProvider.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-tertiary">
                {selectedModelMeta?.description ?? 'Choose the model you want as default.'}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-raised p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                Saved key
              </p>
              <p className="mt-2 text-sm text-text-primary">
                {selectedCredential?.has_key
                  ? selectedCredential.key_hint
                  : 'No API key saved for this provider'}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                {selectedCredential?.saved_at
                  ? `Updated ${new Date(selectedCredential.saved_at).toLocaleString()}`
                  : 'Keys stay server-side and never return to the client after save.'}
              </p>
            </div>
          </div>

          <GlassInput
            label={selectedProvider.api_key_label}
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={selectedProvider.api_key_placeholder}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <GlassButton
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={saving || testing}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              <span className="ml-2">Save Key</span>
            </GlassButton>
            <GlassButton
              type="button"
              variant="default"
              onClick={handleTest}
              disabled={
                saving ||
                testing ||
                (!selectedCredential?.has_key && !apiKey.trim())
              }
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              <span className="ml-2">Test Connection</span>
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              onClick={handleSetDefault}
              disabled={saving || testing}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="ml-2">Set Default</span>
            </GlassButton>
            <GlassButton
              type="button"
              variant="danger"
              onClick={handleRemove}
              disabled={saving || testing || !selectedCredential?.has_key}
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-2">Remove Key</span>
            </GlassButton>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-surface-overlay/50 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
              Current default
            </p>
            <p className="mt-2 text-lg font-medium text-text-primary">
              {
                state.providers.find((provider) => provider.id === state.default_provider)
                  ?.label
              }
            </p>
            <p className="text-sm text-text-secondary">{state.default_model}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
              Pricing hint
            </p>
            <div className="rounded-xl border border-border bg-surface-raised p-3">
              <p className="text-sm text-text-primary">
                {selectedModelMeta?.pricing.input_per_million != null
                  ? `$${selectedModelMeta.pricing.input_per_million} / 1M input tokens`
                  : 'Static pricing unavailable for this model'}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                {selectedModelMeta?.pricing.pricing_note ??
                  'Costs will be shown when token pricing is known.'}
              </p>
            </div>
          </div>

          {(error || notice) && (
            <div
              className={[
                'rounded-xl border p-3 text-sm',
                error
                  ? 'border-status-danger/20 bg-status-danger/10 text-status-danger'
                  : 'border-status-active/20 bg-status-active/10 text-status-active',
              ].join(' ')}
            >
              {error || notice}
            </div>
          )}

          {testResult && (
            <div className="rounded-xl border border-border bg-surface-raised p-3">
              <p className="text-sm font-medium text-text-primary">Test result</p>
              <p className="mt-2 text-xs text-text-tertiary">
                {testResult.provider_label} · {testResult.model} ·{' '}
                {testResult.latency_ms}ms
              </p>
              <p className="mt-3 text-sm text-text-secondary">
                {testResult.output_text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
