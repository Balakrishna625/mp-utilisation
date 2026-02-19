import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { AvailabilityStatus } from '@/types/report'

const normalizeColumnName = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[\/\\]/g, '_')
}

const columnMapping: Record<string, string> = {
  'name': 'name',
  'email': 'email',
  'email_address': 'email',
  'role': 'role',
  'title': 'role',
  'position': 'role',
  'current_project': 'currentProject',
  'currentproject': 'currentProject',
  'project': 'currentProject',
  'is_available': 'isAvailable',
  'isavailable': 'isAvailable',
  'available': 'isAvailable',
  'availability': 'isAvailable',
  'tentative_project': 'tentativeProject',
  'tentativeproject': 'tentativeProject',
  'available_from': 'availableFrom',
  'availablefrom': 'availableFrom',
  'practice': 'practice',
  'mentor': 'mentor',
  'mentor_name': 'mentor',
  'manager_name': 'managerName',
  'managername': 'managerName',
  'manager': 'managerName',
  'iscontractor': 'isContractor',
  'is_contractor': 'isContractor',
  'contractor': 'isContractor',
  'remarks': 'remarks',
  'notes': 'remarks',
  'comments': 'remarks',
  'last_updated': 'lastUpdated',
  'lastupdated': 'lastUpdated',
  'current_project_utilization_%': 'currentProjectUtilization',
  'currentprojectutilization': 'currentProjectUtilization',
  'utilization': 'currentProjectUtilization',
}

const parseAvailabilityStatus = (val: any): AvailabilityStatus => {
  if (!val) return 'Available'
  
  const str = String(val).toLowerCase().replace(/[\[\]"']/g, '').trim()
  
  if (str.includes('booked')) return 'Booked'
  if (str.includes('has bandwidth') || str.includes('bandwidth')) return 'Has Bandwidth'
  if (str === 'no' || str.includes('not available') || str.includes('occupied')) return 'No'
  if (str === 'yes' || str.includes('available')) return 'Available'
  
  return 'Available'
}

const parseBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val
  if (!val) return false
  const str = String(val).toLowerCase().trim()
  return str === 'true' || str === 'yes' || str === '1'
}

const parseNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[%,\s]/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validExtensions = ['.csv', '.xls', '.xlsx']
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      )
    }

    let rawData: any[] = []
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellText: false,
        cellDates: false,
        raw: false
      })
      
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      rawData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '',
        blankrows: false
      })
    } catch (parseError: any) {
      console.error('Parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse file: ' + parseError.message },
        { status: 400 }
      )
    }

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the file.' },
        { status: 400 }
      )
    }

    console.log('Raw report data sample:', rawData[0])

    const transformedData = rawData
      .map((row: any, index: number) => {
        const normalizedRow: any = {}
        
        Object.keys(row).forEach(key => {
          const normalizedKey = normalizeColumnName(key)
          const mappedKey = columnMapping[normalizedKey] || normalizedKey
          normalizedRow[mappedKey] = row[key]
        })

        const name = normalizedRow.name || ''
        const nameStr = String(name).toLowerCase().trim()
        
        // Skip invalid rows
        const invalidPatterns = [
          'total', 'sum', 'applied filters', 'included', 'excluded',
          'fiscalyear', 'fiscalquarter', 'fiscalmonth', 'globalworkgroup',
          'department code', 'current-former employee', 'level 2 supervisor',
          'level 3 supervisor', 'level 4 supervisor', 'begintimesdates',
          'endtimesdates', 'exemptfromcptimeentry', 'estimatedtargethours',
          'fy26', 'fq1', 'fq2', 'fq3', 'fq4'
        ]
        
        if (!name || nameStr === '' || invalidPatterns.some(pattern => nameStr.includes(pattern))) {
          return null
        }

        const isAvailable = parseAvailabilityStatus(normalizedRow.isAvailable)
        
        return {
          id: `rep-${index + 1}`,
          name: String(name).trim(),
          email: normalizedRow.email ? String(normalizedRow.email).trim() : '',
          role: String(normalizedRow.role || 'N/A').trim().replace(/[\[\]"']/g, ''),
          currentProject: String(normalizedRow.currentProject || 'N/A').trim().replace(/[\[\]"']/g, ''),
          isAvailable,
          tentativeProject: normalizedRow.tentativeProject ? String(normalizedRow.tentativeProject).trim() : undefined,
          availableFrom: normalizedRow.availableFrom ? String(normalizedRow.availableFrom).trim() : undefined,
          practice: String(normalizedRow.practice || 'N/A').trim(),
          mentor: normalizedRow.mentor ? String(normalizedRow.mentor).trim() : undefined,
          managerName: String(normalizedRow.managerName || 'N/A').trim().replace(/[\[\]"']/g, ''),
          isContractor: parseBoolean(normalizedRow.isContractor),
          remarks: normalizedRow.remarks ? String(normalizedRow.remarks).trim() : undefined,
          lastUpdated: normalizedRow.lastUpdated ? String(normalizedRow.lastUpdated).trim() : undefined,
          currentProjectUtilization: parseNumber(normalizedRow.currentProjectUtilization),
        }
      })
      .filter((row: any) => row !== null)

    if (transformedData.length === 0) {
      return NextResponse.json(
        { error: 'No valid employee data found.' },
        { status: 400 }
      )
    }

    console.log('Transformed reports count:', transformedData.length)
    console.log('Sample transformed report:', transformedData[0])

    // Also create mentor-mentee data for the mentor-mentee page
    const mentorMenteeData = transformedData
      .filter((emp: any) => emp.mentor && emp.mentor.trim() !== '' && emp.mentor !== 'N/A')
      .map((emp: any, idx: number) => ({
        id: `emp-${idx + 1}`,
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

    console.log('Mentor-mentee relationships extracted:', mentorMenteeData.length)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${transformedData.length} employee reports from ${file.name}`,
      data: transformedData,
      mentorMenteeData: mentorMenteeData,
      recordCount: transformedData.length,
      fileName: file.name,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process file: ' + error.message },
      { status: 500 }
    )
  }
}
