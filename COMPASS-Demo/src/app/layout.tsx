import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AirWise - Aircraft Maintenance Command Center',
  description: 'Professional aircraft maintenance management system with timeline scheduling and AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className='dark'>
      <body className='min-h-screen bg-white'>
          <main style={{ zoom: 0.8 }}>
            {children}
          </main>
      </body>
    </html>
  )
} 