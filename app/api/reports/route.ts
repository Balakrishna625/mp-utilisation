/**
 * Reports Data API
 * 
 * Retrieves employee availability reports from database
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAvailable = searchParams.get('isAvailable')
    const practice = searchParams.get('practice')

    const where: any = {}
    if (isAvailable) where.isAvailable = isAvailable
    if (practice) where.practice = practice

    const reports = await prisma.employeeAvailability.findMany({
      where,
      orderBy: { lastUpdated: 'desc' }
    })

    // Get metadata
    const metadata = await prisma.uploadMetadata.findFirst({
      where: { dataType: 'reports' },
      orderBy: { uploadedAt: 'desc' }
    })

    // Transform to match frontend format
    const transformedReports = reports.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.userEmail,
      role: r.role,
      currentProject: r.currentProject,
      isAvailable: r.isAvailable,
      tentativeProject: r.tentativeProject || undefined,
      availableFrom: r.availableFrom?.toISOString().split('T')[0] || undefined,
      practice: r.practice,
      mentor: r.mentor || undefined,
      managerName: r.managerName,
      isContractor: r.isContractor,
      remarks: r.remarks || undefined,
      lastUpdated: r.lastUpdated.toISOString().split('T')[0],
      currentProjectUtilization: r.currentProjectUtilization || undefined
    }))

    // Also provide mentor-mentee data
    const mentorMenteeData = transformedReports
      .filter((emp: any) => emp.mentor && emp.mentor.trim() !== '' && emp.mentor !== 'N/A')
      .map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        title: emp.role,
        project: emp.currentProject,
        utilization: emp.currentProjectUtilization || 0,
        targetHours: 0,
        practice: emp.practice,
        mentor: emp.mentor,
        fringe: 0,
        pmn: 0,
        fringeImpact: 0,
        wPresales: 0,
        status: 'Active',
      }))

    return NextResponse.json({
      success: true,
      data: transformedReports,
      mentorMenteeData: mentorMenteeData,
      metadata
    })
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Clear all reports
export async function DELETE() {
  try {
    const deleted = await prisma.employeeAvailability.deleteMany({})
    
    return NextResponse.json({
      success: true,
      count: deleted.count,
      message: `Deleted ${deleted.count} reports`
    })
  } catch (error: any) {
    console.error('Error deleting reports:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
