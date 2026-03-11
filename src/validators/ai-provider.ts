import { z } from 'zod'
import { isValidAIProviderId } from '@/lib/ai/catalog'

export const providerIdSchema = z.string().refine(isValidAIProviderId, {
  message: 'Unsupported AI provider',
})

export const updateProviderCredentialSchema = z.object({
  provider: providerIdSchema,
  apiKey: z.string().min(8).max(512),
  defaultModel: z.string().min(1).max(120).optional(),
})

export const removeProviderCredentialSchema = z.object({
  provider: providerIdSchema,
})

export const testProviderCredentialSchema = z.object({
  provider: providerIdSchema,
  apiKey: z.string().min(8).max(512).optional(),
  model: z.string().min(1).max(120),
})

export const updateAIPreferencesSchema = z.object({
  default_ai_provider: providerIdSchema.optional(),
  default_ai_model: z.string().min(1).max(120).optional(),
})

export const aiQuerySelectionSchema = z.object({
  provider: providerIdSchema,
  model: z.string().min(1).max(120),
})

export const aiQuerySchema = z.object({
  question: z.string().min(1).max(500),
  selection: aiQuerySelectionSchema.optional(),
})

export const compareModelsSchema = z.object({
  question: z.string().min(1).max(500),
  selections: z.array(aiQuerySelectionSchema).min(2).max(6),
})
