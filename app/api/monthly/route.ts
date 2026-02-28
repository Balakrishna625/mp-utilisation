/**
 * Monthly Utilization API
 * 
 * Handles all monthly utilization data operations
 * Replaces localStorage with database
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// New Financial Year Quarter Mapping
const QUARTER_MAPPING: { [month: string]: string } = {
  'Jul': 'Q1', 'Aug': 'Q1', 'Sep': 'Q1',
  'Oct': 'Q2', 'Nov': 'Q2', 'Dec': 'Q2',
  'Jan': 'Q3', 'Feb': 'Q3', 'Mar': 'Q3',
  'Apr': 'Q4', 'May': 'Q4', 'Jun': 'Q4',
}

// GET all monthly utilization data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const financialYear = searchParams.get('fy')
    const quarter = searchParams.get('quarter')

    const where: any = {}
    if (userEmail) where.userEmail = userEmail
    if (financialYear) where.financialYear = financialYear
    if (quarter) where.quarter = quarter

    const records = await prisma.monthlyUtilization.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    // Fix quarters on the fly for backward compatibility
    const correctedRecords = records.map(record => {
      const correctQuarter = QUARTER_MAPPING[record.month]
      if (correctQuarter && record.quarter !== correctQuarter) {
        return { ...record, quarter: correctQuarter }
      }
      return record
    })

    // Get metadata
    const metadata = await prisma.uploadMetadata.findFirst({
      where: { dataType: 'monthly-utilization' },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: correctedRecords,
      metadata: metadata || null
    })
  } catch (error: any) {
    console.error('Error fetching monthly utilization:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Save monthly utilization data  
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { records, metadata } = body

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Records array is required' },
        { status: 400 }
      )
    }

    // Delete existing records for the same period (if replacing)
    if (records.length > 0) {
      const { financialYear, quarter } = records[0]
      await prisma.monthlyUtilization.deleteMany({
        where: { financialYear, quarter }
      })
    }

    // Create new records
    const created = await prisma.monthlyUtilization.createMany({
      data: records.map((record: any) => {
        // For monthly records, set fromDate/toDate to start and end of month
        const recordDate = new Date(record.date)
        const year = recordDate.getFullYear()
        const month = recordDate.getMonth()
        const fromDate = new Date(year, month, 1)
        const toDate = new Date(year, month + 1, 0) // Last day of month
        
        return {
          userEmail: record.email || record.userEmail || record.name,
          name: record.name,
          title: record.title,
          month: record.month,
          monthNumber: record.monthNumber,
          quarter: record.quarter,
          financialYear: record.financialYear,
          date: recordDate,
          fromDate,
          toDate,
          periodType: 'monthly',
          targetHours: parseFloat(record.targetHours) || 0,
          project: parseFloat(record.project) || 0,
          pmn: parseFloat(record.pmn) || 0,
          utilization: parseFloat(record.utilization) || 0,
          fringeImpact: parseFloat(record.fringeImpact) || 0,
          fringe: parseFloat(record.fringe) || 0,
          wPresales: parseFloat(record.wPresales) || 0,
          mentor: record.mentor || null
        }
      }),
      skipDuplicates: true
    })

    // Save metadata
    if (metadata) {
      await prisma.uploadMetadata.create({
        data: {
          dataType: 'monthly-utilization',
          fileName: metadata.fileName || 'unknown',
          recordCount: created.count,
          uploadedBy: metadata.uploadedBy || null,
          dateRange: metadata.dateRange || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `Saved ${created.count} monthly utilization records`
    })
  } catch (error: any) {
    console.error('Error saving monthly utilization:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Clear monthly utilization data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const financialYear = searchParams.get('fy')
    const quarter = searchParams.get('quarter')
    const periodId = searchParams.get('periodId')

    const where: any = {}
    
    // Handle deletion by period ID (date range for weekly, month for monthly)
    if (periodId) {
      if (periodId.includes('_')) {
        // Weekly period: format is "fromDate_toDate"
        const [fromDate, toDate] = periodId.split('_')
        where.fromDate = new Date(fromDate)
        where.toDate = new Date(toDate)
      } else {
        // Monthly period: just month name
        where.month = periodId
        where.periodType = 'monthly'
      }
    } else {
      // Delete by FY/Quarter if provided, otherwise delete all
      if (financialYear) where.financialYear = financialYear
      if (quarter) where.quarter = quarter
    }

    const deleted = await prisma.monthlyUtilization.deleteMany({ where })

    return NextResponse.json({
      success: true,
      count: deleted.count,
      message: `Deleted ${deleted.count} records`
    })
  } catch (error: any) {
    console.error('Error deleting monthly utilization:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
