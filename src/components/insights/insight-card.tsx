'use client'

import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AIInsight, InsightType } from '@/types'
import { GlassCard } from '@/components/glass/glass-card'
import { GlassBadge } from '@/components/glass/glass-badge'
import { GlassButton } from '@/components/glass/glass-button'

const iconByType: Record<InsightType, React.ElementType> = {
  optimization: Lightbulb,
  forecast: TrendingUp,
  alert: AlertTriangle,
}

const badgeVariantByType: Record<InsightType, 'info' | 'success' | 'warning'> = {
  optimization: 'info',
  forecast: 'success',
  alert: 'warning',
}

const labelByType: Record<InsightType, string> = {
  optimization: 'Optimization',
  forecast: 'Forecast',
  alert: 'Alert',
}

interface InsightCardProps {
  insight: AIInsight
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
}

export function InsightCard({ insight, onDismiss, onMarkRead }: InsightCardProps) {
  const Icon = iconByType[insight.type]
  const timeAgo = formatDistanceToNow(new Date(insight.created_at), {
    addSuffix: true,
  })

  return (
    <GlassCard glow={!insight.is_read} hover={false}>
      <div className="flex items-start gap-4">
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            !insight.is_read
              ? 'bg-accent/15 text-accent'
              : 'bg-surface-subtle text-text-tertiary',
          ].join(' ')}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <GlassBadge variant={badgeVariantByType[insight.type]}>
              {labelByType[insight.type]}
            </GlassBadge>
            <span className="text-[11px] text-text-muted">{timeAgo}</span>
          </div>

          <h3 className="text-sm font-semibold text-text-primary">{insight.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{insight.body}</p>

          {insight.related_subscription_ids.length > 0 && (
            <p className="text-xs text-text-muted">
              Related subscriptions: {insight.related_subscription_ids.length}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(insight.id)}
            >
              Dismiss
            </GlassButton>
            {!insight.is_read && (
              <GlassButton
                variant="default"
                size="sm"
                onClick={() => onMarkRead(insight.id)}
              >
                Mark Read
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
