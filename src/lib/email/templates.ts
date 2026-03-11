// ---------------------------------------------------------------------------
// Email Templates — plain HTML strings for Edge Function compatibility
// ---------------------------------------------------------------------------

export interface WeeklyDigestData {
  totalMonthlySpend: number
  upcomingRenewals: Array<{ name: string; amount: number; date: string }>
  newInsights: Array<{ title: string; body: string }>
  currency: string
}

export interface RenewalReminderData {
  subscriptionName: string
  amount: number
  currency: string
  renewalDate: string
  daysUntil: number
}

export interface PriceChangeData {
  subscriptionName: string
  oldAmount: number
  newAmount: number
  currency: string
  changePercent: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a1a;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
${body}
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<span style="color:rgba(255,255,255,0.3);font-size:12px;">SubTracker</span>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Template 1 — Weekly Digest
// ---------------------------------------------------------------------------

export function weeklyDigestTemplate(data: WeeklyDigestData): string {
  const { totalMonthlySpend, upcomingRenewals, newInsights, currency } = data

  const renewalRows = upcomingRenewals
    .map(
      (r) => `<tr>
<td style="padding:8px 0;color:#e2e8f0;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.04);">${r.name}</td>
<td style="padding:8px 0;color:#e2e8f0;font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04);">${formatCurrency(r.amount, currency)}</td>
<td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04);">${r.date}</td>
</tr>`
    )
    .join('')

  const renewalsSection =
    upcomingRenewals.length > 0
      ? `<tr><td style="padding:24px 32px 8px;">
<h2 style="margin:0;color:#e2e8f0;font-size:16px;font-weight:600;">Upcoming Renewals</h2>
</td></tr>
<tr><td style="padding:0 32px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<th style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid rgba(255,255,255,0.08);">Name</th>
<th style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid rgba(255,255,255,0.08);">Amount</th>
<th style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid rgba(255,255,255,0.08);">Date</th>
</tr>
${renewalRows}
</table>
</td></tr>`
      : ''

  const insightItems = newInsights
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
<strong style="color:#e2e8f0;font-size:14px;">${i.title}</strong>
<p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.4;">${i.body}</p>
</td></tr>`
    )
    .join('')

  const insightsSection =
    newInsights.length > 0
      ? `<tr><td style="padding:24px 32px 8px;">
<h2 style="margin:0;color:#e2e8f0;font-size:16px;font-weight:600;">AI Insights</h2>
</td></tr>
<tr><td style="padding:0 32px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${insightItems}
</table>
</td></tr>`
      : ''

  const body = `<tr><td style="padding:32px 32px 16px;">
<h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Your Weekly Subscription Digest</h1>
</td></tr>
<tr><td style="padding:0 32px 24px;">
<div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:20px;text-align:center;">
<span style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Monthly Spend</span>
<div style="color:#818cf8;font-size:32px;font-weight:700;margin-top:4px;">${formatCurrency(totalMonthlySpend, currency)}</div>
</div>
</td></tr>
${renewalsSection}
${insightsSection}`

  return shell('Weekly Subscription Digest', body)
}

// ---------------------------------------------------------------------------
// Template 2 — Renewal Reminder
// ---------------------------------------------------------------------------

export function renewalReminderTemplate(data: RenewalReminderData): string {
  const { subscriptionName, amount, currency, renewalDate, daysUntil } = data
  const formattedAmount = formatCurrency(amount, currency)
  const daysLabel = daysUntil === 1 ? 'day' : 'days'

  const body = `<tr><td style="padding:32px 32px 16px;">
<h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Renewal Reminder</h1>
</td></tr>
<tr><td style="padding:0 32px 24px;">
<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:12px;padding:24px;text-align:center;">
<p style="margin:0;color:#fbbf24;font-size:18px;font-weight:600;">${subscriptionName} (${formattedAmount})</p>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;">renews in <strong style="color:#fbbf24;">${daysUntil} ${daysLabel}</strong></p>
<p style="margin:12px 0 0;color:rgba(255,255,255,0.4);font-size:13px;">${renewalDate}</p>
</div>
</td></tr>`

  return shell('Renewal Reminder', body)
}

// ---------------------------------------------------------------------------
// Template 3 — Price Change Alert
// ---------------------------------------------------------------------------

export function priceChangeTemplate(data: PriceChangeData): string {
  const { subscriptionName, oldAmount, newAmount, currency, changePercent } =
    data
  const formattedOld = formatCurrency(oldAmount, currency)
  const formattedNew = formatCurrency(newAmount, currency)
  const isIncrease = changePercent > 0
  const changeColor = isIncrease ? '#f87171' : '#34d399'
  const arrow = isIncrease ? '&#9650;' : '&#9660;'
  const sign = isIncrease ? '+' : ''

  const body = `<tr><td style="padding:32px 32px 16px;">
<h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Price Change Alert</h1>
</td></tr>
<tr><td style="padding:0 32px 8px;">
<p style="margin:0;color:rgba(255,255,255,0.6);font-size:15px;">${subscriptionName} has changed its pricing.</p>
</td></tr>
<tr><td style="padding:0 32px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="45%" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;">
<span style="color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Old Price</span>
<div style="color:rgba(255,255,255,0.5);font-size:24px;font-weight:700;margin-top:4px;text-decoration:line-through;">${formattedOld}</div>
</td>
<td width="10%" style="text-align:center;color:rgba(255,255,255,0.3);font-size:20px;">&#8594;</td>
<td width="45%" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;">
<span style="color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">New Price</span>
<div style="color:#e2e8f0;font-size:24px;font-weight:700;margin-top:4px;">${formattedNew}</div>
</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:0 32px 24px;text-align:center;">
<span style="color:${changeColor};font-size:14px;font-weight:600;">${arrow} ${sign}${changePercent.toFixed(1)}%</span>
</td></tr>`

  return shell('Price Change Alert', body)
}
