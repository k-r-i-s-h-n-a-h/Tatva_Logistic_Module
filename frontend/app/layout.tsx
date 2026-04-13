import type { Metadata } from 'next'
import './globals.css' // This is CRUCIAL for your Tailwind styles to work!

// This is what shows up in the browser tab
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
      {/* antialiased makes the font look sharp and premium */}
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}