'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { SubscriptionForm } from './subscription-form'

interface AddSubscriptionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  loading?: boolean
  error?: string | null
}

export function AddSubscriptionModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: AddSubscriptionModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            role="presentation"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={[
              'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
              'rounded-xl border p-6',
              'bg-surface-raised border-border',
              'shadow-[var(--shadow-lg)]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-text-primary">
                Add Subscription
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SubscriptionForm
              mode="create"
              onSubmit={(data) => onSubmit(data as unknown as Record<string, unknown>)}
              onCancel={onClose}
              loading={loading}
            />
            {error ? (
              <p className="mt-4 rounded-lg border border-status-danger/20 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
                {error}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
