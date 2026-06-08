'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import MessageChat from '@/components/MessageChat'
import { MessageSquare, Search, User, CheckCheck } from 'lucide-react'

export default function AdminMessagesPage() {
  const [adminUser, setAdminUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAdminUser(user.id)

      const { data: shs } = await supabase.from('shareholders')
        .select('id, name, phone, photo_url, auth_user_id')
        .eq('status', 'approved')
        .order('name')
      if (!shs) return

      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, message_type, created_at, is_read')
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const lastMsgMap = {}
      const unreadMap = {}
      if (msgs) {
        for (const m of msgs) {
          const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
          if (!lastMsgMap[otherId]) lastMsgMap[otherId] = m
          if (m.receiver_id === user.id && !m.is_read) {
            unreadMap[otherId] = (unreadMap[otherId] || 0) + 1
          }
        }
      }

      const convos = shs
        .filter(sh => sh.auth_user_id && (lastMsgMap[sh.auth_user_id] || true))
        .map(sh => ({
          ...sh,
          lastMessage: lastMsgMap[sh.auth_user_id] || null,
          unreadCount: unreadMap[sh.auth_user_id] || 0
        }))
        .sort((a, b) => {
          if (a.unreadCount && !b.unreadCount) return -1
          if (!a.unreadCount && b.unreadCount) return 1
          const tA = a.lastMessage?.created_at || ''
          const tB = b.lastMessage?.created_at || ''
          return tB.localeCompare(tA)
        })

      setConversations(convos)
    }
    init()
  }, [])

  const filtered = conversations.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  useEffect(() => {
    if (!adminUser) return
    const channel = supabase.channel('admin-msg-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `receiver_id=eq.${adminUser}` },
        async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const { data: msgs } = await supabase
            .from('messages')
            .select('sender_id, receiver_id, content, message_type, created_at, is_read')
            .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
            .order('created_at', { ascending: false })

          const unreadMap = {}
          const lastMsgMap = {}
          if (msgs) {
            for (const m of msgs) {
              const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
              if (!lastMsgMap[otherId]) lastMsgMap[otherId] = m
              if (m.receiver_id === user.id && !m.is_read) {
                unreadMap[otherId] = (unreadMap[otherId] || 0) + 1
              }
            }
          }
          setConversations(prev => prev.map(c => ({
            ...c,
            lastMessage: lastMsgMap[c.auth_user_id] || c.lastMessage,
            unreadCount: unreadMap[c.auth_user_id] || 0
          })))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [adminUser])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-ahal-400" />
        মেসেজ সেন্টার
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm
                focus:ring-2 focus:ring-ahal-500 outline-none" placeholder="সদস্য খুঁজুন..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
            {filtered.map(sh => (
              <button key={sh.id} onClick={() => setSelectedUser(sh)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-700/30 ${
                  selectedUser?.id === sh.id ? 'bg-ahal-600/20 border-l-2 border-ahal-500' : ''
                }`}>
                <div className="w-10 h-10 rounded-full bg-ahal-900/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {sh.photo_url ? (
                    <img src={sh.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-ahal-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium truncate">{sh.name}</p>
                    {sh.unreadCount > 0 && (
                      <span className="ml-2 bg-ahal-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {sh.unreadCount}
                      </span>
                    )}
                  </div>
                  {sh.lastMessage ? (
                    <div className="flex items-center gap-1">
                      {sh.lastMessage.sender_id === adminUser && (
                        <CheckCheck className={`w-3 h-3 ${sh.lastMessage.is_read ? 'text-blue-400' : 'text-gray-500'}`} />
                      )}
                      <p className="text-gray-400 text-xs truncate">
                        {sh.lastMessage.message_type === 'text'
                          ? (sh.lastMessage.content || '')
                          : sh.lastMessage.message_type === 'image' ? '[ছবি]'
                          : sh.lastMessage.message_type === 'video' ? '[ভিডিও]'
                          : sh.lastMessage.message_type === 'voice' ? '[ভয়েস]'
                          : ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs">কোন মেসেজ নেই</p>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">কোন সদস্য নেই</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedUser && adminUser ? (
            <MessageChat
              userId={adminUser}
              userType="admin"
              otherId={selectedUser.auth_user_id}
              otherType="shareholder"
              otherName={selectedUser.name}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px] bg-gray-800 rounded-xl border border-gray-700">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p>বাম পাশ থেকে একজন সদস্য নির্বাচন করুন</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
