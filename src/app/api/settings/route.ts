import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const DEFAULT_CATEGORIES = [
  'streaming',
  'dev-tools',
  'productivity',
  'entertainment',
  'cloud',
  'finance',
  'health',
  'education',
  'other',
]

const updateSettingsSchema = z.object({
  email_digest: z.boolean().optional(),
  email_alerts: z.boolean().optional(),
  in_app_alerts: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  categories: z.array(z.string().min(1).max(50)).optional(),
})

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdmin()
    const { data: existingData, error } = await supabase
      .from('user_settings')
      .select('id, user_id, email_digest, email_alerts, in_app_alerts, currency, categories')
      .eq('user_id', userId)
      .single()

    if (error || !existingData) {
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          categories: DEFAULT_CATEGORIES,
        })
        .select('id, user_id, email_digest, email_alerts, in_app_alerts, currency, categories')
        .single()

      if (createError) throw createError
      return NextResponse.json(newSettings)
    }

    return NextResponse.json(existingData)
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

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('user_settings')
      .update(validated)
      .eq('user_id', userId)
      .select('id, user_id, email_digest, email_alerts, in_app_alerts, currency, categories')
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
