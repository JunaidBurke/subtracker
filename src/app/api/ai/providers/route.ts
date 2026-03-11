import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getAIProviderSettingsPayload } from '@/lib/ai/settings'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getAIProviderSettingsPayload(userId)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[ai-providers-get]', error)
    return NextResponse.json(
      { error: 'Failed to load AI provider settings' },
      { status: 500 }
    )
  }
}
