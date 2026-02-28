import type { MPProject } from '@/types/project'

// NOTE: This service no longer uses localStorage - all data should come from database
// Keeping this for backward compatibility

export const projectStorageService = {
  saveProjects: (projects: MPProject[]) => {
    console.log('⚠️ projectStorageService.saveProjects called but localStorage is disabled. Use API endpoints instead.')
  },

  getProjects: (): MPProject[] => {
    console.log('⚠️ projectStorageService.getProjects called but localStorage is disabled. Use /api/projects instead.')
    return []
  },

  getMetadata: () => {
    console.log('⚠️ projectStorageService.getMetadata called but localStorage is disabled.')
    return null
  },

  clearProjects: () => {
    console.log('⚠️ projectStorageService.clearProjects called but localStorage is disabled. Use DELETE /api/projects instead.')
  },
}
