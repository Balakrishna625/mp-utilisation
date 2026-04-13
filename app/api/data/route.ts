import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Build query filters — use date range (gte/lte) so any period filter works
    const where: any = {}
    if (fromDate) where.fromDate = { gte: new Date(fromDate) }
    if (toDate) where.toDate = { lte: new Date(toDate) }

    // Fetch utilization records ordered by most recent first
    const records = await prisma.monthlyUtilization.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { name: 'asc' }
      ]
    })

    // When a date range is supplied → aggregate (sum) all records per employee
    // across the period so multiple weekly uploads are combined correctly.
    // When no range → deduplicate (keep latest per employee, i.e. most recent upload).
    let data: Array<{
      id: string; name: string; title: string; userEmail: string;
      targetHours: number; project: number; pmn: number;
      utilization: number; fringeImpact: number; fringe: number; wPresales: number;
      mentor: string | null; fromDate: Date | null; toDate: Date | null;
      periodType: string; updatedAt: Date;
    }>

    if (fromDate || toDate) {
      // Aggregate: group by employee name, sum numeric fields, recalc utilization
      const grouped = new Map<string, typeof records>()
      for (const record of records) {
        // Prefer stable identifiers when grouping: userEmail -> userId -> name
        const key = (record.userEmail || record.userId || record.name || '').toString().toLowerCase().trim()
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(record)
      }

      data = Array.from(grouped.entries()).map(([, rows]) => {
        // Use the latest row for meta fields (title, mentor, ids)
          const latest = rows[0] // already ordered date desc
          const totalTarget  = rows.reduce((s, r) => s + (r.targetHours || 0), 0)
          const totalProject = rows.reduce((s, r) => s + (r.project || 0), 0)
          const totalPmn     = rows.reduce((s, r) => s + (r.pmn || 0), 0)
          const totalPresales= rows.reduce((s, r) => s + (r.wPresales || 0), 0)
          const totalFringe  = rows.reduce((s, r) => s + (r.fringe || 0), 0)
          const totalFringeImpact = rows.reduce((s, r) => s + (r.fringeImpact || 0), 0)
          // Weighted utilization (project / target) when target hours are available
          const util = totalTarget > 0 ? (totalProject / totalTarget) * 100 : (rows.reduce((s, r) => s + (r.utilization || 0), 0) / Math.max(rows.length, 1))

        return {
          id: latest.id,
          name: latest.name,
          title: latest.title,
          userEmail: latest.userEmail,
          targetHours: totalTarget,
          project: totalProject,
          pmn: totalPmn,
          utilization: util,
          fringeImpact: totalFringeImpact,
          fringe: totalFringe,
          wPresales: totalPresales,
          mentor: latest.mentor,
          fromDate: latest.fromDate,
          toDate: latest.toDate,
          periodType: latest.periodType,
          updatedAt: latest.updatedAt,
        }
      }).sort((a, b) => b.utilization - a.utilization)
    } else {
      // No date range: keep only the most recent record per employee
      const seen = new Map<string, typeof records[0]>()
      for (const record of records) {
        const key = (record.userEmail || record.userId || record.name || '').toString().toLowerCase().trim()
        if (!seen.has(key)) seen.set(key, record) // date desc → first = latest
      }
      data = Array.from(seen.values()).sort((a, b) => b.utilization - a.utilization)
    }

    // Get metadata (most recent record's timestamp)
    const metadata = records.length > 0
      ? {
          lastUpdated: records[0].updatedAt.toISOString(),
          recordCount: data.length
        }
      : null

    return NextResponse.json({
      success: true,
      data,
      metadata,
      info: {
        storageType: 'database',
        endpoint: '/api/data',
      }
    })
  } catch (error: any) {
    console.error('Data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Delete all utilization records
    const result = await prisma.monthlyUtilization.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} records from database`,
      count: result.count
    })
  } catch (error: any) {
    console.error('Data deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to clear data: ' + error.message },
      { status: 500 }
    )
  }
}
