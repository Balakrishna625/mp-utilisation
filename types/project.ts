export interface MPProject {
  id: string
  projectName: string
  status: string
  projectType: string
  region: string
  deliveryPOC: string
  resources: string
  deliveryOwner: string
  fmRCNames: string
  remarks: string
  accountManager: string
  duration: number
  startDate: string
  endDate: string
  techstack: string
  salesFolder: string
  practice: string
  projectTerritory: string
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  projectsByType: Record<string, number>
  projectsByRegion: Record<string, number>
  projectsByPractice: Record<string, number>
  avgDuration: number
  endingSoon: number
}
