'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSkeleton from './LoadingSkeleton'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('manager' | 'individual')[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // If specific roles are required, check them
    if (allowedRoles && allowedRoles.length > 0) {
      if (!user || !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard
        if (user?.role === 'manager') {
          router.push('/')
        } else if (user?.role === 'individual') {
          router.push('/individual')
        }
      }
    }
  }, [isAuthenticated, user, allowedRoles, router])

  if (!isAuthenticated) {
    return <LoadingSkeleton />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <LoadingSkeleton />
    }
  }

  return <>{children}</>
}
