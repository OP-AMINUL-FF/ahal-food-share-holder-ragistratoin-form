'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import LocationDropdowns from '@/components/LocationDropdowns'
import FileUpload from '@/components/FileUpload'
import { UtensilsCrossed, UserPlus, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => {
    supabase.from('business_types').select('*').eq('is_active', true).order('name_bn')
      .then(({ data }) => { if (data) setBusinessTypes(data) })
  }, [])

  function handleLocationChange(loc) {
    setForm(prev => ({ ...prev, ...loc }))
  }

  async function uploadFile(file, bucket, path) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    return publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password !== form.confirm_password) {
      setError('পাসওয়ার্ড মিলছে না')
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw new Error(authError.message)

      let photoUrl = null, nidFrontUrl = null, nidBackUrl = null

      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'shareholder-photos', `photos/${authData.user.id}`)
      }
      if (nidFrontFile) {
        nidFrontUrl = await uploadFile(nidFrontFile, 'shareholder-nid', `nid/${authData.user.id}-front`)
      }
      if (nidBackFile) {
        nidBackUrl = await uploadFile(nidBackFile, 'shareholder-nid', `nid/${authData.user.id}-back`)
      }

      const { error: profileError } = await supabase.from('shareholders').insert({
        auth_user_id: authData.user.id,
        name: form.name,
        father_name: form.father_name,
        mother_name: form.mother_name,
        date_of_birth: form.date_of_birth,
        phone: form.phone,
        email: form.email,
        division_id: form.division_id || null,
        district_id: form.district_id || null,
        upazila_id: form.upazila_id || null,
        union_id: form.union_id || null,
        village_id: form.village_id || null,
        address_details: form.address_details,
        photo_url: photoUrl,
        nid_front_url: nidFrontUrl,
        nid_back_url: nidBackUrl,
        business_type_id: form.business_type_id || null,
        status: 'pending'
      })
      if (profileError) throw new Error(profileError.message)

      router.push('/login?registered=true')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-ahal-700 hover:text-ahal-800">
            <UtensilsCrossed className="w-8 h-8" />
            <span className="text-xl font-bold">AHAL</span>
          </Link>
          <h1 className="text-2xl font-bold text-ahal-900 mt-4">নিবন্ধন ফর্ম</h1>
          <p className="text-gray-500">নিচের ফর্মটি পূরণ করে নিবন্ধন সম্পন্ন করুন</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-ahal-700 border-b pb-2">ব্যক্তিগত তথ্য</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">নাম *</label>
                <input className="input-field" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">পিতার নাম *</label>
                <input className="input-field" value={form.father_name}
                  onChange={e => setForm(f => ({ ...f, father_name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">মাতার নাম *</label>
                <input className="input-field" value={form.mother_name}
                  onChange={e => setForm(f => ({ ...f, mother_name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">জন্ম তারিখ *</label>
                <input type="date" className="input-field" value={form.date_of_birth}
                  onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} required />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-ahal-700 border-b pb-2">ঠিকানা</h2>
            <LocationDropdowns values={form} onChange={handleLocationChange} />
            <div>
              <label className="label">বিস্তারিত ঠিকানা</label>
              <textarea className="input-field" rows="2" value={form.address_details}
                onChange={e => setForm(f => ({ ...f, address_details: e.target.value }))}
                placeholder="রাস্তা, বাড়ি নম্বর, এলাকা ইত্যাদি" />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-ahal-700 border-b pb-2">ছবি আপলোড</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FileUpload label="প্রোফাইল ছবি" onUpload={setPhotoFile} value={photoFile} />
              <FileUpload label="এনআইডি (সামনে)" onUpload={setNidFrontFile} value={nidFrontFile} />
              <FileUpload label="এনআইডি (পিছনে)" onUpload={setNidBackFile} value={nidBackFile} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-ahal-700 border-b pb-2">যোগাযোগের তথ্য</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">মোবাইল নম্বর *</label>
                <input type="tel" className="input-field" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required placeholder="০১৭XXXXXXXX" />
              </div>
              <div>
                <label className="label">ইমেইল *</label>
                <input type="email" className="input-field" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required placeholder="your@email.com" />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-ahal-700 border-b pb-2">অ্যাকাউন্ট তথ্য</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">পাসওয়ার্ড *</label>
                <input type="password" className="input-field" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div>
                <label className="label">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input type="password" className="input-field" value={form.confirm_password}
                  onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))} required />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-ahal-700 border-b pb-2">ব্যবসার তথ্য</h2>
            <div>
              <label className="label">ব্যবসার ধরন *</label>
              <select className="select-field" value={form.business_type_id}
                onChange={e => setForm(f => ({ ...f, business_type_id: e.target.value }))} required>
                <option value="">ব্যবসার ধরন নির্বাচন করুন</option>
                {businessTypes.map(bt => (
                  <option key={bt.id} value={bt.id}>{bt.name_bn}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-lg">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {loading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন জমা দিন'}
          </button>

          <p className="text-center text-sm text-gray-500">
            ইতিমধ্যে নিবন্ধিত? <Link href="/login" className="text-ahal-600 hover:underline">লগইন করুন</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
