'use client'

import { useRef, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationList } from '@/components/notifications/notification-list'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-all duration-200 w-full min-h-[44px] cursor-pointer"
      >
        <Bell className="h-[18px] w-[18px] shrink-0" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-status-danger px-1.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={[
            'absolute bottom-full left-0 mb-2 w-[320px] max-h-[400px]',
            'overflow-y-auto rounded-xl border',
            'bg-surface-raised border-border',
            'shadow-[var(--shadow-lg)]',
            'z-50',
          ].join(' ')}
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          </div>
          <NotificationList
            notifications={notifications}
            onMarkRead={markAsRead}
          />
        </div>
      )}
    </div>
  )
}
