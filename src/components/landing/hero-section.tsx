'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 pt-24 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
      >
        Track Every Subscription.{' '}
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Save Intelligently.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl"
      >
        AI-powered subscription tracking with spend insights, cost optimization,
        and smart forecasting.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-10"
      >
        <Link
          href="/sign-up"
          className="inline-flex min-h-[48px] items-center rounded-xl border border-white/10 bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-8 py-3 text-base font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-purple-500 hover:shadow-[var(--shadow-glow)]"
        >
          Get Started
        </Link>
      </motion.div>
    </section>
  )
}
