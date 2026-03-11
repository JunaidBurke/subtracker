import type { Subscription } from '@/types'

export function calculateMonthlyAmount(sub: Subscription): number {
  switch (sub.billing_cycle) {
    case 'weekly':
      return sub.amount * 4.33
    case 'monthly':
      return sub.amount
    case 'yearly':
      return sub.amount / 12
  }
}

export function totalMonthlySpend(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + calculateMonthlyAmount(s), 0)
}

export function spendByCategory(
  subs: Subscription[]
): Record<string, number> {
  return subs
    .filter((s) => s.status === 'active')
    .reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + calculateMonthlyAmount(s)
        return acc
      },
      {} as Record<string, number>
    )
}
