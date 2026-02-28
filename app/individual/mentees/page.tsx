'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Users,
  Target,
  Calendar,
  Award,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { HistoricalUtilization } from '@/types/utilization'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import LastUpdated from '@/components/LastUpdated'
import UtilizationTrendChart from '@/components/charts/UtilizationTrendChart'
import PerformanceGauge from '@/components/charts/PerformanceGauge'
import HoursBreakdownChart from '@/components/charts/HoursBreakdownChart'
import ProgressTracker from '@/components/charts/ProgressTracker'
import PerformanceComparison from '@/components/charts/PerformanceComparison'
import MonthOnMonthComparison from '@/components/charts/MonthOnMonthComparison'
import AchievementBadges from '@/components/charts/AchievementBadges'

type TimeView = 'lastMonth' | 'last6Months' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'

// ------------------------------------------------------------------
// Fuzzy mentor name matching
// e.g. "Bala" matches "Balakrishna Cherukuri"
// ------------------------------------------------------------------
function isMentorMatch(
  mentorField: string | undefined | null,
  candidateName: string | undefined | null
): boolean {
  if (!mentorField || !candidateName) return false
  const normalize = (s: string) => s.toLowerCase().replace(/[.,]/g, '').trim()
  const m = normalize(mentorField)
  const c = normalize(candidateName)
  if (m === c) return true
  const cParts = c.split(/\s+/).filter(p => p.length > 1)
  const mParts = m.split(/\s+/).filter(p => p.length > 1)
  if (cParts.some(part => part.startsWith(m))) return true
  if (mParts.length > 0 && mParts.every(mp => cParts.some(cp => cp.startsWith(mp) || mp.startsWith(cp)))) return true
  return false
}

// ------------------------------------------------------------------
// Aggregate multiple weekly records into summed totals
// ------------------------------------------------------------------
function aggregateRecords(records: any[]) {
  if (records.length === 0) return null
  const t = records.reduce(
    (acc, r) => ({
      project: acc.project + (r.project || 0),
      pmn: acc.pmn + (r.pmn || 0),
      fringe: acc.fringe + (r.fringe || 0),
      wPresales: acc.wPresales + (r.wPresales || 0),
      fringeImpact: acc.fringeImpact + (r.fringeImpact || 0),
      utilization: acc.utilization + (r.utilization || 0),
      targetHours: acc.targetHours + (r.targetHours || 0),
      count: acc.count + 1,
    }),
    { project: 0, pmn: 0, fringe: 0, wPresales: 0, fringeImpact: 0, utilization: 0, targetHours: 0, count: 0 }
  )
  return { ...t, utilization: t.count > 0 ? t.utilization / t.count : 0 }
}

const QUARTER_MONTHS: Record<string, string[]> = {
  Q1: ['Jul', 'Aug', 'Sep'],
  Q2: ['Oct', 'Nov', 'Dec'],
  Q3: ['Jan', 'Feb', 'Mar'],
  Q4: ['Apr', 'May', 'Jun'],
}

