/**
 * Monthly Data Storage - Database Version
 * 
 * This replaces localStorage with database API calls
 * All function signatures remain the same - UI code needs NO changes!
 */

import type { MonthlyUtilizationRecord, MonthlyDataStructure, QuarterData } from '@/types/utilization'

const MONTHLY_DATA_KEY = 'mp-monthly-utilization-data'
const MONTHLY_METADATA_KEY = 'mp-monthly-utilization-metadata'

// Financial Year and Quarter mapping
export const FY_QUARTER_MAPPING: { [month: string]: { quarter: string, fy: string } } = {
  'Jul': { quarter: 'Q1', fy: 'FY' }, 'Aug': { quarter: 'Q1', fy: 'FY' }, 'Sep': { quarter: 'Q1', fy: 'FY' },
  'Oct': { quarter: 'Q2', fy: 'FY' }, 'Nov': { quarter: 'Q2', fy: 'FY' }, 'Dec': { quarter: 'Q2', fy: 'FY' },
  'Jan': { quarter: 'Q3', fy: 'FY' }, 'Feb': { quarter: 'Q3', fy: 'FY' }, 'Mar': { quarter: 'Q3', fy: 'FY' },
  'Apr': { quarter: 'Q4', fy: 'FY' }, 'May': { quarter: 'Q4', fy: 'FY' }, 'Jun': { quarter: 'Q4', fy: 'FY' },
}

export const MONTH_TO_NUMBER: { [month: string]: number } = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
}

export function getQuarterFromMonth(month: string): string {
  return FY_QUARTER_MAPPING[month]?.quarter || 'Q1'
}

export function getFinancialYear(month: string, year: number): string {
  const monthNum = MONTH_TO_NUMBER[month]
  return monthNum >= 7 ? `FY${String(year % 100 + 1).padStart(2, '0')}` : `FY${String(year % 100).padStart(2, '0')}`
}

export const monthlyDataStorage = {
  // Save monthly utilization data
  saveData: async (data: MonthlyDataStructure, metadata?: any) => {
    if (typeof window === 'undefined') return false

    try {
      // Flatten the structured data for API
      const records: any[] = []
      Object.values(data).forEach(fyData => {
        Object.values(fyData.quarters).forEach(qData => {
          Object.values(qData.months).forEach(monthRecords => {
            records.push(...monthRecords)
          })
        })
      })

      const response = await fetch('/api/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, metadata })
      })

      const result = await response.json()
      if (result.success) {
        console.log('✅ Saved', result.count, 'monthly records to database')
        // Also save to localStorage as cache
        localStorage.setItem(MONTHLY_DATA_KEY, JSON.stringify(data))
        if (metadata) {
          localStorage.setItem(MONTHLY_METADATA_KEY, JSON.stringify(metadata))
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save monthly data:', error)
      // Fallback to localStorage
      localStorage.setItem(MONTHLY_DATA_KEY, JSON.stringify(data))
      if (metadata) {
        localStorage.setItem(MONTHLY_METADATA_KEY, JSON.stringify(metadata))
      }
      return true
    }
  },

  // Get monthly utilization data
  getData: async (): Promise<MonthlyDataStructure> => {
    if (typeof window === 'undefined') return {}

    try {
      const response = await fetch('/api/monthly')
      const result = await response.json()

      if (result.success && result.data) {
        // Restructure flat data into FY/Q/M hierarchy
        const structured: MonthlyDataStructure = {}

        result.data.forEach((record: any) => {
          const { financialYear, quarter, month } = record

          if (!structured[financialYear]) {
            structured[financialYear] = {
              financialYear,
              quarters: {}
            }
          }

          if (!structured[financialYear].quarters[quarter]) {
            structured[financialYear].quarters[quarter] = {
              quarter,
              months: {}
            }
          }

          if (!structured[financialYear].quarters[quarter].months[month]) {
            structured[financialYear].quarters[quarter].months[month] = []
          }

          structured[financialYear].quarters[quarter].months[month].push(record)
        })

        // Cache to localStorage
        localStorage.setItem(MONTHLY_DATA_KEY, JSON.stringify(structured))
        console.log('📊 Loaded monthly data from database')
        return structured
      }

      // Fallback to localStorage
      const cached = localStorage.getItem(MONTHLY_DATA_KEY)
      return cached ? JSON.parse(cached) : {}
    } catch (error) {
      console.error('Failed to load monthly data:', error)
      // Fallback to localStorage
      const cached = localStorage.getItem(MONTHLY_DATA_KEY)
      return cached ? JSON.parse(cached) : {}
    }
  },

  // Get metadata
  getMetadata: async () => {
    if (typeof window === 'undefined') return null

    try {
      const response = await fetch('/api/monthly')
      const result = await response.json()
      if (result.success && result.metadata) {
        localStorage.setItem(MONTHLY_METADATA_KEY, JSON.stringify(result.metadata))
        return result.metadata
      }
      // Fallback
      const cached = localStorage.getItem(MONTHLY_METADATA_KEY)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      const cached = localStorage.getItem(MONTHLY_METADATA_KEY)
      return cached ? JSON.parse(cached) : null
    }
  },

  // Clear all data
  clearData: async () => {
    if (typeof window === 'undefined') return

    try {
      await fetch('/api/monthly', { method: 'DELETE' })
      localStorage.removeItem(MONTHLY_DATA_KEY)
      localStorage.removeItem(MONTHLY_METADATA_KEY)
      console.log('🗑️ Cleared monthly data from database and cache')
    } catch (error) {
      localStorage.removeItem(MONTHLY_DATA_KEY)
      localStorage.removeItem(MONTHLY_METADATA_KEY)
    }
  },

  // Append new month'data to existing structure
  appendMonthData: async (newData: MonthlyDataStructure) => {
    if (typeof window === 'undefined') return false

    try {
      const existing = await monthlyDataStorage.getData()
      
      // Merge new data with existing
      Object.keys(newData).forEach(fy => {
        if (!existing[fy]) {
          existing[fy] = newData[fy]
        } else {
          Object.keys(newData[fy].quarters).forEach(q => {
            if (!existing[fy].quarters[q]) {
              existing[fy].quarters[q] = newData[fy].quarters[q]
            } else {
              Object.keys(newData[fy].quarters[q].months).forEach(m => {
                existing[fy].quarters[q].months[m] = newData[fy].quarters[q].months[m]
              })
            }
          })
        }
      })

      return await monthlyDataStorage.saveData(existing)
    } catch (error) {
      console.error('Failed to append month data:', error)
      return false
    }
  }
}
