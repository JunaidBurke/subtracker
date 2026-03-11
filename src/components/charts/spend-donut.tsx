'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { GlassCard } from '@/components/glass'
import { spendByCategory } from '@/lib/utils/spend'
import type { Subscription } from '@/types'

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
]

interface SpendDonutProps {
  subscriptions: Subscription[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { name: string; value: number; fill: string }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) return null

  const item = payload[0]
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">
      <p className="text-sm font-medium text-white">{item.name}</p>
      <p className="text-sm text-white/70">
        ${item.value.toFixed(2)}/mo
      </p>
    </div>
  )
}

export function SpendDonut({ subscriptions }: SpendDonutProps) {
  const categorySpend = spendByCategory(subscriptions)
  const data = Object.entries(categorySpend).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }))

  if (data.length === 0) {
    return (
      <GlassCard hover={false}>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Spend by Category
        </h3>
        <p className="text-sm text-white/50">
          No active subscriptions to display.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard hover={false}>
      <h3 className="mb-4 text-lg font-semibold text-white">
        Spend by Category
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                opacity={0.85}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-xs text-white/70">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
