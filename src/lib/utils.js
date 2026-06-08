export function getStatusColor(status) {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusText(status) {
  switch (status) {
    case 'approved': return 'অনুমোদিত'
    case 'pending': return 'বিচারাধীন'
    case 'rejected': return 'বাতিল'
    default: return status
  }
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
