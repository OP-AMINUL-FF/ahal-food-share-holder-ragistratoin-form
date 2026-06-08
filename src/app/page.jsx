'use client'

import Link from 'next/link'
import { UtensilsCrossed, Users, Shield, MessageSquare } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8 text-ahal-600" />
            <span className="text-xl font-bold text-ahal-800">AHAL</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">লগইন</Link>
            <Link href="/register" className="btn-primary text-sm">রেজিস্টার</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold text-ahal-900 mb-4">
            AHAL ফুড শেয়ার হোল্ডার
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            ফুড শেয়ার হোল্ডার রেজিস্ট্রেশন সিস্টেমে আপনাকে স্বাগতম। 
            নিবন্ধন করুন এবং আমাদের সাথে যুক্ত হন।
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              নিবন্ধন করুন
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              লগইন
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <Users className="w-12 h-12 text-ahal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">সহজ নিবন্ধন</h3>
              <p className="text-gray-600">আপনার তথ্য দিন এবং সহজেই নিবন্ধন সম্পন্ন করুন</p>
            </div>
            <div className="card text-center">
              <Shield className="w-12 h-12 text-ahal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">নিরাপদ সিস্টেম</h3>
              <p className="text-gray-600">আপনার তথ্য সম্পূর্ণ সুরক্ষিত রাখা হয়</p>
            </div>
            <div className="card text-center">
              <MessageSquare className="w-12 h-12 text-ahal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">সরাসরি যোগাযোগ</h3>
              <p className="text-gray-600">এডমিনের সাথে সরাসরি মেসেজিং এর সুবিধা</p>
            </div>
          </div>
        </section>

        <footer className="border-t bg-white py-8 text-center text-gray-500">
          <p>&copy; 2026 AHAL — Developed by <strong>OP AMINUL FF</strong> (OPX)</p>
          <p className="text-sm mt-1">Founder: HM Fayzullah</p>
        </footer>
      </main>
    </div>
  )
}
