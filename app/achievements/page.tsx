'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Crown, Star, TrendingUp, Award, Zap, ArrowLeft, Users, Target, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AchievementBadges from '@/components/charts/AchievementBadges'
import type { EmployeeUtilization } from '@/types/utilization'

interface LeaderboardEntry {
  name: string
  email: string
  utilization: number
  projectHours: number
  fringe: number
  rank: number
  isTied: boolean
  trend: 'up' | 'down' | 'same'
  badge?: string
}

type PeriodType = 'current' | 'quarterly' | 'yearly' | 'custom'

export default function AchievementsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [myData, setMyData] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<number>(0)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('current')
  
  // Initialize to current month
  const now = new Date()
  const [customMonth, setCustomMonth] = useState<number>(now.getMonth() + 1)
  const [customYear, setCustomYear] = useState<number>(now.getFullYear())
  const myRowRef = useRef<HTMLDivElement>(null)

  const scrollToMyRank = () => {
    if (myRowRef.current) {
      myRowRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      // Add a subtle pulse effect
      myRowRef.current.classList.add('animate-pulse')
      setTimeout(() => {
        myRowRef.current?.classList.remove('animate-pulse')
      }, 1000)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'individual') {
      router.push('/login')
      return
    }
    loadData()
  }, [isAuthenticated, user, router, selectedPeriod, customMonth, customYear])

  const loadData = async () => {
    setLoading(true)
    
    try {
      if (!user?.employeeName && !user?.email) {
        setLoading(false)
        return
      }

      // Fetch data from database API
      const response = await fetch('/api/monthly')
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        // Filter records based on selected period
        let filteredData = result.data
        const now = new Date()
        
        if (selectedPeriod === 'current' || selectedPeriod === 'custom') {
          // Filter for specific month/year
          const targetMonth = selectedPeriod === 'custom' ? customMonth : now.getMonth() + 1
          const targetYear = selectedPeriod === 'custom' ? customYear : now.getFullYear()
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const targetMonthName = monthNames[targetMonth - 1]
          
          filteredData = result.data.filter((record: any) => {
            const recordDate = new Date(record.date)
            return record.month === targetMonthName && recordDate.getFullYear() === targetYear
          })
        } else if (selectedPeriod === 'quarterly') {
          // Filter for current quarter (last 3 months)
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          filteredData = result.data.filter((record: any) => {
            const recordDate = new Date(record.date)
            return recordDate >= threeMonthsAgo
          })
        } else if (selectedPeriod === 'yearly') {
          // Filter for current year
          filteredData = result.data.filter((record: any) => {
            const recordDate = new Date(record.date)
            return recordDate.getFullYear() === now.getFullYear()
          })
        }
        
        // Aggregate ALL records for each employee (sum hours, average utilization)
        const employeeRecordsMap = new Map<string, any[]>()
        filteredData.forEach((record: any) => {
          const key = record.name
          if (!employeeRecordsMap.has(key)) {
            employeeRecordsMap.set(key, [])
          }
          employeeRecordsMap.get(key)!.push(record)
        })

        // Aggregate each employee's records: sum project/target hours, recompute utilization
        const aggregatedMap = new Map<string, any>()
        employeeRecordsMap.forEach((records, name) => {
          const totalProject = records.reduce((sum, r) => sum + (r.project || 0), 0)
          const totalTarget = records.reduce((sum, r) => sum + (r.targetHours || 0), 0)
          const totalFringe = records.reduce((sum, r) => sum + (r.fringe || 0), 0)
          const avgUtilization = totalTarget > 0 ? (totalProject / totalTarget) * 100 : 0
          const firstRecord = records[0]
          aggregatedMap.set(name, {
            ...firstRecord,
            project: totalProject,
            targetHours: totalTarget,
            fringe: totalFringe,
            utilization: avgUtilization,
            weekCount: records.length
          })
        })

        // Find current user's aggregated data
        const userRecord = Array.from(aggregatedMap.values()).find((r: any) => 
          r.name === user.employeeName || 
          r.userEmail === user.email ||
          r.email === user.email
        )
        
        setMyData(userRecord ? {
          name: userRecord.name,
          email: userRecord.userEmail || userRecord.email,
          utilization: userRecord.utilization,
          project: userRecord.project,
          targetHours: userRecord.targetHours,
          fringe: userRecord.fringe
        } : null)
        
        // Create leaderboard from all employees (using aggregated data)
        const allEmployees = Array.from(aggregatedMap.values()).map((record: any) => ({
          name: record.name,
          email: record.userEmail || record.email || '',
          utilization: record.utilization || 0,
          projectHours: record.project || 0,
          fringe: record.fringe || 0,
        }))
        
        // Multi-key sort: utilization (desc) → projectHours (desc) → fringe (asc = less bench time)
        const sorted = allEmployees
          .map((emp) => ({
            name: emp.name,
            email: emp.email,
            utilization: emp.utilization,
            projectHours: emp.projectHours,
            fringe: emp.fringe,
            rank: 0,
            isTied: false,
            trend: 'same' as const,
            badge: emp.utilization > 100 ? 'champion' : 
                   emp.utilization >= 90 ? 'star' :
                   emp.utilization >= 80 ? 'rising' : undefined
          }))
          .sort((a, b) => {
            // Primary: utilization descending
            if (Math.abs(b.utilization - a.utilization) > 0.01) return b.utilization - a.utilization
            // Secondary: project hours descending (more absolute work done)
            if (b.projectHours !== a.projectHours) return b.projectHours - a.projectHours
            // Tertiary: fringe ascending (less bench time = better discipline)
            return a.fringe - b.fringe
          })
        
        // Standard competition ranking: tied entries share the same rank, next rank skips
        // Two entries are "truly tied" only if ALL three criteria match
        const sortedEmployees = sorted.map((emp, index, arr) => {
          let rank: number
          if (index === 0) {
            rank = 1
          } else {
            const prev = arr[index - 1]
            const isSame =
              Math.abs(emp.utilization - prev.utilization) <= 0.01 &&
              emp.projectHours === prev.projectHours &&
              emp.fringe === prev.fringe
            rank = isSame ? (arr[index - 1] as any)._rank : index + 1
          }
          ;(emp as any)._rank = rank
          return emp
        }).map((emp, index, arr) => {
          const rank = (emp as any)._rank
          // Mark as tied if any neighbour shares the same rank
          const isTied = arr.some((other, i) => i !== index && (other as any)._rank === rank)
          return { ...emp, rank, isTied }
        })
        
        setLeaderboard(sortedEmployees)
        
        const userEntry = sortedEmployees.find(emp => 
          emp.name === user.employeeName || emp.email === user.email
        )
        setMyRank(userEntry ? userEntry.rank : 0)
      } else {
        setMyData(null)
        setLeaderboard([])
        setMyRank(0)
      }
    } catch (error) {
      console.error('Failed to load achievements data:', error)
      setMyData(null)
      setLeaderboard([])
      setMyRank(0)
    } finally {
      setLoading(false)
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 via-amber-400 to-yellow-500'
    if (rank === 2) return 'from-gray-300 via-gray-400 to-gray-500'
    if (rank === 3) return 'from-orange-400 via-amber-600 to-orange-700'
    return 'from-blue-500 via-indigo-500 to-blue-600'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-300" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Trophy className="w-6 h-6 text-orange-400" />
    return <Star className="w-5 h-5 text-blue-400" />
  }

  const getPeriodLabel = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December']
    const now = new Date()
    
    if (selectedPeriod === 'custom') {
      return `${monthNames[customMonth - 1]} ${customYear}`
    } else if (selectedPeriod === 'current') {
      return `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    } else if (selectedPeriod === 'quarterly') {
      return 'Last 3 Months'
    } else if (selectedPeriod === 'yearly') {
      return `Year ${now.getFullYear()}`
    }
    return 'This Month'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-primary">Loading achievements...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-surface-light">
        <div className="w-full px-6 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary">
                My Achievements 🏆
              </h1>
              <p className="text-text-muted mt-2">Track your progress and compete with the best!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6 space-y-6">
        {/* Achievements Section */}
        {myData && (
          <AchievementBadges
            currentUtilization={myData.utilization ?? 0}
            averageUtilization={myData.utilization ?? 0}
            totalHours={myData.project ?? 0}
            menteeCount={0}
            historicalData={null}
          />
        )}

        {/* Leaderboard Section */}
        <div className="bg-surface border border-surface-light rounded-xl p-4 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Leaderboard</h2>
                <p className="text-sm text-text-muted">Top performers this period</p>
              </div>
            </div>
            
            {/* Period Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedPeriod('current')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === 'current'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-surface-light text-text-muted hover:bg-surface-light/80'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setSelectedPeriod('quarterly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === 'quarterly'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-surface-light text-text-muted hover:bg-surface-light/80'
                  }`}
                >
                  This Quarter
                </button>
                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === 'yearly'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-surface-light text-text-muted hover:bg-surface-light/80'
                  }`}
                >
                  This Year
                </button>
              </div>
              
              {/* Custom Month/Year Selector */}
              <div className="flex items-center gap-2 bg-surface-light px-3 py-2 rounded-lg border border-surface-light flex-wrap sm:flex-nowrap">
                <Calendar className="w-4 h-4 text-text-muted" />
                <select
                  value={customMonth}
                  onChange={(e) => setCustomMonth(Number(e.target.value))}
                  className="bg-transparent text-text-primary text-sm font-medium border-none outline-none cursor-pointer pr-2"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                <span className="text-text-muted">|</span>
                <select
                  value={customYear}
                  onChange={(e) => setCustomYear(Number(e.target.value))}
                  className="bg-transparent text-text-primary text-sm font-medium border-none outline-none cursor-pointer pr-2"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedPeriod('custom')}
                  className="ml-2 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap"
                >
                  Get Results
                </button>
              </div>
            </div>
          </div>

          {/* Selected Period Indicator */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg px-4 py-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm text-text-muted">Showing data for:</span>
              <span className="font-semibold text-text-primary">{getPeriodLabel()}</span>
            </div>
          </div>

          {/* Your Current Rank - Compact display */}
          {myRank > 0 && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={scrollToMyRank}
                className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg px-5 py-2.5 hover:border-primary transition-all hover:shadow-md cursor-pointer group"
                title="Click to scroll to your position"
              >
                <div className="text-sm text-text-muted">Your Rank:</div>
                {getRankIcon(myRank)}
                <div className="text-2xl font-bold text-text-primary group-hover:text-primary transition-colors">
                  #{myRank}
                </div>
                <div className="text-sm text-text-muted">of {leaderboard.length}</div>
              </button>
            </div>
          )}

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="mb-8 flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className={`w-32 h-40 bg-gradient-to-br ${getRankColor(2)} rounded-t-2xl border-4 border-white/20 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <Medal className="w-12 h-12 text-white mb-2 relative z-10" />
                  <div className="text-4xl font-bold text-white relative z-10">2</div>
                </div>
                <div className="mt-4 text-center">
                  <div className="font-bold text-text-primary">{leaderboard[1].name}</div>
                  <div className="text-sm text-text-muted">{leaderboard[1].utilization.toFixed(1)}%</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mb-6">
                <div className="animate-bounce-slow">
                  <Crown className="w-10 h-10 text-yellow-400 mb-2" />
                </div>
                <div className={`w-36 h-52 bg-gradient-to-br ${getRankColor(1)} rounded-t-2xl border-4 border-yellow-300/50 shadow-2xl shadow-yellow-500/30 flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent" />
                  <Trophy className="w-16 h-16 text-white mb-2 relative z-10 drop-shadow-lg" />
                  <div className="text-5xl font-bold text-white relative z-10">1</div>
                  <div className="absolute -top-2 -right-2 text-4xl">✨</div>
                  <div className="absolute -bottom-2 -left-2 text-4xl">🌟</div>
                </div>
                <div className="mt-4 text-center">
                  <div className="font-bold text-text-primary text-lg">{leaderboard[0].name}</div>
                  <div className="text-sm text-primary font-semibold">{leaderboard[0].utilization.toFixed(1)}%</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className={`w-32 h-32 bg-gradient-to-br ${getRankColor(3)} rounded-t-2xl border-4 border-white/20 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <Medal className="w-10 h-10 text-white mb-2 relative z-10" />
                  <div className="text-3xl font-bold text-white relative z-10">3</div>
                </div>
                <div className="mt-4 text-center">
                  <div className="font-bold text-text-primary">{leaderboard[2].name}</div>
                  <div className="text-sm text-text-muted">{leaderboard[2].utilization.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-background rounded-xl border border-surface-light overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-light text-sm font-semibold text-text-muted uppercase tracking-wide">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Employee</div>
              <div className="col-span-2">Utilization</div>
              <div className="col-span-2">Project Hours</div>
              <div className="col-span-2">Badge</div>
            </div>
            
            <div className="divide-y divide-surface-light">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.name === user?.employeeName
                
                return (
                  <div
                    key={entry.email}
                    ref={isCurrentUser ? myRowRef : null}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all ${
                      isCurrentUser 
                        ? 'bg-primary/10 border-l-4 border-primary shadow-lg' 
                        : 'hover:bg-surface/50'
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <div className="relative">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          entry.rank <= 3 
                            ? `bg-gradient-to-br ${getRankColor(entry.rank)} shadow-lg`
                            : 'bg-surface-light'
                        }`}>
                          {entry.rank <= 3 ? (
                            <span className="text-white font-bold">{entry.rank}</span>
                          ) : (
                            <span className="text-text-muted font-semibold">{entry.rank}</span>
                          )}
                        </div>
                        {entry.isTied && (
                          <span className="absolute -top-1 -right-1 text-[9px] font-bold text-amber-400 bg-surface border border-amber-400/40 rounded px-0.5 leading-tight">=</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {entry.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className={`font-semibold ${isCurrentUser ? 'text-primary' : 'text-text-primary'}`}>
                          {entry.name}
                          {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                        </div>
                        <div className="text-sm text-text-muted">{entry.email}</div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-2">
                        <div className={`text-xl font-bold ${
                          entry.utilization >= 90 ? 'text-green-500' :
                          entry.utilization >= 70 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {entry.utilization.toFixed(1)}%
                        </div>
                        {entry.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-text-primary">{entry.projectHours}h</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      {entry.badge === 'champion' && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                          <Crown className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-semibold text-purple-300">Champion</span>
                        </div>
                      )}
                      {entry.badge === 'star' && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-300">Star</span>
                        </div>
                      )}
                      {entry.badge === 'rising' && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-300">Rising Star</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Motivational Message */}
          {myRank > 0 && (
            <div className="mt-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <Zap className="w-12 h-12 text-primary" />
                <div>
                  <div className="font-bold text-lg text-text-primary mb-1">
                    {myRank === 1 ? "🎉 You're #1! Amazing work!" :
                     myRank <= 3 ? `🌟 You're in the top 3! Keep pushing!` :
                     myRank <= 10 ? `💪 You're in the top 10! You're doing great!` :
                     `🚀 Keep going! You're ranked #${myRank} - every step counts!`}
                  </div>
                  <div className="text-sm text-text-muted">
                    {myRank === 1 ? "You're leading the pack! Your hard work is truly inspiring." :
                     myRank <= 3 ? "Just a little more effort and the top spot could be yours!" :
                     myRank <= 10 ? "You're on the right track. Consistency is key!" :
                     `${leaderboard.length - myRank} positions to catch up. You've got this!`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
