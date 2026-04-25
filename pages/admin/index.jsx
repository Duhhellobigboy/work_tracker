import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'

export default function AdminDashboard({ session }) {
  const [dateRange, setDateRange] = useState('Last 30 Days')

  const stats = [
    { label: 'Total Bookings', value: '142', change: '+12%', bgIcon: 'bg-blue-500/10', textChange: 'text-green-400', isUp: true },
    { label: 'Active Clients', value: '48', change: '+5%', bgIcon: 'bg-emerald-500/10', textChange: 'text-green-400', isUp: true },
    { label: 'Session Types', value: '12', change: '0%', bgIcon: 'bg-purple-500/10', textChange: 'text-gray-400', isUp: null },
    { label: 'Revenue (YTD)', value: '$12,450', change: '+24%', bgIcon: 'bg-amber-500/10', textChange: 'text-green-400', isUp: true },
  ]

  return (
    <AdminLayout session={session}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 shadow-lg">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Range:</span>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent border-none text-sm text-gray-300 font-medium focus:ring-0 cursor-pointer outline-none"
          >
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-gray-700 transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgIcon} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
            <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${stat.textChange}`}>
                {stat.isUp === true && <span>↑</span>}
                {stat.isUp === false && <span>↓</span>}
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        Quick Actions <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">New</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-5 px-6 rounded-2xl transition shadow-lg shadow-blue-900/20 text-left flex flex-col gap-1 border border-blue-400/20 group">
          <span className="text-lg">Add Session Type</span>
          <span className="text-blue-200 text-sm font-normal transition-opacity group-hover:opacity-100 opacity-70">Create a new service offering</span>
        </button>
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-5 px-6 rounded-2xl transition border border-gray-700 text-left flex flex-col gap-1 shadow-lg group">
          <span className="text-lg">View Calendar</span>
          <span className="text-gray-400 text-sm font-normal transition-opacity group-hover:opacity-100 opacity-70">Manage upcoming bookings</span>
        </button>
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-5 px-6 rounded-2xl transition border border-gray-700 text-left flex flex-col gap-1 shadow-lg group">
          <span className="text-lg">Invite Client</span>
          <span className="text-gray-400 text-sm font-normal transition-opacity group-hover:opacity-100 opacity-70">Send a booking link</span>
        </button>
      </div>
    </AdminLayout>
  )
}

