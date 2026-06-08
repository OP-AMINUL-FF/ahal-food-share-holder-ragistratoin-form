'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { getStatusColor, getStatusText } from '@/lib/utils'
import { LayoutDashboard, MessageSquare, Users, LogOut, UtensilsCrossed, Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let channel = null
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('shareholders')
        .select('*').eq('auth_user_id', user.id).single()
      if (!data) { router.push('/login'); return }
      if (data.status !== 'approved') {
        setProfile(data)
        setLoading(false)
        return
      }
      const { count } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
      setProfile(data)
      setLoading(false)
      channel = supabase.channel('user-unread')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'messages',
            filter: `receiver_id=eq.${user.id}` },
          async () => {
            const { count } = await supabase.from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('receiver_id', user.id)
              .eq('is_read', false)
            setUnreadCount(count || 0)
          }
        )
        .subscribe()
    }
    loadProfile()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ahal-600" />
      </div>
    )
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">লোড হচ্ছে...</div>
  }

  if (profile.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <UtensilsCrossed className="w-16 h-16 text-ahal-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">অভিনন্দন! আপনার নিবন্ধন জমা দেওয়া হয়েছে</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium my-4
            bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            বিচারাধীন — অনুমোদনের অপেক্ষায়
          </div>
          <p className="text-gray-600 mb-4">
            আপনার তথ্য যাচাই করা হচ্ছে। অনুমোদিত হলে আপনি ড্যাশবোর্ড অ্যাক্সেস করতে পারবেন।
          </p>
          <button onClick={handleLogout} className="btn-secondary">লগআউট</button>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { href: '/dashboard/messages', icon: MessageSquare, label: 'মেসেজ' },
    { href: '/dashboard/members', icon: Users, label: 'সদস্যগণ' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r min-h-screen hidden md:block">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2 text-ahal-700">
            <UtensilsCrossed className="w-6 h-6" />
            <span className="font-bold text-lg">AHAL</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-ahal-50 hover:text-ahal-700 transition-colors">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.href === '/dashboard/messages' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t mt-auto">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span>লগআউট</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 flex items-center justify-between md:hidden">
          <Link href="/" className="flex items-center gap-2 text-ahal-700">
            <UtensilsCrossed className="w-6 h-6" />
            <span className="font-bold">AHAL</span>
          </Link>
          <div className="flex items-center gap-2">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="p-2 text-gray-600 hover:text-ahal-600 relative">
                <item.icon className="w-5 h-5" />
                {item.href === '/dashboard/messages' && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
            <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
