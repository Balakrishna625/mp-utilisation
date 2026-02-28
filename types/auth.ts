export type UserRole = 'manager' | 'individual'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  // For individual users - matches their name in the utilization data
  employeeName?: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  // For SSO future integration
  loginWithSSO?: () => Promise<void>
}

// Mock user database - replace with real database/SSO later
export const MOCK_USERS: User[] = [
  {
    id: 'mgr-1',
    name: 'Ajaykumar',
    email: 'ajaykumar@presidio.com',
    role: 'manager',
  },
  // Add individual users - these should match employee names in your utilization data
  {
    id: 'emp-1',
    name: 'Balakrishna Cherukuri',
    email: 'bcherukuri@presidio.com',
    role: 'individual',
    employeeName: 'Balakrishna Cherukuri',
  },
  {
    id: 'emp-2',
    name: 'Azeemushan Ali',
    email: 'azeem@presidio.com',
    role: 'individual',
    employeeName: 'Azeemushan Ali',
  },
  {
    id: 'emp-3',
    name: 'Gokula Krishnan K S',
    email: 'gokul@presidio.com',
    role: 'individual',
    employeeName: 'Gokula Krishnan K S',
  },
  // Add more employees as needed
]
