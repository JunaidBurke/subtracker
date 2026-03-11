import type { AIProviderCatalogItem, AIProviderId, AIModelCatalogItem } from '@/types'

type ProviderProtocol = 'anthropic' | 'google' | 'openai-compatible'

interface AIProviderRegistryItem extends AIProviderCatalogItem {
  protocol: ProviderProtocol
  env_key: string
  api_base_url?: string
}

const NO_PRICING = {
  input_per_million: null,
  output_per_million: null,
  pricing_note: 'Pricing estimate unavailable for this model.',
} as const

function model(
  id: string,
  label: string,
  description: string,
  pricing?: Partial<AIModelCatalogItem['pricing']>,
  supportsVision = false
): AIModelCatalogItem {
  return {
    id,
    label,
    description,
    supports_vision: supportsVision,
    pricing: {
      ...NO_PRICING,
      ...pricing,
    },
  }
}

export const AI_PROVIDER_CATALOG: Record<string, AIProviderRegistryItem> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    api_key_label: 'Anthropic API Key',
    api_key_placeholder: 'sk-ant-...',
    supports_vision: true,
    supports_comparison: true,
    protocol: 'anthropic',
    env_key: 'ANTHROPIC_API_KEY',
    models: [
      model(
        'claude-3-7-sonnet-latest',
        'Claude 3.7 Sonnet',
        'Balanced reasoning and writing quality.',
        {
          input_per_million: 3,
          output_per_million: 15,
          pricing_note: 'Static estimate based on published Anthropic pricing.',
        },
        true
      ),
      model(
        'claude-3-5-haiku-latest',
        'Claude 3.5 Haiku',
        'Fast and inexpensive for lightweight tasks.',
        {
          input_per_million: 0.8,
          output_per_million: 4,
          pricing_note: 'Static estimate based on published Anthropic pricing.',
        },
        true
      ),
    ],
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    api_key_label: 'OpenAI API Key',
    api_key_placeholder: 'sk-...',
    supports_vision: true,
    supports_comparison: true,
    protocol: 'openai-compatible',
    env_key: 'OPENAI_API_KEY',
    api_base_url: 'https://api.openai.com/v1',
    models: [
      model(
        'gpt-4o-mini',
        'GPT-4o mini',
        'Fast multimodal model for cost-sensitive prompts.',
        {
          input_per_million: 0.15,
          output_per_million: 0.6,
          pricing_note: 'Static estimate based on published OpenAI pricing.',
        },
        true
      ),
      model(
        'gpt-4.1-mini',
        'GPT-4.1 mini',
        'Stronger reasoning at a moderate price.',
        {
          input_per_million: 0.4,
          output_per_million: 1.6,
          pricing_note: 'Static estimate based on published OpenAI pricing.',
        },
        true
      ),
    ],
  },
  google: {
    id: 'google',
    label: 'Google',
    api_key_label: 'Google AI API Key',
    api_key_placeholder: 'AIza...',
    supports_vision: true,
    supports_comparison: true,
    protocol: 'google',
    env_key: 'GOOGLE_AI_API_KEY',
    models: [
      model(
        'gemini-2.0-flash',
        'Gemini 2.0 Flash',
        'Fast Gemini model for broad chat and extraction tasks.',
        NO_PRICING,
        true
      ),
      model(
        'gemini-1.5-pro',
        'Gemini 1.5 Pro',
        'Higher-quality reasoning and larger context windows.',
        NO_PRICING,
        true
      ),
    ],
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    api_key_label: 'OpenRouter API Key',
    api_key_placeholder: 'sk-or-...',
    supports_vision: true,
    supports_comparison: true,
    protocol: 'openai-compatible',
    env_key: 'OPENROUTER_API_KEY',
    api_base_url: 'https://openrouter.ai/api/v1',
    models: [
      model(
        'openai/gpt-4o-mini',
        'OpenRouter · GPT-4o mini',
        'OpenAI hosted through OpenRouter.',
        NO_PRICING,
        true
      ),
      model(
        'anthropic/claude-3.5-haiku',
        'OpenRouter · Claude 3.5 Haiku',
        'Anthropic model routed through OpenRouter.',
        NO_PRICING,
        true
      ),
    ],
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    api_key_label: 'Groq API Key',
    api_key_placeholder: 'gsk_...',
    supports_vision: false,
    supports_comparison: true,
    protocol: 'openai-compatible',
    env_key: 'GROQ_API_KEY',
    api_base_url: 'https://api.groq.com/openai/v1',
    models: [
      model(
        'llama-3.3-70b-versatile',
        'Llama 3.3 70B Versatile',
        'Low-latency open model served on Groq.',
        NO_PRICING
      ),
      model(
        'llama-3.1-8b-instant',
        'Llama 3.1 8B Instant',
        'Very fast low-cost option for short prompts.',
        NO_PRICING
      ),
    ],
  },
  together: {
    id: 'together',
    label: 'Together',
    api_key_label: 'Together API Key',
    api_key_placeholder: 'tsk_...',
    supports_vision: false,
    supports_comparison: true,
    protocol: 'openai-compatible',
    env_key: 'TOGETHER_API_KEY',
    api_base_url: 'https://api.together.xyz/v1',
    models: [
      model(
        'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        'Llama 3.3 70B Turbo',
        'Strong open model for general chat tasks.',
        NO_PRICING
      ),
      model(
        'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        'Llama 3.1 8B Turbo',
        'Lower-cost open model on Together.',
        NO_PRICING
      ),
    ],
  },
  xai: {
    id: 'xai',
    label: 'xAI',
    api_key_label: 'xAI API Key',
    api_key_placeholder: 'xai-...',
    supports_vision: false,
    supports_comparison: true,
    protocol: 'openai-compatible',
    env_key: 'XAI_API_KEY',
    api_base_url: 'https://api.x.ai/v1',
    models: [
      model(
        'grok-2-latest',
        'Grok 2',
        'General chat and reasoning via xAI.',
        NO_PRICING
      ),
      model(
        'grok-beta',
        'Grok Beta',
        'Compatibility fallback for existing xAI accounts.',
        NO_PRICING
      ),
    ],
  },
}

export const DEFAULT_PROVIDER_ID = 'anthropic'
export const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = Object.fromEntries(
  Object.entries(AI_PROVIDER_CATALOG).map(([provider, config]) => [
    provider,
    config.models[0]?.id ?? '',
  ])
) as Record<string, string>

export function listAIProviderIds(): AIProviderId[] {
  return Object.keys(AI_PROVIDER_CATALOG)
}

export function isValidAIProviderId(provider: string): provider is AIProviderId {
  return provider in AI_PROVIDER_CATALOG
}

export function getDefaultModelForProvider(provider: AIProviderId) {
  return (
    DEFAULT_MODEL_BY_PROVIDER[provider] ??
    DEFAULT_MODEL_BY_PROVIDER[DEFAULT_PROVIDER_ID] ??
    ''
  )
}

export function listAIProviders(): AIProviderCatalogItem[] {
  return Object.values(AI_PROVIDER_CATALOG).map(
    ({ protocol: _protocol, env_key: _envKey, api_base_url: _apiBaseUrl, ...provider }) =>
      provider
  )
}

export function getProviderCatalogItem(provider: AIProviderId) {
  return AI_PROVIDER_CATALOG[provider]
}

export function getModelCatalogItem(provider: AIProviderId, modelId: string) {
  return AI_PROVIDER_CATALOG[provider].models.find((model) => model.id === modelId)
}

export function getProviderRegistryItem(provider: AIProviderId) {
  return AI_PROVIDER_CATALOG[provider]
}
