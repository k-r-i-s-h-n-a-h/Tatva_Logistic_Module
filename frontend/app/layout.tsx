import type { Metadata } from 'next'
import Script from 'next/script' 
import './globals.css'
import { AuthProvider } from '@/context/AuthContext' // 1. Added the AuthProvider import

export const metadata: Metadata = {
  title: 'Tatvaops Logistics & Fleet Optimizer',
  description: 'Optimize your delivery routes and fleet management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        
        {/* 2. Wrapped children with the AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* Kept your Google Maps Script exactly as it was */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  )
}