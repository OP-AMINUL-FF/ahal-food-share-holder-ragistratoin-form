import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'AHAL - Food Share Holder Registration',
  description: 'AHAL Food Share Holder Registration System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="bn" dir="ltr">
      <body className="min-h-screen">
        {children}
        <Toaster position="top-center" toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }
        }} />
      </body>
    </html>
  )
}
