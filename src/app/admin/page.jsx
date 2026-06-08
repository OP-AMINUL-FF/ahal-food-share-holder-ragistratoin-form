'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Users, UserCheck, UserX, Clock, MessageSquare, ArrowRight } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase.from('shareholders').select('status')
      if (data) {
        setStats({
          total: data.length,
          pending: data.filter(s => s.status === 'pending').length,
          approved: data.filter(s => s.status === 'approved').length,
          rejected: data.filter(s => s.status === 'rejected').length,
        })
      }
    }
    loadStats()
  }, [])

  const cards = [
    { label: 'মোট ইউজার', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { label: 'বিচারাধীন', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    { label: 'অনুমোদিত', value: stats.approved, icon: UserCheck, color: 'text-green-400', bg: 'bg-green-900/20' },
    { label: 'বাতিল', value: stats.rejected, icon: UserX, color: 'text-red-400', bg: 'bg-red-900/20' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">এডমিন ড্যাশবোর্ড</h1>
      <p className="text-gray-400">AHAL ফুড শেয়ার হোল্ডার রেজিস্ট্রেশন সিস্টেম</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.pending > 0 && (
        <Link href="/admin/users"
          className="flex items-center justify-between bg-ahal-600/20 border border-ahal-600/30 rounded-xl p-4
            hover:bg-ahal-600/30 transition-colors group">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white font-medium">{stats.pending} জন ব্যবহারকারী অনুমোদনের অপেক্ষায়</p>
              <p className="text-gray-400 text-sm">ইউজার ম্যানেজমেন্টে যান</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        </Link>
      )}
    </div>
  )
}
