'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import { User, Phone, Mail, Calendar, Briefcase, MapPin } from 'lucide-react'

export default function DashboardHome() {
  const [profile, setProfile] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('shareholders').select(`
          *,
          divisions!inner(name_bn),
          districts!inner(name_bn),
          upazilas!inner(name_bn),
          business_types!inner(name_bn)
        `).eq('auth_user_id', user.id).single().then(({ data }) => {
          if (data) setProfile(data)
        })
      }
    })
  }, [])

  if (!profile) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">স্বাগতম, {profile.name}!</h1>
      <p className="text-gray-500">আপনার ড্যাশবোর্ড থেকে সবকিছু manage করুন</p>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">আপনার প্রোফাইল</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-ahal-600" />
            <div><span className="text-sm text-gray-500">নাম</span><p className="font-medium">{profile.name}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-ahal-600" />
            <div><span className="text-sm text-gray-500">জন্ম তারিখ</span><p className="font-medium">{formatDate(profile.date_of_birth)}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-ahal-600" />
            <div><span className="text-sm text-gray-500">মোবাইল</span><p className="font-medium">{profile.phone}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-ahal-600" />
            <div><span className="text-sm text-gray-500">ইমেইল</span><p className="font-medium">{profile.email}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-ahal-600" />
            <div><span className="text-sm text-gray-500">ঠিকানা</span><p className="font-medium">{profile.divisions?.name_bn}, {profile.districts?.name_bn}, {profile.upazilas?.name_bn}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-ahal-600" />
            <div><span className="text-sm text-gray-500">ব্যবসা</span><p className="font-medium">{profile.business_types?.name_bn}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
