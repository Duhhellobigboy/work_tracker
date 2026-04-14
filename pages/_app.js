import '../styles/globals.css'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { getBrowserSupabase } from '../lib/supabase-browser'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [authReady, setAuthReady] = useState(false)
  const publicRoutes = ['/login', '/signup']

  useEffect(() => {
    let mounted = true

    async function guardCurrentRoute() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return
      const isPublicRoute = publicRoutes.includes(router.pathname)

      if (!session && !isPublicRoute) {
        await router.replace('/signup')
      } else if (session && isPublicRoute) {
        await router.replace('/')
      }

      if (mounted) setAuthReady(true)
    }

    guardCurrentRoute()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isPublicRoute = publicRoutes.includes(router.pathname)

      if (!session && !isPublicRoute) {
        router.replace('/signup')
      } else if (session && isPublicRoute) {
        router.replace('/')
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [router, router.pathname, supabase])

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-400 grid place-items-center">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  return <Component {...pageProps} />
}
