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
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={[
        'rounded-3xl border p-8 backdrop-blur-xl',
        'bg-white/[0.03] border-white/[0.08]',
        'shadow-[var(--shadow-glass-sm)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </motion.div>
  )
}
