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
          'flex items-center gap-3 rounded-full border px-4 py-3',
          'bg-white/5 backdrop-blur-xl',
          'border-white/10',
          'shadow-[var(--shadow-glass)]',
          'transition-all duration-300',
          loading && 'animate-pulse border-purple-500/40 shadow-purple-500/20',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Sparkles className="h-5 w-5 shrink-0 text-purple-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your subscriptions..."
          disabled={loading}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 transition-colors hover:bg-purple-500/30 disabled:opacity-30 disabled:hover:bg-purple-500/20"
          aria-label="Send question"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
