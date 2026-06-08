export function setRememberMe(remember) {
  localStorage.setItem('ahal_remember', remember ? 'true' : 'false')
}

export function getRememberMe() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('ahal_remember') !== 'false'
}
