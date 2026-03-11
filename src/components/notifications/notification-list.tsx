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
      <div className="flex flex-col items-center justify-center py-10 text-white/40">
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
                'hover:bg-white/[0.06] min-h-[44px]',
                notification.is_read
                  ? 'bg-transparent'
                  : 'bg-white/[0.04]',
              ].join(' ')}
            >
              <div
                className={[
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  notification.is_read
                    ? 'bg-white/[0.06] text-white/40'
                    : 'bg-blue-500/20 text-blue-400',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    'text-sm font-medium truncate',
                    notification.is_read ? 'text-white/50' : 'text-white',
                  ].join(' ')}
                >
                  {notification.title}
                </p>
                <p className="text-xs text-white/40 line-clamp-2 mt-0.5">
                  {notification.body}
                </p>
                <p className="text-[11px] text-white/30 mt-1">{timeAgo}</p>
              </div>
              {!notification.is_read && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
