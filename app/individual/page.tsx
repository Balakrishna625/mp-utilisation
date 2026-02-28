'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Upload, 
  Target,
  Calendar,
  Clock,
  Zap,
  Star,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { EmployeeUtilization, EmployeeHistoricalData } from '@/types/utilization'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import LastUpdated from '@/components/LastUpdated'
import UtilizationTrendChart from '@/components/charts/UtilizationTrendChart'
import PerformanceGauge from '@/components/charts/PerformanceGauge'
import HoursBreakdownChart from '@/components/charts/HoursBreakdownChart'
import QuickActions from '@/components/charts/QuickActions'
import InteractiveTooltip from '@/components/charts/InteractiveTooltip'
import { FringeTracker } from '@/components/FringeTracker'

type TimeView = 'lastMonth' | 'last6Months' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'
type DataView = 'weekly' | 'monthly'

export default function EnhancedIndividualDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<EmployeeUtilization[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<TimeView>('last6Months')
  const [historicalData, setHistoricalData] = useState<EmployeeHistoricalData | null>(null)
  
  // View mode toggle: weekly shows individual weeks, monthly shows aggregated averages
  const [dataView, setDataView] = useState<DataView>('monthly')
  
  // New selectors for FY/Quarter/Month
  const [selectedFY, setSelectedFY] = useState<string>('')
  const [selectedQuarter, setSelectedQuarter] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [availableFYs, setAvailableFYs] = useState<string[]>([])
  const [availableQuarters, setAvailableQuarters] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [allMonthlyRecords, setAllMonthlyRecords] = useState<any[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!user?.email && !user?.employeeName) {
        console.log('⚠️ No user email or employeeName available')
        setLoading(false)
        return
      }

      // Fetch data from database API
      const response = await fetch('/api/monthly')
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('📊 Fetched monthly data from database:', {
          totalRecords: result.data.length,
          userEmail: user.email,
          userName: user.employeeName
        })

        // Filter records for this specific user (by email or name)
        const userRecords = result.data.filter((record: any) => {
          const emailMatch = user.email && (
            record.userEmail?.toLowerCase() === user.email.toLowerCase() ||
            record.email?.toLowerCase() === user.email.toLowerCase() ||
            record.name?.toLowerCase() === user.email.split('@')[0].toLowerCase()
          )
          const nameMatch = user.employeeName && (
            record.name?.toLowerCase() === user.employeeName.toLowerCase() ||
            record.employeeName?.toLowerCase() === user.employeeName.toLowerCase()
          )
          return emailMatch || nameMatch
        })

        console.log('🔍 Filtered user records:', {
          totalRecords: result.data.length,
          userRecords: userRecords.length,
          sample: userRecords[0] ? {
            name: userRecords[0].name,
            email: userRecords[0].userEmail,
            month: userRecords[0].month,
            fy: userRecords[0].financialYear
          } : null
        })

        if (userRecords.length > 0) {
          // Store all monthly records for the user
          setAllMonthlyRecords(userRecords)
          
          // Get unique FYs, sorted
          const fySet = new Set<string>()
          userRecords.forEach((r: any) => {
            if (r.financialYear) fySet.add(r.financialYear)
          })
          const fys = Array.from(fySet).sort().reverse()
          setAvailableFYs(fys)
          
          // Set default FY to most recent
          if (fys.length > 0 && !selectedFY) {
            const latestFY = fys[0]
            setSelectedFY(latestFY)
            
            // Get quarters for latest FY
            const quarterSet = new Set<string>()
            userRecords
              .filter((r: any) => r.financialYear === latestFY)
              .forEach((r: any) => { if (r.quarter) quarterSet.add(r.quarter) })
            const quarters = Array.from(quarterSet).sort()
            setAvailableQuarters(quarters)
            
            if (quarters.length > 0 && !selectedQuarter) {
              const latestQuarter = quarters[quarters.length - 1]
              setSelectedQuarter(latestQuarter)
              
              // Get months for latest quarter
              const monthSet = new Set<string>()
              userRecords
                .filter((r: any) => r.financialYear === latestFY && r.quarter === latestQuarter)
                .forEach((r: any) => { if (r.month) monthSet.add(r.month) })
              const months = Array.from(monthSet)
              setAvailableMonths(months)
              
              if (months.length > 0 && !selectedMonth) {
                setSelectedMonth(months[months.length - 1])
              }
            }
          }
          
          // Get the most recent record for current display
          const latestRecord = userRecords.sort((a: any, b: any) => 
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          )[0]
          
          // Convert to EmployeeUtilization format
          const employeeData: EmployeeUtilization = {
            id: latestRecord.id,
            name: latestRecord.name,
            email: latestRecord.userEmail || latestRecord.email,
            title: latestRecord.title,
            targetHours: latestRecord.targetHours,
            project: latestRecord.project,
            pmn: latestRecord.pmn,
            utilization: latestRecord.utilization,
            fringeImpact: latestRecord.fringeImpact,
            fringe: latestRecord.fringe,
            wPresales: latestRecord.wPresales,
            mentor: latestRecord.mentor
          }
          
          // Get all employees from the database (for mentee filtering)
          const allEmployees = result.data.map((record: any) => ({
            id: record.id,
            name: record.name,
            email: record.userEmail || record.email,
            title: record.title,
            targetHours: record.targetHours,
            project: record.project,
            pmn: record.pmn,
            utilization: record.utilization,
            fringeImpact: record.fringeImpact,
            fringe: record.fringe,
            wPresales: record.wPresales,
            mentor: record.mentor
          }))
          
          setData(allEmployees)
          
          // Build historical data from user records
          // Keep original weekly data for weekly view
          const historicalDataPoints = userRecords.map((record: any) => ({
            month: record.month,
            year: new Date(record.date).getFullYear(),
            targetHours: record.targetHours,
            project: record.project,
            utilization: record.utilization,
            fringe: record.fringe,
            date: record.date,
            periodType: record.periodType,
            fromDate: record.fromDate,
            toDate: record.toDate,
            financialYear: record.financialYear,
            quarter: record.quarter
          })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          
          if (historicalDataPoints.length > 0) {
            setHistoricalData({
              employeeName: latestRecord.name,
              data: historicalDataPoints
            })
          }
          
          // Set metadata
          if (result.metadata) {
            setLastUpdated(result.metadata.uploadedAt || result.metadata.lastUpdated || null)
          }
        } else {
          console.log('⚠️ No records found for user:', { email: user.email, name: user.employeeName })
          setData([])
          setAllMonthlyRecords([])
          setHistoricalData(null)
        }
      } else {
        console.log('⚠️ No data available from API')
        setData([])
        setAllMonthlyRecords([])
        setHistoricalData(null)
      }
    } catch (error) {
      console.error('❌ Failed to load data from database:', error)
      setData([])
      setAllMonthlyRecords([])
      setHistoricalData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'individual') {
      router.push('/login')
      return
    }
    
    // loadData is now async
    loadData()

    const handleDataUpdate = () => {
      loadData()
    }
    
    window.addEventListener('utilizationDataUpdated', handleDataUpdate)
    window.addEventListener('monthlyDataUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('utilizationDataUpdated', handleDataUpdate)
      window.removeEventListener('monthlyDataUpdated', handleDataUpdate)
    }
  }, [isAuthenticated, user, router])

  // Update available quarters when FY changes
  useEffect(() => {
    if (selectedFY && allMonthlyRecords.length > 0) {
      // Get quarters from filtered records for selected FY
      const quarterSet = new Set<string>()
      allMonthlyRecords
        .filter((r: any) => r.financialYear === selectedFY)
        .forEach((r: any) => { if (r.quarter) quarterSet.add(r.quarter) })
      const quarters = Array.from(quarterSet).sort()
      
      setAvailableQuarters(quarters)
      if (quarters.length > 0 && !quarters.includes(selectedQuarter)) {
        setSelectedQuarter(quarters[quarters.length - 1])
      }
    }
  }, [selectedFY, allMonthlyRecords])

  // Update available months when quarter changes
  useEffect(() => {
    if (selectedFY && selectedQuarter && allMonthlyRecords.length > 0) {
      // Get months from filtered records for selected FY and quarter
      const monthSet = new Set<string>()
      allMonthlyRecords
        .filter((r: any) => r.financialYear === selectedFY && r.quarter === selectedQuarter)
        .forEach((r: any) => { if (r.month) monthSet.add(r.month) })
      const months = Array.from(monthSet)
      
      setAvailableMonths(months)
      if (months.length > 0 && !months.includes(selectedMonth)) {
        setSelectedMonth(months[months.length - 1])
      }
    }
  }, [selectedFY, selectedQuarter, allMonthlyRecords])

  // Filter data for individual user
  const { myData, menteeData } = useMemo(() => {
    if (!user?.employeeName) {
      return { myData: null, menteeData: [] }
    }

    // If a specific month is selected, show that month's data
    let myData = data.find(emp => emp.name === user.employeeName) || null
    
    console.log('🔍 DEBUG - myData Initial (from data array):', {
      employeeName: user.employeeName,
      foundInData: !!myData,
      targetHours: myData?.targetHours,
      project: myData?.project,
      utilization: myData?.utilization,
      fringe: myData?.fringe,
      dataArrayLength: data.length,
      dataArrayNames: data.map(d => d.name)
    })
    
    if (selectedMonth && selectedFY) {
      console.log('🔍 DEBUG - Attempting month override:', { 
        selectedMonth, 
        selectedFY,
        allMonthlyRecordsCount: allMonthlyRecords.length,
        allMonthlyRecords: allMonthlyRecords.map(r => ({ 
          month: r.month, 
          fy: r.financialYear, 
          name: r.name,
          target: r.targetHours,
          project: r.project
        }))
      })
      
      // Get all records for the selected month (could be multiple weekly records)
      const monthRecords = allMonthlyRecords.filter(
        record => record.month === selectedMonth && record.financialYear === selectedFY
      )
      
      console.log('🔍 DEBUG - Month records found:', {
        count: monthRecords.length,
        month: selectedMonth,
        fy: selectedFY,
        records: monthRecords.map(r => ({ 
          targetHours: r.targetHours, 
          project: r.project, 
          utilization: r.utilization,
          fringe: r.fringe,
          fromDate: r.fromDate,
          toDate: r.toDate
        }))
      })
      
      if (monthRecords.length > 0) {
        // Aggregate all weekly records for this month (sum hours, average utilization)
        const aggregated = monthRecords.reduce((acc, record) => ({
          project: acc.project + (record.project || 0),
          pmn: acc.pmn + (record.pmn || 0),
          fringe: acc.fringe + (record.fringe || 0),
          wPresales: acc.wPresales + (record.wPresales || 0),
          fringeImpact: acc.fringeImpact + (record.fringeImpact || 0),
          utilization: acc.utilization + (record.utilization || 0),
          targetHours: acc.targetHours + (record.targetHours || 0),
          count: acc.count + 1
        }), { 
          project: 0, 
          pmn: 0, 
          fringe: 0, 
          wPresales: 0, 
          fringeImpact: 0, 
          utilization: 0,
          targetHours: 0,
          count: 0
        })
        
        const firstRecord = monthRecords[0]
        myData = {
          id: user.employeeName,
          name: user.employeeName,
          email: firstRecord.email || myData?.email || '',
          title: firstRecord.title || myData?.title || '',
          targetHours: aggregated.targetHours,
          utilization: aggregated.utilization / aggregated.count, // Average utilization
          project: aggregated.project,
          pmn: aggregated.pmn,
          fringeImpact: aggregated.fringeImpact,
          fringe: aggregated.fringe,
          wPresales: aggregated.wPresales,
          mentor: firstRecord.mentor || myData?.mentor || ''
        }
      } else {
        // No data for this specific month - set to null to show "no data" message
        myData = null
      }
    }
    
    console.log('🔍 DEBUG - Final myData:', {
      targetHours: myData?.targetHours,
      project: myData?.project,
      utilization: myData?.utilization,
      fringe: myData?.fringe,
      name: myData?.name
    })

    const menteeData = data.filter(emp => emp.mentor === user.employeeName)

    return { myData, menteeData }
  }, [data, user, selectedMonth, selectedFY, allMonthlyRecords])

  // Convert all monthly records to HistoricalUtilization format for quarterly trend chart
  // Aggregate multiple weekly records for the same month
  const allMonthlyHistoricalData = useMemo(() => {
    // Group records by month+FY
    const monthlyGroups = new Map<string, any[]>()
    
    allMonthlyRecords.forEach(record => {
      const key = `${record.month} ${record.financialYear}`
      if (!monthlyGroups.has(key)) {
        monthlyGroups.set(key, [])
      }
      monthlyGroups.get(key)!.push(record)
    })
    
    // Aggregate each group
    return Array.from(monthlyGroups.entries()).map(([period, records]) => {
      const aggregated = records.reduce((acc, record) => ({
        targetHours: acc.targetHours + (record.targetHours || 0),
        projectHours: acc.projectHours + (record.project || 0),
        fringe: acc.fringe + (record.fringe || 0),
        utilization: acc.utilization + (record.utilization || 0),
        count: acc.count + 1
      }), { targetHours: 0, projectHours: 0, fringe: 0, utilization: 0, count: 0 })
      
      return {
        period,
        utilization: aggregated.utilization / aggregated.count, // Average utilization
        targetHours: aggregated.targetHours,
        projectHours: aggregated.projectHours,
        fringe: aggregated.fringe,
        date: records[0].date // Use first record's date for sorting
      }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [allMonthlyRecords])

  // Get current period data based on selected view and filters
  const currentPeriodData = useMemo(() => {
    console.log('🔄 RECALCULATING currentPeriodData:', {
      selectedView,
      selectedFY,
      totalMonthlyData: allMonthlyHistoricalData.length
    })
    
    if (allMonthlyHistoricalData.length === 0) {
      console.warn('⚠️ No monthly historical data available')
      return null
    }
    
    // Map views to actual uploaded data
    let periodData: any[] = []
    
    switch(selectedView) {
      case 'lastMonth':
        // Most recent month only
        const sorted = [...allMonthlyHistoricalData].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        periodData = sorted.slice(0, 1)
        console.log('📅 Last Month:', periodData.map(d => d.period))
        break
      case 'last6Months':
        // Last 6 months
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        periodData = allMonthlyHistoricalData.filter(record => 
          new Date(record.date) >= sixMonthsAgo
        )
        console.log('📅 Last 6 Months:', periodData.map(d => d.period))
        break
      case 'Q1':
      case 'Q2':
      case 'Q3':
      case 'Q4':
        // For quarterly view, get individual monthly records for that quarter
        // Financial Year Quarters: Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
        const quarterMonths = {
          'Q1': ['Jul', 'Aug', 'Sep'],
          'Q2': ['Oct', 'Nov', 'Dec'],
          'Q3': ['Jan', 'Feb', 'Mar'],
          'Q4': ['Apr', 'May', 'Jun']
        }
        
        const monthsInQuarter = quarterMonths[selectedView as 'Q1' | 'Q2' | 'Q3' | 'Q4']
        
        // Use selected FY from dropdown, or default to most recent
        const targetFY = selectedFY || (availableFYs.length > 0 ? availableFYs[0] : '')
        
        console.log(`🔍 Filtering ${selectedView} for FY: ${targetFY}`)
        console.log(`   Looking for months: ${monthsInQuarter.join(', ')}`)
        console.log(`   Available data:`, allMonthlyHistoricalData.map(d => d.period))
        
        periodData = allMonthlyHistoricalData.filter(record => {
          // Extract month name and FY from period (format: "Jan FY25")
          const parts = record.period.trim().split(' ')
          const monthName = parts[0]
          const recordFY = parts[1] // e.g., "FY25"
          
          // Only filter by: 1) Quarter months, 2) Selected FY
          const isCorrectMonth = monthsInQuarter.includes(monthName)
          const isCorrectFY = recordFY === targetFY
          
          console.log(`   Checking ${record.period}: month=${isCorrectMonth}, FY=${isCorrectFY}`)
          
          return isCorrectMonth && isCorrectFY
        })
        
        console.log(`✅ Found ${periodData.length} months for ${selectedView} ${targetFY}:`, 
          periodData.map(r => `${r.period}: ${r.projectHours}h/${r.targetHours}h (${r.utilization}%)`)
        )
        
        break
      case 'annual':
        // All records for selected FY
        const annualFY = selectedFY || (availableFYs.length > 0 ? availableFYs[0] : '')
        periodData = allMonthlyHistoricalData.filter(record => {
          const parts = record.period.trim().split(' ')
          const recordFY = parts[1]
          return recordFY === annualFY
        })
        console.log('📅 Annual:', periodData.map(d => d.period))
        break
      default:
        periodData = allMonthlyHistoricalData
    }
    
    console.log(`📊 Final Period Data for ${selectedView}:`, {
      count: periodData.length,
      periods: periodData.map(d => d.period),
      data: periodData
    })
    
    return periodData.length > 0 ? periodData : null
  }, [allMonthlyHistoricalData, selectedView, selectedFY, availableFYs])

  // Calculate performance metrics for selected period
  const performanceMetrics = useMemo(() => {
    console.log('🧮 CALCULATING performanceMetrics:', {
      selectedView,
      currentPeriodDataExists: !!currentPeriodData,
      dataPointsCount: currentPeriodData?.length || 0
    })
    
    if (!currentPeriodData || currentPeriodData.length === 0) {
      console.warn(`⚠️ No data available for ${selectedView} - returning NULL`)
      return null
    }

    const avgUtil = currentPeriodData.reduce((sum, d) => sum + d.utilization, 0) / currentPeriodData.length
    const totalProjectHours = currentPeriodData.reduce((sum, d) => sum + d.projectHours, 0)
    const totalTargetHours = currentPeriodData.reduce((sum, d) => sum + d.targetHours, 0)
    
    console.log('📊 Performance Metrics Calculation:', {
      view: selectedView,
      dataPoints: currentPeriodData.length,
      monthsIncluded: currentPeriodData.map(d => d.period),
      individualRecords: currentPeriodData.map(d => ({
        period: d.period,
        target: d.targetHours,
        project: d.projectHours,
        util: d.utilization
      })),
      TOTALS: {
        avgUtil: avgUtil.toFixed(2) + '%',
        totalProjectHours: totalProjectHours + 'h',
        totalTargetHours: totalTargetHours + 'h',
      }
    })
    
    // Calculate fringe hours from the monthly records based on the selected period
    let totalFringeHours = 0
    if (allMonthlyRecords.length > 0) {
      // Filter monthly records based on the selected period
      const periodRecords = allMonthlyRecords.filter(record => {
        if (selectedView === 'lastMonth') {
          // Get only the most recent month
          const sorted = [...allMonthlyRecords].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          return sorted[0] && record.date === sorted[0].date
        } else if (selectedView === 'last6Months') {
          // Get records from last 6 months
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          return new Date(record.date) >= sixMonthsAgo
        } else if (['Q1', 'Q2', 'Q3', 'Q4'].includes(selectedView)) {
          // Filter by quarter and FY (Financial Year: Q1=Jul-Sep, Q2=Oct-Dec, Q3=Jan-Mar, Q4=Apr-Jun)
          const quarterMonths = {
            'Q1': ['Jul', 'Aug', 'Sep'],
            'Q2': ['Oct', 'Nov', 'Dec'],
            'Q3': ['Jan', 'Feb', 'Mar'],
            'Q4': ['Apr', 'May', 'Jun']
          }
          const monthsInQuarter = quarterMonths[selectedView as 'Q1' | 'Q2' | 'Q3' | 'Q4']
          const targetFY = selectedFY || (availableFYs.length > 0 ? availableFYs[0] : '')
          return monthsInQuarter.includes(record.month) && record.financialYear === targetFY
        } else if (selectedView === 'annual') {
          // All records for the selected FY or all if no FY selected
          const targetFY = selectedFY || (availableFYs.length > 0 ? availableFYs[0] : '')
          return record.financialYear === targetFY
        }
        return true
      })
      totalFringeHours = periodRecords.reduce((sum, r) => sum + (r.fringe || 0), 0)
    }
    
    const trend = currentPeriodData.length >= 2 
      ? currentPeriodData[currentPeriodData.length - 1].utilization - currentPeriodData[0].utilization
      : 0
    
    return {
      average: avgUtil,
      totalProjectHours,
      totalTargetHours,
      totalFringeHours,
      trend: trend > 2 ? 'up' : trend < -2 ? 'down' : 'stable',
      trendPercentage: Math.abs(trend),
      totalHours: totalProjectHours,
    }
  }, [currentPeriodData, allMonthlyRecords, selectedView, selectedFY, availableFYs])

  // Helper functions
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-success'
    if (utilization >= 70) return 'text-warning'
    return 'text-danger'
  }

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-success/10'
    if (utilization >= 70) return 'bg-warning/10'
    return 'bg-danger/10'
  }

  const timeViewOptions = [
    { value: 'lastMonth' as TimeView, label: 'Last Month' },
    { value: 'last6Months' as TimeView, label: 'Last 6 Months' },
    { value: 'Q1' as TimeView, label: 'Q1' },
    { value: 'Q2' as TimeView, label: 'Q2' },
    { value: 'Q3' as TimeView, label: 'Q3' },
    { value: 'Q4' as TimeView, label: 'Q4' },
    { value: 'annual' as TimeView, label: 'Annual' },
  ]

  // Early returns
  if (loading) {
    return <LoadingSkeleton />
  }

  if (!myData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface border border-surface-light rounded-xl p-12 text-center">
            <Upload className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">No Data Available</h2>
            <p className="text-text-muted">
              No utilization data found for your profile. Please contact your manager.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-surface-light">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Welcome back, {user?.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-text-muted mt-1">Here's your performance overview</p>
              </div>
            </div>
            <LastUpdated timestamp={lastUpdated} />
          </div>


        </div>
      </div>

      <div className="w-full px-6 py-6 space-y-6">
        {/* View Mode Toggle - Weekly vs Monthly */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-surface-light rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Data View</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDataView('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  dataView === 'monthly'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface text-text-secondary hover:bg-surface-light border border-surface-light'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Monthly Average
                </div>
              </button>
              <button
                onClick={() => setDataView('weekly')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  dataView === 'weekly'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface text-text-secondary hover:bg-surface-light border border-surface-light'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Weekly Details
                </div>
              </button>
            </div>
          </div>
          {dataView === 'monthly' && (
            <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                <span>Showing aggregated monthly averages (when multiple weeks exist for a month)</span>
              </p>
            </div>
          )}
          {dataView === 'weekly' && (
            <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-400 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>Showing individual weekly entries with date ranges</span>
              </p>
            </div>
          )}
        </div>

        {/* Time Period Selector */}
        <div className="bg-surface border border-surface-light rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-base font-semibold text-text-primary">Period</h3>
            </div>
            <div className="flex-1 max-w-xs">
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text-primary text-sm"
              >
                <option value="">All Years</option>
                {availableFYs.map(fy => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
            {selectedFY && (
              <div className="px-3 py-1 bg-primary/20 rounded-lg border border-primary/30">
                <span className="text-xs font-medium text-primary">
                  Viewing: {selectedFY}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* All Months Bar Chart */}
        {allMonthlyRecords.length > 0 && (() => {
          // Aggregate data by month when in monthly view
          const getDisplayData = () => {
            const filtered = allMonthlyRecords.filter(record => record.financialYear === selectedFY)
            
            if (dataView === 'weekly') {
              // Weekly view: show individual records
              return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            } else {
              // Monthly view: aggregate by month
              const monthGroups: { [key: string]: any[] } = {}
              
              filtered.forEach(record => {
                const key = `${record.financialYear}-${record.month}`
                if (!monthGroups[key]) {
                  monthGroups[key] = []
                }
                monthGroups[key].push(record)
              })
              
              // Calculate averages for each month
              return Object.entries(monthGroups).map(([key, records]) => {
                const avgUtilization = records.reduce((sum, r) => sum + r.utilization, 0) / records.length
                const totalProject = records.reduce((sum, r) => sum + r.project, 0)
                const totalTarget = records.reduce((sum, r) => sum + r.targetHours, 0)
                const totalFringe = records.reduce((sum, r) => sum + (r.fringe || 0), 0)
                
                return {
                  ...records[0],
                  utilization: avgUtilization,
                  project: totalProject,
                  targetHours: totalTarget,
                  fringe: totalFringe,
                  weekCount: records.length,
                  isAggregated: true
                }
              }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            }
          }
          
          const displayData = getDisplayData()
          
          return (
            <div className="bg-surface border border-surface-light rounded-xl p-8">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Month-on-Month Analysis
                {dataView === 'monthly' && (
                  <span className="text-sm font-normal text-text-muted ml-2">(Aggregated Monthly Averages)</span>
                )}
                {dataView === 'weekly' && (
                  <span className="text-sm font-normal text-text-muted ml-2">(Individual Weekly Entries)</span>
                )}
              </h2>
              <div className="h-[450px]">
                <svg viewBox="0 0 800 350" className="w-full h-full">
                  {/* Y-axis */}
                  <line x1="50" y1="20" x2="50" y2="260" stroke="#475569" strokeWidth="2" />
                  <line x1="50" y1="260" x2="780" y2="260" stroke="#475569" strokeWidth="2" />
                  
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100, 125, 150].map(val => (
                    <g key={val}>
                      <text x="35" y={260 - (val * 1.6)} fontSize="12" fill="#94a3b8" textAnchor="end">{val}%</text>
                      <line x1="45" y1={260 - (val * 1.6)} x2="780" y2={260 - (val * 1.6)} stroke="#334155" strokeWidth="1" />
                    </g>
                  ))}
                  
                  {/* Bars */}
                  {displayData.map((record, index, filteredArray) => {
                    const barWidth = 700 / Math.max(filteredArray.length, 1) - 10
                    const x = 60 + (index * (700 / filteredArray.length))
                    const barHeight = record.utilization * 1.6
                    const y = 260 - barHeight
                    const isSelected = selectedMonth === record.month && selectedFY === record.financialYear
                    
                    // Create label based on view mode
                    const getLabel = () => {
                      if (dataView === 'weekly' && record.fromDate && record.toDate) {
                        const from = new Date(record.fromDate)
                        const to = new Date(record.toDate)
                        return `${record.month} ${from.getDate()}-${to.getDate()}`
                      } else if (record.isAggregated && record.weekCount > 1) {
                        return `${record.month} (${record.weekCount}w avg)`
                      } else {
                        return `${record.month} ${String(new Date(record.date).getFullYear()).slice(-2)}`
                      }
                    }
                    
                    return (
                      <g key={`${record.financialYear}-${record.month}-${index}`}>
                        {/* Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill={isSelected ? '#3B82F6' : record.utilization >= 90 ? '#10B981' : record.utilization >= 70 ? '#F59E0B' : '#EF4444'}
                          opacity={isSelected ? 1 : 0.7}
                          rx="4"
                        />
                        
                        {/* Value label */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 5}
                          fontSize="10"
                          fill="#f1f5f9"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {record.utilization.toFixed(1)}%
                        </text>
                        
                        {/* Month/Week label */}
                        <text
                          x={x + barWidth / 2}
                          y="305"
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="end"
                          transform={`rotate(-45 ${x + barWidth / 2} 305)`}
                        >
                          {getLabel()}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            <div className="mt-1 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">≥90% (Excellent)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">70-89% (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">&lt;70% (Needs Attention)</span>
              </div>
            </div>
            {dataView === 'monthly' && displayData.some(r => r.isAggregated) && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Months marked with (Nw avg) show aggregated data from N weekly uploads</span>
                </p>
              </div>
            )}
          </div>
        )})()}

        {/* Performance Analytics */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Performance Analytics
          </h2>
          <div className="flex gap-2">
            {timeViewOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedView(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedView === option.value
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface border border-surface-light text-text-secondary hover:bg-surface-light'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Analytics Grid */}
        {performanceMetrics ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Gauge */}
            <div className="bg-surface border border-surface-light rounded-xl p-8 flex items-center justify-center">
              <PerformanceGauge
                value={performanceMetrics.average}
                label={
                  selectedView === 'lastMonth' ? 'Last Month Performance' :
                  selectedView === 'last6Months' ? 'Last 6 Months Avg' :
                  selectedView === 'Q1' ? 'Q1 Performance' :
                  selectedView === 'Q2' ? 'Q2 Performance' :
                  selectedView === 'Q3' ? 'Q3 Performance' :
                  selectedView === 'Q4' ? 'Q4 Performance' :
                  'Annual Performance'
                }
              />
            </div>

            {/* Hours Breakdown */}
            <div className="lg:col-span-2">
              <HoursBreakdownChart
                targetHours={performanceMetrics.totalTargetHours}
                projectHours={performanceMetrics.totalProjectHours}
                fringe={performanceMetrics.totalFringeHours}
              />
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-surface-light rounded-xl p-12">
            <div className="text-center">
              <div className="inline-block p-4 bg-slate-500/10 rounded-full mb-4">
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Data Available</h3>
              <p className="text-sm text-slate-500">
                Not enough data to display for {
                  selectedView === 'lastMonth' ? 'Last Month' :
                  selectedView === 'last6Months' ? 'Last 6 Months' :
                  selectedView === 'Q1' ? 'Q1' :
                  selectedView === 'Q2' ? 'Q2' :
                  selectedView === 'Q3' ? 'Q3' :
                  selectedView === 'Q4' ? 'Q4' :
                  'Annual'
                }
                {selectedFY ? ` - ${selectedFY}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {currentPeriodData && currentPeriodData.length > 0 && (
          <UtilizationTrendChart
            data={currentPeriodData}
            title={
              selectedView === 'lastMonth' ? 'Last Month Trend' :
              selectedView === 'last6Months' ? 'Last 6 Months Trend' :
              selectedView === 'Q1' ? 'Q1 Utilization Trend' :
              selectedView === 'Q2' ? 'Q2 Utilization Trend' :
              selectedView === 'Q3' ? 'Q3 Utilization Trend' :
              selectedView === 'Q4' ? 'Q4 Utilization Trend' :
              'Annual Utilization Trend'
            }
            selectedFY={selectedFY}
          />
        )}

        {/* Fringe Hours Tracker - Month by Month */}
        <FringeTracker
          monthlyRecords={allMonthlyRecords}
          selectedFY={selectedFY}
        />

        {/* Mentees Section */}
        {menteeData.length > 0 && (
          <div className="bg-surface border border-surface-light rounded-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Your Mentees ({menteeData.length})
              </h2>
              <button
                onClick={() => router.push('/individual/mentees')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Dashboard
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-light">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Title</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-text-muted">Target Hours</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-text-muted">Project Hours</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-text-muted">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {menteeData.map((mentee) => (
                    <tr key={mentee.id} className="border-b border-surface-light/50 hover:bg-surface-light/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-text-primary">{mentee.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-text-muted">{mentee.title}</td>
                      <td className="py-4 px-4 text-right text-text-primary font-mono">{mentee.targetHours}</td>
                      <td className="py-4 px-4 text-right text-text-primary font-mono">{mentee.project}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getUtilizationBgColor(mentee.utilization)} ${getUtilizationColor(mentee.utilization)}`}>
                          {mentee.utilization.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Your Profile */}
        <div className="bg-surface border border-surface-light rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Name</label>
              <p className="text-text-primary font-semibold mt-1">{myData.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Title</label>
              <p className="text-text-primary font-semibold mt-1">{myData.title}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Email</label>
              <p className="text-text-primary font-semibold mt-1">{myData.email || user?.email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Mentor</label>
              <p className="text-text-primary font-semibold mt-1">{myData.mentor || 'No mentor assigned'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
