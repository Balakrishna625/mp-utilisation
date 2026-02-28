export type AvailabilityStatus = 'Available' | 'No' | 'Has Bandwidth' | 'Booked' | 'Partial'

export interface EmployeeReport {
  id: string
  name: string
  email: string
  role: string
  currentProject: string
  isAvailable: AvailabilityStatus
  tentativeProject?: string
  availableFrom?: string
  practice: string
  mentor?: string
  managerName: string
  isContractor: boolean
  remarks?: string
  lastUpdated?: string
  currentProjectUtilization?: number
}
