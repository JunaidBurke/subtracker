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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full rounded-2xl border border-purple-500/30 bg-white/5 p-5 backdrop-blur-xl shadow-[var(--shadow-glass)]"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
            style={{
              background:
                'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">
                AI Response
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              aria-label="Dismiss response"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {response}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
