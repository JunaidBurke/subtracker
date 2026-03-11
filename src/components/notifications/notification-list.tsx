'use client'

import { Bell, TrendingUp, Mail, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Notification, NotificationType } from '@/types'

const iconByType: Record<NotificationType, React.ElementType> = {
  renewal_reminder: Bell,
  price_change: TrendingUp,
  digest: Mail,
  insight: Sparkles,
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}

export function NotificationList({
  notifications,
  onMarkRead,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
        <Bell className="h-8 w-8 mb-3 opacity-50" />
        <p className="text-sm">No notifications yet</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {notifications.map((notification) => {
        const Icon = iconByType[notification.type] || Bell
        const timeAgo = formatDistanceToNow(new Date(notification.sent_at), {
          addSuffix: true,
        })

        return (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => {
                if (!notification.is_read) {
                  onMarkRead(notification.id)
                }
              }}
              className={[
                'flex items-start gap-3 w-full px-4 py-3 text-left',
                'transition-colors duration-150 cursor-pointer',
                'hover:bg-surface-overlay min-h-[44px]',
                notification.is_read
                  ? 'bg-transparent'
                  : 'bg-surface-overlay/50',
              ].join(' ')}
            >
              <div
                className={[
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  notification.is_read
                    ? 'bg-surface-subtle text-text-tertiary'
                    : 'bg-accent/15 text-accent',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    'text-sm font-medium truncate',
                    notification.is_read ? 'text-text-tertiary' : 'text-text-primary',
                  ].join(' ')}
                >
                  {notification.title}
                </p>
                <p className="text-xs text-text-tertiary line-clamp-2 mt-0.5">
                  {notification.body}
                </p>
                <p className="text-[11px] text-text-muted mt-1">{timeAgo}</p>
              </div>
              {!notification.is_read && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
