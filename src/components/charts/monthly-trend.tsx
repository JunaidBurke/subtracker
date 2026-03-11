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
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-sm text-white/70">
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
        <h3 className="mb-4 text-lg font-semibold text-white">
          Monthly Trend
        </h3>
        <p className="text-sm text-white/50">
          No active subscriptions to display.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard hover={false}>
      <h3 className="mb-4 text-lg font-semibold text-white">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#trendGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
