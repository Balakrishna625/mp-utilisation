import type { EmployeeReport } from '@/types/report'

const REPORT_STORAGE_KEY = 'mp-reports-data'
const REPORT_METADATA_KEY = 'mp-reports-metadata'

interface ReportMetadata {
  lastUpdated: string
  recordCount: number
  fileName?: string
}

export const reportStorageService = {
  saveReports: (reports: EmployeeReport[], fileName?: string) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports))
      const metadata: ReportMetadata = {
        lastUpdated: new Date().toISOString(),
        recordCount: reports.length,
        fileName,
      }
      localStorage.setItem(REPORT_METADATA_KEY, JSON.stringify(metadata))
      console.log('✅ Saved', reports.length, 'reports to localStorage')
    } catch (error) {
      console.error('Error saving reports:', error)
    }
  },

  getReports: (): EmployeeReport[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const data = localStorage.getItem(REPORT_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading reports:', error)
      return []
    }
  },

  getMetadata: (): ReportMetadata | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const metadata = localStorage.getItem(REPORT_METADATA_KEY)
      return metadata ? JSON.parse(metadata) : null
    } catch (error) {
      console.error('Error loading report metadata:', error)
      return null
    }
  },

  clearReports: () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(REPORT_STORAGE_KEY)
      localStorage.removeItem(REPORT_METADATA_KEY)
      console.log('🗑️ Cleared reports data')
    } catch (error) {
      console.error('Error clearing reports:', error)
    }
  },
}
