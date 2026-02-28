import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { MonthlyUtilizationRecord, MonthlyDataStructure, QuarterData } from '@/types/utilization'
import { 
  getQuarterFromMonth, 
  getFinancialYear, 
  MONTH_TO_NUMBER,
  FY_QUARTER_MAPPING 
} from '@/lib/monthlyDataStorage'
import { calculatePeriodInfo, formatDateISO } from '@/lib/dateUtils'
import { prisma } from '@/lib/prisma'

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
  'target_hours_project': 'targetHours',
  'target': 'targetHours',
  'project': 'project',
  'project_hours': 'project',
  'pmn': 'pmn',
  'utilization': 'utilization',
  'util': 'utilization',
  'utilization_%': 'utilization',
  'fringeimpact': 'fringeImpact',
  'fringe_impact': 'fringeImpact',
  'fringe_impac_fringe': 'fringeImpact',
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
    return isPercentage && val < 10 ? val * 100 : val
  }
  if (typeof val === 'string') {
    const hadPercentSign = val.includes('%')
    const cleaned = val.replace(/[%,\s]/g, '').trim()
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed)) return 0
    if (isPercentage && parsed < 10 && !hadPercentSign) {
      return parsed * 100
    }
    return parsed
  }
  return 0
}

// Parse month/year from various formats
const parseMonthYear = (monthStr: string): { month: string, year: number } | null => {
  // Try various formats: "Jul", "Jul 2024", "July", "07/2024", etc.
  const monthMap: { [key: string]: string } = {
    'jan': 'Jan', 'january': 'Jan', '01': 'Jan', '1': 'Jan',
    'feb': 'Feb', 'february': 'Feb', '02': 'Feb', '2': 'Feb',
    'mar': 'Mar', 'march': 'Mar', '03': 'Mar', '3': 'Mar',
    'apr': 'Apr', 'april': 'Apr', '04': 'Apr', '4': 'Apr',
    'may': 'May', '05': 'May', '5': 'May',
    'jun': 'Jun', 'june': 'Jun', '06': 'Jun', '6': 'Jun',
    'jul': 'Jul', 'july': 'Jul', '07': 'Jul', '7': 'Jul',
    'aug': 'Aug', 'august': 'Aug', '08': 'Aug', '8': 'Aug',
    'sep': 'Sep', 'sept': 'Sep', 'september': 'Sep', '09': 'Sep', '9': 'Sep',
    'oct': 'Oct', 'october': 'Oct', '10': 'Oct',
    'nov': 'Nov', 'november': 'Nov', '11': 'Nov',
    'dec': 'Dec', 'december': 'Dec', '12': 'Dec'
  }

  const str = monthStr.trim().toLowerCase()
  const currentYear = new Date().getFullYear()

  // Check if it's just a month name
  if (monthMap[str]) {
    return { month: monthMap[str], year: currentYear }
  }

  // Try "Month Year" format
  const parts = str.split(/[\s,\/\-]+/)
  if (parts.length >= 1) {
    const month = monthMap[parts[0]]
    if (month) {
      const year = parts.length > 1 ? parseInt(parts[1]) : currentYear
      return { month, year: year < 100 ? 2000 + year : year }
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const periodType = (formData.get('periodType') as string) || 'monthly'
    const selectedMonth = formData.get('month') as string
    const selectedYear = formData.get('year') as string
    const fromDateStr = formData.get('fromDate') as string
    const toDateStr = formData.get('toDate') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate period configuration
    let month: string
    let year: number
    let quarter: string
    let financialYear: string
    let monthNumber: number
    let date: string
    let fromDate: Date | undefined
    let toDate: Date | undefined
    let periodInfo: any

    if (periodType === 'weekly') {
      if (!fromDateStr || !toDateStr) {
        return NextResponse.json(
          { error: 'Please provide both From Date and To Date for weekly uploads' },
          { status: 400 }
        )
      }

      fromDate = new Date(fromDateStr)
      toDate = new Date(toDateStr)

      if (fromDate > toDate) {
        return NextResponse.json(
          { error: 'From Date must be before or equal to To Date' },
          { status: 400 }
        )
      }

      // Calculate period information from date range
      periodInfo = calculatePeriodInfo(fromDate, toDate)
      month = periodInfo.month
      year = periodInfo.fromDate.getFullYear()
      quarter = periodInfo.quarter
      financialYear = periodInfo.financialYear
      monthNumber = periodInfo.monthNumber
      date = periodInfo.firstDayOfMonth.toISOString()
    } else {
      // Monthly upload - use the selected month and year
      month = selectedMonth
      year = parseInt(selectedYear) || new Date().getFullYear()

      if (!month) {
        return NextResponse.json(
          { error: 'Please specify the month for this data' },
          { status: 400 }
        )
      }

      quarter = getQuarterFromMonth(month)
      financialYear = getFinancialYear(month, year)
      monthNumber = MONTH_TO_NUMBER[month]
      date = new Date(year, monthNumber - 1, 1).toISOString()
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

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse file using xlsx library
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellText: false,
      cellDates: false,
      raw: false
    })

    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    })

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      )
    }

    console.log(`Processing data for: ${month} ${year} (${financialYear} ${quarter})`)
    if (periodType === 'weekly') {
      console.log(`Date range: ${formatDateISO(fromDate!)} to ${formatDateISO(toDate!)}`)
    }

    // Process data
    const records: MonthlyUtilizationRecord[] = []
    let skippedRows = 0

    rawData.forEach((row: any, index: number) => {
      try {
        // Normalize column names
        const normalizedRow: any = {}
        Object.keys(row).forEach(key => {
          const normalizedKey = normalizeColumnName(key)
          const mappedKey = columnMapping[normalizedKey] || normalizedKey
          normalizedRow[mappedKey] = row[key]
        })

        // Extract required fields
        const name = normalizedRow.name?.toString().trim()
        
        // Skip empty rows
        if (!name || name === '') {
          skippedRows++
          return
        }
        
        // Skip metadata/filter rows (these are not employee data)
        const metadataPatterns = [
          /^applied filters:/i,
          /fiscalyear/i,
          /fiscalquarter/i,
          /globalworkgroup/i,
          /current-former employee/i,
          /begintimeDates/i,
          /endtimeDates/i,
          /exemptfromcp/i,
          /department code/i,
          /estmatedtargethours/i,
          /supervisor\)/i
        ]
        
        if (metadataPatterns.some(pattern => pattern.test(name))) {
          console.log(`⏭️  Skipping metadata row: ${name.substring(0, 50)}...`)
          skippedRows++
          return
        }

        const record: MonthlyUtilizationRecord = {
          name,
          email: normalizedRow.email?.toString().trim() || undefined,
          title: normalizedRow.title?.toString().trim() || '',
          targetHours: parseNumber(normalizedRow.targetHours || normalizedRow.target_hours_project),
          project: parseNumber(normalizedRow.project),
          pmn: parseNumber(normalizedRow.pmn),
          utilization: parseNumber(normalizedRow.utilization, true),
          fringeImpact: parseNumber(normalizedRow.fringeImpact || normalizedRow.fringe_impac_fringe),
          fringe: parseNumber(normalizedRow.fringe),
          wPresales: parseNumber(normalizedRow.wPresales || normalizedRow.w_presales),
          mentor: normalizedRow.mentor?.toString().trim() || undefined,
          month,
          quarter,
          financialYear,
          monthNumber,
          date,
          periodType,
          fromDate: fromDate ? formatDateISO(fromDate) : undefined,
          toDate: toDate ? formatDateISO(toDate) : undefined,
        }

        records.push(record)
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error)
        skippedRows++
      }
    })

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found' },
        { status: 400 }
      )
    }

    // Structure the data hierarchically
    const structuredData: MonthlyDataStructure = {
      [financialYear]: {
        financialYear,
        quarters: {
          [quarter]: {
            quarter,
            months: {
              [month]: records
            }
          }
        }
      }
    }

    console.log(`✅ Processed ${records.length} records for ${month} ${year}`)
    if (skippedRows > 0) {
      console.log(`⚠️ Skipped ${skippedRows} invalid rows`)
    }

    // Save to database
    try {
      const prisma = (await import('@/lib/prisma')).default
      
      // Test database connection first
      await prisma.$queryRaw`SELECT 1`
      
      // Delete existing records for this SPECIFIC period
      // For weekly: delete only records with matching fromDate and toDate
      // For monthly: delete only records with matching month and periodType='monthly'
      const deleteWhere: any = {
        financialYear,
        quarter,
        month
      }
      
      if (periodType === 'weekly' && fromDate && toDate) {
        // For weekly uploads, only delete records with the exact same date range
        deleteWhere.periodType = 'weekly'
        deleteWhere.fromDate = fromDate
        deleteWhere.toDate = toDate
      } else if (periodType === 'monthly') {
        // For monthly uploads, only delete monthly records (not weekly ones)
        deleteWhere.periodType = 'monthly'
      }
      
      console.log('🗑️  Deleting existing records with criteria:', deleteWhere)
      
      const deleted = await prisma.monthlyUtilization.deleteMany({
        where: deleteWhere
      })
      
      console.log(`🗑️  Deleted ${deleted.count} existing records`)

      // Create new records
      const created = await prisma.monthlyUtilization.createMany({
        data: records.map((record: MonthlyUtilizationRecord) => ({
          userEmail: record.email || record.name,
          name: record.name,
          title: record.title,
          month: record.month,
          monthNumber: record.monthNumber,
          quarter: record.quarter,
          financialYear: record.financialYear,
          date: new Date(record.date),
          periodType: record.periodType || 'monthly',
          fromDate: record.fromDate ? new Date(record.fromDate) : new Date(record.date),
          toDate: record.toDate ? new Date(record.toDate) : new Date(record.date),
          targetHours: record.targetHours,
          project: record.project,
          pmn: record.pmn,
          utilization: record.utilization,
          fringeImpact: record.fringeImpact,
          fringe: record.fringe,
          wPresales: record.wPresales,
          mentor: record.mentor || null
        }))
      })

      // Save upload metadata
      await prisma.uploadMetadata.create({
        data: {
          dataType: 'monthly-utilization',
          fileName: file.name,
          recordCount: created.count,
          dateRange: {
            from: fromDate ? formatDateISO(fromDate) : date.split('T')[0],
            to: toDate ? formatDateISO(toDate) : date.split('T')[0]
          }
        }
      })

      // Build response
      const response: any = {
        success: true,
        data: structuredData,
        metadata: {
          fileName: file.name,
          recordCount: created.count,
          skippedRows,
          month,
          quarter,
          financialYear,
          year,
          dateRange: {
            from: fromDate ? formatDateISO(fromDate) : date.split('T')[0],
            to: toDate ? formatDateISO(toDate) : date.split('T')[0]
          }
        }
      }

      // Add periodInfo for weekly uploads
      if (periodType === 'weekly' && periodInfo) {
        response.periodInfo = {
          periodType,
          fromDate: formatDateISO(fromDate!),
          toDate: formatDateISO(toDate!),
          financialYear: periodInfo.financialYear,
          quarter: periodInfo.quarter,
          month: periodInfo.month,
          monthNumber: periodInfo.monthNumber,
        }
      }

      return NextResponse.json(response)
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      
      // Check if it's a database connection error
      if (dbError.message?.includes("Can't reach database") || 
          dbError.message?.includes("connection") ||
          dbError.code === 'P1001') {
        return NextResponse.json(
          { 
            error: 'Database connection failed', 
            details: 'Unable to connect to the database. Please ensure your database is running and accessible. If using Supabase, check if your project is paused.',
            technicalDetails: dbError.message
          },
          { status: 503 }
        )
      }
      
      // Other database errors
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: 'Failed to save data to database',
          technicalDetails: dbError.message 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Upload processing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process file', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
