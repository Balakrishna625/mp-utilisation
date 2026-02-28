import { User, MOCK_USERS } from '@/types/auth'

const AUTH_STORAGE_KEY = 'mp-utilization-auth'

export const authService = {
  // Get current user from localStorage
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  },

  // Set current user
  setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return
    
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  },

  // Mock login - replace with real authentication
  async login(email: string, password: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For demo purposes, accept any password for valid users
    const user = MOCK_USERS.find(u => u.email === email)
    
    if (!user) {
      throw new Error('Invalid credentials')
    }
    
    this.setCurrentUser(user)
    return user
  },

  // Logout
  logout(): void {
    this.setCurrentUser(null)
  },

  // Check if user has manager role
  isManager(user: User | null): boolean {
    return user?.role === 'manager'
  },

  // Check if user has individual role
  isIndividual(user: User | null): boolean {
    return user?.role === 'individual'
  },
}
