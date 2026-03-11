import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface GlassBadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-subtle text-text-secondary',
  success: 'bg-status-active/15 text-status-active',
  warning: 'bg-status-warning/15 text-status-warning',
  danger: 'bg-status-danger/15 text-status-danger',
  info: 'bg-status-info/15 text-status-info',
}

export function GlassBadge({
  children,
  variant = 'default',
}: GlassBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase',
        variantStyles[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
