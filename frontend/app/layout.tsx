import type { Metadata } from 'next'
import Script from 'next/script' // 1. Import the Script component
import './globals.css'

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
        {children}
        
        {/* 2. Add the Google Maps Script here */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  )
}