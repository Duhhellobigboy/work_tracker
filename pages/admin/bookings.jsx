import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { getBrowserSupabase } from '../../lib/supabase-browser'

export default function AdminBookings({ session }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const supabase = getBrowserSupabase()

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          start_time,
          profiles (full_name, email),
          session_types (name)
        `)
        .order('start_time', { ascending: false })
      
      if (error) throw error
      setBookings(data || [])
    } catch (e) {
      console.error('Error fetching bookings:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = filter === 'All' 
    ? bookings 
    : bookings.filter(b => b.status.toLowerCase() === filter.toLowerCase())

  const statusBadge = (status) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Confirmed</span>
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>
    }
  }

  return (
    <AdminLayout session={session}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bookings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and track all user appointments.</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 shadow-lg">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Filter:</span>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent border-none text-sm text-gray-300 font-medium focus:ring-0 cursor-pointer outline-none"
          >
            <option>All</option>
            <option>Confirmed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-950/50 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">ID</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Client</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Service</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Date & Time</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-800/50 transition group">
                  <td className="px-6 py-4 text-gray-500 font-mono text-[10px] uppercase tracking-tighter">
                    {booking.id.split('-')[0]}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                      {booking.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-gray-500 text-xs">{booking.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[11px]">
                      {booking.session_types?.name || 'Deleted Service'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{new Date(booking.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{new Date(booking.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-gray-800 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-bold uppercase border border-gray-700 hover:border-blue-500">
                      Manage
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                    {loading ? 'Fetching bookings...' : 'No bookings found matching your criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

