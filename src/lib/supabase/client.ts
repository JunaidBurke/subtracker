import { createClient } from '@supabase/supabase-js'

const SCHEMA = process.env.NEXT_PUBLIC_APP_SCHEMA || 'subtracker'

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: SCHEMA } }
  )
}
