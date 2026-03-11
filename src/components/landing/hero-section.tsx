'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center px-4 pt-24 text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="mb-6 text-sm font-medium tracking-[0.2em] uppercase text-accent"
      >
        Subscription Intelligence
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-3xl font-display text-5xl leading-[1.1] tracking-tight text-text-primary sm:text-6xl md:text-7xl"
      >
        Track every subscription.{' '}
        <em className="text-accent">Save intelligently.</em>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-text-secondary"
      >
        AI-powered insights on your recurring spend. Know where your money goes,
        before it leaves.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-12 flex items-center gap-6"
      >
        <Link
          href="/sign-up"
          className="group inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-accent px-8 py-3 text-base font-semibold text-surface-base transition-all duration-300 hover:bg-accent-hover hover:shadow-[var(--shadow-accent)]"
        >
          Get Started
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex min-h-[48px] items-center px-4 py-3 text-base text-text-secondary transition-colors duration-200 hover:text-text-primary"
        >
          Sign In
        </Link>
      </motion.div>
    </section>
  )
}
