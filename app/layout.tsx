import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MP Utilisation - Employee Time Tracking',
  description: 'Enterprise-level employee utilization tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('🚀 MP Utilisation App loaded');
            console.log('💡 Tip: Use window.testDataParsing() to verify uploaded data');
          `
        }} />
      </body>
    </html>
  )
}
