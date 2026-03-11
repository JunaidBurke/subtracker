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
    description: 'Upload receipts or confirmation emails. AI extracts every detail automatically.',
    icon: Upload,
  },
  {
    title: 'Cost Advisor',
    description: 'Surface savings opportunities you would never spot on your own.',
    icon: Lightbulb,
  },
  {
    title: 'Spend Forecasting',
    description: 'See where your money is headed. Predict and plan with confidence.',
    icon: TrendingUp,
  },
  {
    title: 'Natural Language',
    description: 'Ask anything about your subscriptions in plain English.',
    icon: MessageCircle,
  },
]

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center text-sm font-medium tracking-[0.2em] uppercase text-text-tertiary"
      >
        What sets us apart
      </motion.p>
      <div className="grid gap-px sm:grid-cols-2 border border-border rounded-xl overflow-hidden bg-border">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-surface-raised p-8 transition-colors duration-300 hover:bg-surface-overlay"
          >
            <feature.icon className="mb-5 h-5 w-5 text-accent" />
            <h3 className="mb-2 font-display text-lg text-text-primary">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
