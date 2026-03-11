'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Lightbulb,
  Settings,
} from 'lucide-react'

interface NavTab {
  label: string
  href: string
  icon: React.ElementType
}

const tabs: NavTab[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Subs', href: '/dashboard/subscriptions', icon: CreditCard },
  { label: 'Insights', href: '/dashboard/insights', icon: Lightbulb },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-surface-base/95 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px]',
                'text-xs transition-colors duration-200',
                isActive
                  ? 'text-accent'
                  : 'text-text-tertiary hover:text-text-secondary',
              ].join(' ')}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
