'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { setRememberMe, applySessionPersistence } from '@/lib/auth'
import { Shield, LogIn } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMeState] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  if (!supabase) return null

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('ভুল ইমেইল বা পাসওয়ার্ড')
      setLoading(false)
      return
    }
    setRememberMe(rememberMe)
    applySessionPersistence(rememberMe)
    router.push('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-ahal-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white">এডমিন লগইন</h1>
          <p className="text-gray-400 text-sm mt-1">AHAL প্রশাসন প্যানেল</p>
        </div>
        {error && <div className="bg-red-900/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label text-gray-300">ইমেইল</label>
            <input type="email" className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white
              focus:ring-2 focus:ring-ahal-500 outline-none" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label text-gray-300">পাসওয়ার্ড</label>
            <input type="password" className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white
              focus:ring-2 focus:ring-ahal-500 outline-none" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input type="checkbox" checked={rememberMe}
              onChange={e => setRememberMeState(e.target.checked)}
              className="accent-ahal-600 w-4 h-4" />
            রিমেম্বার মি
          </label>
          <button type="submit" disabled={loading}
            className="w-full bg-ahal-600 hover:bg-ahal-700 text-white font-medium py-2.5 px-5 rounded-lg
              transition-colors flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            {loading ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন'}
          </button>
        </form>
      </div>
    </div>
  )
}
