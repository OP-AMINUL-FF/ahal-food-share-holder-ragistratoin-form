export function setRememberMe(remember) {
  localStorage.setItem('ahal_remember', remember ? 'true' : 'false')
}

export function getRememberMe() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('ahal_remember') !== 'false'
}

export function applySessionPersistence(remember) {
  if (remember) return
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const c = cookie.trim()
    if (c.startsWith('sb-')) {
      const eq = c.indexOf('=')
      const name = c.substring(0, eq)
      const value = c.substring(eq + 1)
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      document.cookie = name + '=' + value + '; path=/'
    }
  }
}
