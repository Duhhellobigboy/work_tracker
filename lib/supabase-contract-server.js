import { createClient } from '@supabase/supabase-js'

/**
 * Server-only: contract project with service role for API routes after main-app auth.
 * Never import this file from client components.
 */
export function getContractServiceSupabase() {
  const url =
    process.env.NEXT_PUBLIC_CONTRACT_SUPABASE_URL || process.env.CONTRACT_SUPABASE_URL
  const key = process.env.CONTRACT_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing contract Supabase URL (NEXT_PUBLIC_CONTRACT_SUPABASE_URL) or CONTRACT_SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createClient(url, key)
}
