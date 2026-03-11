import { z } from 'zod'

export const createNotificationSchema = z.object({
  type: z.enum(['renewal_reminder', 'price_change', 'digest', 'insight']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  channel: z.enum(['in_app', 'email']),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
