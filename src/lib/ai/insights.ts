import 'server-only'

import { createSupabaseAdmin } from '@/lib/supabase/server'
import { calculateMonthlyAmount } from '@/lib/utils/spend'
import type { AIInsight, PriceHistory, Subscription } from '@/types'

type InsightInsert = Pick<
  AIInsight,
  'type' | 'title' | 'body' | 'related_subscription_ids'
>

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function roundAmount(amount: number) {
  return Math.round(amount * 100) / 100
}

function buildForecastInsight(
  subscriptions: Subscription[],
  currency: string
): InsightInsert {
  const totalMonthly = roundAmount(
    subscriptions.reduce((sum, sub) => sum + calculateMonthlyAmount(sub), 0)
  )
  const next30Days = roundAmount(totalMonthly)

  return {
    type: 'forecast',
    title: 'Projected spend for the next 30 days',
    body: `Your current active subscriptions are projected to cost about ${formatCurrency(next30Days, currency)} over the next 30 days across ${subscriptions.length} active subscription${subscriptions.length === 1 ? '' : 's'}.`,
    related_subscription_ids: subscriptions.map((sub) => sub.id),
  }
}

function buildOptimizationInsight(
  subscriptions: Subscription[],
  currency: string
): InsightInsert {
  const grouped = new Map<string, Subscription[]>()

  for (const subscription of subscriptions) {
    const group = grouped.get(subscription.category) ?? []
    group.push(subscription)
    grouped.set(subscription.category, group)
  }

  const overlappingCategory = [...grouped.entries()]
    .filter(([, items]) => items.length > 1)
    .sort((a, b) => {
      const totalA = a[1].reduce((sum, sub) => sum + calculateMonthlyAmount(sub), 0)
      const totalB = b[1].reduce((sum, sub) => sum + calculateMonthlyAmount(sub), 0)
      return totalB - totalA
    })[0]

  if (overlappingCategory) {
    const [category, items] = overlappingCategory
    const monthlyTotal = roundAmount(
      items.reduce((sum, sub) => sum + calculateMonthlyAmount(sub), 0)
    )

    return {
      type: 'optimization',
      title: `Review your ${category} subscriptions`,
      body: `You have ${items.length} active ${category} subscription${items.length === 1 ? '' : 's'} costing about ${formatCurrency(monthlyTotal, currency)} per month combined. This is the clearest place to look for overlap or downgrade opportunities.`,
      related_subscription_ids: items.map((item) => item.id),
    }
  }

  const highestCost = [...subscriptions].sort(
    (a, b) => calculateMonthlyAmount(b) - calculateMonthlyAmount(a)
  )[0]
  const monthlyAmount = roundAmount(calculateMonthlyAmount(highestCost))

  return {
    type: 'optimization',
    title: `Review ${highestCost.name} first`,
    body: `${highestCost.name} is your most expensive active subscription at about ${formatCurrency(monthlyAmount, currency)} per month. If you want to cut spend quickly, it is the highest-impact subscription to review.`,
    related_subscription_ids: [highestCost.id],
  }
}

function buildAlertInsight(
  subscriptions: Subscription[],
  priceHistory: PriceHistory[],
  currency: string
): InsightInsert | null {
  const upcomingRenewals = [...subscriptions]
    .filter((subscription) => {
      const renewalDate = new Date(subscription.next_renewal)
      const diffMs = renewalDate.getTime() - Date.now()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 7
    })
    .sort(
      (a, b) =>
        new Date(a.next_renewal).getTime() - new Date(b.next_renewal).getTime()
    )

  if (upcomingRenewals.length > 0) {
    const [nextRenewal] = upcomingRenewals
    const diffMs = new Date(nextRenewal.next_renewal).getTime() - Date.now()
    const diffDays = Math.max(
      0,
      Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    )

    return {
      type: 'alert',
      title: 'Upcoming renewal to watch',
      body: `${nextRenewal.name} renews ${diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`} for ${formatCurrency(nextRenewal.amount, currency)}. ${upcomingRenewals.length > 1 ? `You also have ${upcomingRenewals.length - 1} more renewal${upcomingRenewals.length === 2 ? '' : 's'} coming up within a week.` : ''}`,
      related_subscription_ids: upcomingRenewals.map((subscription) => subscription.id),
    }
  }

  const historyBySubscriptionId = new Map<string, PriceHistory[]>()
  for (const entry of priceHistory) {
    const records = historyBySubscriptionId.get(entry.subscription_id) ?? []
    records.push(entry)
    historyBySubscriptionId.set(entry.subscription_id, records)
  }

  const priceIncrease = subscriptions
    .map((subscription) => {
      const history = (historyBySubscriptionId.get(subscription.id) ?? []).sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      )
      if (history.length < 2) return null

      const previous = Number(history[history.length - 2].amount)
      const current = Number(history[history.length - 1].amount)
      if (current <= previous) return null

      return {
        subscription,
        previous,
        current,
        delta: current - previous,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.delta - a.delta)[0]

  if (!priceIncrease) {
    return null
  }

  return {
    type: 'alert',
    title: `${priceIncrease.subscription.name} got more expensive`,
    body: `${priceIncrease.subscription.name} increased from ${formatCurrency(priceIncrease.previous, currency)} to ${formatCurrency(priceIncrease.current, currency)}. Review the plan details if you were not expecting a price change.`,
    related_subscription_ids: [priceIncrease.subscription.id],
  }
}

export async function ensureUserInsights(userId: string) {
  const supabase = createSupabaseAdmin()
  const { count, error: countError } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw countError
  }

  if ((count ?? 0) > 0) {
    return
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select('id, user_id, name, logo_url, category, amount, currency, billing_cycle, next_renewal, start_date, status, notes, payment_method, auto_renew, created_at, updated_at')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (subscriptionsError) {
    throw subscriptionsError
  }

  const activeSubscriptions = (subscriptions ?? []) as Subscription[]
  if (activeSubscriptions.length === 0) {
    return
  }

  const subscriptionIds = activeSubscriptions.map((subscription) => subscription.id)
  const { data: priceHistory, error: priceHistoryError } = await supabase
    .from('price_history')
    .select('id, subscription_id, amount, recorded_at')
    .in('subscription_id', subscriptionIds)
    .order('recorded_at', { ascending: true })

  if (priceHistoryError) {
    throw priceHistoryError
  }

  const currency = activeSubscriptions[0]?.currency || 'USD'
  const generatedInsights = [
    buildForecastInsight(activeSubscriptions, currency),
    buildOptimizationInsight(activeSubscriptions, currency),
    buildAlertInsight(activeSubscriptions, (priceHistory ?? []) as PriceHistory[], currency),
  ].filter((insight): insight is InsightInsert => Boolean(insight))

  if (generatedInsights.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from('ai_insights').insert(
    generatedInsights.map((insight) => ({
      user_id: userId,
      ...insight,
    }))
  )

  if (insertError) {
    throw insertError
  }
}
