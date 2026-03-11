import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateSubscriptionSchema } from '@/validators/subscription'
import {
  getSubscriptionById,
  getPriceHistoryBySubscriptionId,
  getInsightsBySubscriptionId,
  updateSubscription,
  deleteSubscription,
} from '@/lib/supabase/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const subscription = await getSubscriptionById(userId, id)
    const [price_history, related_insights] = await Promise.all([
      getPriceHistoryBySubscriptionId(subscription.id),
      getInsightsBySubscriptionId(userId, subscription.id),
    ])

    return NextResponse.json({
      subscription,
      price_history,
      related_insights,
    })
  } catch (error) {
    console.error('[subscription-get]', error)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: unknown = await request.json()
    const validated = updateSubscriptionSchema.parse(body)
    const data = await updateSubscription(userId, id, validated)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[subscription-put]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await deleteSubscription(userId, id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[subscription-delete]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
