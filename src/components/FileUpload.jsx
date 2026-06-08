'use client'

import { useState, useRef } from 'react'
import { Upload, X, Camera } from 'lucide-react'

export default function FileUpload({ label, accept = 'image/*', onUpload, value }) {
  const [preview, setPreview] = useState(value || null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('ফাইলের সাইজ ৫MB এর কম হতে হবে')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    onUpload(file)
  }

  function handleRemove() {
    setPreview(null)
    onUpload(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {preview ? (
          <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 hover:border-ahal-500 
              flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-ahal-600 transition-colors">
            <Camera className="w-8 h-8" />
            <span className="text-sm">ছবি আপলোড করুন</span>
            <span className="text-xs text-gray-400">PNG, JPG (সর্বোচ্চ ৫MB)</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile}
          className="hidden" />
      </div>
    </div>
  )
}
