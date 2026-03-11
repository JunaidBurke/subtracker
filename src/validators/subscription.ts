import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  logo_url: z.string().url().nullable().optional(),
  category: z.string().min(1).max(50),
  amount: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3).default('USD'),
  billing_cycle: z.enum(['weekly', 'monthly', 'yearly']),
  next_renewal: z.string().date(),
  start_date: z.string().date(),
  status: z.enum(['active', 'paused', 'cancelled', 'trial']).default('active'),
  notes: z.string().max(500).nullable().optional(),
  payment_method: z.string().max(50).nullable().optional(),
  auto_renew: z.boolean().default(true),
})

export const updateSubscriptionSchema = createSubscriptionSchema.partial()

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
