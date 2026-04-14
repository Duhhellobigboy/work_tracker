import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getBrowserSupabase } from '../lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => getBrowserSupabase(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    await router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-7 shadow-2xl shadow-blue-900/20">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Task Manager</p>
          <h1 className="mb-1 text-3xl font-bold leading-tight">Welcome back</h1>
          <p className="mb-6 text-sm text-gray-400">Log in to manage your procurement and RFP task flow.</p>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Need an account?{' '}
            <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
