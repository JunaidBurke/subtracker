'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) return
      const data: Notification[] = await res.json()
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refetch: fetchNotifications,
  }
}
