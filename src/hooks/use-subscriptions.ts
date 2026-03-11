'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Subscription } from '@/types'

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/subscriptions')
      if (!res.ok) throw new Error('Failed to fetch subscriptions')
      const data: Subscription[] = await res.json()
      setSubscriptions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return { subscriptions, loading, error, refetch: fetchSubscriptions }
}
