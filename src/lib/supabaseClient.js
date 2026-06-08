import { createBrowserClient } from '@supabase/ssr'

function parseCookies() {
  if (typeof document === 'undefined') return []
  return document.cookie.split('; ').filter(Boolean).map(c => {
    const sep = c.indexOf('=')
    return { name: c.substring(0, sep), value: c.substring(sep + 1) }
  })
}

function getRemember() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('ahal_remember') !== 'false'
}

function setCookie(name, value, remember) {
  const parts = [`${name}=${value}`, 'path=/', 'SameSite=Lax']
  if (remember) parts.push('max-age=31536000')
  if (location.protocol === 'https:') parts.push('Secure')
  document.cookie = parts.join('; ')
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key, {
    cookies: {
      getAll() { return parseCookies() },
      setAll(cookiesToSet) {
        const remember = getRemember()
        cookiesToSet.forEach(({ name, value }) => {
          if (value) setCookie(name, value, remember)
        })
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}
