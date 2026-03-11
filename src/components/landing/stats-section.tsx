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
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[var(--shadow-glass)]"
      >
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
