import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const limit = Math.min(Number(searchParams.get('limit') || 20), 50)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    const supabase = createSupabaseAdmin()
    let query = supabase
      .from('notifications')
      .select('id, user_id, type, title, body, channel, is_read, sent_at')
      .eq('user_id', userId)
      .eq('channel', 'in_app')
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[notifications-get]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const { id } = body as { id: string }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid notification id' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications-put]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
