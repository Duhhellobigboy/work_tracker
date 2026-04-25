import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { getBrowserSupabase } from '../../lib/supabase-browser'

export default function AdminClients({ session }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = getBrowserSupabase()

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    try {
      // For this phase, we treat all profiles as potential clients
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setClients(data || [])
    } catch (e) {
      console.error('Error fetching clients:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout session={session}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clients</h1>
          <p className="text-gray-400 text-sm mt-1">Manage user profiles and booking history.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client List */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950/50 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Name</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Role</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Joined</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {clients.length > 0 ? clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-800/50 transition group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                        {client.full_name || 'No Name'}
                      </div>
                      <div className="text-gray-500 text-xs">{client.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        client.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                        {client.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-[10px]">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-white transition text-xs font-bold uppercase tracking-tighter">Details</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                      {loading ? 'Fetching clients...' : 'No clients found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Insights Side Panel */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Client Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Users</p>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
              </div>
              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">New This Month</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {clients.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl transition border border-gray-700 shadow-lg text-sm">
            Export Client List (CSV)
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
