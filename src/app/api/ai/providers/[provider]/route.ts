import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAIProviderSettingsPayload, removeProviderCredential, saveProviderCredential, updateAIPreferences } from '@/lib/ai/settings'
import { getDefaultModelForProvider } from '@/lib/ai/catalog'
import { MissingAIConfigError } from '@/lib/ai/crypto'
import { testAIConnection } from '@/lib/ai/provider'
import {
  providerIdSchema,
  testProviderCredentialSchema,
  updateProviderCredentialSchema,
} from '@/validators/ai-provider'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ provider: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const routeProvider = providerIdSchema.parse(params.provider)
    const body: unknown = await request.json()
    const requestPayload =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const validated = updateProviderCredentialSchema.parse({
      ...requestPayload,
      provider: routeProvider,
    })

    await saveProviderCredential(userId, validated.provider, validated.apiKey)

    if (validated.defaultModel) {
      await updateAIPreferences(userId, {
        default_ai_provider: validated.provider,
        default_ai_model: validated.defaultModel,
      })
    }

    const payload = await getAIProviderSettingsPayload(userId)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    if (error instanceof MissingAIConfigError) {
      return NextResponse.json(
        {
          error:
            'Server configuration is incomplete: set AI_CREDENTIAL_ENCRYPTION_KEY in .env.local and restart the app.',
        },
        { status: 500 }
      )
    }

    console.error('[ai-provider-put]', error)
    return NextResponse.json(
      { error: 'Failed to save AI provider key' },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const provider = providerIdSchema.parse(params.provider)
    await removeProviderCredential(userId, provider)

    const payload = await getAIProviderSettingsPayload(userId)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    console.error('[ai-provider-delete]', error)
    return NextResponse.json(
      { error: 'Failed to remove AI provider key' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const provider = providerIdSchema.parse(params.provider)
    const body: unknown = await request.json()
    const requestPayload =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const validated = testProviderCredentialSchema.parse({
      ...requestPayload,
      provider,
      model:
        typeof requestPayload.model === 'string'
          ? requestPayload.model
          : getDefaultModelForProvider(provider),
    })

    const result = await testAIConnection({
      provider,
      model: validated.model,
      userId,
      apiKeyOverride: validated.apiKey,
    })

    return NextResponse.json(result, {
      status: result.error ? 400 : 200,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    if (error instanceof MissingAIConfigError) {
      return NextResponse.json(
        {
          error:
            'Server configuration is incomplete: set AI_CREDENTIAL_ENCRYPTION_KEY in .env.local and restart the app.',
        },
        { status: 500 }
      )
    }

    console.error('[ai-provider-test]', error)
    return NextResponse.json(
      { error: 'Failed to test AI provider' },
      { status: 500 }
    )
  }
}
