import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const viewType = searchParams.get('viewType') || 'weekly'

    // Mock data - replace with database query
    const data = {
      employees: [
        {
          id: '1',
          name: 'Azeemushan Ali',
          title: 'Lead Engineer',
          targetHours: 528,
          project: 544,
          pmn: 0,
          utilization: 103.03,
          fringeImpact: -6.06,
          fringe: 32,
          wPresales: 103.03,
        },
        {
          id: '2',
          name: 'Gokula Krishnan K S',
          title: 'Senior Engineer',
          targetHours: 528,
          project: 531,
          pmn: 0,
          utilization: 100.57,
          fringeImpact: -16.29,
          fringe: 86,
          wPresales: 100.57,
        },
        // Add more employees...
      ],
      summary: {
        totalEmployees: 87,
        avgUtilization: 73.61,
        totalHours: 30816,
        targetHours: 41864,
      },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Utilization data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch utilization data' },
      { status: 500 }
    )
  }
}
