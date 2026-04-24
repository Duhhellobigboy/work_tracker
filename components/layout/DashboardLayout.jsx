import Link from 'next/link'
import ProfileDropdown from '../auth/ProfileDropdown'

export default function DashboardLayout({ children, session }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <header className="px-6 py-4 border-b border-gray-800 bg-gray-900/60 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-lg text-white hover:text-blue-400 transition-colors">
            Task Manager
          </Link>
        </div>
        <ProfileDropdown session={session} />
      </header>
      
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-10">
        {children}
      </main>
    </div>
  )
}
