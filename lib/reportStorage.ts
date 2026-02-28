import type { EmployeeReport } from '@/types/report'

// NOTE: This service no longer uses localStorage - all data should come from database
// Keeping this for backward compatibility

export const reportStorageService = {
  saveReports: (reports: EmployeeReport[], fileName?: string) => {
    console.log('⚠️ reportStorageService.saveReports called but localStorage is disabled. Use API endpoints instead.')
  },

  getReports: (): EmployeeReport[] => {
    console.log('⚠️ reportStorageService.getReports called but localStorage is disabled. Use /api/reports instead.')
    return []
  },

  getMetadata: (): null => {
    console.log('⚠️ reportStorageService.getMetadata called but localStorage is disabled.')
    return null
  },

  clearReports: () => {
    console.log('⚠️ reportStorageService.clearReports called but localStorage is disabled. Use DELETE /api/reports instead.')
  },
}
