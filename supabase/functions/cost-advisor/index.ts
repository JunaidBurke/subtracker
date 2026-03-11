// supabase/functions/cost-advisor/index.ts
// Scheduled: Sundays 9am UTC via pg_cron
// Analyzes user subscriptions for overlaps, savings, and optimization opportunities.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Insight {
  title: string
  body: string
  type: 'optimization' | 'forecast' | 'alert'
  related_names: string[]
}

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billing_cycle: string
  category: string
  status: string
}

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

async function processUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, name, amount, currency, billing_cycle, category, status')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error(`[cost-advisor] Error fetching subs for ${userId}:`, error.message)
    return 0
  }

  if (!subs || subs.length < 2) return 0

  const typedSubs = subs as Subscription[]
  const subsText = typedSubs
    .map((s) => `${s.name}: $${s.amount}/${s.billing_cycle} (${s.category})`)
    .join('\n')

  const prompt = `Analyze these active subscriptions and identify:
1. Overlapping or duplicate services
2. Potentially unused subscriptions (high cost, niche category)
3. Cheaper alternatives for well-known services

Subscriptions:
${subsText}

Return ONLY valid JSON array: [{ "title": string, "body": string, "type": "optimization", "related_names": string[] }]
If no issues found, return [].`

  const result = await callClaude(prompt)
  const cleaned = result
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  let insights: Insight[]
  try {
    insights = JSON.parse(cleaned) as Insight[]
  } catch {
    console.error(`[cost-advisor] Failed to parse Claude response for ${userId}`)
    return 0
  }

  if (!Array.isArray(insights) || insights.length === 0) return 0

  for (const insight of insights) {
    const relatedIds = typedSubs
      .filter((s) => insight.related_names?.includes(s.name))
      .map((s) => s.id)

    const { error: insightError } = await supabase.from('ai_insights').insert({
      user_id: userId,
      type: insight.type || 'optimization',
      title: insight.title,
      body: insight.body,
      related_subscription_ids: relatedIds,
    })

    if (insightError) {
      console.error(`[cost-advisor] Insert insight error:`, insightError.message)
      continue
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'insight',
      title: insight.title,
      body: insight.body,
      channel: 'in_app',
    })
  }

  return insights.length
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: users, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    const uniqueUserIds = [...new Set((users ?? []).map((u: { user_id: string }) => u.user_id))]
    let totalInsights = 0

    for (const userId of uniqueUserIds) {
      const count = await processUser(supabase, userId)
      totalInsights += count
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_processed: uniqueUserIds.length,
        insights_generated: totalInsights,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[cost-advisor]', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
