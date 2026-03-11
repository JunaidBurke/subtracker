'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
}

export function GlassCard({
  children,
  className = '',
  glow = false,
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={
        hover
          ? { boxShadow: 'var(--shadow-lg)' }
          : undefined
      }
      className={[
        'relative rounded-xl border p-6',
        'bg-surface-raised border-border',
        'shadow-[var(--shadow-sm)]',
        'transition-colors duration-300',
        glow && 'border-border-accent shadow-[var(--shadow-accent)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </motion.div>
  )
}
