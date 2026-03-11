import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSubscriptionSchema } from '@/validators/subscription'
import {
  getSubscriptions,
  createSubscription,
} from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100)
    const offset = Number(searchParams.get('offset') || 0)

    const data = await getSubscriptions(userId, limit, offset)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[subscriptions-get]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const validated = createSubscriptionSchema.parse(body)
    const data = await createSubscription(userId, validated)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[subscriptions-post]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
