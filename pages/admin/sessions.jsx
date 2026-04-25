import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { getBrowserSupabase } from '../../lib/supabase-browser'

export default function AdminSessions({ session }) {
  const [view, setView] = useState('types') // 'types' or 'categories'
  const [sessionTypes, setSessionTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = getBrowserSupabase()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', duration_minutes: 60, price: 0, category_id: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: catData } = await supabase.from('categories').select('*').order('name')
      const { data: typeData } = await supabase.from('session_types').select(`
        *,
        categories (name)
      `).order('name')
      
      setCategories(catData || [])
      setSessionTypes(typeData || [])
    } catch (e) {
      console.error('Error fetching sessions data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (view === 'types') {
        const { error } = await supabase.from('session_types').insert([{
          name: formData.name,
          description: formData.description,
          duration_minutes: parseInt(formData.duration_minutes),
          price: parseFloat(formData.price),
          category_id: formData.category_id || null
        }])
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert([{
          name: formData.name,
          description: formData.description
        }])
        if (error) throw error
      }
      
      setIsModalOpen(false)
      setFormData({ name: '', description: '', duration_minutes: 60, price: 0, category_id: '' })
      await fetchData()
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout session={session}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Session Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {view === 'types' ? 'Manage your service offerings and pricing.' : 'Organize your sessions into logical groups.'}
          </p>
        </div>
        <div className="flex gap-3">
          {view === 'types' ? (
            <button 
              onClick={() => setView('categories')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl font-medium transition border border-gray-700 flex items-center gap-2 text-sm shadow-lg"
            >
              📂 Manage Categories
            </button>
          ) : (
            <button 
              onClick={() => setView('types')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl font-medium transition border border-gray-700 flex items-center gap-2 text-sm shadow-lg"
            >
              ⏱️ View Session Types
            </button>
          )}
          <button 
            onClick={() => {
              setFormData({ name: '', description: '', duration_minutes: 60, price: 0, category_id: categories[0]?.id || '' })
              setIsModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-blue-900/40 border border-blue-400/20 flex items-center gap-2 text-sm active:scale-95"
          >
            <span>+</span> New {view === 'types' ? 'Session Type' : 'Category'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
              <h3 className="text-lg font-bold">Add New {view === 'types' ? 'Session Type' : 'Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder={`Enter ${view === 'types' ? 'type' : 'category'} name...`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                  placeholder="Tell us a bit more..."
                />
              </div>
              
              {view === 'types' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Duration (min)</label>
                    <input 
                      type="number" 
                      value={formData.duration_minutes}
                      onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
                    <select 
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">No Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : 'Create ' + (view === 'types' ? 'Type' : 'Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button 
              onClick={() => setView('types')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'types' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Session Types
            </button>
            <button 
              onClick={() => setView('categories')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'categories' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Categories
            </button>
          </div>
          {loading && <span className="text-xs text-blue-400 animate-pulse font-bold uppercase tracking-widest">Syncing...</span>}
        </div>

        <div className="overflow-x-auto">
          {view === 'types' ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950/50 text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Category</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Duration</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Price</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sessionTypes.length > 0 ? sessionTypes.map(item => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition group">
                    <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 text-[10px] font-bold border border-gray-700 uppercase tracking-tight">
                        {item.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{item.duration_minutes} min</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">${item.price || '0.00'}</td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button className="text-gray-500 hover:text-white transition text-xs font-bold uppercase tracking-tighter">Edit</button>
                      <button className="text-gray-500 hover:text-red-400 transition text-xs font-bold uppercase tracking-tighter">Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                      {loading ? 'Loading sessions...' : 'No session types found. Create your first one!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950/50 text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Category Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Description</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Created</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {categories.length > 0 ? categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-800/50 transition group">
                    <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">{cat.name}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs truncate max-w-xs">{cat.description || 'No description'}</td>
                    <td className="px-6 py-4 text-gray-500 text-[10px] font-mono">{new Date(cat.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button className="text-gray-500 hover:text-white transition text-xs font-bold uppercase tracking-tighter">Edit</button>
                      <button className="text-gray-500 hover:text-red-400 transition text-xs font-bold uppercase tracking-tighter">Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                      {loading ? 'Loading categories...' : 'No categories found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
