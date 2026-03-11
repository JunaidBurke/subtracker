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
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 w-full min-h-[44px] cursor-pointer"
      >
        <Bell className="h-5 w-5 shrink-0" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={[
            'absolute bottom-full left-0 mb-2 w-[320px] max-h-[400px]',
            'overflow-y-auto rounded-2xl border',
            'bg-[#0a0a0f]/95 border-white/[0.08] backdrop-blur-xl',
            'shadow-[var(--shadow-glass-sm)]',
            'z-50',
          ].join(' ')}
        >
          <div className="px-4 py-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
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
