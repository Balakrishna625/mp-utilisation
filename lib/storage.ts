import type { EmployeeUtilization } from '@/types/utilization'

const STORAGE_KEY = 'mp-utilization-data'
const STORAGE_METADATA_KEY = 'mp-utilization-metadata'

interface StorageMetadata {
  lastUpdated: string
  fileName: string
  recordCount: number
  fileType: string
}

export const storageService = {
  // Save utilization data to localStorage
  saveData: (data: EmployeeUtilization[], metadata?: Partial<StorageMetadata>) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        
        if (metadata) {
          const meta: StorageMetadata = {
            lastUpdated: new Date().toISOString(),
            fileName: metadata.fileName || 'unknown',
            recordCount: data.length,
            fileType: metadata.fileType || 'unknown',
          }
          localStorage.setItem(STORAGE_METADATA_KEY, JSON.stringify(meta))
        }
        
        console.log('✅ Saved', data.length, 'records to localStorage')
        
        // Dispatch custom event to notify all listening components
        window.dispatchEvent(new CustomEvent('utilizationDataUpdated', { 
          detail: { count: data.length } 
        }))
        
        return true
      } catch (error) {
        console.error('Failed to save data:', error)
        return false
      }
    }
    return false
  },

  // Get utilization data from localStorage
  getData: (): EmployeeUtilization[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          console.log('📊 Loaded', parsed.length, 'records from localStorage')
          return parsed
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    return []
  },

  // Get metadata about stored data
  getMetadata: (): StorageMetadata | null => {
    if (typeof window !== 'undefined') {
      try {
        const meta = localStorage.getItem(STORAGE_METADATA_KEY)
        return meta ? JSON.parse(meta) : null
      } catch (error) {
        console.error('Failed to load metadata:', error)
      }
    }
    return null
  },

  // Clear all data
  clearData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_METADATA_KEY)
      console.log('🗑️ Cleared all data from localStorage')
    }
  },

  // Calculate summary statistics
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

  // Validate data integrity
  validateData: (data: any[]): boolean => {
    if (!Array.isArray(data) || data.length === 0) return false
    
    // Check if first item has required fields
    const requiredFields = ['id', 'name', 'title']
    const firstItem = data[0]
    
    return requiredFields.every(field => field in firstItem)
  }
}
