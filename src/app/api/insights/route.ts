import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserInsights, regenerateUserInsights } from '@/lib/ai/insights'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const type = searchParams.get('type')
    const limit = Math.min(Number(searchParams.get('limit') || 20), 50)

    try {
      await ensureUserInsights(userId)
    } catch (generationError) {
      console.error('[insights-generate-on-read]', generationError)
    }

    const supabase = createSupabaseAdmin()
    let query = supabase
      .from('ai_insights')
      .select('id, user_id, type, title, body, related_subscription_ids, is_read, is_dismissed, created_at')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[insights-get]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await regenerateUserInsights(userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[insights-post]', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh insights',
      },
      { status: 500 }
    )
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  is_read: z.boolean().optional(),
  is_dismissed: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = updateSchema.parse(body)

    const supabase = createSupabaseAdmin()
    const { error } = await supabase
      .from('ai_insights')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[insights-put]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
