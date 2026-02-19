import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Helper function to normalize column names
const normalizeColumnName = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[\/\\]/g, '_')
}

// Map common column name variations to standard names
const columnMapping: Record<string, string> = {
  'name': 'name',
  'employee_name': 'name',
  'employee': 'name',
  'email': 'email',
  'email_address': 'email',
  'title': 'title',
  'position': 'title',
  'role': 'title',
  'targethours': 'targetHours',
  'target_hours': 'targetHours',
  'target': 'targetHours',
  'project': 'project',
  'project_hours': 'project',
  'pmn': 'pmn',
  'utilization': 'utilization',
  'util': 'utilization',
  'utilization_%': 'utilization',
  'fringeimpact': 'fringeImpact',
  'fringe_impact': 'fringeImpact',
  'fringe': 'fringe',
  'w_presales': 'wPresales',
  'wpresales': 'wPresales',
  'with_presales': 'wPresales',
  'presales': 'wPresales',
  'mentor': 'mentor',
  'mentor_name': 'mentor',
}

// Helper to parse numeric values including percentages
const parseNumber = (val: any, isPercentage: boolean = false): number => {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') {
    // If it's a decimal less than 1 and supposed to be a percentage, multiply by 100
    return isPercentage && val < 10 ? val * 100 : val
  }
  if (typeof val === 'string') {
    // Check if original string had a % sign
    const hadPercentSign = val.includes('%')
    // Remove percentage signs, commas, and extra spaces
    const cleaned = val.replace(/[%,\s]/g, '').trim()
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed)) return 0
    
    // If it's a small decimal (< 10) and it's supposed to be a percentage, multiply by 100
    // This handles Excel's internal storage of percentages as decimals
    if (isPercentage && parsed < 10 && !hadPercentSign) {
      return parsed * 100
    }
    return parsed
  }
  return 0
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validExtensions = ['.csv', '.xls', '.xlsx']
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      )
    }

    let rawData: any[] = []
    
    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      // Parse file using xlsx library with proper options
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellText: false,
        cellDates: false,
        raw: false
      })
      
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON with headers
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
        { error: 'No data found in the file. Please ensure the file contains data rows.' },
        { status: 400 }
      )
    }

    console.log('Raw data sample:', rawData[0])

    // Transform data to match our schema
    const transformedData = rawData
      .map((row: any, index: number) => {
        const normalizedRow: any = {}
        
        // Normalize all column names and map them
        Object.keys(row).forEach(key => {
          const normalizedKey = normalizeColumnName(key)
          const mappedKey = columnMapping[normalizedKey] || normalizedKey
          normalizedRow[mappedKey] = row[key]
        })

        // Extract and validate required fields
        const name = normalizedRow.name || ''
        
        // Skip empty rows, total rows, or filter information rows
        const nameStr = String(name).toLowerCase().trim()
        const invalidPatterns = [
          'total', 'sum', 'applied filters', 'included', 'excluded',
          'fiscalyear', 'fiscalquarter', 'fiscalmonth', 'globalworkgroup',
          'department code', 'current-former employee', 'level 2 supervisor',
          'level 3 supervisor', 'level 4 supervisor', 'begintimesdates',
          'endtimesdates', 'exemptfromcptimeentry', 'estimatedtargethours',
          'fy26', 'fq1', 'fq2', 'fq3', 'fq4'
        ]
        
        if (!name || 
            nameStr === '' ||
            invalidPatterns.some(pattern => nameStr.includes(pattern))) {
          return null
        }

        return {
          id: `emp-${index + 1}`,
          name: String(name).trim(),
          email: normalizedRow.email ? String(normalizedRow.email).trim() : undefined,
          title: String(normalizedRow.title || 'N/A').trim().replace(/[\[\]"']/g, ''),
          targetHours: parseNumber(normalizedRow.targetHours),
          project: parseNumber(normalizedRow.project),
          pmn: parseNumber(normalizedRow.pmn),
          utilization: parseNumber(normalizedRow.utilization, true),
          fringeImpact: parseNumber(normalizedRow.fringeImpact, true),
          fringe: parseNumber(normalizedRow.fringe),
          wPresales: parseNumber(normalizedRow.wPresales || normalizedRow.utilization, true),
          mentor: normalizedRow.mentor ? String(normalizedRow.mentor).trim() : undefined,
        }
      })
      .filter((row: any) => row !== null)

    if (transformedData.length === 0) {
      return NextResponse.json(
        { error: 'No valid employee data found. Please check your file format.' },
        { status: 400 }
      )
    }

    console.log('Transformed data count:', transformedData.length)
    console.log('Sample transformed data:', transformedData[0])

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded and parsed ${transformedData.length} employee records from ${file.name}`,
      data: transformedData,
      recordCount: transformedData.length,
      fileType: file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel',
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
