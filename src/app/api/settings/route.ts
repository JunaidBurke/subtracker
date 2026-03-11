import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_CATEGORIES } from '@/lib/constants/subscriptions'
import { DEFAULT_PROVIDER_ID, getDefaultModelForProvider } from '@/lib/ai/catalog'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getOrCreateUserSettings } from '@/lib/ai/settings'
import { providerIdSchema } from '@/validators/ai-provider'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  email_digest: z.boolean().optional(),
  email_alerts: z.boolean().optional(),
  in_app_alerts: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  categories: z.array(z.string().min(1).max(50)).optional(),
  default_ai_provider: providerIdSchema.optional(),
  default_ai_model: z.string().min(1).max(120).optional(),
})

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getOrCreateUserSettings(userId)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[settings-get]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const validated = updateSettingsSchema.parse(body)
    const existing = await getOrCreateUserSettings(userId)

    const nextProvider =
      validated.default_ai_provider ?? existing.default_ai_provider ?? DEFAULT_PROVIDER_ID

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          categories: validated.categories ?? existing.categories ?? DEFAULT_CATEGORIES,
          default_ai_provider: nextProvider,
          default_ai_model:
            validated.default_ai_model ??
            existing.default_ai_model ??
            getDefaultModelForProvider(nextProvider),
          ...validated,
        },
        { onConflict: 'user_id' }
      )
      .select(
        'id, user_id, email_digest, email_alerts, in_app_alerts, currency, categories, default_ai_provider, default_ai_model'
      )
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[settings-put]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
