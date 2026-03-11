import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getDefaultModelForProvider } from '@/lib/ai/catalog'
import { executeAIRequest } from '@/lib/ai/provider'
import { getOrCreateUserSettings } from '@/lib/ai/settings'
import { nlQueryPrompt } from '@/lib/ai/prompts'
import { getSubscriptions } from '@/lib/supabase/queries'
import { calculateMonthlyAmount } from '@/lib/utils/spend'
import { aiQuerySchema } from '@/validators/ai-provider'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const { question, selection } = aiQuerySchema.parse(body)

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
    const settings = await getOrCreateUserSettings(userId)
    const provider = selection?.provider ?? settings.default_ai_provider
    const model =
      selection?.model ??
      settings.default_ai_model ??
      getDefaultModelForProvider(provider)

    const result = await executeAIRequest({
      provider,
      model,
      userId,
      prompt: nlQueryPrompt(fullContext, question),
    })

    return NextResponse.json(result, {
      status: result.error ? 400 : 200,
    })
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
