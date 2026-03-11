import { createSupabaseAdmin } from '@/lib/supabase/server'
import {
  DEFAULT_PROVIDER_ID,
  getDefaultModelForProvider,
  isValidAIProviderId,
  listAIProviders,
} from '@/lib/ai/catalog'
import { decryptSecret, encryptSecret, getSecretHint } from '@/lib/ai/crypto'
import type {
  AIProviderCredentialSummary,
  AIProviderId,
  AIProviderSettingsPayload,
  UserSettings,
} from '@/types'

const SETTINGS_COLUMNS =
  'id, user_id, email_digest, email_alerts, in_app_alerts, currency, categories, default_ai_provider, default_ai_model'

interface ProviderCredentialRow {
  provider: AIProviderId
  encrypted_api_key: string
  key_hint: string
  updated_at: string
}

export async function getOrCreateUserSettings(userId: string) {
  const supabase = createSupabaseAdmin()
  const { data: existingData, error } = await supabase
    .from('user_settings')
    .select(SETTINGS_COLUMNS)
    .eq('user_id', userId)
    .single()

  if (!error && existingData) {
    return existingData as UserSettings
  }

  const defaultProvider = DEFAULT_PROVIDER_ID
  const { data: created, error: createError } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      default_ai_provider: defaultProvider,
      default_ai_model: getDefaultModelForProvider(defaultProvider),
    })
    .select(SETTINGS_COLUMNS)
    .single()

  if (createError) {
    throw createError
  }

  return created as UserSettings
}

export async function getProviderCredentialSummaries(
  userId: string
): Promise<AIProviderCredentialSummary[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('ai_provider_credentials')
    .select('provider, key_hint, updated_at')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  const savedMap = new Map<AIProviderId, AIProviderCredentialSummary>()

  for (const row of data ?? []) {
    if (!isValidAIProviderId(row.provider)) {
      continue
    }

    savedMap.set(row.provider, {
      provider: row.provider,
      has_key: true,
      key_hint: row.key_hint as string,
      saved_at: row.updated_at as string,
    })
  }

  return listAIProviders().map((provider) => {
    return (
      savedMap.get(provider.id) ?? {
        provider: provider.id,
        has_key: false,
        key_hint: null,
        saved_at: null,
      }
    )
  })
}

export async function getAIProviderSettingsPayload(
  userId: string
): Promise<AIProviderSettingsPayload> {
  const [settings, credentials] = await Promise.all([
    getOrCreateUserSettings(userId),
    getProviderCredentialSummaries(userId),
  ])

  return {
    providers: listAIProviders(),
    credentials,
    default_provider: settings.default_ai_provider,
    default_model: settings.default_ai_model,
  }
}

export async function updateAIPreferences(
  userId: string,
  updates: Partial<Pick<UserSettings, 'default_ai_provider' | 'default_ai_model'>>
) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        ...updates,
      },
      { onConflict: 'user_id' }
    )
    .select(SETTINGS_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return data as UserSettings
}

export async function saveProviderCredential(
  userId: string,
  provider: AIProviderId,
  apiKey: string
) {
  const supabase = createSupabaseAdmin()
  const normalized = apiKey.trim()
  const { error } = await supabase.from('ai_provider_credentials').upsert(
    {
      user_id: userId,
      provider,
      encrypted_api_key: encryptSecret(normalized),
      key_hint: getSecretHint(normalized),
    },
    { onConflict: 'user_id,provider' }
  )

  if (error) {
    throw error
  }
}

export async function removeProviderCredential(
  userId: string,
  provider: AIProviderId
) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('ai_provider_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) {
    throw error
  }
}

export async function getStoredProviderApiKey(
  userId: string,
  provider: AIProviderId
) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('ai_provider_credentials')
    .select('provider, encrypted_api_key, key_hint, updated_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const row = data as ProviderCredentialRow

  return {
    provider: row.provider,
    apiKey: decryptSecret(row.encrypted_api_key),
    keyHint: row.key_hint,
    updatedAt: row.updated_at,
  }
}
