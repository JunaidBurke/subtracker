import { performance } from 'perf_hooks'
import {
  getDefaultModelForProvider,
  getModelCatalogItem,
  getProviderCatalogItem,
  getProviderRegistryItem,
} from '@/lib/ai/catalog'
import { getStoredProviderApiKey } from '@/lib/ai/settings'
import type { AIExecutionResult, AIProviderId, AIRequestSelection, AIUsageMetrics } from '@/types'

interface ExecuteAIInput {
  provider: AIProviderId
  model: string
  prompt: string
  userId?: string
  apiKeyOverride?: string
  imageBase64?: string
  maxTokens?: number
}

interface UsageSnapshot {
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
}

function getTextFromContent(
  content:
    | string
    | Array<{ text?: string; type?: string }>
    | null
    | undefined
) {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  return content
    .map((part) => part.text ?? '')
    .join('\n')
    .trim()
}

function buildUsageMetrics(
  provider: AIProviderId,
  model: string,
  usage: UsageSnapshot
): AIUsageMetrics {
  const catalogModel = getModelCatalogItem(provider, model)
  const pricing = catalogModel?.pricing

  const estimatedCostUsd =
    pricing?.input_per_million != null &&
    pricing?.output_per_million != null &&
    usage.inputTokens != null &&
    usage.outputTokens != null
      ? (usage.inputTokens / 1_000_000) * pricing.input_per_million +
        (usage.outputTokens / 1_000_000) * pricing.output_per_million
      : null

  return {
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    estimated_cost_usd: estimatedCostUsd,
    cost_note:
      estimatedCostUsd != null
        ? pricing?.pricing_note ?? 'Estimated from static per-token pricing.'
        : pricing?.pricing_note ?? 'Cost estimate unavailable for this provider or model.',
  }
}

async function resolveApiKey(
  provider: AIProviderId,
  userId?: string,
  apiKeyOverride?: string
) {
  if (apiKeyOverride?.trim()) {
    return apiKeyOverride.trim()
  }

  if (userId) {
    const saved = await getStoredProviderApiKey(userId, provider)
    if (saved?.apiKey) {
      return saved.apiKey
    }
  }

  const registryItem = getProviderRegistryItem(provider)
  const envKey = registryItem?.env_key
    ? process.env[registryItem.env_key]
    : undefined
  if (envKey?.trim()) {
    return envKey.trim()
  }

  throw new Error(`No API key configured for ${provider}`)
}

async function executeOpenAICompatibleRequest(
  input: ExecuteAIInput,
  apiKey: string
) {
  const registryItem = getProviderRegistryItem(input.provider)
  if (!registryItem?.api_base_url) {
    throw new Error(`No API base URL configured for ${input.provider}`)
  }

  const modelMeta = getModelCatalogItem(input.provider, input.model)
  if (input.imageBase64 && !modelMeta?.supports_vision) {
    throw new Error(`${input.model} does not support image analysis in this app`)
  }

  const response = await fetch(
    `${registryItem.api_base_url}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(input.provider === 'openrouter'
          ? {
              'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000',
              'X-Title': 'Subscription Tracker',
            }
          : {}),
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens ?? 1024,
        messages: [
          {
            role: 'user',
            content: input.imageBase64
              ? [
                  { type: 'text', text: input.prompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/png;base64,${input.imageBase64}`,
                    },
                  },
                ]
              : input.prompt,
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
  }

  return {
    text: getTextFromContent(data.choices?.[0]?.message?.content),
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? null,
      outputTokens: data.usage?.completion_tokens ?? null,
      totalTokens: data.usage?.total_tokens ?? null,
    },
  }
}

async function executeAnthropicRequest(input: ExecuteAIInput, apiKey: string) {
  const modelMeta = getModelCatalogItem(input.provider, input.model)
  if (input.imageBase64 && !modelMeta?.supports_vision) {
    throw new Error(`${input.model} does not support image analysis in this app`)
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens ?? 1024,
      messages: [
        {
          role: 'user',
          content: input.imageBase64
            ? [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: input.imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: input.prompt,
                },
              ]
            : [{ type: 'text', text: input.prompt }],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>
    usage?: {
      input_tokens?: number
      output_tokens?: number
    }
  }

  const inputTokens = data.usage?.input_tokens ?? null
  const outputTokens = data.usage?.output_tokens ?? null

  return {
    text: getTextFromContent(data.content),
    usage: {
      inputTokens,
      outputTokens,
      totalTokens:
        inputTokens != null && outputTokens != null
          ? inputTokens + outputTokens
          : null,
    },
  }
}

async function executeGoogleRequest(input: ExecuteAIInput, apiKey: string) {
  const modelMeta = getModelCatalogItem(input.provider, input.model)
  if (input.imageBase64 && !modelMeta?.supports_vision) {
    throw new Error(`${input.model} does not support image analysis in this app`)
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: input.imageBase64
            ? [
                { text: input.prompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: input.imageBase64,
                  },
                },
              ]
            : [{ text: input.prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: input.maxTokens ?? 1024,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
    usageMetadata?: {
      promptTokenCount?: number
      candidatesTokenCount?: number
      totalTokenCount?: number
    }
  }

  return {
    text: getTextFromContent(data.candidates?.[0]?.content?.parts),
    usage: {
      inputTokens: data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      totalTokens: data.usageMetadata?.totalTokenCount ?? null,
    },
  }
}

export async function executeAIRequest(
  input: ExecuteAIInput
): Promise<AIExecutionResult> {
  const apiKey = await resolveApiKey(input.provider, input.userId, input.apiKeyOverride)
  const providerMeta = getProviderCatalogItem(input.provider)
  const providerConfig = getProviderRegistryItem(input.provider)
  const startedAt = performance.now()

  try {
    const result =
      providerConfig?.protocol === 'anthropic'
        ? await executeAnthropicRequest(input, apiKey)
        : providerConfig?.protocol === 'google'
          ? await executeGoogleRequest(input, apiKey)
          : await executeOpenAICompatibleRequest(input, apiKey)

    return {
      provider: input.provider,
      provider_label: providerMeta.label,
      model: input.model,
      latency_ms: Math.round(performance.now() - startedAt),
      output_text: result.text.trim(),
      usage: buildUsageMetrics(input.provider, input.model, result.usage),
      error: null,
    }
  } catch (error) {
    return {
      provider: input.provider,
      provider_label: providerMeta.label,
      model: input.model,
      latency_ms: Math.round(performance.now() - startedAt),
      output_text: '',
      usage: buildUsageMetrics(input.provider, input.model, {
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      }),
      error:
        error instanceof Error
          ? error.message.slice(0, 400)
          : 'Unknown provider error',
    }
  }
}

export async function executeAIComparison(
  userId: string,
  prompt: string,
  selections: AIRequestSelection[]
) {
  return Promise.all(
    selections.map((selection) =>
      executeAIRequest({
        ...selection,
        userId,
        prompt,
      })
    )
  )
}

export async function testAIConnection(input: {
  provider: AIProviderId
  model: string
  userId?: string
  apiKeyOverride?: string
}) {
  return executeAIRequest({
    provider: input.provider,
    model: input.model || getDefaultModelForProvider(input.provider),
    userId: input.userId,
    apiKeyOverride: input.apiKeyOverride,
    prompt: 'Reply with exactly: OK',
    maxTokens: 16,
  })
}
