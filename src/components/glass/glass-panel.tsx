'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassPanelProps {
  children: ReactNode
  className?: string
}

export function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={[
        'rounded-xl border p-8',
        'bg-surface-raised border-border',
        'shadow-[var(--shadow-sm)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </motion.div>
  )
}
