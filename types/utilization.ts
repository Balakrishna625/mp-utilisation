export interface EmployeeUtilization {
  id: string
  name: string
  email?: string
  title: string
  targetHours: number
  project: number
  pmn: number
  utilization: number
  fringeImpact: number
  fringe: number
  wPresales: number
  mentor?: string
}

export interface UtilizationData {
  employees: EmployeeUtilization[]
  period: string
  totalTargetHours: number
  totalProject: number
  avgUtilization: number
  totalFringe: number
}
