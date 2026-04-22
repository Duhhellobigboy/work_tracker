import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getBrowserSupabase } from '../../lib/supabase-browser'

export default function ProfileDropdown({ session }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const supabase = getBrowserSupabase()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const user = session?.user
  if (!user) return null

  // Extract metadata
  const profile = user.user_metadata || {}
  const name = profile.full_name || ''
  const email = user.email || ''
  
  // Calculate initials
  let initials = email ? email.charAt(0).toUpperCase() : '?'
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      initials = parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
    } else {
      initials = parts[0][0].toUpperCase()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-700 hover:border-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        aria-label="User menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="truncate text-white font-medium">{name || 'User'}</p>
            <p className="truncate text-gray-500 text-xs mt-0.5">{email}</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            <Link 
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
            >
              Profile
            </Link>
            <button
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
              className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
