// supabase/functions/spend-forecast/index.ts
// Scheduled: Daily 6am UTC via pg_cron
// Calculates upcoming spend for 7d/30d/90d windows, detects anomalies.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billing_cycle: string
  category: string
  next_renewal: string
}

interface PriceRecord {
  subscription_id: string
  amount: number
  recorded_at: string
}

interface BreakdownItem {
  subscription_id: string
  name: string
  amount: number
  renewal_date: string
}

interface AnomalyResult {
  title: string
  body: string
  related_names: string[]
}

type Period = '7d' | '30d' | '90d'

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 }

async function callClaude(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getNextOccurrences(
  nextRenewal: string,
  billingCycle: string,
  windowEnd: Date
): Date[] {
  const dates: Date[] = []
  let current = new Date(nextRenewal)
  const cycleDays =
    billingCycle === 'weekly' ? 7 : billingCycle === 'monthly' ? 30 : 365

  while (current <= windowEnd) {
    if (current >= new Date()) {
      dates.push(new Date(current))
    }
    current = addDays(current, cycleDays)
  }

  return dates
}

function calculateForecast(
  subs: Subscription[],
  period: Period
): { total: number; breakdown: BreakdownItem[] } {
  const now = new Date()
  const windowEnd = addDays(now, PERIOD_DAYS[period])
  let total = 0
  const breakdown: BreakdownItem[] = []

  for (const sub of subs) {
    const occurrences = getNextOccurrences(
      sub.next_renewal,
      sub.billing_cycle,
      windowEnd
    )

    for (const date of occurrences) {
      total += sub.amount
      breakdown.push({
        subscription_id: sub.id,
        name: sub.name,
        amount: sub.amount,
        renewal_date: date.toISOString().split('T')[0],
      })
    }
  }

  breakdown.sort(
    (a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
  )

  return { total: Math.round(total * 100) / 100, breakdown }
}

async function detectAnomalies(
  subs: Subscription[],
  priceHistory: PriceRecord[]
): Promise<AnomalyResult[]> {
  if (subs.length === 0) return []

  const historyBySubId = new Map<string, PriceRecord[]>()
  for (const record of priceHistory) {
    const existing = historyBySubId.get(record.subscription_id) ?? []
    existing.push(record)
    historyBySubId.set(record.subscription_id, existing)
  }

  const subsWithHistory = subs.map((s) => {
    const history = historyBySubId.get(s.id) ?? []
    return {
      name: s.name,
      current_amount: s.amount,
      billing_cycle: s.billing_cycle,
      category: s.category,
      price_history: history
        .sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        )
        .map((h) => ({ amount: h.amount, date: h.recorded_at })),
    }
  })

  const prompt = `Analyze these subscriptions and their price history for anomalies:
- Price increases (significant jumps)
- Unusual patterns (frequent changes)
- Subscriptions that have gotten significantly more expensive over time

Data:
${JSON.stringify(subsWithHistory, null, 2)}

Return ONLY valid JSON array: [{ "title": string, "body": string, "related_names": string[] }]
If no anomalies found, return [].`

  const result = await callClaude(prompt)
  const cleaned = result
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as AnomalyResult[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('[spend-forecast] Failed to parse anomaly response')
    return []
  }
}

async function processUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, name, amount, currency, billing_cycle, category, next_renewal')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error || !subs || subs.length === 0) return

  const typedSubs = subs as Subscription[]
  const periods: Period[] = ['7d', '30d', '90d']

  for (const period of periods) {
    const { total, breakdown } = calculateForecast(typedSubs, period)

    // Delete existing forecast for this user/period, then insert
    await supabase
      .from('forecasts')
      .delete()
      .eq('user_id', userId)
      .eq('period', period)

    await supabase.from('forecasts').insert({
      user_id: userId,
      period,
      total_amount: total,
      breakdown: JSON.stringify(breakdown),
      generated_at: new Date().toISOString(),
    })
  }

  // Anomaly detection via Claude
  const subIds = typedSubs.map((s) => s.id)
  const { data: priceHistory } = await supabase
    .from('price_history')
    .select('subscription_id, amount, recorded_at')
    .in('subscription_id', subIds)
    .order('recorded_at', { ascending: true })

  const anomalies = await detectAnomalies(
    typedSubs,
    (priceHistory ?? []) as PriceRecord[]
  )

  for (const anomaly of anomalies) {
    const relatedIds = typedSubs
      .filter((s) => anomaly.related_names?.includes(s.name))
      .map((s) => s.id)

    await supabase.from('ai_insights').insert({
      user_id: userId,
      type: 'alert',
      title: anomaly.title,
      body: anomaly.body,
      related_subscription_ids: relatedIds,
    })
  }

  // Renewal reminders for subscriptions renewing within 3 days
  const threeDaysFromNow = addDays(new Date(), 3)
  const today = new Date()

  for (const sub of typedSubs) {
    const renewalDate = new Date(sub.next_renewal)
    if (renewalDate >= today && renewalDate <= threeDaysFromNow) {
      const daysUntil = Math.ceil(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'renewal_reminder',
        title: `${sub.name} renews ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}`,
        body: `Your ${sub.name} subscription ($${sub.amount}/${sub.billing_cycle}) renews on ${sub.next_renewal}.`,
        channel: 'in_app',
      })
    }
  }
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: 'subtracker' },
    })

    const { data: users, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    const uniqueUserIds = [
      ...new Set((users ?? []).map((u: { user_id: string }) => u.user_id)),
    ]

    for (const userId of uniqueUserIds) {
      await processUser(supabase, userId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_processed: uniqueUserIds.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[spend-forecast]', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
