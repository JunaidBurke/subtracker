import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getDefaultModelForProvider, getModelCatalogItem } from '@/lib/ai/catalog'
import { executeAIRequest } from '@/lib/ai/provider'
import { getOrCreateUserSettings } from '@/lib/ai/settings'
import { PARSE_RECEIPT_PROMPT } from '@/lib/ai/prompts'
import { aiQuerySelectionSchema } from '@/validators/ai-provider'
import { z } from 'zod'

const requestSchema = z.object({
  image: z.string().optional(),
  text: z.string().optional(),
  selection: aiQuerySelectionSchema.optional(),
}).refine(data => data.image || data.text, {
  message: 'Either image or text is required',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const validated = requestSchema.parse(body)
    const settings = await getOrCreateUserSettings(userId)
    const provider = validated.selection?.provider ?? settings.default_ai_provider
    const model =
      validated.selection?.model ??
      settings.default_ai_model ??
      getDefaultModelForProvider(provider)

    if (validated.image && !getModelCatalogItem(provider, model)?.supports_vision) {
      return NextResponse.json(
        {
          error:
            'The selected provider/model does not support receipt image parsing. Choose a vision-capable model.',
        },
        { status: 400 }
      )
    }

    const result = await executeAIRequest({
      provider,
      model,
      userId,
      imageBase64: validated.image,
      prompt: validated.image
        ? PARSE_RECEIPT_PROMPT
        : `${PARSE_RECEIPT_PROMPT}\n\nReceipt text:\n${validated.text}`,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    const cleaned = result.output_text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const parsed: unknown = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('[parse-receipt]', error)
    return NextResponse.json(
      { error: 'Failed to parse receipt' },
      { status: 500 },
    )
  }
}
