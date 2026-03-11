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

function GlassTooltip({
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
    <div className="rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl px-3 py-2">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-sm font-semibold text-white">
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
      <h3 className="text-lg font-semibold text-white mb-4">Price History</h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">
          No price history available yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip content={<GlassTooltip />} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="url(#gradient)"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6, fill: '#3b82f6' }}
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  )
}
