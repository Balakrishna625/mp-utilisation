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
  'workflow_status': 'workflowStatus',
  'workflowstatus': 'workflowStatus',
  'workflow status': 'workflowStatus',
  'current_project_utilization_%': 'currentProjectUtilization',
  'currentprojectutilization': 'currentProjectUtilization',
  'utilization': 'currentProjectUtilization',
}

const parseAvailabilityStatus = (val: any): AvailabilityStatus => {
  if (!val) return 'Available'
  
  const str = String(val).toLowerCase().replace(/[\[\]"']/g, '').trim()
  
  if (str.includes('booked')) return 'Booked'
  if (str.includes('has bandwidth') || str.includes('bandwidth')) return 'Has Bandwidth'
  if (str === 'partial') return 'Partial'
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

const parseDate = (val: any): Date | null => {
  if (!val) return null
  const str = String(val).trim()
  if (!str) return null
  // Try direct parse first
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d
  // Handle M/D/YYYY H:MM AM/PM (e.g. "4/29/2026 8:00 PM")
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const d2 = new Date(`${match[3]}-${match[1].padStart(2,'0')}-${match[2].padStart(2,'0')}`)
    if (!isNaN(d2.getTime())) return d2
  }
  // Handle DD/MM/YY (e.g. "20/02/26")
  const match2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (match2) {
    const d3 = new Date(`20${match2[3]}-${match2[2].padStart(2,'0')}-${match2[1].padStart(2,'0')}`)
    if (!isNaN(d3.getTime())) return d3
  }
  return null
}

const cleanManagerName = (val: any): string => {
  if (!val) return 'N/A'
  // Strip brackets, quotes, asterisks and take non-empty parts
  const cleaned = String(val).replace(/[\[\]"'*]/g, '').trim()
  // May be "*, Vimal Prakash" or "Vimal Prakash" — take last meaningful word group
  const parts = cleaned.split(',').map((p: string) => p.trim()).filter((p: string) => p && p !== '*')
  return parts.length > 0 ? parts[parts.length - 1] : 'N/A'
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

    console.log('[reports/upload] File received:', file.name, 'size:', file.size)
    console.log('[reports/upload] Valid extension check passed')

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

    console.log('[reports/upload] Parsed rows from file:', rawData.length)
    console.log('[reports/upload] First raw row keys:', rawData[0] ? Object.keys(rawData[0]) : 'no rows')

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
          mentor: normalizedRow.mentor ? String(normalizedRow.mentor).trim().replace(/[\[\]"']/g, '') : undefined,
          managerName: cleanManagerName(normalizedRow.managerName),
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

    console.log('[reports/upload] Transformed valid records:', transformedData.length)
    if (transformedData.length > 0) {
      console.log('[reports/upload] Sample transformed record:', JSON.stringify(transformedData[0]))
    }

    // Save to database
    const prisma = (await import('@/lib/prisma')).default
    
    // Clear existing reports
    await prisma.employeeAvailability.deleteMany({})

    // Create new reports
    const created = await prisma.employeeAvailability.createMany({
      data: transformedData.map((report: any) => ({
        userEmail: report.email || report.name,
        name: report.name,
        role: report.role,
        currentProject: report.currentProject,
        isAvailable: report.isAvailable,
        tentativeProject: report.tentativeProject || null,
        availableFrom: report.availableFrom ? parseDate(report.availableFrom) : null,
        practice: report.practice,
        mentor: report.mentor || null,
        managerName: report.managerName,
        isContractor: report.isContractor,
        remarks: report.remarks || null,
        currentProjectUtilization: report.currentProjectUtilization || null
      }))
    })

    console.log('[reports/upload] Prisma createMany complete, records created:', created.count)

    // Save upload metadata
    await prisma.uploadMetadata.create({
      data: {
        dataType: 'reports',
        fileName: file.name,
        recordCount: created.count
      }
    })

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
      message: `Successfully uploaded ${created.count} employee reports from ${file.name}`,
      data: transformedData,
      mentorMenteeData: mentorMenteeData,
      recordCount: created.count,
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
