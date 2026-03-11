'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AIInsight } from '@/types'

export function useInsights(type?: string) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      const res = await fetch(`/api/insights?${params}`)
      if (!res.ok) throw new Error('Failed to fetch insights')
      const data = await res.json()
      setInsights(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [type])

  const markRead = useCallback(async (id: string) => {
    await fetch('/api/insights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_read: true }),
    })
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i))
  }, [])

  const dismiss = useCallback(async (id: string) => {
    await fetch('/api/insights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_dismissed: true }),
    })
    setInsights(prev => prev.filter(i => i.id !== id))
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return { insights, loading, error, markRead, dismiss, refetch: fetchInsights }
}
