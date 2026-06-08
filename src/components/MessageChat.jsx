'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, Image, Video, Mic, X, StopCircle, Play, Trash2 } from 'lucide-react'

export default function MessageChat({ userId, userType, otherId, otherType, otherName }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const supabase = createClient()
  if (!supabase) return null

  // File preview state
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewType, setPreviewType] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel(`chat-${userId}-${otherId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new
          const isOurs = (m.sender_id === userId && m.receiver_id === otherId) ||
                         (m.sender_id === otherId && m.receiver_id === userId)
          if (!isOurs) return
          setMessages(prev => [...prev, m])
          if (m.receiver_id === userId) {
            supabase.from('messages').update({ is_read: true }).eq('id', m.id)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, otherId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
      stopMediaStream()
    }
  }, [])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data)
      const unreadIds = data.filter(m => m.receiver_id === userId && !m.is_read).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
      }
    }
  }

  // ---- File Selection ----

  function handleFileSelect(e, type) {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(f)
    setPreviewType(type)
    setPreviewUrl(URL.createObjectURL(f))
    e.target.value = ''
  }

  function clearFileSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewType(null)
    setPreviewUrl(null)
  }

  // ---- Voice Recording ----

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioPreviewUrl(url)
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
        setRecordingTimer(0)
        stopMediaStream()
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingTimer(0)
      timerRef.current = setInterval(() => {
        setRecordingTimer(t => t + 1)
      }, 1000)
    } catch {
      alert('মাইক্রোফোন অ্যাক্সেস করা যায়নি')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  function cancelAudio() {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
    setAudioBlob(null)
    setAudioPreviewUrl(null)
    setRecordingTimer(0)
    stopMediaStream()
  }

  function stopMediaStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      audioRef.current.onended = () => setIsPlaying(false)
    }
  }

  // ---- Send Message ----

  async function handleSend() {
    if (sending) return
    if (!text.trim() && !selectedFile && !audioBlob) return
    setSending(true)

    let type = 'text'
    let mediaUrl = null

    if (selectedFile) {
      type = previewType
      const ext = selectedFile.name.split('.').pop()
      const path = `chat/${userId}/${Date.now()}.${ext}`
      await supabase.storage.from('message-media').upload(path, selectedFile)
      const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(path)
      mediaUrl = publicUrl
    } else if (audioBlob) {
      type = 'voice'
      const path = `chat/${userId}/${Date.now()}.webm`
      await supabase.storage.from('message-media').upload(path, audioBlob)
      const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(path)
      mediaUrl = publicUrl
    }

    const { data: newMsg } = await supabase.from('messages').insert({
      sender_id: userId,
      sender_type: userType,
      receiver_id: otherId,
      receiver_type: otherType,
      message_type: type,
      content: text.trim() || null,
      media_url: mediaUrl,
    }).select().single()
    if (newMsg) setMessages(prev => [...prev, newMsg])

    setText('')
    clearFileSelection()
    cancelAudio()
    setSending(false)
  }

  function formatTimer(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-xl bg-white">
      <div className="p-4 border-b bg-gray-50 rounded-t-xl">
        <h3 className="font-semibold">{otherName || 'চ্যাট'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
              msg.sender_id === userId
                ? 'bg-ahal-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}>
              {msg.content && <p>{msg.content}</p>}
              {msg.media_url && (
                <div className={msg.content ? 'mt-1' : ''}>
                  {msg.message_type === 'image' && <img src={msg.media_url} alt="" className="rounded-lg max-w-full" />}
                  {msg.message_type === 'video' && <video src={msg.media_url} controls className="rounded-lg max-w-full" />}
                  {msg.message_type === 'voice' && <audio src={msg.media_url} controls className="w-full" />}
                </div>
              )}
              <p className={`text-xs mt-1 ${msg.sender_id === userId ? 'text-white/70' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t space-y-2">
        {/* File Preview Bar */}
        {previewUrl && selectedFile && (
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-200">
              {previewType === 'image' ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <video src={previewUrl} className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-sm text-gray-600 truncate flex-1">{selectedFile.name}</span>
            <button onClick={clearFileSelection} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Audio Preview Bar */}
        {audioPreviewUrl && !isRecording && (
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
            <button onClick={togglePlay} className="p-2 bg-ahal-600 text-white rounded-full hover:bg-ahal-700">
              {isPlaying ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              {isPlaying && (
                <audio ref={audioRef} src={audioPreviewUrl} onEnded={() => setIsPlaying(false)} />
              )}
              <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
                <div className={`h-full bg-ahal-600 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{ width: isPlaying ? '60%' : '0%' }} />
              </div>
            </div>
            <span className="text-xs text-gray-500">ভয়েস</span>
            <button onClick={cancelAudio} className="p-1 hover:bg-gray-200 rounded-full">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Recording UI */}
        {isRecording && (
          <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-200">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 font-mono text-sm">{formatTimer(recordingTimer)}</span>
            <span className="text-red-500 text-sm flex-1">রেকর্ডিং...</span>
            <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700">
              <StopCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full">
            <Image className="w-5 h-5 text-gray-500" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleFileSelect(e, 'image')} />
          </label>
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full">
            <Video className="w-5 h-5 text-gray-500" />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
              onChange={e => handleFileSelect(e, 'video')} />
          </label>
          <button onClick={startRecording} disabled={isRecording}
            className={`p-2 rounded-full ${isRecording ? 'bg-red-100 text-red-500' : 'hover:bg-gray-100 text-gray-500'}`}>
            <Mic className="w-5 h-5" />
          </button>
          <input className="flex-1 input-field" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="মেসেজ লিখুন..." />
          <button onClick={handleSend} disabled={sending || (!text.trim() && !selectedFile && !audioBlob)}
            className="btn-primary p-2.5 rounded-full disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
