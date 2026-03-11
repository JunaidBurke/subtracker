export type BillingCycle = 'weekly' | 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial'
export type InsightType = 'optimization' | 'forecast' | 'alert'
export type NotificationType = 'renewal_reminder' | 'price_change' | 'digest' | 'insight'
export type NotificationChannel = 'in_app' | 'email'

export interface Subscription {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  category: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_renewal: string
  start_date: string
  status: SubscriptionStatus
  notes: string | null
  payment_method: string | null
  auto_renew: boolean
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  subscription_id: string
  amount: number
  recorded_at: string
}

export interface AIInsight {
  id: string
  user_id: string
  type: InsightType
  title: string
  body: string
  related_subscription_ids: string[]
  is_read: boolean
  is_dismissed: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  channel: NotificationChannel
  is_read: boolean
  sent_at: string
}

export interface Forecast {
  id: string
  user_id: string
  period: '7d' | '30d' | '90d'
  total_amount: number
  breakdown: ForecastBreakdownItem[]
  generated_at: string
}

export interface ForecastBreakdownItem {
  subscription_id: string
  name: string
  amount: number
  renewal_date: string
}

export interface UserSettings {
  id: string
  user_id: string
  email_digest: boolean
  email_alerts: boolean
  in_app_alerts: boolean
  currency: string
  categories: string[]
}
