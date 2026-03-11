import { createSupabaseAdmin } from './server'
import type { Subscription } from '@/types'

const SUBSCRIPTION_COLUMNS =
  'id, user_id, name, logo_url, category, amount, currency, billing_cycle, next_renewal, start_date, status, notes, payment_method, auto_renew, created_at, updated_at'

export async function getSubscriptions(
  userId: string,
  limit = 50,
  offset = 0
) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .eq('user_id', userId)
    .order('next_renewal', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as Subscription[]
}

export async function getSubscriptionById(userId: string, id: string) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .eq('user_id', userId)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Subscription
}

export async function createSubscription(
  userId: string,
  input: Record<string, unknown>
) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ ...input, user_id: userId })
    .select(SUBSCRIPTION_COLUMNS)
    .single()

  if (error) throw error

  await supabase.from('price_history').insert({
    subscription_id: data.id,
    amount: data.amount,
  })

  return data as Subscription
}

export async function updateSubscription(
  userId: string,
  id: string,
  input: Record<string, unknown>
) {
  const supabase = createSupabaseAdmin()

  if (input.amount !== undefined) {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('amount')
      .eq('user_id', userId)
      .eq('id', id)
      .single()

    if (existing && Number(existing.amount) !== Number(input.amount)) {
      await supabase.from('price_history').insert({
        subscription_id: id,
        amount: input.amount as number,
      })
    }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(input)
    .eq('user_id', userId)
    .eq('id', id)
    .select(SUBSCRIPTION_COLUMNS)
    .single()

  if (error) throw error
  return data as Subscription
}

export async function deleteSubscription(userId: string, id: string) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('id', id)
    .select(SUBSCRIPTION_COLUMNS)
    .single()

  if (error) throw error
  return data as Subscription
}
