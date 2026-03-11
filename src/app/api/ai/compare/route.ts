import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { compareModelsSchema } from '@/validators/ai-provider'
import { nlQueryPrompt } from '@/lib/ai/prompts'
import { getSubscriptions } from '@/lib/supabase/queries'
import { calculateMonthlyAmount } from '@/lib/utils/spend'
import { executeAIComparison } from '@/lib/ai/provider'
import { z } from 'zod'

function buildSubscriptionContext(subscriptions: Awaited<ReturnType<typeof getSubscriptions>>) {
  const context = subscriptions
    .map(
      (s) =>
        `- ${s.name}: $${s.amount}/${s.billing_cycle} (${s.category}, ${s.status}, renews ${s.next_renewal}, monthly equivalent: $${calculateMonthlyAmount(s).toFixed(2)})`
    )
    .join('\n')

  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + calculateMonthlyAmount(s), 0)

  const activeCount = subscriptions.filter((s) => s.status === 'active').length

  return `Total monthly spend: $${totalMonthly.toFixed(2)}\nActive subscriptions: ${activeCount}\n\nSubscriptions:\n${context}`
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const { question, selections } = compareModelsSchema.parse(body)
    const subscriptions = await getSubscriptions(userId)
    const prompt = nlQueryPrompt(buildSubscriptionContext(subscriptions), question)
    const results = await executeAIComparison(userId, prompt, selections)

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    console.error('[ai-compare]', error)
    return NextResponse.json(
      { error: 'Failed to compare AI models' },
      { status: 500 }
    )
  }
}
