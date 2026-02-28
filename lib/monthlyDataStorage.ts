import type { 
  MonthlyUtilizationRecord, 
  MonthlyDataStructure, 
  MonthlyDataMetadata,
  FinancialYearData,
  QuarterData
} from '@/types/utilization'

// NOTE: This service no longer uses localStorage - all data should come from database
// Keeping utility functions for financial year/quarter calculations

// Financial year quarter mapping
// FY starts in July and ends in June
export const FY_QUARTER_MAPPING = {
  Q1: ['Jul', 'Aug', 'Sep'],
  Q2: ['Oct', 'Nov', 'Dec'],
  Q3: ['Jan', 'Feb', 'Mar'],
  Q4: ['Apr', 'May', 'Jun']
}

export const MONTH_TO_NUMBER: { [key: string]: number } = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
}

export const NUMBER_TO_MONTH: { [key: number]: string } = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
}

// Determine quarter from month
export const getQuarterFromMonth = (month: string): string => {
  for (const [quarter, months] of Object.entries(FY_QUARTER_MAPPING)) {
    if (months.includes(month)) {
      return quarter
    }
  }
  return 'Q1' // default
}

// Determine financial year from month and calendar year
export const getFinancialYear = (month: string, calendarYear: number): string => {
  // Simple mapping: FY matches the calendar year selected
  // All months of 2025 → FY25
  // All months of 2024 → FY24
  return `FY${String(calendarYear).slice(-2)}`
}

export const monthlyDataStorage = {
  // Disabled - use database API instead
  saveMonthlyData: (data: MonthlyDataStructure, metadata?: Partial<MonthlyDataMetadata>) => {
    console.log('⚠️ monthlyDataStorage.saveMonthlyData called but localStorage is disabled. Use API endpoints instead.')
    return false
  },

  // Disabled - use database API instead
  getMonthlyData: (): MonthlyDataStructure => {
    console.log('⚠️ monthlyDataStorage.getMonthlyData called but localStorage is disabled. Use /api/monthly instead.')
    return {}
  },

  // Disabled - use database API instead
  getMetadata: (): MonthlyDataMetadata | null => {
    console.log('⚠️ monthlyDataStorage.getMetadata called but localStorage is disabled.')
    return null
  },

  // Disabled - use database API instead
  getEmployeeData: (employeeName: string): MonthlyUtilizationRecord[] => {
    console.log('⚠️ monthlyDataStorage.getEmployeeData called but localStorage is disabled.')
    return []
  },

  // Disabled - use database API instead
  getFinancialYearData: (fy: string): FinancialYearData | null => {
    console.log('⚠️ monthlyDataStorage.getFinancialYearData called but localStorage is disabled.')
    return null
  },

  // Disabled - use database API instead
  getQuarterData: (fy: string, quarter: string): QuarterData | null => {
    console.log('⚠️ monthlyDataStorage.getQuarterData called but localStorage is disabled.')
    return null
  },

  // Disabled - use database API instead
  getMonthData: (fy: string, quarter: string, month: string): MonthlyUtilizationRecord[] => {
    console.log('⚠️ monthlyDataStorage.getMonthData called but localStorage is disabled.')
    return []
  },

  // Disabled - use database API instead
  getAvailableFinancialYears: (): string[] => {
    console.log('⚠️ monthlyDataStorage.getAvailableFinancialYears called but localStorage is disabled.')
    return []
  },

  // Disabled - use database API instead
  getAvailableQuarters: (fy: string): string[] => {
    console.log('⚠️ monthlyDataStorage.getAvailableQuarters called but localStorage is disabled.')
    return []
  },

  // Disabled - use database API instead
  getAvailableMonths: (fy: string, quarter: string): string[] => {
    console.log('⚠️ monthlyDataStorage.getAvailableMonths called but localStorage is disabled.')
    return []
  },

  // Disabled - use database API instead
  getAllEmployeeNames: (): string[] => {
    console.log('⚠️ monthlyDataStorage.getAllEmployeeNames called but localStorage is disabled.')
    return []
  },

  // Disabled - use database API instead
  getMenteesForMentor: (mentorName: string): string[] => {
    console.log('⚠️ monthlyDataStorage.getMenteesForMentor called but localStorage is disabled.')
    return []
  },

  // Utility function - still works
  calculateQuarterStats: (quarterData: QuarterData): { avgUtilization: number, totalHours: number } => {
    let totalUtilization = 0
    let totalHours = 0
    let count = 0

    Object.values(quarterData.months).forEach((monthRecords: MonthlyUtilizationRecord[]) => {
      monthRecords.forEach(record => {
        totalUtilization += record.utilization || 0
        totalHours += record.project || 0
        count++
      })
    })

    return {
      avgUtilization: count > 0 ? totalUtilization / count : 0,
      totalHours
    }
  },

  // Utility function - still works
  calculateFYStats: (fyData: FinancialYearData): { avgUtilization: number, totalHours: number } => {
    let totalUtilization = 0
    let totalHours = 0
    let count = 0

    Object.values(fyData.quarters).forEach((quarterData: QuarterData) => {
      Object.values(quarterData.months).forEach((monthRecords: MonthlyUtilizationRecord[]) => {
        monthRecords.forEach(record => {
          totalUtilization += record.utilization || 0
          totalHours += record.project || 0
          count++
        })
      })
    })

    return {
      avgUtilization: count > 0 ? totalUtilization / count : 0,
      totalHours
    }
  },

  // Disabled - use database API instead
  deleteMonth: (fy: string, quarter: string, month: string): boolean => {
    console.log('⚠️ monthlyDataStorage.deleteMonth called but localStorage is disabled. Use DELETE /api/monthly instead.')
    return false
  },

  // Disabled - use database API instead
  clearMonthlyData: () => {
    console.log('⚠️ monthlyDataStorage.clearMonthlyData called but localStorage is disabled. Use DELETE /api/monthly instead.')
  }
}
