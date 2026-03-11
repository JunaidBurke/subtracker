'use client'

import { Upload, Lightbulb, TrendingUp, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

const features: Feature[] = [
  {
    title: 'Smart Entry',
    description: 'Upload receipts, AI extracts details automatically.',
    icon: Upload,
  },
  {
    title: 'Cost Advisor',
    description: 'AI finds savings opportunities across your subscriptions.',
    icon: Lightbulb,
  },
  {
    title: 'Spend Forecasting',
    description: 'Predict and track spending trends over time.',
    icon: TrendingUp,
  },
  {
    title: 'Natural Language',
    description: 'Ask questions about your subscriptions in plain English.',
    icon: MessageCircle,
  },
]

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      <div className="grid gap-6 sm:grid-cols-2">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glass-lg)' }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[var(--shadow-glass)] transition-colors duration-200"
          >
            <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3">
              <feature.icon className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/50">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
