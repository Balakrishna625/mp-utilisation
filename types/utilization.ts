export interface EmployeeUtilization {
  id: string
  name: string
  email?: string
  title: string
  targetHours: number
  project: number
  pmn: number
  utilization: number
  fringeImpact: number
  fringe: number
  wPresales: number
  mentor?: string
}

export interface UtilizationData {
  employees: EmployeeUtilization[]
  period: string
  totalTargetHours: number
  totalProject: number
  avgUtilization: number
  totalFringe: number
}

// Historical utilization data for individual tracking
export interface HistoricalUtilization {
  period: string // e.g., "Week 7", "Jan 2026", "Q1 2026", "2026"
  utilization: number
  targetHours: number
  projectHours: number
  date: string // ISO date string for sorting
}

export interface EmployeeHistoricalData {
  employeeName: string
  data?: HistoricalUtilization[]  // All historical data points
  lastWeek?: HistoricalUtilization[]
  lastMonth?: HistoricalUtilization[]
  lastQuarter?: HistoricalUtilization[]
  lastYear?: HistoricalUtilization[]
}

export interface PerformanceMetrics {
  averageUtilization: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  hoursLogged: number
  daysActive: number
  topPerformingPeriod: string
}

// Monthly utilization data with FY/Quarter hierarchy
export interface MonthlyUtilizationRecord {
  name: string
  email?: string
  title: string
  targetHours: number
  project: number
  pmn: number
  utilization: number
  fringeImpact: number
  fringe: number
  wPresales: number
  mentor?: string
  month: string // e.g., "Jul", "Aug", "Sep"
  quarter: string // e.g., "FQ1", "FQ2", "FQ3", "FQ4"
  financialYear: string // e.g., "FY25", "FY26"
  monthNumber: number // 1-12 for sorting
  date: string // ISO date string (first day of month)
  periodType?: string // "monthly" or "weekly"
  fromDate?: string // ISO date string (start of period)
  toDate?: string // ISO date string (end of period)
}

export interface QuarterData {
  quarter: string // "FQ1", "FQ2", "FQ3", "FQ4"
  months: {
    [month: string]: MonthlyUtilizationRecord[] // "Jul", "Aug", "Sep" -> records
  }
  quarterAvgUtilization?: number
  quarterTotalHours?: number
}

export interface FinancialYearData {
  financialYear: string // "FY25", "FY26"
  quarters: {
    [quarter: string]: QuarterData // "FQ1", "FQ2", "FQ3", "FQ4"
  }
  yearAvgUtilization?: number
  yearTotalHours?: number
}

export interface MonthlyDataStructure {
  [financialYear: string]: FinancialYearData
}

// Metadata matching database UploadMetadata model
export interface MonthlyDataMetadata {
  uploadedAt: string | Date  // Database field (DateTime)
  fileName: string
  recordCount: number
  uploadedBy?: string | null
  dateRange?: any  // JSON field
  // Legacy fields
  lastUpdated?: string
}
