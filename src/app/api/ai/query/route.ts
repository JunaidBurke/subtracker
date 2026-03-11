import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/provider'
import { nlQueryPrompt } from '@/lib/ai/prompts'
import { getSubscriptions } from '@/lib/supabase/queries'
import { calculateMonthlyAmount } from '@/lib/utils/spend'
import { z } from 'zod'

const querySchema = z.object({
  question: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const { question } = querySchema.parse(body)

    const subscriptions = await getSubscriptions(userId)
    const context = subscriptions
      .map(
        (s) =>
          `- ${s.name}: $${s.amount}/${s.billing_cycle} (${s.category}, ${s.status}, renews ${s.next_renewal}, monthly equivalent: $${calculateMonthlyAmount(s).toFixed(2)})`
      )
      .join('\n')

    const totalMonthly = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + calculateMonthlyAmount(s), 0)

    const activeCount = subscriptions.filter(
      (s) => s.status === 'active'
    ).length

    const fullContext = `Total monthly spend: $${totalMonthly.toFixed(2)}\nActive subscriptions: ${activeCount}\n\nSubscriptions:\n${context}`

    const ai = getAIProvider()
    const response = await ai.analyzeText(nlQueryPrompt(fullContext, question))

    return NextResponse.json({ response })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[ai-query]', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}
