/**
 * Report Storage - Database Version
 * 
 * Replaces localStorage with database API calls
 * Function signatures unchanged - UI compatible!
 */

import type { EmployeeReport } from '@/types/report'

const REPORT_STORAGE_KEY = 'mp-report-data'
const REPORT_METADATA_KEY = 'mp-report-metadata'

export const reportStorage = {
  saveReports: async (reports: EmployeeReport[]) => {
    // Note: Reports are saved via upload API
    // This just caches locally
    if (typeof window === 'undefined') return
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports))
    localStorage.setItem(REPORT_METADATA_KEY, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      count: reports.length
    }))
  },

  getReports: async (): Promise<EmployeeReport[]> => {
    if (typeof window === 'undefined') return []

    try {
      const response = await fetch('/api/reports')
      const result = await response.json()

      if (result.success && result.data) {
        // Cache locally
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(result.data))
        console.log('📊 Loaded', result.data.length, 'reports from database')
        return result.data
      }

      // Fallback to localStorage
      const cached = localStorage.getItem(REPORT_STORAGE_KEY)
      return cached ? JSON.parse(cached) : []
    } catch (error) {
      console.error('Failed to load reports:', error)
      const cached = localStorage.getItem(REPORT_STORAGE_KEY)
      return cached ? JSON.parse(cached) : []
    }
  },

  getMetadata: async () => {
    if (typeof window === 'undefined') return null

    try {
      const response = await fetch('/api/reports')
      const result = await response.json()
      if (result.success && result.metadata) {
        return result.metadata
      }
      const cached = localStorage.getItem(REPORT_METADATA_KEY)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      const cached = localStorage.getItem(REPORT_METADATA_KEY)
      return cached ? JSON.parse(cached) : null
    }
  },

  getMentorMenteeData: async () => {
    if (typeof window === 'undefined') return []

    try {
      const response = await fetch('/api/reports')
      const result = await response.json()
      if (result.success && result.mentorMenteeData) {
        return result.mentorMenteeData
      }
      return []
    } catch (error) {
      console.error('Failed to load mentor-mentee data:', error)
      return []
    }
  },

  clearReports: async () => {
    if (typeof window === 'undefined') return

    try {
      await fetch('/api/reports', { method: 'DELETE' })
      localStorage.removeItem(REPORT_STORAGE_KEY)
      localStorage.removeItem(REPORT_METADATA_KEY)
      console.log('🗑️ Cleared reports from database')
    } catch (error) {
      localStorage.removeItem(REPORT_STORAGE_KEY)
      localStorage.removeItem(REPORT_METADATA_KEY)
    }
  }
}
