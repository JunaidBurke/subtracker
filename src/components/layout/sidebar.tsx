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
    <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 border-r border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
          S
        </div>
        <span className="text-lg font-semibold text-white">SubTracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                'transition-all duration-200 min-h-[44px]',
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-blue-500'
                  : 'text-white/50 hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Notification bell */}
      <div className="mb-4">
        <NotificationBell />
      </div>

      {/* User area */}
      <div className="border-t border-white/[0.08] pt-4">
        <div className="flex items-center gap-3 px-4 py-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
          <span className="text-sm text-white/70">Account</span>
        </div>
      </div>
    </aside>
  )
}
