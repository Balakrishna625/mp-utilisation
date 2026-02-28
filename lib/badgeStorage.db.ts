/**
 * Badge History Storage - Database Version
 * 
 * Replaces localStorage badge tracking with database API
 * Used by Achievement Badges component
 */

const BADGE_HISTORY_KEY = 'mp-employee-badge-history'

interface BadgeRecord {
  badgeId: string
  earnedDate: string
  period: string
  achievementData: {
    utilization?: number
    projectHours?: number
    menteeCount?: number
    improvement?: number
  }
}

export const saveBadgeHistory = async (email: string, badges: BadgeRecord[]) => {
  if (typeof window === 'undefined') return

  try {
    const response = await fetch('/api/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: email, badges })
    })

    const result = await response.json()
    if (result.success) {
      console.log('✅ Saved', result.count, 'badge achievements to database')
      
      // Also cache to localStorage
      const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
      allHistory[email] = {
        badges,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(BADGE_HISTORY_KEY, JSON.stringify(allHistory))
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to save badge history:', error)
    
    // Fallback to localStorage
    const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
    allHistory[email] = {
      badges,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(BADGE_HISTORY_KEY, JSON.stringify(allHistory))
    return true
  }
}

export const getBadgeHistory = async (email: string): Promise<BadgeRecord[]> => {
  if (typeof window === 'undefined') return []

  try {
    const response = await fetch(`/api/badges?email=${encodeURIComponent(email)}`)
    const result = await response.json()

    if (result.success && result.badges) {
      // Cache to localStorage
      const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
      allHistory[email] = {
        badges: result.badges,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(BADGE_HISTORY_KEY, JSON.stringify(allHistory))
      
      console.log('📊 Loaded', result.badges.length, 'badge achievements from database')
      return result.badges
    }

    // Fallback to localStorage
    const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
    return allHistory[email]?.badges || []
  } catch (error) {
    console.error('Failed to load badge history:', error)
    
    // Fallback to localStorage
    const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
    return allHistory[email]?.badges || []
  }
}

export const clearBadgeHistory = async (email: string) => {
  if (typeof window === 'undefined') return

  try {
    await fetch(`/api/badges?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
    
    // Clear from localStorage cache
    const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
    delete allHistory[email]
    localStorage.setItem(BADGE_HISTORY_KEY, JSON.stringify(allHistory))
    
    console.log('🗑️ Cleared badge history from database')
  } catch (error) {
    // Clear from localStorage
    const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
    delete allHistory[email]
    localStorage.setItem(BADGE_HISTORY_KEY, JSON.stringify(allHistory))
  }
}