export default function MenteeDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // ── Authoritative mentee list from employee_availability ──
  const [menteeNames, setMenteeNames] = useState<string[]>([])
  const [menteeProfileMap, setMenteeProfileMap] = useState<Map<string, any>>(new Map())

  // ── Monthly records filtered strictly to mentees from /api/monthly ──
  const [allMonthlyRecords, setAllMonthlyRecords] = useState<any[]>([])

  // Period selectors
  const [selectedFY, setSelectedFY] = useState<string>('')
  const [selectedQuarter, setSelectedQuarter] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [availableFYs, setAvailableFYs] = useState<string[]>([])
  const [availableQuarters, setAvailableQuarters] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])

  const [selectedView, setSelectedView] = useState<TimeView>('last6Months')
  const [expandedMentee, setExpandedMentee] = useState<string | null>(null)

  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'individual') { router.push('/login'); return }
    loadData()
    const refresh = () => loadData()
    window.addEventListener('utilizationDataUpdated', refresh)
    window.addEventListener('monthlyDataUpdated', refresh)
    return () => {
      window.removeEventListener('utilizationDataUpdated', refresh)
      window.removeEventListener('monthlyDataUpdated', refresh)
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!selectedFY || allMonthlyRecords.length === 0) return
    const quarters = Array.from(new Set(allMonthlyRecords.filter(r => r.financialYear === selectedFY).map(r => r.quarter))).sort() as string[]
    setAvailableQuarters(quarters)
    if (quarters.length > 0 && !quarters.includes(selectedQuarter)) setSelectedQuarter(quarters[quarters.length - 1])
  }, [selectedFY, allMonthlyRecords])

  useEffect(() => {
    if (!selectedFY || !selectedQuarter || allMonthlyRecords.length === 0) return
    const months = Array.from(new Set(allMonthlyRecords.filter(r => r.financialYear === selectedFY && r.quarter === selectedQuarter).map(r => r.month))) as string[]
    setAvailableMonths(months)
    if (months.length > 0 && !months.includes(selectedMonth)) setSelectedMonth(months[months.length - 1])
  }, [selectedFY, selectedQuarter, allMonthlyRecords])

  // ------------------------------------------------------------------
  const loadData = async () => {
    setLoading(true)
    try {
      const candidateName = user?.employeeName || user?.name
      if (!candidateName) { setLoading(false); return }

      // Step 1 – Authoritative mentor-mentee from employee_availability
      const rr = await fetch('/api/reports')
      const rd = await rr.json()
      const foundNames: string[] = []
      const profileMap = new Map<string, any>()
      if (rd.success && rd.data?.length > 0) {
        rd.data.forEach((r: any) => {
          if (isMentorMatch(r.mentor, candidateName)) {
            const n = (r.name || '').trim()
            if (n) { foundNames.push(n); profileMap.set(n.toLowerCase(), r) }
          }
        })
      }
      setMenteeNames(foundNames)
      setMenteeProfileMap(profileMap)
      console.log(`[Mentees] "${candidateName}" → mentees:`, foundNames)
      if (foundNames.length === 0) { setLoading(false); return }

      // Step 2 – Utilization data from monthly_utilization, filtered to mentees
      const mr = await fetch('/api/monthly')
      const md = await mr.json()
      if (md.success && md.data?.length > 0) {
        const namesLower = new Set(foundNames.map(n => n.toLowerCase()))
        const menteeRecords = md.data.filter((r: any) => namesLower.has((r.name || '').toLowerCase().trim()))
        setAllMonthlyRecords(menteeRecords)

        // Step 3 – Populate period selectors from mentee records only
        const fys = (Array.from(new Set(menteeRecords.map((r: any) => r.financialYear))) as string[]).sort().reverse()
        setAvailableFYs(fys)
        if (fys.length > 0) {
          const latestFY = fys[0]
          setSelectedFY(latestFY)
          const quarters = Array.from(new Set(menteeRecords.filter((r: any) => r.financialYear === latestFY).map((r: any) => r.quarter))).sort() as string[]
          setAvailableQuarters(quarters)
          if (quarters.length > 0) {
            const latestQ = quarters[quarters.length - 1]
            setSelectedQuarter(latestQ)
            const months = Array.from(new Set(menteeRecords.filter((r: any) => r.financialYear === latestFY && r.quarter === latestQ).map((r: any) => r.month))) as string[]
            setAvailableMonths(months)
            if (months.length > 0) setSelectedMonth(months[months.length - 1])
          }
        }
        if (md.metadata) setLastUpdated(md.metadata.uploadedAt || md.metadata.lastUpdated || null)
      } else {
        setAllMonthlyRecords([])
      }
    } catch (err) {
      console.error('[Mentees] load error:', err)
      setAllMonthlyRecords([])
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // Per-mentee aggregated display data for the selected period
  // Mirrors individual/page.tsx selectedMonth aggregation
  // ------------------------------------------------------------------
  const menteeDisplayData = useMemo(() => {
    return menteeNames.map(menteeName => {
      const profile = menteeProfileMap.get(menteeName.toLowerCase())
      const myRecords = allMonthlyRecords.filter(r => (r.name || '').toLowerCase().trim() === menteeName.toLowerCase().trim())
      const latestRecord = [...myRecords].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())[0]

      let periodRecords = myRecords
      if (selectedMonth && selectedFY) {
        periodRecords = myRecords.filter(r => r.month === selectedMonth && r.financialYear === selectedFY)
      } else if (selectedQuarter && selectedFY) {
        periodRecords = myRecords.filter(r => r.quarter === selectedQuarter && r.financialYear === selectedFY)
      } else if (selectedFY) {
        periodRecords = myRecords.filter(r => r.financialYear === selectedFY)
      }

      const agg = aggregateRecords(periodRecords) || aggregateRecords(latestRecord ? [latestRecord] : [])
      return {
        id: menteeName,
        name: menteeName,
        email: latestRecord?.userEmail || latestRecord?.email || profile?.email || '',
        title: latestRecord?.title || profile?.role || '',
        targetHours: agg?.targetHours ?? 0,
        project: agg?.project ?? 0,
        pmn: agg?.pmn ?? 0,
        utilization: agg?.utilization ?? 0,
        fringeImpact: agg?.fringeImpact ?? 0,
        fringe: agg?.fringe ?? 0,
        wPresales: agg?.wPresales ?? 0,
        mentor: latestRecord?.mentor || profile?.mentor,
        hasData: myRecords.length > 0,
        periodLabel: selectedMonth && selectedFY ? `${selectedMonth} ${selectedFY}` : selectedQuarter && selectedFY ? `${selectedQuarter} ${selectedFY}` : selectedFY || 'All time',
      }
    })
  }, [menteeNames, menteeProfileMap, allMonthlyRecords, selectedMonth, selectedFY, selectedQuarter])

  // ------------------------------------------------------------------
  // Per-mentee monthly historical data for trend charts
  // Aggregates multiple weekly uploads into one point per month
  // ------------------------------------------------------------------
  const menteeHistoricalMap = useMemo(() => {
    const result: Record<string, HistoricalUtilization[]> = {}
    menteeNames.forEach(menteeName => {
      const myRecords = allMonthlyRecords.filter(r => (r.name || '').toLowerCase().trim() === menteeName.toLowerCase().trim())
      if (myRecords.length === 0) return
      const groups = new Map<string, any[]>()
      myRecords.forEach(r => {
        const key = `${r.month} ${r.financialYear}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(r)
      })
      result[menteeName] = Array.from(groups.entries()).map(([period, recs]) => {
        const agg = aggregateRecords(recs)!
        return { period, utilization: agg.utilization, targetHours: agg.targetHours, projectHours: agg.project, date: recs[0].date } as HistoricalUtilization
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })
    return result
  }, [menteeNames, allMonthlyRecords])

  function getMenteeTrendData(menteeName: string): HistoricalUtilization[] {
    const points = menteeHistoricalMap[menteeName] || []
    if (points.length === 0) return []
    switch (selectedView) {
      case 'lastMonth':
        return [...points].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 1)
      case 'last6Months': {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6)
        return points.filter(p => new Date(p.date) >= cutoff)
      }
      case 'Q1': case 'Q2': case 'Q3': case 'Q4': {
        const targetFY = selectedFY || availableFYs[0] || ''
        const qMonths = QUARTER_MONTHS[selectedView]
        return points.filter(p => { const [month, fy] = p.period.trim().split(' '); return qMonths.includes(month) && fy === targetFY })
      }
      case 'annual': {
        const targetFY = selectedFY || availableFYs[0] || ''
        return points.filter(p => p.period.trim().split(' ')[1] === targetFY)
      }
      default: return points
    }
  }

  const getUtilizationColor = (u: number) => u >= 90 ? 'text-success' : u >= 70 ? 'text-warning' : 'text-danger'

  const timeViewOptions: { value: TimeView; label: string }[] = [
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'Q1', label: 'Q1' }, { value: 'Q2', label: 'Q2' },
    { value: 'Q3', label: 'Q3' }, { value: 'Q4', label: 'Q4' },
    { value: 'annual', label: 'Annual' },
  ]

  if (loading) return <LoadingSkeleton />

  if (menteeNames.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="bg-surface border border-surface-light rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No Mentees Found</h2>
          <p className="text-text-muted">You don't have any mentees assigned to you yet.</p>
        </div>
      </div>
    )
  }

  const avgUtil = menteeDisplayData.length > 0 ? menteeDisplayData.reduce((s, m) => s + m.utilization, 0) / menteeDisplayData.length : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-surface-light">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">My Mentee Dashboard 👥</h1>
                <p className="text-text-muted mt-1">Utilization data from uploaded weekly/monthly reports</p>
              </div>
            </div>
            <LastUpdated timestamp={lastUpdated} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Total Mentees', value: menteeNames.length, color: 'text-text-primary' },
              { icon: Zap, label: 'Avg Utilization', value: `${avgUtil.toFixed(1)}%`, color: getUtilizationColor(avgUtil) },
              { icon: Target, label: 'High Performers', value: menteeDisplayData.filter(m => m.utilization >= 90).length, color: 'text-success' },
              { icon: Award, label: 'Needs Attention', value: menteeDisplayData.filter(m => m.utilization < 70 && m.hasData).length, color: 'text-danger' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-surface/50 backdrop-blur-sm border border-surface-light rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-text-muted">{label}</span>
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6 space-y-6">
        {/* Period Selectors */}
        <div className="bg-surface/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-surface-light">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />Select Period
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Financial Year', value: selectedFY, onChange: (v: string) => setSelectedFY(v), options: availableFYs, disabled: false },
              { label: 'Quarter', value: selectedQuarter, onChange: (v: string) => setSelectedQuarter(v), options: availableQuarters, disabled: !selectedFY },
              { label: 'Month', value: selectedMonth, onChange: (v: string) => setSelectedMonth(v), options: availableMonths, disabled: !selectedQuarter },
            ].map(({ label, value, onChange, options, disabled }) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>
                <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                  className="w-full px-4 py-3 bg-surface border-2 border-surface-light rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-text-primary">
                  <option value="">All {label}s</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          {(selectedFY || selectedQuarter || selectedMonth) && (
            <div className="mt-4 p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl border-2 border-primary/30 text-sm font-medium text-text-primary flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Viewing: {selectedMonth || 'All Months'}{selectedQuarter && ` • ${selectedQuarter}`}{selectedFY && ` • ${selectedFY}`}
            </div>
          )}
        </div>

        {/* View tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />Mentee Performance Analytics
          </h2>
          <div className="flex flex-wrap gap-2">
            {timeViewOptions.map(opt => (
              <button key={opt.value} onClick={() => setSelectedView(opt.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${selectedView === opt.value ? 'bg-primary text-white shadow-lg' : 'bg-surface border border-surface-light text-text-secondary hover:bg-surface-light'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mentee Cards */}
        <div className="space-y-4">
          {menteeDisplayData.map(mentee => {
            const isExpanded = expandedMentee === mentee.name
            const trendData = getMenteeTrendData(mentee.name)
            const periodMetrics = trendData.length > 0 ? {
              avgUtil: trendData.reduce((s, d) => s + d.utilization, 0) / trendData.length,
              totalProjectHours: trendData.reduce((s, d) => s + d.projectHours, 0),
              totalTargetHours: trendData.reduce((s, d) => s + d.targetHours, 0),
            } : null

            return (
              <div key={mentee.id} className="bg-surface border border-surface-light rounded-xl overflow-hidden">
                <div className="p-6 cursor-pointer hover:bg-surface-light/50 transition-colors" onClick={() => setExpandedMentee(isExpanded ? null : mentee.name)}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{mentee.name}</h3>
                        <p className="text-sm text-text-muted">{mentee.title || 'Employee'}</p>
                        {!mentee.hasData && <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full mt-1 inline-block">No utilization uploaded yet</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Utilization</p>
                        <p className={`text-xl font-bold ${getUtilizationColor(mentee.utilization)}`}>{mentee.utilization.toFixed(1)}%</p>
                        <p className="text-xs text-text-muted">{mentee.periodLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Project Hours</p>
                        <p className="text-xl font-bold text-text-primary">{mentee.project.toFixed(0)}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Target</p>
                        <p className="text-xl font-bold text-text-primary">{mentee.targetHours.toFixed(0)}h</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-6 h-6 text-text-muted" /> : <ChevronDown className="w-6 h-6 text-text-muted" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-light p-6 space-y-6 bg-background/50">
                    {mentee.hasData ? (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="bg-surface border border-surface-light rounded-xl p-6 flex items-center justify-center">
                            <PerformanceGauge
                              value={periodMetrics?.avgUtil ?? mentee.utilization}
                              label={selectedView === 'lastMonth' ? 'Last Month' : selectedView === 'last6Months' ? 'Last 6 Months Avg' : selectedView === 'annual' ? 'Annual Performance' : `${selectedView} Performance`}
                            />
                          </div>
                          <div className="lg:col-span-2">
                            <HoursBreakdownChart
                              targetHours={periodMetrics?.totalTargetHours ?? mentee.targetHours}
                              projectHours={periodMetrics?.totalProjectHours ?? mentee.project}
                              fringe={mentee.fringe}
                            />
                          </div>
                        </div>

                        {trendData.length > 0 && (
                          <UtilizationTrendChart
                            data={trendData}
                            title={`${mentee.name} — ${selectedView === 'lastMonth' ? 'Last Month' : selectedView === 'last6Months' ? 'Last 6 Months' : selectedView === 'annual' ? 'Annual' : selectedView} Utilization Trend`}
                            selectedFY={selectedFY}
                          />
                        )}

                        {trendData.length >= 2 && (
                          <>
                            <PerformanceComparison metrics={[
                              { label: 'Utilization %', current: trendData[trendData.length - 1].utilization, previous: trendData[trendData.length - 2].utilization, unit: '%' },
                              { label: 'Project Hours', current: trendData[trendData.length - 1].projectHours, previous: trendData[trendData.length - 2].projectHours, unit: 'h' },
                            ]} />
                            <MonthOnMonthComparison data={trendData} />
                          </>
                        )}

                        <ProgressTracker milestones={[
                          { label: 'Project Hours', value: mentee.project, target: mentee.targetHours, unit: 'hours', icon: Target },
                          { label: 'Utilization Goal', value: mentee.utilization, target: 100, unit: '%', icon: Award },
                        ]} />

                        <AchievementBadges
                          currentUtilization={mentee.utilization}
                          averageUtilization={trendData.length > 0 ? trendData.reduce((s, d) => s + d.utilization, 0) / trendData.length : mentee.utilization}
                          totalHours={mentee.project}
                          menteeCount={0}
                          historicalData={trendData}
                        />
                      </>
                    ) : (
                      <div className="text-center py-8 text-text-muted">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No utilization data uploaded yet</p>
                        <p className="text-sm mt-1">Data will appear once their weekly/monthly report is uploaded.</p>
                      </div>
                    )}

                    <div className="bg-surface border border-surface-light rounded-xl p-6">
                      <h4 className="text-lg font-bold text-text-primary mb-4">Profile Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div><label className="text-sm text-text-muted">Name</label><p className="text-text-primary font-medium mt-1">{mentee.name}</p></div>
                        <div><label className="text-sm text-text-muted">Title</label><p className="text-text-primary font-medium mt-1">{mentee.title || '—'}</p></div>
                        <div><label className="text-sm text-text-muted">Email</label><p className="text-text-primary font-medium mt-1">{mentee.email || '—'}</p></div>
                        <div><label className="text-sm text-text-muted">Fringe Hours</label><p className="text-text-primary font-medium mt-1">{mentee.fringe.toFixed(1)}h</p></div>
                        <div><label className="text-sm text-text-muted">W/Presales</label><p className="text-text-primary font-medium mt-1">{mentee.wPresales.toFixed(2)}%</p></div>
                        <div><label className="text-sm text-text-muted">Mentor</label><p className="text-text-primary font-medium mt-1">{user?.employeeName || user?.name || '—'}</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
