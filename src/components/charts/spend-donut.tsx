'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { GlassCard } from '@/components/glass'
import { spendByCategory } from '@/lib/utils/spend'
import type { Subscription } from '@/types'

const COLORS = [
  '#c9a96e', // gold
  '#7a8a6e', // sage
  '#7a9ab5', // steel blue
  '#d4a574', // warm amber
  '#a3816a', // clay
  '#8b7a6e', // stone
  '#6b8a7a', // fern
  '#9a8a7a', // driftwood
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
    <div className="rounded-lg border border-border bg-surface-raised px-4 py-2">
      <p className="text-sm font-medium text-text-primary">{item.name}</p>
      <p className="text-sm text-accent">
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
        <h3 className="mb-4 font-display text-lg text-text-primary">
          Spend by Category
        </h3>
        <p className="text-sm text-text-tertiary">
          No active subscriptions to display.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard hover={false}>
      <h3 className="mb-4 font-display text-lg text-text-primary">
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
              <span className="text-xs text-text-secondary">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
