'use client'

import { motion } from 'framer-motion'

const stats = [
  { label: 'Unlimited Subscriptions', value: 'Track' },
  { label: 'AI-Powered Insights', value: 'Smart' },
  { label: 'Real-Time Alerts', value: 'Instant' },
]

export function StatsSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-24">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="flex justify-center"
      >
        <div className="grid w-full gap-px sm:grid-cols-3 border border-border rounded-xl overflow-hidden bg-border">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface-raised px-8 py-10 text-center">
              <p className="font-display text-2xl text-accent italic">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-text-tertiary">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
