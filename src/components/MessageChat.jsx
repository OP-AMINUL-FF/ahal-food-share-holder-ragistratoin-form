'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, Paperclip, Image, Video, Mic } from 'lucide-react'

export default function MessageChat({ userId, userType, otherId, otherType, otherName }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const messagesEndRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `sender_id=in.(${userId},${otherId})` },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
          if (payload.new.receiver_id === userId) {
            supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, otherId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  async function sendMessage(type = 'text') {
    if (!text.trim() && !file) return
    let mediaUrl = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `chat/${userId}/${Date.now()}.${ext}`
      await supabase.storage.from('message-media').upload(path, file)
      const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(path)
      mediaUrl = publicUrl
    }
    await supabase.from('messages').insert({
      sender_id: userId,
      sender_type: userType,
      receiver_id: otherId,
      receiver_type: otherType,
      message_type: type,
      content: text || null,
      media_url: mediaUrl,
    })
    setText('')
    setFile(null)
  }

  function handleFileSelect(e, type) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      sendMessage(type)
    }
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
              {msg.message_type === 'text' && msg.content && <p>{msg.content}</p>}
              {msg.media_url && (
                <div className="mt-1">
                  {msg.message_type === 'image' && <img src={msg.media_url} alt="Shared" className="rounded-lg max-w-full" />}
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

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full">
            <Image className="w-5 h-5 text-gray-500" />
            <input type="file" accept="image/*" className="hidden"
              onChange={e => handleFileSelect(e, 'image')} />
          </label>
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full">
            <Video className="w-5 h-5 text-gray-500" />
            <input type="file" accept="video/*" className="hidden"
              onChange={e => handleFileSelect(e, 'video')} />
          </label>
          <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full">
            <Mic className="w-5 h-5 text-gray-500" />
            <input type="file" accept="audio/*" className="hidden"
              onChange={e => handleFileSelect(e, 'voice')} />
          </label>
          <input className="flex-1 input-field" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage('text')}
            placeholder="মেসেজ লিখুন..." />
          <button onClick={() => sendMessage('text')}
            className="btn-primary p-2.5 rounded-full">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
