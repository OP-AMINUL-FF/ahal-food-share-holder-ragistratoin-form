'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import { getStatusColor, getStatusText, formatDate } from '@/lib/utils'
import { Search, CheckCircle, XCircle, Eye, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [rejecting, setRejecting] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('shareholders')
      .select('id, name, phone, email, status, created_at, business_types!inner(name_bn)')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
  }

  async function handleAction(userId, status) {
    const { data: { user } } = await supabase.auth.getUser()
    const notes = rejecting === userId ? rejectNotes : null
    const { error } = await supabase.from('shareholders').update({
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes
    }).eq('id', userId)
    if (error) {
      toast.error('আপডেট করতে সমস্যা হয়েছে')
    } else {
      toast.success(status === 'approved' ? 'অনুমোদিত হয়েছে' : 'বাতিল করা হয়েছে')
    }
    setRejecting(null)
    setRejectNotes('')
    loadUsers()
  }

  const filtered = users.filter(u => {
    if (filter !== 'all' && u.status !== filter) return false
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) &&
        !u.phone?.includes(search)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-ahal-400" />
        <h1 className="text-2xl font-bold text-white">ইউজার ম্যানেজমেন্ট</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white
            focus:ring-2 focus:ring-ahal-500 outline-none" placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-ahal-500"
          value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">সব</option>
          <option value="pending">বিচারাধীন</option>
          <option value="approved">অনুমোদিত</option>
          <option value="rejected">বাতিল</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="text-left p-4">নাম</th>
                <th className="text-left p-4">ফোন</th>
                <th className="text-left p-4">ইমেইল</th>
                <th className="text-left p-4">ব্যবসা</th>
                <th className="text-left p-4">স্ট্যাটাস</th>
                <th className="text-left p-4">তারিখ</th>
                <th className="text-left p-4">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-gray-700/50 text-white hover:bg-gray-700/30">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-300">{user.phone}</td>
                  <td className="p-4 text-gray-300">{user.email}</td>
                  <td className="p-4 text-gray-300">{user.business_types?.name_bn}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300 text-sm">{formatDate(user.created_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${user.id}`}
                        className="p-1.5 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {user.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(user.id, 'approved')}
                            className="p-1.5 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRejecting(user.id)}
                            className="p-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">কোন ইউজার পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">বাতিলের কারণ</h3>
            <p className="text-gray-400 text-sm mb-4">এই ব্যবহারকারী বাতিল করার কারণ লিখুন</p>
            <textarea className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white
              focus:ring-2 focus:ring-ahal-500 outline-none resize-none" rows="3"
              value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
              placeholder="কারণ লিখুন..." />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setRejecting(null); setRejectNotes('') }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                বাতিল
              </button>
              <button onClick={() => handleAction(rejecting, 'rejected')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                <XCircle className="w-4 h-4" /> নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
