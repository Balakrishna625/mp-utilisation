/**
 * Project Storage - Database Version
 * 
 * Replaces localStorage with database API calls
 * Function signatures unchanged - UI compatible!
 */

import type { MPProject } from '@/types/project'

const PROJECT_STORAGE_KEY = 'mp-project-data'
const PROJECT_METADATA_KEY = 'mp-project-metadata'

export const projectStorage = {
  saveProjects: async (projects: MPProject[]) => {
    // Note: Projects are saved via upload API
    // This just caches locally
    if (typeof window === 'undefined') return
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects))
    localStorage.setItem(PROJECT_METADATA_KEY, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      count: projects.length
    }))
  },

  getProjects: async (): Promise<MPProject[]> => {
    if (typeof window === 'undefined') return []

    try {
      const response = await fetch('/api/projects')
      const result = await response.json()

      if (result.success && result.data) {
        // Cache locally
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(result.data))
        console.log('📊 Loaded', result.data.length, 'projects from database')
        return result.data
      }

      // Fallback to localStorage
      const cached = localStorage.getItem(PROJECT_STORAGE_KEY)
      return cached ? JSON.parse(cached) : []
    } catch (error) {
      console.error('Failed to load projects:', error)
      const cached = localStorage.getItem(PROJECT_STORAGE_KEY)
      return cached ? JSON.parse(cached) : []
    }
  },

  getMetadata: async () => {
    if (typeof window === 'undefined') return null

    try {
      const response = await fetch('/api/projects')
      const result = await response.json()
      if (result.success && result.metadata) {
        return result.metadata
      }
      const cached = localStorage.getItem(PROJECT_METADATA_KEY)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      const cached = localStorage.getItem(PROJECT_METADATA_KEY)
      return cached ? JSON.parse(cached) : null
    }
  },

  clearProjects: async () => {
    if (typeof window === 'undefined') return

    try {
      await fetch('/api/projects', { method: 'DELETE' })
      localStorage.removeItem(PROJECT_STORAGE_KEY)
      localStorage.removeItem(PROJECT_METADATA_KEY)
      console.log('🗑️ Cleared projects from database')
    } catch (error) {
      localStorage.removeItem(PROJECT_STORAGE_KEY)
      localStorage.removeItem(PROJECT_METADATA_KEY)
    }
  }
}
