/**
 * Projects Data API
 * 
 * Retrieves project data from database
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const practice = searchParams.get('practice')
    const region = searchParams.get('region')

    const where: any = {}
    if (status) where.status = status
    if (practice) where.practice = practice
    if (region) where.region = region

    const projects = await prisma.mPProject.findMany({
      where,
      include: {
        resources: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get metadata
    const metadata = await prisma.uploadMetadata.findFirst({
      where: { dataType: 'projects' },
      orderBy: { uploadedAt: 'desc' }
    })

    // Transform to match frontend format
    const transformedProjects = projects.map((p: any) => ({
      id: p.id,
      projectName: p.projectName,
      status: p.status,
      projectType: p.projectType,
      region: p.region,
      deliveryPOC: p.deliveryPOC,
      resources: p.resources.map((r: any) => r.resourceName).join(', ') || p.deliveryPOC,
      deliveryOwner: p.deliveryOwner,
      fmRCNames: p.fmRCNames,
      remarks: p.remarks,
      accountManager: p.accountManager,
      duration: p.duration,
      startDate: p.startDate.toISOString().split('T')[0],
      endDate: p.endDate.toISOString().split('T')[0],
      techstack: p.techstack,
      salesFolder: p.salesFolder,
      practice: p.practice,
      projectTerritory: p.projectTerritory
    }))

    return NextResponse.json({
      success: true,
      data: transformedProjects,
      metadata
    })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Clear all projects
export async function DELETE() {
  try {
    const deleted = await prisma.mPProject.deleteMany({})
    
    return NextResponse.json({
      success: true,
      count: deleted.count,
      message: `Deleted ${deleted.count} projects`
    })
  } catch (error: any) {
    console.error('Error deleting projects:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
