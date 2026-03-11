'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Sparkles, Send } from 'lucide-react'

interface AIChatInputProps {
  onSubmit: (question: string) => void
  loading?: boolean
}

export function AIChatInput({ onSubmit, loading = false }: AIChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={[
          'flex items-center gap-3 rounded-lg border px-4 py-3',
          'bg-surface-raised',
          'border-border',
          'shadow-[var(--shadow-sm)]',
          'transition-all duration-300',
          loading && 'animate-pulse border-accent/30',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Sparkles className="h-5 w-5 shrink-0 text-accent" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your subscriptions..."
          disabled={loading}
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:opacity-30 disabled:hover:bg-accent/15"
          aria-label="Send question"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
