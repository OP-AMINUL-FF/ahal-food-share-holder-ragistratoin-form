'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function LocationDropdowns({ values, onChange }) {
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])
  const [villages, setVillages] = useState([])
  const supabase = createClient()
  if (!supabase) return null

  useEffect(() => {
    supabase.from('divisions').select('*').order('name_bn').then(({ data }) => {
      if (data) setDivisions(data)
    })
  }, [])

  async function loadDistricts(divisionId) {
    if (!divisionId) { setDistricts([]); setUpazilas([]); setUnions([]); setVillages([]); return }
    const { data } = await supabase.from('districts').select('*')
      .eq('division_id', divisionId).order('name_bn')
    if (data) setDistricts(data)
    setUpazilas([]); setUnions([]); setVillages([])
  }

  async function loadUpazilas(districtId) {
    if (!districtId) { setUpazilas([]); setUnions([]); setVillages([]); return }
    const { data } = await supabase.from('upazilas').select('*')
      .eq('district_id', districtId).order('name_bn')
    if (data) setUpazilas(data)
    setUnions([]); setVillages([])
  }

  async function loadUnions(upazilaId) {
    if (!upazilaId) { setUnions([]); setVillages([]); return }
    const { data } = await supabase.from('unions').select('*')
      .eq('upazila_id', upazilaId).order('name_bn')
    if (data) setUnions(data)
    setVillages([])
  }

  async function loadVillages(unionId) {
    if (!unionId) { setVillages([]); return }
    const { data } = await supabase.from('villages').select('*')
      .eq('union_id', unionId).order('name_bn')
    if (data) setVillages(data)
  }

  function handleChange(field, value) {
    const newValues = { ...values, [field]: value }
    if (field === 'division_id') {
      newValues.district_id = ''; newValues.upazila_id = ''; newValues.union_id = ''; newValues.village_id = ''
      loadDistricts(value)
    }
    if (field === 'district_id') {
      newValues.upazila_id = ''; newValues.union_id = ''; newValues.village_id = ''
      loadUpazilas(value)
    }
    if (field === 'upazila_id') {
      newValues.union_id = ''; newValues.village_id = ''
      loadUnions(value)
    }
    if (field === 'union_id') {
      newValues.village_id = ''
      loadVillages(value)
    }
    onChange(newValues)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">বিভাগ</label>
        <select className="select-field" value={values.division_id || ''}
          onChange={e => handleChange('division_id', e.target.value)}>
          <option value="">বিভাগ নির্বাচন করুন</option>
          {divisions.map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
        </select>
      </div>
      <div>
        <label className="label">জেলা</label>
        <select className="select-field" value={values.district_id || ''}
          onChange={e => handleChange('district_id', e.target.value)}>
          <option value="">জেলা নির্বাচন করুন</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
        </select>
      </div>
      <div>
        <label className="label">থানা/উপজেলা</label>
        <select className="select-field" value={values.upazila_id || ''}
          onChange={e => handleChange('upazila_id', e.target.value)}>
          <option value="">থানা নির্বাচন করুন</option>
          {upazilas.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
        </select>
      </div>
      <div>
        <label className="label">ইউনিয়ন</label>
        <select className="select-field" value={values.union_id || ''}
          onChange={e => handleChange('union_id', e.target.value)}>
          <option value="">ইউনিয়ন নির্বাচন করুন</option>
          {unions.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label">গ্রাম</label>
        <select className="select-field" value={values.village_id || ''}
          onChange={e => handleChange('village_id', e.target.value)}>
          <option value="">গ্রাম নির্বাচন করুন</option>
          {villages.map(v => <option key={v.id} value={v.id}>{v.name_bn}</option>)}
        </select>
      </div>
    </div>
  )
}
