import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const viewType = searchParams.get('viewType') || 'monthly'
    const financialYear = searchParams.get('financialYear')
    const quarter = searchParams.get('quarter')
    const month = searchParams.get('month')

    // Build query filters
    const where: any = {}
    
    if (financialYear) {
      where.financialYear = financialYear
    }
    if (quarter) {
      where.quarter = quarter
    }
    if (month) {
      where.month = month
    }

    // Fetch data from database
    const records = await prisma.monthlyUtilization.findMany({
      where,
      orderBy: [
        { utilization: 'desc' },
        { name: 'asc' }
      ]
    })

    // Transform database records to match the expected format
    const employees = records.map(record => ({
      id: record.id,
      name: record.name,
      title: record.title,
      targetHours: record.targetHours,
      project: record.project,
      pmn: record.pmn,
      utilization: record.utilization,
      fringeImpact: record.fringeImpact,
      fringe: record.fringe,
      wPresales: record.wPresales,
      mentor: record.mentor,
      email: record.userEmail,
      financialYear: record.financialYear,
      quarter: record.quarter,
      month: record.month,
      periodType: record.periodType,
      fromDate: record.fromDate,
      toDate: record.toDate,
    }))

    // Calculate summary statistics
    const summary = {
      totalEmployees: employees.length,
      avgUtilization: employees.length > 0 
        ? employees.reduce((sum, emp) => sum + emp.utilization, 0) / employees.length 
        : 0,
      totalHours: employees.reduce((sum, emp) => sum + emp.project, 0),
      targetHours: employees.reduce((sum, emp) => sum + emp.targetHours, 0),
    }

    return NextResponse.json({
      employees,
      summary
    })
  } catch (error) {
    console.error('Utilization data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch utilization data' },
      { status: 500 }
    )
  }
}
