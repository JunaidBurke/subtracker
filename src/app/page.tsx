import Link from 'next/link'
import {
  AnimatedBackground,
  HeroSection,
  FeatureCards,
  StatsSection,
} from '@/components/landing'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg text-text-primary tracking-tight">
          SubTracker
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-all duration-200 hover:border-border-accent hover:text-text-primary"
        >
          Sign In
        </Link>
      </nav>

      <main>
        <HeroSection />
        <FeatureCards />
        <StatsSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-text-tertiary">
        <p>&copy; {new Date().getFullYear()} SubTracker. All rights reserved.</p>
      </footer>
    </div>
  )
}
