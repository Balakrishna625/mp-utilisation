'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Dashboard from '@/components/Dashboard'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect individual users to their own dashboard
    if (user?.role === 'individual') {
      router.push('/individual')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'manager') {
    return <LoadingSkeleton />
  }

  return <Dashboard />
}
