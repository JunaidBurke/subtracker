import 'server-only'

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { AIProviderCatalogItem, AIProviderId } from '@/types'

type ProviderProtocol = 'anthropic' | 'google' | 'openai-compatible'

interface AIProviderRegistryItem extends AIProviderCatalogItem {
  protocol: ProviderProtocol
  env_key: string
  api_base_url?: string
}

const pricingSchema = z.object({
  input_per_million: z.number().nullable(),
  output_per_million: z.number().nullable(),
  pricing_note: z.string().optional(),
})

const modelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  supports_vision: z.boolean(),
  pricing: pricingSchema,
})

const providerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  api_key_label: z.string().min(1),
  api_key_placeholder: z.string().min(1),
  supports_vision: z.boolean(),
  supports_comparison: z.boolean(),
  protocol: z.enum(['anthropic', 'google', 'openai-compatible']),
  env_key: z.string().min(1),
  api_base_url: z.string().url().optional(),
  models: z.array(modelSchema).min(1),
})

const catalogSchema = z.object({
  default_provider: z.string().min(1),
  providers: z.array(providerSchema).min(1),
})

let cachedCatalog: Record<string, AIProviderRegistryItem> | null = null
let cachedDefaultProviderId: AIProviderId | null = null

function loadCatalogFile() {
  const filePath = path.join(process.cwd(), 'config', 'ai-providers.json')
  const raw = readFileSync(filePath, 'utf8')
  const parsed = catalogSchema.parse(JSON.parse(raw))

  const providers = Object.fromEntries(
    parsed.providers.map((provider) => [provider.id, provider])
  ) as Record<string, AIProviderRegistryItem>

  if (!(parsed.default_provider in providers)) {
    throw new Error(
      `config/ai-providers.json default_provider "${parsed.default_provider}" does not exist in providers`
    )
  }

  cachedCatalog = providers
  cachedDefaultProviderId = parsed.default_provider

  return {
    providers,
    defaultProvider: parsed.default_provider,
  }
}

function ensureCatalog() {
  if (cachedCatalog && cachedDefaultProviderId) {
    return {
      providers: cachedCatalog,
      defaultProvider: cachedDefaultProviderId,
    }
  }

  return loadCatalogFile()
}

function stripProviderRuntimeFields(
  provider: AIProviderRegistryItem
): AIProviderCatalogItem {
  const { protocol: _protocol, env_key: _envKey, api_base_url: _apiBaseUrl, ...publicProvider } =
    provider

  return publicProvider
}

export function getAIProviderCatalog() {
  return ensureCatalog().providers
}

export function getDefaultProviderId(): AIProviderId {
  return ensureCatalog().defaultProvider
}

export function listAIProviderIds(): AIProviderId[] {
  return Object.keys(getAIProviderCatalog())
}

export function isValidAIProviderId(provider: string): provider is AIProviderId {
  return provider in getAIProviderCatalog()
}

export function getDefaultModelForProvider(provider: AIProviderId) {
  const catalog = getAIProviderCatalog()
  const defaultProvider = getDefaultProviderId()

  return catalog[provider]?.models[0]?.id ?? catalog[defaultProvider]?.models[0]?.id ?? ''
}

export function listAIProviders(): AIProviderCatalogItem[] {
  return Object.values(getAIProviderCatalog()).map(stripProviderRuntimeFields)
}

export function getProviderCatalogItem(provider: AIProviderId) {
  const catalog = getAIProviderCatalog()
  const item = catalog[provider]

  return item ? stripProviderRuntimeFields(item) : undefined
}

export function getModelCatalogItem(provider: AIProviderId, modelId: string) {
  return getAIProviderCatalog()[provider]?.models.find((model) => model.id === modelId)
}

export function getProviderRegistryItem(provider: AIProviderId) {
  return getAIProviderCatalog()[provider]
}
