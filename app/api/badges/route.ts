/**
 * Badge History API
 * 
 * Handles achievement badge history operations
 * Replaces localStorage badge tracking with database
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET badge history for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const badgeId = searchParams.get('badgeId')
    const period = searchParams.get('period')

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const where: any = { userEmail }
    if (badgeId) where.badgeId = badgeId
    if (period) where.period = period

    const badges = await prisma.badgeHistory.findMany({
      where,
      orderBy: { earnedDate: 'desc' }
    })

    // Group by badgeId for frontend consumption
    const grouped = badges.reduce((acc: any, badge: any) => {
      if (!acc[badge.badgeId]) {
        acc[badge.badgeId] = []
      }
      acc[badge.badgeId].push({
        badgeId: badge.badgeId,
        earnedDate: badge.earnedDate.toISOString(),
        period: badge.period,
        achievementData: {
          utilization: badge.utilization,
          projectHours: badge.projectHours,
          menteeCount: badge.menteeCount,
          improvement: badge.improvement
        }
      })
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      badges: badges.map((b: any) => ({
        badgeId: b.badgeId,
        earnedDate: b.earnedDate.toISOString(),
        period: b.period,
        achievementData: {
          utilization: b.utilization,
          projectHours: b.projectHours,
          menteeCount: b.menteeCount,
          improvement: b.improvement
        }
      })),
      grouped
    })
  } catch (error: any) {
    console.error('Error fetching badge history:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Save badge achievement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, badges } = body

    if (!userEmail || !badges || !Array.isArray(badges)) {
      return NextResponse.json(
        { success: false, error: 'userEmail and badges array are required' },
        { status: 400 }
      )
    }

    // Ensure user exists
    let user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userEmail.split('@')[0],
          role: 'employee'
        }
      })
    }

    // Save badges
    const created = await Promise.all(
      badges.map((badge: any) =>
        prisma.badgeHistory.create({
          data: {
            userId: user!.id,
            userEmail: userEmail,
            badgeId: badge.badgeId,
            earnedDate: new Date(badge.earnedDate || Date.now()),
            period: badge.period || 'month',
            utilization: badge.achievementData?.utilization || null,
            projectHours: badge.achievementData?.projectHours || null,
            menteeCount: badge.achievementData?.menteeCount || null,
            improvement: badge.achievementData?.improvement || null,
            otherData: badge.achievementData || {}
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: created.length,
      message: `Saved ${created.length} badge achievements`
    })
  } catch (error: any) {
    console.error('Error saving badge history:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Clear badge history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const deleted = await prisma.badgeHistory.deleteMany({
      where: { userEmail }
    })

    return NextResponse.json({
      success: true,
      count: deleted.count,
      message: `Deleted ${deleted.count} badge records`
    })
  } catch (error: any) {
    console.error('Error deleting badge history:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
