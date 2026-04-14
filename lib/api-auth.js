import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars')
}

export function getBearerToken(req) {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) return null
  return auth.slice('Bearer '.length).trim() || null
}

export async function getRequestAuth(req) {
  const accessToken = getBearerToken(req)
  if (!accessToken) {
    return { error: 'Missing bearer token', status: 401 }
  }

  const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabaseUserClient.auth.getUser(accessToken)

  if (error || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  return { user, supabaseUserClient }
}
