import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getBrowserSupabase } from '../lib/supabase-browser'

export default function SignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => getBrowserSupabase(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    const hasSession = !!data?.session

    if (hasSession) {
      await router.push('/')
      return
    }

    setSuccess('Account created. Check your email to verify, then log in.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-7 shadow-2xl shadow-blue-900/20">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Task Manager</p>
          <h1 className="mb-1 text-3xl font-bold leading-tight">Create your account</h1>
          <p className="mb-6 text-sm text-gray-400">Sign up to access your private task manager workspace.</p>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSignup} className="space-y-3">
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
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Have an account?{' '}
            <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
