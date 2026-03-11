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

      {/* Glass Nav Bar */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
        <Link href="/" className="text-lg font-bold text-white">
          SubTracker
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white transition-all duration-200 hover:bg-white/15"
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
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/40">
        <p>&copy; {new Date().getFullYear()} SubTracker. All rights reserved.</p>
      </footer>
    </div>
  )
}
