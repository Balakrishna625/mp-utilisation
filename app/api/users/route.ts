/**
 * Users API
 * 
 * Handles user/employee data operations
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          monthlyRecords: {
            orderBy: { date: 'desc' },
            take: 12
          },
          badgeHistory: {
            orderBy: { earnedDate: 'desc' },
            take: 20
          }
        }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, user })
    }

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, role, title, managerName, practice, isContractor } = body

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: role || 'employee',
        title: title || null,
        managerName: managerName || null,
        practice: practice || null,
        isContractor: isContractor || false
      },
      create: {
        email,
        name,
        role: role || 'employee',
        title: title || null,
        managerName: managerName || null,
        practice: practice || null,
        isContractor: isContractor || false
      }
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'User saved successfully'
    })
  } catch (error: any) {
    console.error('Error saving user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
