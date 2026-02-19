'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Calendar, TrendingUp, Users, Clock } from 'lucide-react'
import UtilizationTable from './UtilizationTable'
import UtilizationCharts from './UtilizationCharts'
import CSVUpload from './CSVUpload'
import LastUpdated from './LastUpdated'
import LoadingSkeleton from './LoadingSkeleton'
import { storageService } from '@/lib/storage'
import type { EmployeeUtilization } from '@/types/utilization'

type ViewType = 'weekly' | 'monthly' | 'quarterly' | 'annual'

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('weekly')
  const [showUpload, setShowUpload] = useState(false)
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

  // Load data from localStorage on mount
  useEffect(() => {
    loadData()
  }, [])

  // Auto-scroll to table when range is selected
  useEffect(() => {
    if (selectedRange && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedRange])

  const loadData = () => {
    setLoading(true)
    // Simulate async loading for smooth transition
    setTimeout(() => {
      const storedData = storageService.getData()
      const metadata = storageService.getMetadata()
      
      setData(storedData)
      setSummary(storageService.getSummary(storedData))
      setLastUpdated(metadata?.lastUpdated || null)
      setLoading(false)
      
      if (metadata) {
        console.log('📊 Data Info:', {
          records: storedData.length,
          lastUpdated: new Date(metadata.lastUpdated).toLocaleString(),
          fileName: metadata.fileName,
          fileType: metadata.fileType
        })
      }
    }, 200)
  }

  const handleUploadSuccess = () => {
    loadData()
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      storageService.clearData()
      loadData()
    }
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
                  • {data.length} employees loaded
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {data.length > 0 && (
              <button
                onClick={handleClearData}
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

        {/* View Selector */}
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

        {/* Charts */}
        <UtilizationCharts 
          viewType={currentView} 
          data={data}
          onRangeSelect={handleRangeSelect}
          selectedRange={selectedRange}
        />

        {/* Data Table */}
        <div ref={tableRef}>
          {selectedRange && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-text-primary font-medium">Filtered by:</span>
                <span className="text-primary font-semibold">{selectedRange.label}</span>
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
