import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getBrowserSupabase } from '../lib/supabase-browser'

// Use the singleton instance outside component render to guarantee single instance
const supabase = getBrowserSupabase()
const PUBLIC_ROUTES = ['/login', '/signup']

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // 1. Centralized Session Loading & Auth Listener
  useEffect(() => {
    let mounted = true

    // Load initial session
    supabase.auth.getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session ?? null)
          setAuthReady(true)
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthReady(true)
        }
      })

    // Subscribe to auth changes (e.g. login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array ensures this effect only runs once on mount

  // 2. Route Guarding Side-Effect
  useEffect(() => {
    if (!authReady) return

    const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname)

    if (!session && !isPublicRoute) {
      router.replace('/signup')
    } else if (session && isPublicRoute) {
      router.replace('/')
    }
  }, [authReady, session, router.pathname])

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-400 grid place-items-center">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  // Pass session to pages so they don't need to refetch it
  return <Component {...pageProps} session={session} />
}