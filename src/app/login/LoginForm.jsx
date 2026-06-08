'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { setRememberMe, getRememberMe, applySessionPersistence } from '@/lib/auth'
import { UtensilsCrossed, LogIn, CheckCircle } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMeState] = useState(() => getRememberMe())
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMsg('নিবন্ধন সফল হয়েছে! আপনার ইমেইল ভেরিফাই করে লগইন করুন।')
    }
  }, [searchParams])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email, password
    })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'ভুল ইমেইল বা পাসওয়ার্ড'
        : authError.message)
      setLoading(false)
      return
    }

    setRememberMe(rememberMe)
    applySessionPersistence(rememberMe)

    await supabase.auth.getUser()

    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (isAdmin) {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="w-full max-w-md card">
        <div className="text-center mb-8">
          <UtensilsCrossed className="w-12 h-12 text-ahal-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-ahal-800">লগইন</h1>
          <p className="text-gray-500 text-sm mt-1">আপনার অ্যাকাউন্টে সাইন ইন করুন</p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">ইমেইল</label>
            <input type="email" className="input-field" value={email}
              onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div>
            <label className="label">পাসওয়ার্ড</label>
            <input type="password" className="input-field" value={password}
              onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={rememberMe}
              onChange={e => setRememberMeState(e.target.checked)}
              className="accent-ahal-600 w-4 h-4" />
            রিমেম্বার মি
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            {loading ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          নিবন্ধন করেননি? <Link href="/register" className="text-ahal-600 hover:underline">রেজিস্টার করুন</Link>
        </p>
      </div>
    </div>
  )
}
