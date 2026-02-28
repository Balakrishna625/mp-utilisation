'use client'

import { useState, useEffect } from 'react'
import { Award, TrendingUp, Target, Star, Zap, Trophy, Medal, Crown, Scale, Flame, Users, Lightbulb, Calendar } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  achieved: boolean
  progress: number
  color: string
  bgColor: string
  timesEarned: number
  firstEarned?: string
  lastEarned?: string
  criteriaValue?: string
}

interface AchievementBadgesProps {
  currentUtilization: number
  averageUtilization: number
  totalHours: number
  menteeCount: number
  historicalData?: any
}

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

// Badge history storage
const BADGE_HISTORY_KEY = 'mp-employee-badge-history'

const saveBadgeHistory = (email: string, badges: BadgeRecord[]) => {
  if (typeof window === 'undefined') return
  const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
  allHistory[email] = {
    badges,
    lastUpdated: new Date().toISOString()
  }
  localStorage.setItem(BADGE_HISTORY_KEY, JSON.stringify(allHistory))
}

const getBadgeHistory = (email: string): BadgeRecord[] => {
  if (typeof window === 'undefined') return []
  const allHistory = JSON.parse(localStorage.getItem(BADGE_HISTORY_KEY) || '{}')
  return allHistory[email]?.badges || []
}

