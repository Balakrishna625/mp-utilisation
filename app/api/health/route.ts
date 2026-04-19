/**
 * Database Health Check Endpoint
 * 
 * Tests database connectivity and returns connection info
 * Works with both Supabase and AWS RDS
 */

import { NextRequest, NextResponse } from 'next/server'
import { getHealthStatus, getDatabaseInfo } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const [health, dbInfo] = await Promise.all([
      getHealthStatus(),
      getDatabaseInfo()
    ])

    return NextResponse.json({
      ...health,
      database: {
        ...dbInfo,
        status: health.database
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
