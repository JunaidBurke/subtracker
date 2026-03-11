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
}

export function AddSubscriptionModal({
  open,
  onClose,
  onSubmit,
  loading = false,
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={[
              'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
              'rounded-2xl border p-6 backdrop-blur-xl',
              'bg-white/5 border-white/10',
              'shadow-[var(--shadow-glass)]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Add Subscription
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