export default function AchievementBadges({ 
  currentUtilization, 
  averageUtilization,
  totalHours, 
  menteeCount,
  historicalData 
}: AchievementBadgesProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    // Get user email from auth context or localStorage
    if (typeof window !== 'undefined') {
      const authUser = localStorage.getItem('mp-auth-user')
      if (authUser) {
        const user = JSON.parse(authUser)
        setUserEmail(user.email || '')
      }
    }
  }, [])

  // Calculate fringe percentage
  const fringeData = historicalData?.lastMonth?.[0]
  const fringePercentage = fringeData ? ((fringeData.targetHours - fringeData.projectHours) / fringeData.targetHours) * 100 : 0

  // Calculate improvement from previous quarter
  const quarterData = historicalData?.lastQuarter || []
  const improvement = quarterData.length >= 2 
    ? quarterData[quarterData.length - 1].utilization - quarterData[0].utilization 
    : 0

  const achievements: Achievement[] = [
    {
      id: 'elite-performer',
      title: 'Elite Performer',
      description: 'Maintain ≥95% utilization',
      icon: Trophy,
      achieved: currentUtilization >= 95,
      progress: Math.min((currentUtilization / 95) * 100, 100),
      color: 'from-yellow-500 to-amber-600',
      bgColor: 'bg-gradient-to-br from-yellow-500/10 to-amber-600/10',
      timesEarned: 0,
      criteriaValue: `${currentUtilization.toFixed(1)}%`
    },
    {
      id: 'consistent-contributor',
      title: 'Consistent Contributor',
      description: '80-95% utilization for 3 months',
      icon: Star,
      achieved: (() => {
        const lastMonthData = historicalData?.lastMonth || []
        if (lastMonthData.length < 3) return false
        return lastMonthData.slice(0, 3).every((d: any) => d.utilization >= 80 && d.utilization <= 95)
      })(),
      progress: Math.min(((historicalData?.lastMonth?.length || 0) / 3) * 100, 100),
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-600/10',
      timesEarned: 0,
      criteriaValue: `${historicalData?.lastMonth?.length || 0}/3 months`
    },
    {
      id: 'over-achiever',
      title: 'Over Achiever',
      description: 'Achieve more than 100% utilization',
      icon: Crown,
      achieved: currentUtilization > 100,
      progress: Math.min((currentUtilization / 100) * 100, 100),
      color: 'from-purple-500 to-fuchsia-600',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-fuchsia-600/10',
      timesEarned: 0,
      criteriaValue: `${currentUtilization.toFixed(1)}%`
    },
    {
      id: 'mentor-master',
      title: 'Mentor Master',
      description: 'Mentoring 3+ team members',
      icon: Users,
      achieved: menteeCount >= 3,
      progress: Math.min((menteeCount / 3) * 100, 100),
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-600/10',
      timesEarned: 0,
      criteriaValue: `${menteeCount} mentees`
    },
    {
      id: 'rising-star',
      title: 'Rising Star',
      description: '10%+ improvement from last quarter',
      icon: TrendingUp,
      achieved: improvement >= 10,
      progress: Math.min((improvement / 10) * 100, 100),
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-gradient-to-br from-pink-500/10 to-rose-600/10',
      timesEarned: 0,
      criteriaValue: `+${improvement.toFixed(1)}%`
    },
    {
      id: 'balanced-pro',
      title: 'Balanced Pro',
      description: '85-95% utilization, <15% fringe (2mo)',
      icon: Scale,
      achieved: currentUtilization >= 85 && currentUtilization <= 95 && fringePercentage < 15,
      progress: currentUtilization >= 85 && currentUtilization <= 95 ? Math.min(((15 - fringePercentage) / 15) * 100, 100) : 0,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-gradient-to-br from-teal-500/10 to-cyan-600/10',
      timesEarned: 0,
      criteriaValue: `${fringePercentage.toFixed(1)}% fringe`
    },
    {
      id: 'marathon-runner',
      title: 'Marathon Runner',
      description: '600+ billable hours/quarter',
      icon: Flame,
      achieved: totalHours >= 600,
      progress: Math.min((totalHours / 600) * 100, 100),
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-orange-500/10 to-red-600/10',
      timesEarned: 0,
      criteriaValue: `${totalHours}h`
    },
    {
      id: 'team-player',
      title: 'Team Player',
      description: 'Active on 3+ client projects',
      icon: Award,
      achieved: false, // TODO: implement when project data available
      progress: 0,
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-indigo-500/10 to-blue-600/10',
      timesEarned: 0,
      criteriaValue: '0/3 projects'
    },
    {
      id: 'innovation-champion',
      title: 'Innovation Champion',
      description: 'Presales activity + 80%+ utilization',
      icon: Lightbulb,
      achieved: currentUtilization >= 80 && fringePercentage > 5,
      progress: currentUtilization >= 80 ? Math.min((fringePercentage / 5) * 100, 100) : 0,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-violet-500/10 to-purple-600/10',
      timesEarned: 0,
      criteriaValue: `${currentUtilization.toFixed(1)}%`
    },
    {
      id: 'perfect-attendance',
      title: 'Perfect Attendance',
      description: '100% data compliance (6mo)',
      icon: Calendar,
      achieved: (historicalData?.lastMonth?.length || 0) >= 6,
      progress: Math.min(((historicalData?.lastMonth?.length || 0) / 6) * 100, 100),
      color: 'from-slate-500 to-gray-600',
      bgColor: 'bg-gradient-to-br from-slate-500/10 to-gray-600/10',
      timesEarned: 0,
      criteriaValue: `${historicalData?.lastMonth?.length || 0}/6 months`
    },
  ]

  // Load badge history and update counts
  useEffect(() => {
    if (!userEmail) return
    const history = getBadgeHistory(userEmail)
    
    achievements.forEach(achievement => {
      const badgeRecords = history.filter(b => b.badgeId === achievement.id)
      achievement.timesEarned = badgeRecords.length
      
      if (badgeRecords.length > 0) {
        const sorted = badgeRecords.sort((a, b) => new Date(a.earnedDate).getTime() - new Date(b.earnedDate).getTime())
        achievement.firstEarned = sorted[0].earnedDate
        achievement.lastEarned = sorted[sorted.length - 1].earnedDate
      }
      
      // Save newly earned badges
      if (achievement.achieved && !badgeRecords.some(b => b.period === getCurrentPeriod())) {
        const newBadge: BadgeRecord = {
          badgeId: achievement.id,
          earnedDate: new Date().toISOString(),
          period: getCurrentPeriod(),
          achievementData: {
            utilization: currentUtilization,
            projectHours: totalHours,
            menteeCount,
            improvement
          }
        }
        saveBadgeHistory(userEmail, [...history, newBadge])
      }
    })
  }, [userEmail, currentUtilization, totalHours])

  const getCurrentPeriod = () => {
    const now = new Date()
    return `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`
  }

  const achievedCount = achievements.filter(a => a.achieved).length

  return (
    <div className="bg-gradient-to-br from-surface via-surface to-surface-light border border-surface-light rounded-2xl p-6 shadow-xl">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Achievements</h3>
            <p className="text-xs text-text-muted">Track your progress and unlock badges</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex gap-1 bg-surface-light/50 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPeriod === 'quarter'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPeriod === 'year'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
              }`}
            >
              Year
            </button>
          </div>

          {/* Achievement Count */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-xl border-2 border-primary/20 shadow-lg">
            <Medal className="w-5 h-5 text-primary" />
            <span className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {achievedCount}/{achievements.length}
            </span>
          </div>
        </div>
      </div>

      {/* Achievements Grid - Vibrant Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          
          return (
            <div
              key={achievement.id}
              className="group relative"
            >
              {/* Main Badge Card */}
              <div className={`
                relative rounded-2xl p-4 transition-all duration-500 cursor-pointer overflow-hidden
                ${achievement.achieved 
                  ? `bg-gradient-to-br ${achievement.color} shadow-xl hover:shadow-2xl hover:scale-110 transform` 
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-750 hover:to-gray-850 shadow-lg hover:shadow-xl hover:scale-105'
                }
              `}>
                {/* Shimmer Effect for Unlocked Badges */}
                {achievement.achieved && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </>
                )}

                {/* Sparkle Effects for Achieved Badges */}
                {achievement.achieved && (
                  <>
                    <div className="absolute top-2 right-2 text-yellow-300 animate-pulse text-xs">✨</div>
                    <div className="absolute bottom-2 left-2 text-yellow-300 animate-pulse text-xs delay-75">✨</div>
                  </>
                )}

                {/* Badge Icon */}
                <div className="flex items-center justify-center mb-3 relative z-10">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500
                    ${achievement.achieved 
                      ? 'bg-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 group-hover:rotate-12 ring-2 ring-white/30' 
                      : 'bg-gray-700/50 border-2 border-dashed border-gray-600'
                    }
                  `}>
                    <Icon 
                      className={`w-8 h-8 transition-all duration-300 ${achievement.achieved ? 'text-white drop-shadow-lg' : 'text-gray-500'}`}
                      strokeWidth={achievement.achieved ? 2.5 : 2}
                    />
                  </div>
                </div>

                {/* Badge Title */}
                <div className="text-center mb-2 relative z-10">
                  <h4 className={`text-sm font-bold ${achievement.achieved ? 'text-white drop-shadow-md' : 'text-gray-400'}`}>
                    {achievement.title}
                  </h4>
                </div>

                {/* Badge Status */}
                {achievement.achieved ? (
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center justify-center gap-1 text-xs text-white/90 font-semibold">
                      <span className="drop-shadow">{achievement.progress.toFixed(0)}%</span>
                    </div>
                    {achievement.timesEarned > 0 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-white/80 bg-black/20 rounded-full px-2 py-0.5">
                        <Zap className="w-3 h-3" />
                        <span className="font-medium">{achievement.timesEarned}x</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-300">
                      <span>{achievement.progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                      <div 
                        className={`h-full bg-gradient-to-r ${achievement.color} rounded-full transition-all duration-700 shadow-glow relative overflow-hidden`}
                        style={{ width: `${achievement.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Achieved Indicator */}
                {achievement.achieved && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20 animate-bounce-slow">
                    <svg className="w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Lock Icon for Unachieved */}
                {!achievement.achieved && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gray-900 border-2 border-gray-700 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Hover Tooltip - Enhanced */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-20 group-hover:translate-y-0 translate-y-2">
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 min-w-[240px] border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${achievement.achieved ? 'text-green-400' : 'text-gray-400'}`} />
                    <div className="text-sm font-bold">{achievement.title}</div>
                  </div>
                  <div className="text-xs text-gray-300 mb-3 leading-relaxed">{achievement.description}</div>
                  
                  {achievement.achieved ? (
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400 font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Unlocked
                        </span>
                      </div>
                      {achievement.timesEarned > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Earned:</span>
                          <span className="text-yellow-400 font-semibold">{achievement.timesEarned} times</span>
                        </div>
                      )}
                      {achievement.firstEarned && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">First earned:</span>
                          <span className="text-gray-300 font-medium">
                            {new Date(achievement.firstEarned).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Current value:</span>
                        <span className="text-white font-semibold">{achievement.criteriaValue}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Progress:</span>
                        <span className="font-bold text-white">{achievement.progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${achievement.color} rounded-full relative overflow-hidden`}
                          style={{ width: `${achievement.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Current value:</span>
                        <span className="text-gray-300 font-medium">{achievement.criteriaValue}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-r border-b border-white/10 transform rotate-45 -mt-1.5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress Bar - Enhanced */}
      <div className="mt-8 pt-6 border-t border-surface-light/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-base font-semibold text-text-primary">Overall Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {((achievedCount / achievements.length) * 100).toFixed(0)}%
            </span>
            <span className="text-sm text-text-muted">
              ({achievedCount}/{achievements.length})
            </span>
          </div>
        </div>
        <div className="relative h-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-1000 relative overflow-hidden shadow-lg"
            style={{ width: `${(achievedCount / achievements.length) * 100}%` }}
          >
            {/* Animated Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
          </div>
          {/* Achievement Markers */}
          {achievements.map((_, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-px bg-gray-700/50"
              style={{ left: `${((index + 1) / achievements.length) * 100}%` }}
            />
          ))}
        </div>
        {achievedCount < achievements.length && (
          <div className="mt-3 text-center text-sm text-text-muted">
            🎯 {achievements.length - achievedCount} more {achievements.length - achievedCount === 1 ? 'badge' : 'badges'} to unlock!
          </div>
        )}
        {achievedCount === achievements.length && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full px-4 py-2">
              <span className="text-2xl">🏆</span>
              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                All achievements unlocked!
              </span>
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
