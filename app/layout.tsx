import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AppLayout from '@/components/AppLayout'

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
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </ThemeProvider>
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
