import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_CONTRACT_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_CONTRACT_SUPABASE_ANON_KEY

let contractBrowserSupabase = null

/**
 * Contract Assessment module — browser client for the contract Supabase project only.
 * Uses NEXT_PUBLIC_CONTRACT_SUPABASE_URL + NEXT_PUBLIC_CONTRACT_SUPABASE_ANON_KEY.
 */
export function getContractBrowserSupabase() {
  if (contractBrowserSupabase) return contractBrowserSupabase

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_CONTRACT_SUPABASE_URL or NEXT_PUBLIC_CONTRACT_SUPABASE_ANON_KEY',
    )
  }

  contractBrowserSupabase = createClient(url, anonKey)
  return contractBrowserSupabase
}
