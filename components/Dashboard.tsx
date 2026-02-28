'use client'

import { useState, useEffect, useRef } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { Upload, Calendar, TrendingUp, Users, Clock } from 'lucide-react'
import UtilizationTable from './UtilizationTable'
import UtilizationCharts from './UtilizationCharts'
import CSVUpload from './CSVUpload'
import LastUpdated from './LastUpdated'
import LoadingSkeleton from './LoadingSkeleton'
import { storageService } from '@/lib/storage'
import type { EmployeeUtilization } from '@/types/utilization'

type ViewType = 'weekly' | 'monthly' | 'quarterly' | 'annual'
type PeriodType = 'lastMonth' | 'last6Months' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual' | 'custom'

// Compute actual from/to date strings for a chosen period
function getDateRange(period: PeriodType, month: number, year: number): { from: string; to: string } | null {
  const today = new Date()
  const cm = today.getMonth() + 1
  const cy = today.getFullYear()
  // Financial year start year (Apr–Mar)
  const fyStart = cm >= 4 ? cy : cy - 1

  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate()

  if (period === 'lastMonth') {
    const lm = cm === 1 ? 12 : cm - 1
    const ly = cm === 1 ? cy - 1 : cy
    return { from: fmt(ly, lm, 1), to: fmt(ly, lm, lastDay(ly, lm)) }
  }
  if (period === 'last6Months') {
    const d = new Date(cy, today.getMonth() - 5, 1)
    return { from: fmt(d.getFullYear(), d.getMonth() + 1, 1), to: fmt(cy, cm, lastDay(cy, cm)) }
  }
  if (period === 'Q1') return { from: fmt(fyStart, 4, 1),      to: fmt(fyStart, 6, 30) }
  if (period === 'Q2') return { from: fmt(fyStart, 7, 1),      to: fmt(fyStart, 9, 30) }
  if (period === 'Q3') return { from: fmt(fyStart, 10, 1),     to: fmt(fyStart, 12, 31) }
  if (period === 'Q4') return { from: fmt(fyStart + 1, 1, 1),  to: fmt(fyStart + 1, 3, 31) }
  if (period === 'annual') return { from: fmt(fyStart, 4, 1),  to: fmt(fyStart + 1, 3, 31) }
  if (period === 'custom') {
    return { from: fmt(year, month, 1), to: fmt(year, month, lastDay(year, month)) }
  }
  return null
}

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('weekly')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('lastMonth')
  // Initialize to last month
  const initLastMonth = () => {
    const now = new Date()
    return now.getMonth() === 0
      ? { month: 12, year: now.getFullYear() - 1 }
      : { month: now.getMonth(), year: now.getFullYear() }
  }
  const lm = initLastMonth()
  const [customMonth, setCustomMonth] = useState<number>(lm.month)
  const [customYear, setCustomYear] = useState<number>(lm.year)
  const [showUpload, setShowUpload] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [data, setData] = useState<EmployeeUtilization[]>([])  
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<{min: number, max: number, label: string} | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    avgUtilization: 0,
    totalHours: 0,
    targetHours: 0,
  })
  const tableRef = useRef<HTMLDivElement>(null)

  // Initial load with lastMonth
  useEffect(() => {
    loadData('lastMonth', lm.month, lm.year)
  }, [])

  // Auto-scroll to table when range is selected
  useEffect(() => {
    if (selectedRange && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedRange])

  const loadData = async (period?: PeriodType, month?: number, year?: number) => {
    setLoading(true)
    try {
      const activePeriod = period ?? selectedPeriod
      const activeMonth  = month  ?? customMonth
      const activeYear   = year   ?? customYear

      const url = new URL('/api/data', window.location.origin)
      const range = getDateRange(activePeriod, activeMonth, activeYear)
      if (range) {
        url.searchParams.set('fromDate', range.from)
        url.searchParams.set('toDate', range.to)
      }

      const response = await fetch(url.toString())
      const result = await response.json()
      
      if (result.success && result.data) {
        const transformedData: EmployeeUtilization[] = result.data.map((record: any) => ({
          id: record.id,
          name: record.name,
          title: record.title,
          targetHours: record.targetHours,
          project: record.project,
          pmn: record.pmn,
          utilization: record.utilization,
          fringeImpact: record.fringeImpact,
          fringe: record.fringe,
          wPresales: record.wPresales,
          mentor: record.mentor || '',
          fromDate: record.fromDate,
          toDate: record.toDate,
          periodType: record.periodType,
        }))
        setData(transformedData)
        setSummary(storageService.getSummary(transformedData))
        setLastUpdated(result.metadata?.lastUpdated || null)
      } else {
        setData([])
        setSummary({ totalEmployees: 0, avgUtilization: 0, totalHours: 0, targetHours: 0 })
        setLastUpdated(null)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setData([])
      setSummary({ totalEmployees: 0, avgUtilization: 0, totalHours: 0, targetHours: 0 })
      setLastUpdated(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    loadData(selectedPeriod, customMonth, customYear)
  }

  const handleClearData = async () => {
    try {
      const response = await fetch('/api/data', { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        loadData(selectedPeriod, customMonth, customYear)
      } else {
        alert('Failed to clear data: ' + result.error)
      }
    } catch (error) {
      alert('Failed to clear data. Please try again.')
    }
  }

  const handlePeriodSelect = (p: PeriodType) => {
    setSelectedPeriod(p)
    loadData(p, customMonth, customYear)
  }

  const handleGetResults = () => {
    setSelectedPeriod('custom')
    loadData('custom', customMonth, customYear)
  }

  const handleRangeSelect = (min: number, max: number, label: string) => {
    if (selectedRange?.min === min && selectedRange?.max === max) {
      setSelectedRange(null) // Toggle off if clicking the same range
    } else {
      setSelectedRange({ min, max, label })
    }
  }

  const filteredData = selectedRange
    ? data.filter(emp => emp.utilization >= selectedRange.min && emp.utilization < selectedRange.max)
    : data

  const periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'lastMonth',   label: 'Last Month' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'Q1',          label: 'Q1' },
    { value: 'Q2',          label: 'Q2' },
    { value: 'Q3',          label: 'Q3' },
    { value: 'Q4',          label: 'Q4' },
    { value: 'annual',      label: 'Annual' },
  ]

  const getPeriodLabel = () => {
    if (selectedPeriod === 'custom') {
      const monthNames = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December']
      return `${monthNames[customMonth - 1]} ${customYear}`
    }
    const range = getDateRange(selectedPeriod, customMonth, customYear)
    const base = periodOptions.find(p => p.value === selectedPeriod)?.label || ''
    if (!range) return base
    return `${base} (${range.from} – ${range.to})`
  }

  const views: { value: ViewType; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
  ]

  const stats = [
    {
      label: 'Total Employees',
      value: summary.totalEmployees.toString(),
      change: data.length > 0 ? '+' + summary.totalEmployees : '0',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Avg Utilization',
      value: summary.avgUtilization > 0 ? `${summary.avgUtilization.toFixed(2)}%` : '0%',
      change: summary.avgUtilization > 0 ? `${(summary.avgUtilization - 80).toFixed(2)}%` : '0%',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Total Hours',
      value: summary.totalHours > 0 ? summary.totalHours.toLocaleString() : '0',
      change: summary.totalHours > 0 ? '+' + summary.totalHours.toLocaleString() : '0',
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      label: 'Target Hours',
      value: summary.targetHours > 0 ? summary.targetHours.toLocaleString() : '0',
      change: '0%',
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-600',
    },
  ]

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="h-full flex flex-col">
      <ConfirmDialog
        open={showConfirm}
        title="Clear Data"
        message="Are you sure you want to clear all data from the database? This action cannot be undone."
        onConfirm={() => {
          setShowConfirm(false)
          handleClearData()
        }}
        onCancel={() => setShowConfirm(false)}
      />
      {/* Header */}
      <header className="bg-surface border-b border-surface-light px-8 py-6">
        <div className="mb-2">
          <LastUpdated timestamp={lastUpdated} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Employee Utilization Dashboard</h1>
            <p className="text-text-secondary mt-1">
              Track and analyze employee billable hours
              {data.length > 0 && (
                <span className="ml-2 text-text-muted">
                  • {data.length} employees
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {data.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-surface-light hover:bg-opacity-80 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                <span className="font-medium">Clear Data</span>
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-lg shadow-primary/30"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload Data</span>
            </button>
          </div>
        </div>

        {/* Period Filter Row */}
        <div className="mt-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Period preset buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {periodOptions.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePeriodSelect(p.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedPeriod === p.value
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-surface-light text-text-secondary hover:text-text-primary hover:bg-opacity-80'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom month/year picker */}
            <div className="flex items-center gap-2 bg-surface-light px-3 py-2 rounded-lg border border-surface-light">
              <Calendar className="w-4 h-4 text-text-muted" />
              <select
                value={customMonth}
                onChange={(e) => setCustomMonth(Number(e.target.value))}
                className="bg-transparent text-text-primary text-sm font-medium border-none outline-none cursor-pointer pr-2"
              >
                {['January','February','March','April','May','June',
                  'July','August','September','October','November','December'].map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
              <span className="text-text-muted">|</span>
              <select
                value={customYear}
                onChange={(e) => setCustomYear(Number(e.target.value))}
                className="bg-transparent text-text-primary text-sm font-medium border-none outline-none cursor-pointer pr-2"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleGetResults}
                className="ml-2 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors"
              >
                Get Results
              </button>
            </div>
          </div>

          {/* What is being shown */}
          <div className="mt-3 text-sm text-text-muted">
            Showing data for: <span className="font-semibold text-text-primary">{getPeriodLabel()}</span>
            {data.length === 0 && !loading && (
              <span className="ml-3 text-warning font-medium">No data found for this period</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-6">
          {views.map((view) => (
            <button
              key={view.value}
              onClick={() => setCurrentView(view.value)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                currentView === view.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-surface-light text-text-secondary hover:text-text-primary hover:bg-opacity-80'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-surface border border-surface-light rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-text-muted text-sm font-medium">{stat.label}</p>
                    <p className="text-text-primary text-3xl font-bold mt-2">{stat.value}</p>
                    <p className={`text-sm mt-2 ${
                      stat.change.startsWith('+') ? 'text-success' : 
                      stat.change.startsWith('-') ? 'text-danger' : 
                      'text-text-muted'
                    }`}>
                      {stat.change} from last period
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* No data message */}
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No sufficient data</h3>
            <p className="text-text-secondary text-sm max-w-sm">
              There is no utilization data for <strong>{getPeriodLabel()}</strong>. Try a different period or upload data.
            </p>
          </div>
        )}

        {/* Charts — only show when there is data */}
        {data.length > 0 && (
          <UtilizationCharts 
            viewType={currentView} 
            data={data}
            onRangeSelect={handleRangeSelect}
            selectedRange={selectedRange}
          />
        )}

        {/* Data Table */}
        <div ref={tableRef}>
          {selectedRange && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-text-primary font-medium">Filtered by:</span>
                <span className="text-primary font-semibold">{selectedRange?.label}</span>
                <span className="text-text-secondary">({filteredData.length} employees)</span>
              </div>
              <button
                onClick={() => setSelectedRange(null)}
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}
          <UtilizationTable viewType={currentView} data={filteredData} />
        </div>
      </div>

      {/* CSV Upload Modal */}
      {showUpload && <CSVUpload onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />}
    </div>
  )
}
