'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Users, MapPin, Briefcase, User } from 'lucide-react'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('shareholders').select(`
      id, name, phone, photo_url,
      divisions!inner(name_bn),
      business_types!inner(name_bn)
    `).eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMembers(data) })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-ahal-600" />
        <h1 className="text-2xl font-bold">সদস্যগণ</h1>
      </div>
      <p className="text-gray-500">অন্যান্য অনুমোদিত সদস্যদের দেখুন</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div key={member.id} className="card flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-ahal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-ahal-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{member.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {member.divisions?.name_bn}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {member.business_types?.name_bn}
              </p>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <p>কোন সদস্য নেই</p>
          </div>
        )}
      </div>
    </div>
  )
}
