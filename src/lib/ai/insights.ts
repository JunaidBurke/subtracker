import 'server-only'

import { z } from 'zod'
import { getDefaultModelForProvider } from '@/lib/ai/catalog'
import { executeAIRequest } from '@/lib/ai/provider'
import { getOrCreateUserSettings } from '@/lib/ai/settings'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { calculateMonthlyAmount } from '@/lib/utils/spend'
import type { PriceHistory, Subscription } from '@/types'

const insightResponseSchema = z.array(
  z.object({
    type: z.enum(['optimization', 'forecast', 'alert']),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    related_names: z.array(z.string()).default([]),
  })
)

const SUBSCRIPTION_COLUMNS =
  'id, user_id, name, logo_url, category, amount, currency, billing_cycle, next_renewal, start_date, status, notes, payment_method, auto_renew, created_at, updated_at'

const PRICE_HISTORY_COLUMNS = 'id, subscription_id, amount, recorded_at'

function buildInsightsPrompt(
  subscriptions: Subscription[],
  priceHistory: PriceHistory[]
) {
  const historyBySubscriptionId = new Map<string, PriceHistory[]>()

  for (const entry of priceHistory) {
    const existing = historyBySubscriptionId.get(entry.subscription_id) ?? []
    existing.push(entry)
    historyBySubscriptionId.set(entry.subscription_id, existing)
  }

  const subscriptionLines = subscriptions.map((subscription) => {
    const monthlyEquivalent = calculateMonthlyAmount(subscription).toFixed(2)
    const history = (historyBySubscriptionId.get(subscription.id) ?? [])
      .slice(-5)
      .map((entry) => `${entry.recorded_at}: ${entry.amount}`)
      .join(', ')

    return [
      `name: ${subscription.name}`,
      `category: ${subscription.category}`,
      `amount: ${subscription.amount} ${subscription.currency}`,
      `billing_cycle: ${subscription.billing_cycle}`,
      `monthly_equivalent: ${monthlyEquivalent} ${subscription.currency}`,
      `next_renewal: ${subscription.next_renewal}`,
      `price_history: ${history || 'none'}`,
    ].join(' | ')
  })

  return `You are generating AI insights for a subscription tracking app.

Analyze the user's active subscriptions and return 2 to 4 useful insights.
At least one insight should be a forecast, one should be an optimization, and one should be an alert when the data supports it.
Ground every insight in the subscription data provided. Do not invent products, prices, renewals, or usage patterns.
Keep titles short. Keep bodies concise and specific.

Return ONLY valid JSON with this exact shape:
[
  {
    "type": "optimization" | "forecast" | "alert",
    "title": "string",
    "body": "string",
    "related_names": ["Subscription Name"]
  }
]

If you cannot produce a valid alert from the data, you may omit the alert insight.
Never include markdown fences.

Subscriptions:
${subscriptionLines.join('\n')}`
}

function parseInsightsResponse(raw: string) {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return insightResponseSchema.parse(JSON.parse(cleaned))
}

async function loadInsightInputs(userId: string) {
  const supabase = createSupabaseAdmin()
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'active')

  if (subscriptionsError) {
    throw subscriptionsError
  }

  const activeSubscriptions = (subscriptions ?? []) as Subscription[]
  if (activeSubscriptions.length === 0) {
    return {
      supabase,
      subscriptions: activeSubscriptions,
      priceHistory: [] as PriceHistory[],
    }
  }

  const subscriptionIds = activeSubscriptions.map((subscription) => subscription.id)
  const { data: priceHistory, error: priceHistoryError } = await supabase
    .from('price_history')
    .select(PRICE_HISTORY_COLUMNS)
    .in('subscription_id', subscriptionIds)
    .order('recorded_at', { ascending: true })

  if (priceHistoryError) {
    throw priceHistoryError
  }

  return {
    supabase,
    subscriptions: activeSubscriptions,
    priceHistory: (priceHistory ?? []) as PriceHistory[],
  }
}

export async function ensureUserInsights(userId: string) {
  const supabase = createSupabaseAdmin()
  const { count, error } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_dismissed', false)

  if (error) {
    throw error
  }

  if ((count ?? 0) > 0) {
    return { generated: false }
  }

  return regenerateUserInsights(userId)
}

export async function regenerateUserInsights(userId: string) {
  const { supabase, subscriptions, priceHistory } = await loadInsightInputs(userId)

  if (subscriptions.length === 0) {
    return { generated: false, count: 0 }
  }

  const settings = await getOrCreateUserSettings(userId)
  const provider = settings.default_ai_provider
  const model =
    settings.default_ai_model || getDefaultModelForProvider(provider)

  const prompt = buildInsightsPrompt(subscriptions, priceHistory)
  const result = await executeAIRequest({
    userId,
    provider,
    model,
    prompt,
    maxTokens: 900,
  })

  if (result.error) {
    throw new Error(result.error)
  }

  const parsedInsights = parseInsightsResponse(result.output_text)
  if (parsedInsights.length === 0) {
    return { generated: false, count: 0 }
  }

  await supabase.from('ai_insights').delete().eq('user_id', userId)

  const inserts = parsedInsights.map((insight) => {
    const relatedIds = subscriptions
      .filter((subscription) => insight.related_names.includes(subscription.name))
      .map((subscription) => subscription.id)

    return {
      user_id: userId,
      type: insight.type,
      title: insight.title,
      body: insight.body,
      related_subscription_ids: relatedIds,
    }
  })

  const { error: insertError } = await supabase.from('ai_insights').insert(inserts)
  if (insertError) {
    throw insertError
  }

  return {
    generated: true,
    count: inserts.length,
    provider,
    model,
  }
}
