import { useState } from 'react'
import { getBrowserSupabase } from '../../lib/supabase-browser'

// Visual feedback helper
function Notice({ msg, type }) {
  if (!msg) return null
  const c = type === 'error'
    ? 'bg-red-900/50 border-red-700 text-red-300'
    : 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
  return <div className={`px-4 py-2.5 rounded-lg border text-sm mb-6 ${c}`}>{msg}</div>
}

export default function ProfileForm({ session }) {
  const supabase = getBrowserSupabase()
  
  const user = session?.user
  const email = user?.email || ''
  const initialName = user?.user_metadata?.full_name || ''

  const [fullName, setFullName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState({ msg: '', type: 'success' })

  function flash(msg, type = 'success') {
    setNotice({ msg, type })
    // Clear success messages after a delay, let error messages stay until corrected
    if (type === 'success') {
      setTimeout(() => setNotice({ msg: '', type: 'success' }), 4000)
    }
  }

  async function updateProfile(e) {
    e.preventDefault()
    setLoading(true)
    setNotice({ msg: '', type: 'success' })

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() }
    })

    if (error) {
      flash(error.message, 'error')
    } else {
      flash('Profile metadata updated successfully!', 'success')
      // Note: Supabase will instantly trigger onAuthStateChange
      // causing the global session in _app.js to update the top-right avatar!
    }
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 shadow-xl shadow-black/20 border border-gray-800 rounded-2xl p-6 md:p-8">
      <Notice {...notice} />

      <form onSubmit={updateProfile} className="space-y-6">
        
        {/* Avatar Placeholder Section */}
        <div className="flex items-center gap-5 pb-6 border-b border-gray-800">
           <div className="w-[72px] h-[72px] rounded-full bg-gray-950 border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-xs font-semibold">
              Avatar
           </div>
           <div>
             <p className="text-sm font-bold text-gray-200">Profile Picture</p>
             <p className="text-xs text-gray-500 mt-1">Image uploading will be integrated in the next rollout phase.</p>
           </div>
        </div>

        {/* Auth Email */}
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</span>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-gray-500 cursor-not-allowed outline-none"
          />
          <p className="text-xs text-gray-600 mt-2">Your email address is managed exclusively by your authentication provider.</p>
        </label>

        {/* Display Name */}
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">Full Name</span>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="e.g. Satoshi Nakamoto"
            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:bg-gray-900"
          />
        </label>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || fullName.trim() === initialName}
            className="w-full sm:w-auto rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Transmitting...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
