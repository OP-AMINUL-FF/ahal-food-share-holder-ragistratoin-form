'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import MessageChat from '@/components/MessageChat'
import { MessageSquare } from 'lucide-react'

export default function UserMessagesPage() {
  const [userId, setUserId] = useState(null)
  const [adminId, setAdminId] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: admin } = await supabase.from('admins').select('id, auth_user_id').limit(1).single()
        if (admin) setAdminId(admin.auth_user_id)
      }
    }
    init()
  }, [])

  if (!userId || !adminId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">মেসেজ</h1>
      <p className="text-gray-500"> AHAL এর প্রতিষ্ঠাতা/এডমিনের সাথে যোগাযোগ করুন</p>
      <MessageChat
        userId={userId}
        userType="shareholder"
        otherId={adminId}
        otherType="admin"
        otherName="AHAL প্রশাসক"
      />
    </div>
  )
}
