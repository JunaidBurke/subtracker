'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { GlassCard } from '@/components/glass'
import { totalMonthlySpend } from '@/lib/utils/spend'
import type { Subscription } from '@/types'

interface MonthlyTrendProps {
  subscriptions: Subscription[]
}

interface TooltipPayloadItem {
  value: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-surface-raised px-4 py-2">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <p className="text-sm text-accent">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  )
}

function generateTrendData(subscriptions: Subscription[]) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  const currentSpend = totalMonthlySpend(subscriptions)

  return months.map((month, i) => {
    const variance = 1 - (months.length - 1 - i) * 0.05
    return {
      month,
      amount: Math.round(currentSpend * variance * 100) / 100,
    }
  })
}

export function MonthlyTrend({ subscriptions }: MonthlyTrendProps) {
  const data = generateTrendData(subscriptions)

  if (subscriptions.filter((s) => s.status === 'active').length === 0) {
    return (
      <GlassCard hover={false}>
        <h3 className="mb-4 font-display text-lg text-text-primary">
          Monthly Trend
        </h3>
        <p className="text-sm text-text-tertiary">
          No active subscriptions to display.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard hover={false}>
      <h3 className="mb-4 font-display text-lg text-text-primary">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a96e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#c9a96e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b6259', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b6259', fontSize: 12 }}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#c9a96e"
            strokeWidth={1.5}
            fill="url(#trendGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
