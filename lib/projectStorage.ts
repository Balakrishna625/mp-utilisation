import type { MPProject } from '@/types/project'

const PROJECT_STORAGE_KEY = 'mp-projects-data'
const PROJECT_METADATA_KEY = 'mp-projects-metadata'

export const projectStorageService = {
  saveProjects: (projects: MPProject[]) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects))
      localStorage.setItem(PROJECT_METADATA_KEY, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        recordCount: projects.length,
      }))
    } catch (error) {
      console.error('Error saving projects:', error)
    }
  },

  getProjects: (): MPProject[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const data = localStorage.getItem(PROJECT_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading projects:', error)
      return []
    }
  },

  getMetadata: () => {
    if (typeof window === 'undefined') return null
    
    try {
      const metadata = localStorage.getItem(PROJECT_METADATA_KEY)
      return metadata ? JSON.parse(metadata) : null
    } catch (error) {
      console.error('Error loading metadata:', error)
      return null
    }
  },

  clearProjects: () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(PROJECT_STORAGE_KEY)
      localStorage.removeItem(PROJECT_METADATA_KEY)
    } catch (error) {
      console.error('Error clearing projects:', error)
    }
  },
}
