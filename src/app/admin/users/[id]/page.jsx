'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { getStatusColor, getStatusText, formatDate } from '@/lib/utils'
import { ArrowLeft, User, Phone, Mail, MapPin, Briefcase, FileText, Calendar, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNotes, setShowNotes] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('shareholders').select(`
      *,
      divisions!inner(name_bn),
      districts!inner(name_bn),
      upazilas!inner(name_bn),
      unions(name_bn),
      villages(name_bn),
      business_types!inner(name_bn)
    `).eq('id', id).single()
      .then(({ data }) => {
        if (data) setUser(data)
        setLoading(false)
      })
  }, [id])

  async function handleAction(status) {
    if (status === 'rejected') {
      setPendingAction(status)
      setShowNotes(true)
      return
    }
    await confirmAction(status)
  }

  async function confirmAction(status) {
    const { data: { user: admin } } = await supabase.auth.getUser()
    const { error } = await supabase.from('shareholders').update({
      status,
      reviewed_by: admin?.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || null
    }).eq('id', id)
    if (error) toast.error('আপডেট করতে সমস্যা হয়েছে')
    else {
      toast.success(status === 'approved' ? 'অনুমোদিত' : 'বাতিল')
      setUser(prev => ({ ...prev, status, review_notes: reviewNotes }))
    }
    setShowNotes(false)
    setReviewNotes('')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-ahal-400" /></div>
  }
  if (!user) {
    return <div className="text-center py-12 text-gray-400"><User className="w-12 h-12 mx-auto mb-2" /><p>ইউজার পাওয়া যায়নি</p></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/users" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> ইউজার লিস্টে ফিরুন
      </Link>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-ahal-900/50 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-ahal-600/30">
            {user.photo_url ? (
              <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-ahal-400" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
              {getStatusText(user.status)}
            </span>
            {user.review_notes && (
              <div className="mt-3 bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm">
                <p className="text-gray-400 text-xs mb-1">পর্যালোচনা নোট:</p>
                <p className="text-gray-200">{user.review_notes}</p>
              </div>
            )}
            <div className="mt-4 flex gap-3">
              {user.status === 'pending' && (
                <>
                  <button onClick={() => handleAction('approved')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <CheckCircle className="w-4 h-4" /> অনুমোদন
                  </button>
                  <button onClick={() => handleAction('rejected')}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <XCircle className="w-4 h-4" /> বাতিল
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailCard icon={Phone} label="ফোন" value={user.phone} />
        <DetailCard icon={Mail} label="ইমেইল" value={user.email || '-'} />
        <DetailCard icon={MapPin} label="ঠিকানা" value={`${user.villages?.name_bn || ''}${user.unions?.name_bn ? ', ' + user.unions.name_bn : ''}${user.upazilas?.name_bn ? ', ' + user.upazilas.name_bn : ''}${user.districts?.name_bn ? ', ' + user.districts.name_bn : ''}${user.divisions?.name_bn ? ', ' + user.divisions.name_bn : ''}`} />
        <DetailCard icon={Briefcase} label="ব্যবসার ধরন" value={user.business_types?.name_bn} />
        <DetailCard icon={FileText} label="ব্যবসার বিবরণ" value={user.business_description || '-'} />
        <DetailCard icon={Calendar} label="রেজিস্ট্রেশন তারিখ" value={formatDate(user.created_at)} />
      </div>

      {user.nid_front_url && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="font-semibold text-white mb-3">জাতীয় পরিচয়পত্র (সামনে)</h3>
          <div className="max-w-md mx-auto">
            <img src={user.nid_front_url} alt="NID Front" className="rounded-lg w-full border border-gray-600" />
          </div>
        </div>
      )}
      {user.nid_back_url && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="font-semibold text-white mb-3">জাতীয় পরিচয়পত্র (পিছনে)</h3>
          <div className="max-w-md mx-auto">
            <img src={user.nid_back_url} alt="NID Back" className="rounded-lg w-full border border-gray-600" />
          </div>
        </div>
      )}

      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">বাতিলের কারণ</h3>
            <p className="text-gray-400 text-sm mb-4">এই ব্যবহারকারী বাতিল করার কারণ লিখুন</p>
            <textarea className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white
              focus:ring-2 focus:ring-ahal-500 outline-none resize-none" rows="3"
              value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
              placeholder="কারণ লিখুন..." />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setShowNotes(false); setReviewNotes('') }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                বাতিল
              </button>
              <button onClick={() => confirmAction('rejected')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                <XCircle className="w-4 h-4" /> নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center gap-3">
        <div className="bg-ahal-900/30 p-2.5 rounded-lg">
          <Icon className="w-5 h-5 text-ahal-400" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white font-medium">{value}</p>
        </div>
      </div>
    </div>
  )
}
