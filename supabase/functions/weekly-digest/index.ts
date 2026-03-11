// supabase/functions/weekly-digest/index.ts
// Scheduled: Mondays 8am UTC via pg_cron
// Sends weekly email digest with spend summary, upcoming renewals, and insights.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billing_cycle: string
  category: string
  next_renewal: string
}

interface Insight {
  title: string
  body: string
}

interface UserSettings {
  email_digest: boolean
  currency: string
}

function toMonthlyAmount(amount: number, cycle: string): number {
  switch (cycle) {
    case 'weekly':
      return amount * 4.33
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function buildEmailHtml(params: {
  totalMonthly: number
  currency: string
  subscriptionCount: number
  upcomingRenewals: Subscription[]
  insights: Insight[]
}): string {
  const { totalMonthly, currency, subscriptionCount, upcomingRenewals, insights } =
    params

  const renewalRows = upcomingRenewals
    .map(
      (sub) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${sub.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(sub.amount, currency)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${sub.next_renewal}</td>
      </tr>`
    )
    .join('')

  const insightBlocks = insights
    .map(
      (insight) => `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 8px; border-radius: 4px;">
        <strong>${insight.title}</strong>
        <p style="margin: 4px 0 0; color: #92400e; font-size: 14px;">${insight.body}</p>
      </div>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background: #1e293b; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Weekly Subscription Digest</h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Your spending summary for the week</p>
      </div>

      <!-- Spend Summary -->
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
        <p style="color: #64748b; margin: 0 0 4px; font-size: 14px;">Monthly Spend</p>
        <p style="color: #1e293b; margin: 0; font-size: 36px; font-weight: 700;">${formatCurrency(totalMonthly, currency)}</p>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px;">${subscriptionCount} active subscription${subscriptionCount === 1 ? '' : 's'}</p>
      </div>

      ${
        upcomingRenewals.length > 0
          ? `
      <!-- Upcoming Renewals -->
      <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">Upcoming Renewals (Next 7 Days)</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #64748b;">Service</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #64748b;">Amount</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #64748b;">Date</th>
            </tr>
          </thead>
          <tbody>${renewalRows}</tbody>
        </table>
      </div>`
          : ''
      }

      ${
        insights.length > 0
          ? `
      <!-- Insights -->
      <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">AI Insights</h2>
        ${insightBlocks}
      </div>`
          : ''
      }

      <!-- Footer -->
      <div style="padding: 16px 24px; text-align: center; background: #f8fafc;">
        <p style="color: #94a3b8; margin: 0; font-size: 12px;">
          You received this because email digests are enabled in your settings.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'SubTracker <digest@subtracker.app>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[weekly-digest] Resend error: ${errorText}`)
    return false
  }

  return true
}

async function processUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  // Check user settings for email digest opt-in
  const { data: settings } = await supabase
    .from('user_settings')
    .select('email_digest, currency')
    .eq('user_id', userId)
    .single()

  const typedSettings = settings as UserSettings | null
  if (typedSettings && !typedSettings.email_digest) return false

  const currency = typedSettings?.currency ?? 'USD'

  // Get active subscriptions
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, name, amount, currency, billing_cycle, category, next_renewal')
    .eq('user_id', userId)
    .eq('status', 'active')

  const typedSubs = (subs ?? []) as Subscription[]
  if (typedSubs.length === 0) return false

  // Calculate total monthly spend
  const totalMonthly = typedSubs.reduce(
    (sum, s) => sum + toMonthlyAmount(s.amount, s.billing_cycle),
    0
  )

  // Get upcoming renewals for next 7 days
  const now = new Date()
  const sevenDaysOut = new Date(now)
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)

  const upcomingRenewals = typedSubs.filter((s) => {
    const renewal = new Date(s.next_renewal)
    return renewal >= now && renewal <= sevenDaysOut
  })

  // Get recent unread insights
  const { data: insightRows } = await supabase
    .from('ai_insights')
    .select('title, body')
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const insights = (insightRows ?? []) as Insight[]

  // Build and send email
  // Note: In production, you'd look up the user's email from Clerk.
  // For now, we use a placeholder approach — the email address would be
  // fetched from Clerk's API using the userId.
  const clerkResponse = await fetch(
    `https://api.clerk.com/v1/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${Deno.env.get('CLERK_SECRET_KEY')}`,
      },
    }
  )

  if (!clerkResponse.ok) {
    console.error(`[weekly-digest] Failed to fetch Clerk user ${userId}`)
    return false
  }

  const clerkUser = await clerkResponse.json()
  const emailAddress =
    clerkUser.email_addresses?.find(
      (e: { id: string }) => e.id === clerkUser.primary_email_address_id
    )?.email_address ?? null

  if (!emailAddress) {
    console.error(`[weekly-digest] No email for user ${userId}`)
    return false
  }

  const html = buildEmailHtml({
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    currency,
    subscriptionCount: typedSubs.length,
    upcomingRenewals,
    insights,
  })

  const sent = await sendEmail(
    emailAddress,
    `Your Weekly Subscription Digest - ${formatCurrency(totalMonthly, currency)}/mo`,
    html
  )

  if (sent) {
    // Record email notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'digest',
      title: 'Weekly digest sent',
      body: `Digest email sent to ${emailAddress}`,
      channel: 'email',
    })
  }

  // Always create in-app notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'digest',
    title: 'Weekly Subscription Digest',
    body: `You have ${typedSubs.length} active subscriptions totaling ${formatCurrency(totalMonthly, currency)}/mo. ${upcomingRenewals.length} renewal${upcomingRenewals.length === 1 ? '' : 's'} coming up this week.`,
    channel: 'in_app',
  })

  return true
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

    const uniqueUserIds = [
      ...new Set((users ?? []).map((u: { user_id: string }) => u.user_id)),
    ]

    let emailsSent = 0
    for (const userId of uniqueUserIds) {
      const sent = await processUser(supabase, userId)
      if (sent) emailsSent++
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_processed: uniqueUserIds.length,
        emails_sent: emailsSent,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[weekly-digest]', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
