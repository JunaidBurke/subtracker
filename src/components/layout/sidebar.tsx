'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Lightbulb,
  Settings,
} from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { NotificationBell } from '@/components/layout/notification-bell'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Subscriptions', href: '/dashboard/subscriptions', icon: CreditCard },
  { label: 'Insights', href: '/dashboard/insights', icon: Lightbulb },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 border-r border-border bg-surface-base p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center text-surface-base text-sm font-bold">
          S
        </div>
        <span className="font-display text-lg text-text-primary tracking-tight">SubTracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-200 min-h-[44px]',
                isActive
                  ? 'bg-surface-overlay text-accent'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-overlay',
              ].join(' ')}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Notification bell */}
      <div className="mb-3">
        <NotificationBell />
      </div>

      {/* User area */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
          <span className="text-sm text-text-secondary">Account</span>
        </div>
      </div>
    </aside>
  )
}
