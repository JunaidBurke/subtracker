import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/provider'
import { PARSE_RECEIPT_PROMPT } from '@/lib/ai/prompts'
import { z } from 'zod'

const requestSchema = z.object({
  image: z.string().optional(),
  text: z.string().optional(),
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
    const ai = getAIProvider()

    let result: string
    if (validated.image) {
      result = await ai.analyzeImage(validated.image, PARSE_RECEIPT_PROMPT)
    } else {
      result = await ai.analyzeText(
        `${PARSE_RECEIPT_PROMPT}\n\nReceipt text:\n${validated.text}`,
      )
    }

    const cleaned = result
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
