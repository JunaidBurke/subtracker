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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={
        hover
          ? { scale: 1.02, boxShadow: 'var(--shadow-glass-lg)' }
          : undefined
      }
      className={[
        'relative rounded-2xl border p-6 backdrop-blur-xl',
        'bg-white/5 border-white/10',
        'shadow-[var(--shadow-glass)]',
        'transition-colors duration-200',
        glow && 'glass-glow',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {glow && (
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
      )}
      {children}
    </motion.div>
  )
}
