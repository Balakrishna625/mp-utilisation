import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Helper function to normalize column names
const normalizeColumnName = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[\/\\()]/g, '').replace(/_+/g, '_')
}

// Map column variations to standard names
const columnMapping: Record<string, string> = {
  'project': 'projectName',
  'project_name': 'projectName',
  'name': 'projectName',
  'status': 'status',
  'project_status': 'status',
  'project_type': 'projectType',
  'type': 'projectType',
  'region': 'region',
  'delivery_poc': 'deliveryPOC',
  'delivery_owner': 'deliveryOwner',
  'poc': 'deliveryPOC',
  'resources': 'resources',
  'resource': 'resources',
  'delivery_owner_resources': 'deliveryOwner',
  'fm_rc_names': 'fmRCNames',
  'fm_pc_names': 'fmRCNames',
  'remarks': 'remarks',
  'notes': 'remarks',
  'account_manager': 'accountManager',
  'manager': 'accountManager',
  'duration_in_start': 'duration',
  'duration': 'duration',
  'start_date': 'startDate',
  'startdate': 'startDate',
  'end_date': 'endDate',
  'enddate': 'endDate',
  'techstack': 'techstack',
  'tech_stack': 'techstack',
  'technology': 'techstack',
  'sales_folder': 'salesFolder',
  'practice': 'practice',
  'project_territory': 'projectTerritory',
  'territory': 'projectTerritory',
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

    // Read file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellText: false,
        cellDates: true,
        raw: false
      })
      
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '',
        blankrows: false
      })

      console.log('Raw project data sample:', rawData[0])

      // Transform data
      const transformedData = rawData
        .map((row: any, index: number) => {
          const normalizedRow: any = {}
          
          Object.keys(row).forEach(key => {
            const normalizedKey = normalizeColumnName(key)
            const mappedKey = columnMapping[normalizedKey] || normalizedKey
            normalizedRow[mappedKey] = row[key]
          })

          const projectName = normalizedRow.projectName || ''
          
          // Skip empty rows
          if (!projectName || projectName.trim() === '') {
            return null
          }

          // Parse duration (extract numbers)
          let duration = 0
          if (normalizedRow.duration) {
            const durationStr = String(normalizedRow.duration)
            const match = durationStr.match(/\d+/)
            duration = match ? parseInt(match[0]) : 0
          }

          return {
            id: `proj-${index + 1}`,
            projectName: String(projectName).trim(),
            status: String(normalizedRow.status || 'Unknown').trim(),
            projectType: String(normalizedRow.projectType || 'N/A').trim(),
            region: String(normalizedRow.region || 'N/A').trim(),
            deliveryPOC: String(normalizedRow.deliveryPOC || '').trim(),
            resources: String(normalizedRow.resources || '').trim(),
            deliveryOwner: String(normalizedRow.deliveryOwner || '').trim(),
            fmRCNames: String(normalizedRow.fmRCNames || '').trim(),
            remarks: String(normalizedRow.remarks || '').trim(),
            accountManager: String(normalizedRow.accountManager || '').trim(),
            duration: duration,
            startDate: String(normalizedRow.startDate || '').trim(),
            endDate: String(normalizedRow.endDate || '').trim(),
            techstack: String(normalizedRow.techstack || '').trim(),
            salesFolder: String(normalizedRow.salesFolder || '').trim(),
            practice: String(normalizedRow.practice || 'MP').trim(),
            projectTerritory: String(normalizedRow.projectTerritory || '').trim(),
          }
        })
        .filter((row: any) => row !== null)

      if (transformedData.length === 0) {
        return NextResponse.json(
          { error: 'No valid project data found.' },
          { status: 400 }
        )
      }

      console.log('Transformed projects count:', transformedData.length)
      console.log('Sample transformed project:', transformedData[0])

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${transformedData.length} projects from ${file.name}`,
        data: transformedData,
        recordCount: transformedData.length,
        fileName: file.name,
      })
    } catch (parseError: any) {
      console.error('Parse error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse file: ' + parseError.message },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process file: ' + error.message },
      { status: 500 }
    )
  }
}
