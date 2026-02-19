// Development utility to test and debug data parsing
// Run this in browser console: window.testDataParsing()

interface TestResult {
  success: boolean
  message: string
  details?: any
}

export const testDataParsing = (): TestResult => {
  try {
    const data = localStorage.getItem('mp-utilization-data')
    
    if (!data) {
      return {
        success: false,
        message: 'No data found in localStorage. Please upload a file first.',
      }
    }

    const parsed = JSON.parse(data)
    
    if (!Array.isArray(parsed)) {
      return {
        success: false,
        message: 'Data is not an array',
        details: typeof parsed,
      }
    }

    if (parsed.length === 0) {
      return {
        success: false,
        message: 'Data array is empty',
      }
    }

    // Check first record
    const firstRecord = parsed[0]
    const requiredFields = ['id', 'name', 'title', 'targetHours', 'project', 'utilization']
    const missingFields = requiredFields.filter(field => !(field in firstRecord))

    if (missingFields.length > 0) {
      return {
        success: false,
        message: 'Missing required fields',
        details: { missingFields, firstRecord },
      }
    }

    // Calculate statistics
    const stats = {
      totalRecords: parsed.length,
      avgUtilization: (parsed.reduce((sum: number, emp: any) => sum + (emp.utilization || 0), 0) / parsed.length).toFixed(2),
      totalHours: parsed.reduce((sum: number, emp: any) => sum + (emp.project || 0), 0),
      sampleRecord: firstRecord,
      allFields: Object.keys(firstRecord),
    }

    console.log('✅ Data Parsing Test Results:', stats)

    return {
      success: true,
      message: `Successfully validated ${parsed.length} records`,
      details: stats,
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Error parsing data',
      details: error.message,
    }
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testDataParsing = testDataParsing
}
