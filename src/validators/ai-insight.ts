import { z } from 'zod'

export const createInsightSchema = z.object({
  type: z.enum(['optimization', 'forecast', 'alert']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  related_subscription_ids: z.array(z.string().uuid()).default([]),
})

export type CreateInsightInput = z.infer<typeof createInsightSchema>
