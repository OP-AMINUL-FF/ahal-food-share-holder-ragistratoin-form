'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { Shield, Users, MessageSquare, LayoutDashboard, LogOut, UtensilsCrossed, Loader2 } from 'lucide-react'

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => {
    if (pathname === '/admin/login') { setLoading(false); return }
    let channel = null
    async function loadAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      const { data: isAdmin } = await supabase.rpc('is_admin')
      if (!isAdmin) { router.push('/admin/login'); return }
      setAdmin({ id: user.id })
      const { count } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
      setLoading(false)
      channel = supabase.channel('admin-unread')
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
    loadAdmin()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [pathname])

  if (pathname === '/admin/login') return children

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-ahal-400" />
    </div>
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { href: '/admin/users', icon: Users, label: 'ইউজার ম্যানেজমেন্ট' },
    { href: '/admin/messages', icon: MessageSquare, label: 'মেসেজ সেন্টার' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen hidden md:block">
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-ahal-400" />
            <span className="font-bold text-lg text-white">AHAL Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  ? 'bg-ahal-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.href === '/admin/messages' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 mt-auto">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span>লগআউট</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between md:hidden">
          <span className="font-bold text-white">AHAL Admin</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
