import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ProfileDropdown from '../auth/ProfileDropdown'

export default function AdminLayout({ children, session }) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Generate breadcrumbs from path
  const pathNodes = router.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathNodes.map((node, i) => {
    const href = '/' + pathNodes.slice(0, i + 1).join('/')
    return { name: node.charAt(0).toUpperCase() + node.slice(1), href }
  })

  const navLinks = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Sessions', href: '/admin/sessions', icon: '⏱️' },
    { name: 'Clients', href: '/admin/clients', icon: '👥' },
    { name: 'Bookings', href: '/admin/bookings', icon: '📅' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white flex font-sans transition-all duration-300">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex transition-all duration-300 ease-in-out`}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between overflow-hidden">
          {!isCollapsed && (
            <Link href="/admin" className="font-bold text-xl text-white hover:text-blue-400 transition-colors truncate">
              Admin Panel
            </Link>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = router.pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20 shadow-inner' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
                }`}
                title={isCollapsed ? link.name : ''}
              >
                <span className="text-xl">{link.icon}</span>
                {!isCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 overflow-hidden">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition flex items-center gap-2 whitespace-nowrap">
            <span>🔙</span> {!isCollapsed && 'Back to App'}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 border-b border-gray-800 bg-gray-900/60 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 overflow-hidden whitespace-nowrap">
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {i > 0 && <span>/</span>}
                  <Link 
                    href={crumb.href}
                    className={`hover:text-gray-300 transition-colors ${i === breadcrumbs.length - 1 ? 'text-gray-300' : ''}`}
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 flex items-center justify-center text-xl transition-colors relative"
              >
                🔔
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-gray-900"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
                    <h3 className="font-bold text-sm">Notifications</h3>
                  </div>
                  <div className="p-2 max-h-96 overflow-y-auto">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="p-3 hover:bg-gray-800 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-700 mb-1">
                        <p className="text-sm font-medium text-white">New Booking Received</p>
                        <p className="text-xs text-gray-500 mt-1">Alice Johnson booked "1-on-1 Consultation" for April 28.</p>
                        <p className="text-[10px] text-blue-400 mt-2 font-bold uppercase tracking-wider">2 mins ago</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-800 text-center">
                    <button className="text-xs text-gray-400 hover:text-white transition">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-800 mx-1 hidden sm:block"></div>

            <span className="text-sm font-medium text-gray-300 hidden sm:block truncate max-w-[150px]">
              {session?.user?.user_metadata?.full_name || session?.user?.email || 'Admin User'}
            </span>
            <ProfileDropdown session={session} />
          </div>
        </header>
        
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

