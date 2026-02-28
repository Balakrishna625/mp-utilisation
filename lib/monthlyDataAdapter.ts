import type { 
  MonthlyUtilizationRecord, 
  HistoricalUtilization,
  EmployeeHistoricalData 
} from '@/types/utilization'
import { monthlyDataStorage, MONTH_TO_NUMBER } from './monthlyDataStorage'

/**
 * Convert monthly data to historical utilization format
 * This allows dashboards to use uploaded monthly data seamlessly
 */

export const monthlyDataAdapter = {
  /**
   * Get historical data for an employee from monthly uploads
   */
  getEmployeeHistoricalData: (employeeName: string): EmployeeHistoricalData | null => {
    const monthlyRecords = monthlyDataStorage.getEmployeeData(employeeName)
    
    if (monthlyRecords.length === 0) {
      return null
    }

    // Sort records by date (newest first)
    const sortedRecords = [...monthlyRecords].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Convert to historical format
    const convertToHistorical = (record: MonthlyUtilizationRecord): HistoricalUtilization => ({
      period: `${record.month} ${record.financialYear}`,
      utilization: record.utilization,
      targetHours: record.targetHours,
      projectHours: record.project,
      date: record.date
    })

    // Get last 8 weeks (months in this case)
    const lastWeek = sortedRecords.slice(0, 8).reverse().map(convertToHistorical)

    // Get last 6 months
    const lastMonth = sortedRecords.slice(0, 6).reverse().map(convertToHistorical)

    // Get last 4 quarters (group by quarter)
    const quarterGroups: { [key: string]: MonthlyUtilizationRecord[] } = {}
    sortedRecords.forEach(record => {
      const key = `${record.financialYear}-${record.quarter}`
      if (!quarterGroups[key]) {
        quarterGroups[key] = []
      }
      quarterGroups[key].push(record)
    })

    const lastQuarter = Object.entries(quarterGroups)
      .slice(0, 4)
      .reverse()
      .map(([key, records]) => {
        const avgUtilization = records.reduce((sum, r) => sum + r.utilization, 0) / records.length
        const totalTargetHours = records.reduce((sum, r) => sum + r.targetHours, 0)
        const totalProjectHours = records.reduce((sum, r) => sum + r.project, 0)
        
        return {
          period: `${records[0].quarter} ${records[0].financialYear}`,
          utilization: avgUtilization,
          targetHours: totalTargetHours,
          projectHours: totalProjectHours,
          date: records[0].date
        }
      })

    // Get last 3 years (group by FY)
    const fyGroups: { [key: string]: MonthlyUtilizationRecord[] } = {}
    sortedRecords.forEach(record => {
      if (!fyGroups[record.financialYear]) {
        fyGroups[record.financialYear] = []
      }
      fyGroups[record.financialYear].push(record)
    })

    const lastYear = Object.entries(fyGroups)
      .slice(0, 3)
      .reverse()
      .map(([fy, records]) => {
        const avgUtilization = records.reduce((sum, r) => sum + r.utilization, 0) / records.length
        const totalTargetHours = records.reduce((sum, r) => sum + r.targetHours, 0)
        const totalProjectHours = records.reduce((sum, r) => sum + r.project, 0)
        
        return {
          period: fy,
          utilization: avgUtilization,
          targetHours: totalTargetHours,
          projectHours: totalProjectHours,
          date: records[0].date
        }
      })

    return {
      employeeName,
      lastWeek,
      lastMonth,
      lastQuarter,
      lastYear
    }
  },

  /**
   * Get current month data for an employee (most recent)
   */
  getCurrentMonthData: (employeeName: string): MonthlyUtilizationRecord | null => {
    const records = monthlyDataStorage.getEmployeeData(employeeName)
    if (records.length === 0) return null

    // Return most recent record
    return records.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
  },

  /**
   * Get all employees who have monthly data
   */
  getAllEmployeesWithData: (): string[] => {
    return monthlyDataStorage.getAllEmployeeNames()
  },

  /**
   * Get mentees for a mentor from monthly data
   */
  getMenteesForMentor: (mentorName: string): string[] => {
    return monthlyDataStorage.getMenteesForMentor(mentorName)
  },

  /**
   * Get summary statistics for the dashboard
   */
  getDashboardSummary: () => {
    const allData = monthlyDataStorage.getMonthlyData()
    
    let totalEmployees = 0
    let totalUtilization = 0
    let count = 0
    let highPerformers = 0
    let needsAttention = 0

    Object.values(allData).forEach(fyData => {
      Object.values(fyData.quarters).forEach(quarterData => {
        Object.values(quarterData.months).forEach(monthRecords => {
          // Get unique employees
          const employeeSet = new Set<string>()
          
          monthRecords.forEach(record => {
            employeeSet.add(record.name)
            totalUtilization += record.utilization
            count++
            
            if (record.utilization >= 90) highPerformers++
            if (record.utilization < 70) needsAttention++
          })
          
          totalEmployees = Math.max(totalEmployees, employeeSet.size)
        })
      })
    })

    return {
      totalEmployees,
      avgUtilization: count > 0 ? totalUtilization / count : 0,
      highPerformers,
      needsAttention
    }
  },

  /**
   * Check if monthly data exists
   */
  hasMonthlyData: (): boolean => {
    const data = monthlyDataStorage.getMonthlyData()
    return Object.keys(data).length > 0
  },

  /**
   * Get time period data for an employee
   */
  getTimePeriodData: (
    employeeName: string, 
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  ): HistoricalUtilization[] => {
    const historicalData = monthlyDataAdapter.getEmployeeHistoricalData(employeeName)
    if (!historicalData) return []

    switch (period) {
      case 'weekly':
        return historicalData.lastWeek || []
      case 'monthly':
        return historicalData.lastMonth || []
      case 'quarterly':
        return historicalData.lastQuarter || []
      case 'yearly':
        return historicalData.lastYear || []
      default:
        return []
    }
  },

  /**
   * Get comparison data (current vs previous period)
   */
  getComparisonData: (employeeName: string): {
    current: HistoricalUtilization | null
    previous: HistoricalUtilization | null
    change: number
    trend: 'up' | 'down' | 'stable'
  } => {
    const records = monthlyDataStorage.getEmployeeData(employeeName)
    if (records.length < 2) {
      return { current: null, previous: null, change: 0, trend: 'stable' }
    }

    const sorted = records.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const current: HistoricalUtilization = {
      period: `${sorted[0].month} ${sorted[0].financialYear}`,
      utilization: sorted[0].utilization,
      targetHours: sorted[0].targetHours,
      projectHours: sorted[0].project,
      date: sorted[0].date
    }

    const previous: HistoricalUtilization = {
      period: `${sorted[1].month} ${sorted[1].financialYear}`,
      utilization: sorted[1].utilization,
      targetHours: sorted[1].targetHours,
      projectHours: sorted[1].project,
      date: sorted[1].date
    }

    const change = current.utilization - previous.utilization
    let trend: 'up' | 'down' | 'stable' = 'stable'
    
    if (change > 2) trend = 'up'
    else if (change < -2) trend = 'down'

    return { current, previous, change, trend }
  }
}
