'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'

interface AIChatResponseProps {
  response: string | null
  onDismiss: () => void
}

export function AIChatResponse({ response, onDismiss }: AIChatResponseProps) {
  return (
    <AnimatePresence>
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full rounded-xl border border-border-accent bg-surface-raised p-5 shadow-[var(--shadow-accent)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-accent">
                AI Response
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-secondary"
              aria-label="Dismiss response"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {response}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
