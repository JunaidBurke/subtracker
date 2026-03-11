'use client'

import { type ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-base">
      <Sidebar />
      <main className="md:ml-[260px] min-h-screen pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
