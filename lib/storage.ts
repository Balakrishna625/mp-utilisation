import type { EmployeeUtilization, HistoricalUtilization, EmployeeHistoricalData } from '@/types/utilization'

// NOTE: This service no longer uses localStorage - all data should come from database
// Keeping this for backward compatibility and utility functions

export const storageService = {
  // No longer saves to localStorage - data should be saved via API
  saveData: (data: EmployeeUtilization[], metadata?: any) => {
    console.log('⚠️ storageService.saveData called but localStorage is disabled. Use API endpoints instead.')
    return false
  },

  // No longer reads from localStorage - data should come from API
  getData: (): EmployeeUtilization[] => {
    console.log('⚠️ storageService.getData called but localStorage is disabled. Use /api/data instead.')
    return []
  },

  // No longer reads from localStorage
  getMetadata: (): null => {
    console.log('⚠️ storageService.getMetadata called but localStorage is disabled.')
    return null
  },

  // No longer clears localStorage
  clearData: () => {
    console.log('⚠️ storageService.clearData called but localStorage is disabled. Use DELETE /api/data instead.')
  },

  // Calculate summary statistics (utility function still works)
  getSummary: (data: EmployeeUtilization[]) => {
    if (data.length === 0) {
      return {
        totalEmployees: 0,
        avgUtilization: 0,
        totalHours: 0,
        targetHours: 0,
        totalFringe: 0,
      }
    }

    const totalTargetHours = data.reduce((sum, emp) => sum + (emp.targetHours || 0), 0)
    const totalProjectHours = data.reduce((sum, emp) => sum + (emp.project || 0), 0)
    const avgUtilization = data.reduce((sum, emp) => sum + (emp.utilization || 0), 0) / data.length
    const totalFringe = data.reduce((sum, emp) => sum + (emp.fringe || 0), 0)

    return {
      totalEmployees: data.length,
      avgUtilization: Number(avgUtilization.toFixed(2)),
      totalHours: totalProjectHours,
      targetHours: totalTargetHours,
      totalFringe,
    }
  },

  // Validate data integrity (utility function still works)
  validateData: (data: any[]): boolean => {
    if (!Array.isArray(data) || data.length === 0) return false
    
    // Check if first item has required fields
    const requiredFields = ['id', 'name', 'title']
    const firstItem = data[0]
    
    return requiredFields.every(field => field in firstItem)
  },

  // Historical data functions disabled
  saveHistoricalData: (employeeName: string, data: EmployeeHistoricalData) => {
    console.log('⚠️ storageService.saveHistoricalData called but localStorage is disabled.')
    return false
  },

  getHistoricalData: (employeeName: string): EmployeeHistoricalData | null => {
    return null
  },

  getAllHistoricalData: (): Record<string, EmployeeHistoricalData> => {
    return {}
  },
}

