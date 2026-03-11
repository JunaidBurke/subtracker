'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { GlassCard } from '@/components/glass/glass-card'
import type { PriceHistory } from '@/types'

interface PriceHistoryChartProps {
  data: PriceHistory[]
}

interface TooltipPayloadItem {
  value: number
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  })
}

function ChartTooltip({
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
    <div className="rounded-lg border border-border bg-surface-raised px-3 py-2">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm font-semibold text-accent">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  )
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const chartData = data.map((item) => ({
    date: formatDate(item.recorded_at),
    amount: item.amount,
  }))

  return (
    <GlassCard hover={false}>
      <h3 className="font-display text-lg text-text-primary mb-4">Price History</h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-8">
          No price history available yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              stroke="#1a1a1a"
              tick={{ fill: '#6b6259', fontSize: 12 }}
            />
            <YAxis
              stroke="#1a1a1a"
              tick={{ fill: '#6b6259', fontSize: 12 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#c9a96e"
              strokeWidth={1.5}
              dot={{ fill: '#c9a96e', r: 4 }}
              activeDot={{ r: 6, fill: '#dbbe84' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  )
}
