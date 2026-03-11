'use client'

import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import {
  BarChart3,
  Check,
  Clock3,
  Coins,
  Layers3,
  Loader2,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { GlassButton } from '@/components/glass/glass-button'
import type {
  AIExecutionResult,
  AIProviderCatalogItem,
  AIProviderCredentialSummary,
  AIProviderId,
  AIProviderSettingsPayload,
  AIRequestSelection,
} from '@/types'

const selectClasses = [
  'w-full rounded-lg px-4 py-3',
  'bg-surface-overlay border border-border text-text-primary',
  'transition-all duration-200 outline-none',
  'focus:border-accent/40 focus:ring-1 focus:ring-accent/30',
].join(' ')

interface ComparisonSlot extends AIRequestSelection {
  id: string
}

interface ProvidersState {
  providers: AIProviderCatalogItem[]
  credentials: AIProviderCredentialSummary[]
  default_provider: AIProviderId
  default_model: string
}

function createSlot(
  provider: AIProviderId,
  model: string,
  index = 0
): ComparisonSlot {
  return {
    id: `${provider}-${model}-${index}`,
    provider,
    model,
  }
}

function formatCost(cost: number | null) {
  if (cost == null) {
    return 'Estimate unavailable'
  }

  return cost < 0.01 ? `$${cost.toFixed(4)} est.` : `$${cost.toFixed(2)} est.`
}

export function AIWorkbench() {
  const [providersState, setProvidersState] = useState<ProvidersState | null>(null)
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [question, setQuestion] = useState('')
  const [singleSelection, setSingleSelection] = useState<AIRequestSelection>({
    provider: 'anthropic',
    model: '',
  })
  const [comparisonSlots, setComparisonSlots] = useState<ComparisonSlot[]>([])
  const [results, setResults] = useState<AIExecutionResult[]>([])
  const [error, setError] = useState('')
  const [winnerId, setWinnerId] = useState('')
  const [loadingState, setLoadingState] = useState<'booting' | 'idle' | 'running'>(
    'booting'
  )
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function fetchProviderState() {
      try {
        const res = await fetch('/api/ai/providers')
        if (!res.ok) {
          throw new Error('Failed to load AI providers')
        }

        const payload: AIProviderSettingsPayload = await res.json()
        const nextState: ProvidersState = {
          providers: payload.providers,
          credentials: payload.credentials,
          default_provider: payload.default_provider,
          default_model: payload.default_model,
        }

        setProvidersState(nextState)
        setSingleSelection({
          provider: payload.default_provider,
          model: payload.default_model,
        })

        const alternateProvider =
          payload.providers.find((provider) => provider.id !== payload.default_provider) ??
          payload.providers[0]

        setComparisonSlots([
          createSlot(payload.default_provider, payload.default_model, 0),
          createSlot(
            alternateProvider.id,
            alternateProvider.models[0]?.id ?? payload.default_model,
            1
          ),
        ])
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load AI providers'
        )
      } finally {
        setLoadingState('idle')
      }
    }

    fetchProviderState()
  }, [])

  const providerMap = useMemo(
    () =>
      new Map(
        (providersState?.providers ?? []).map((provider) => [provider.id, provider])
      ),
    [providersState?.providers]
  )

  const savedProviderIds = useMemo(
    () =>
      new Set(
        (providersState?.credentials ?? [])
          .filter((credential) => credential.has_key)
          .map((credential) => credential.provider)
      ),
    [providersState?.credentials]
  )

  function getProvider(providerId: AIProviderId) {
    return providerMap.get(providerId)
  }

  function setSingleProvider(providerId: AIProviderId) {
    const provider = getProvider(providerId)
    setSingleSelection({
      provider: providerId,
      model: provider?.models[0]?.id ?? '',
    })
  }

  function updateComparisonSlot(slotId: string, updates: Partial<AIRequestSelection>) {
    setComparisonSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) {
          return slot
        }

        const nextProvider = updates.provider ?? slot.provider
        const provider = getProvider(nextProvider)

        return {
          ...slot,
          ...updates,
          provider: nextProvider,
          model:
            updates.provider && !updates.model
              ? provider?.models[0]?.id ?? slot.model
              : updates.model ?? slot.model,
        }
      })
    )
  }

  function addComparisonSlot() {
    if (!providersState || comparisonSlots.length >= 6) {
      return
    }

    const provider =
      providersState.providers[
        comparisonSlots.length % providersState.providers.length
      ]

    setComparisonSlots((current) => [
      ...current,
      createSlot(provider.id, provider.models[0]?.id ?? '', current.length),
    ])
  }

  function removeComparisonSlot(slotId: string) {
    setComparisonSlots((current) => current.filter((slot) => slot.id !== slotId))
  }

  async function runQuery() {
    const trimmed = question.trim()
    if (!trimmed) {
      setError('Enter a prompt to run a comparison.')
      return
    }

    if (mode === 'compare' && comparisonSlots.length < 2) {
      setError('Choose at least two provider/model combinations to compare.')
      return
    }

    setError('')
    setWinnerId('')
    setLoadingState('running')

    try {
      const endpoint = mode === 'single' ? '/api/ai/query' : '/api/ai/compare'
      const body =
        mode === 'single'
          ? { question: trimmed, selection: singleSelection }
          : {
              question: trimmed,
              selections: comparisonSlots.map(({ provider, model }) => ({
                provider,
                model,
              })),
            }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = (await res.json()) as
        | AIExecutionResult
        | { results?: AIExecutionResult[]; error?: string }

      if (!res.ok) {
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : 'Failed to run AI request'
        )
      }

      const nextResults =
        mode === 'single'
          ? [payload as AIExecutionResult]
          : (payload as { results: AIExecutionResult[] }).results

      startTransition(() => {
        setResults(nextResults)
      })
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : 'Failed to run AI request'
      )
      setResults([])
    } finally {
      setLoadingState('idle')
    }
  }

  if (loadingState === 'booting') {
    return (
      <div className="rounded-[28px] border border-border bg-surface-raised p-6">
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-40 rounded bg-surface-subtle" />
          <div className="h-12 w-full rounded bg-surface-subtle" />
          <div className="h-28 w-full rounded bg-surface-subtle" />
        </div>
      </div>
    )
  }

  if (!providersState) {
    return (
      <div className="rounded-[28px] border border-status-danger/20 bg-status-danger/10 p-6 text-sm text-status-danger">
        {error || 'AI workbench unavailable.'}
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-border-accent bg-[linear-gradient(180deg,rgba(16,24,40,0.92),rgba(10,18,32,0.78))] p-5 shadow-[var(--shadow-accent)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="font-display text-xl text-text-primary">
              AI Model Workbench
            </h3>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Run the same subscription question through one model or compare multiple
            providers side by side on speed, tokens, cost estimate, and answer quality.
          </p>
        </div>

        <div className="flex rounded-full border border-border bg-surface-overlay p-1">
          <ModeButton
            active={mode === 'single'}
            icon={<WandSparkles className="h-4 w-4" />}
            label="Single run"
            onClick={() => setMode('single')}
          />
          <ModeButton
            active={mode === 'compare'}
            icon={<Layers3 className="h-4 w-4" />}
            label="Compare"
            onClick={() => setMode('compare')}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-surface-overlay/60 p-4">
        <label className="text-sm font-medium text-text-secondary">Prompt</label>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Which subscriptions look easiest to cancel without hurting my workflow?"
          className="mt-2 min-h-[120px] w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-accent/40 focus:ring-1 focus:ring-accent/30"
        />

        {mode === 'single' ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ProviderSelect
              label="Provider"
              providers={providersState.providers}
              value={singleSelection.provider}
              onChange={setSingleProvider}
              savedProviderIds={savedProviderIds}
            />
            <ModelSelect
              label="Model"
              provider={getProvider(singleSelection.provider)}
              value={singleSelection.model}
              onChange={(model) =>
                setSingleSelection((current) => ({ ...current, model }))
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {comparisonSlots.map((slot, index) => (
              <div
                key={slot.id}
                className="grid gap-3 rounded-2xl border border-border bg-surface-raised/80 p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <ProviderSelect
                  label={`Provider ${index + 1}`}
                  providers={providersState.providers}
                  value={slot.provider}
                  onChange={(provider) =>
                    updateComparisonSlot(slot.id, { provider })
                  }
                  savedProviderIds={savedProviderIds}
                />
                <ModelSelect
                  label="Model"
                  provider={getProvider(slot.provider)}
                  value={slot.model}
                  onChange={(model) => updateComparisonSlot(slot.id, { model })}
                />
                <div className="flex items-end">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => removeComparisonSlot(slot.id)}
                    disabled={comparisonSlots.length <= 2}
                  >
                    Remove
                  </GlassButton>
                </div>
              </div>
            ))}

            <GlassButton
              type="button"
              variant="default"
              onClick={addComparisonSlot}
              disabled={comparisonSlots.length >= 6}
            >
              Add provider/model
            </GlassButton>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <GlassButton
            type="button"
            variant="primary"
            onClick={runQuery}
            disabled={loadingState === 'running'}
          >
            {loadingState === 'running' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Running...</span>
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                <span className="ml-2">
                  {mode === 'single' ? 'Run model' : 'Compare models'}
                </span>
              </>
            )}
          </GlassButton>
          <p className="text-xs text-text-tertiary">
            Saved providers: {savedProviderIds.size || 0}. Missing keys will return
            an error on run.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-sm text-status-danger">
            {error}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {results.map((result) => {
            const id = `${result.provider}:${result.model}`

            return (
              <article
                key={id}
                className={[
                  'rounded-2xl border p-4 transition-all',
                  winnerId === id
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-border bg-surface-overlay/70',
                ].join(' ')}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-text-muted">
                      {result.provider_label}
                    </p>
                    <h4 className="mt-1 text-lg font-medium text-text-primary">
                      {result.model}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWinnerId(id)}
                    className={[
                      'inline-flex min-h-[36px] items-center rounded-full border px-3 text-xs transition-all',
                      winnerId === id
                        ? 'border-accent/40 bg-accent/15 text-accent'
                        : 'border-border text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Mark best
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricPill
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    label="Latency"
                    value={`${result.latency_ms}ms`}
                  />
                  <MetricPill
                    icon={<Coins className="h-3.5 w-3.5" />}
                    label="Cost"
                    value={formatCost(result.usage.estimated_cost_usd)}
                  />
                  <MetricPill
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Input"
                    value={result.usage.input_tokens?.toLocaleString() ?? 'n/a'}
                  />
                  <MetricPill
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Output"
                    value={result.usage.output_tokens?.toLocaleString() ?? 'n/a'}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-surface-raised/80 p-4">
                  {result.error ? (
                    <p className="text-sm text-status-danger">{result.error}</p>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {result.output_text}
                    </p>
                  )}
                </div>

                <p className="mt-3 text-xs text-text-tertiary">
                  {result.usage.cost_note}
                </p>
              </article>
            )
          })}
        </div>
      )}

      {(loadingState === 'running' || isPending) && (
        <div className="rounded-2xl border border-border bg-surface-overlay/50 p-4 text-sm text-text-secondary">
          Gathering responses and normalizing metrics...
        </div>
      )}
    </div>
  )
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm transition-all',
        active
          ? 'bg-accent text-surface-base'
          : 'text-text-secondary hover:text-text-primary',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

function ProviderSelect({
  label,
  providers,
  value,
  onChange,
  savedProviderIds,
}: {
  label: string
  providers: AIProviderCatalogItem[]
  value: AIProviderId
  onChange: (provider: AIProviderId) => void
  savedProviderIds: Set<AIProviderId>
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClasses}
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.label}
            {savedProviderIds.has(provider.id) ? ' · saved key' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function ModelSelect({
  label,
  provider,
  value,
  onChange,
}: {
  label: string
  provider: AIProviderCatalogItem | undefined
  value: string
  onChange: (model: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClasses}
      >
        {(provider?.models ?? []).map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-surface-raised/70 p-3">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-text-primary">{value}</p>
    </div>
  )
}
