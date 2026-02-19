'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Upload, Trash2, Search, Users, UserCheck, UserX, Clock, Briefcase, X } from 'lucide-react'
import { reportStorageService } from '@/lib/reportStorage'
import ReportUpload from '@/components/ReportUpload'
import LastUpdated from '@/components/LastUpdated'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import type { EmployeeReport, AvailabilityStatus } from '@/types/report'

type FilterType = 'all' | 'available' | 'no' | 'has-bandwidth' | 'booked'

export default function ReportsPage() {
  const [reports, setReports] = useState<EmployeeReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    setLoading(true)
    setTimeout(() => {
      const data = reportStorageService.getReports()
      const metadata = reportStorageService.getMetadata()
      setReports(data)
      setLastUpdated(metadata?.lastUpdated || null)
      setLoading(false)
    }, 200)
  }

  const handleUploadSuccess = () => {
    loadReports()
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all report data?')) {
      reportStorageService.clearReports()
      loadReports()
    }
  }

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(activeFilter === filter ? 'all' : filter)
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Calculate KPI statistics
  const stats = useMemo(() => {
    const total = reports.length
    const available = reports.filter(r => r.isAvailable === 'Available').length
    const occupied = reports.filter(r => r.isAvailable === 'No').length
    const hasBandwidth = reports.filter(r => r.isAvailable === 'Has Bandwidth').length
    const booked = reports.filter(r => r.isAvailable === 'Booked').length
    const contractors = reports.filter(r => r.isContractor).length

    return {
      total,
      available,
      occupied,
      hasBandwidth,
      booked,
      contractors,
    }
  }, [reports])

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.currentProject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.role.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesFilter = true
      if (activeFilter === 'available') {
        matchesFilter = report.isAvailable === 'Available'
      } else if (activeFilter === 'no') {
        matchesFilter = report.isAvailable === 'No'
      } else if (activeFilter === 'has-bandwidth') {
        matchesFilter = report.isAvailable === 'Has Bandwidth'
      } else if (activeFilter === 'booked') {
        matchesFilter = report.isAvailable === 'Booked'
      }

      return matchesSearch && matchesFilter
    })
  }, [reports, searchTerm, activeFilter])

  const getStatusColor = (status: AvailabilityStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-success/20 text-success'
      case 'No':
        return 'bg-danger/20 text-danger'
      case 'Has Bandwidth':
        return 'bg-warning/20 text-warning'
      case 'Booked':
        return 'bg-accent/20 text-accent'
      default:
        return 'bg-text-muted/20 text-text-muted'
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Reports Data</h3>
          <p className="text-text-secondary mb-6">Upload an employee report file to get started</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Report</span>
          </button>
        </div>
        {showUpload && <ReportUpload onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-full">
        {/* Header */}
        <div className="px-8 pt-6 pb-2">
          <LastUpdated timestamp={lastUpdated} />
        </div>
        <div className="px-8 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Employee Reports</h1>
            <p className="text-text-secondary">Track employee availability and project assignments</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/30"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload Report</span>
            </button>
            <button
              onClick={handleClearData}
              className="flex items-center space-x-2 px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Clear Data</span>
            </button>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="px-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* Total Employees */}
          <button
            onClick={() => handleFilterClick('all')}
            className={`bg-surface border rounded-xl p-4 text-left transition-all ${
              activeFilter === 'all'
                ? 'border-primary shadow-lg shadow-primary/30'
                : 'border-surface-light hover:border-surface-lighter'
            }`}
          >
            <Users className="w-8 h-8 text-primary mb-2" />
            <p className="text-text-muted text-xs font-medium">Total</p>
            <p className="text-text-primary text-2xl font-bold">{stats.total}</p>
          </button>

          {/* Available */}
          <button
            onClick={() => handleFilterClick('available')}
            className={`bg-surface border rounded-xl p-4 text-left transition-all ${
              activeFilter === 'available'
                ? 'border-success shadow-lg shadow-success/30'
                : 'border-surface-light hover:border-surface-lighter'
            }`}
          >
            <UserCheck className="w-8 h-8 text-success mb-2" />
            <p className="text-text-muted text-xs font-medium">Available</p>
            <p className="text-text-primary text-2xl font-bold">{stats.available}</p>
            <p className="text-success text-xs mt-1">{((stats.available / stats.total) * 100).toFixed(1)}%</p>
          </button>

          {/* Occupied */}
          <button
            onClick={() => handleFilterClick('no')}
            className={`bg-surface border rounded-xl p-4 text-left transition-all ${
              activeFilter === 'no'
                ? 'border-danger shadow-lg shadow-danger/30'
                : 'border-surface-light hover:border-surface-lighter'
            }`}
          >
            <UserX className="w-8 h-8 text-danger mb-2" />
            <p className="text-text-muted text-xs font-medium">Occupied</p>
            <p className="text-text-primary text-2xl font-bold">{stats.occupied}</p>
            <p className="text-danger text-xs mt-1">{((stats.occupied / stats.total) * 100).toFixed(1)}%</p>
          </button>

          {/* Has Bandwidth */}
          <button
            onClick={() => handleFilterClick('has-bandwidth')}
            className={`bg-surface border rounded-xl p-4 text-left transition-all ${
              activeFilter === 'has-bandwidth'
                ? 'border-warning shadow-lg shadow-warning/30'
                : 'border-surface-light hover:border-surface-lighter'
            }`}
          >
            <Clock className="w-8 h-8 text-warning mb-2" />
            <p className="text-text-muted text-xs font-medium">Bandwidth</p>
            <p className="text-text-primary text-2xl font-bold">{stats.hasBandwidth}</p>
            <p className="text-warning text-xs mt-1">{((stats.hasBandwidth / stats.total) * 100).toFixed(1)}%</p>
          </button>

          {/* Booked */}
          <button
            onClick={() => handleFilterClick('booked')}
            className={`bg-surface border rounded-xl p-4 text-left transition-all ${
              activeFilter === 'booked'
                ? 'border-accent shadow-lg shadow-accent/30'
                : 'border-surface-light hover:border-surface-lighter'
            }`}
          >
            <Briefcase className="w-8 h-8 text-accent mb-2" />
            <p className="text-text-muted text-xs font-medium">Booked</p>
            <p className="text-text-primary text-2xl font-bold">{stats.booked}</p>
            <p className="text-accent text-xs mt-1">{((stats.booked / stats.total) * 100).toFixed(1)}%</p>
          </button>

          {/* Contractors */}
          <div className="bg-surface border border-surface-light rounded-xl p-4">
            <Users className="w-8 h-8 text-secondary mb-2" />
            <p className="text-text-muted text-xs font-medium">Contractors</p>
            <p className="text-text-primary text-2xl font-bold">{stats.contractors}</p>
            <p className="text-secondary text-xs mt-1">{((stats.contractors / stats.total) * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Employee Table */}
        <div ref={tableRef} className="bg-surface border-t border-surface-light p-8">
          {/* Clear Filter */}
          {activeFilter !== 'all' && (
            <div className="mb-4 flex justify-between items-center">
              <div className="text-text-secondary">
                Showing <span className="text-primary font-semibold">{filteredReports.length}</span> of {reports.length} employees
              </div>
              <button
                onClick={() => setActiveFilter('all')}
                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear Filter</span>
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, project, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-light border border-surface-light rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-light">
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Current Project</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Tentative Project</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Available From</th>
                  <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Practice</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-surface-light hover:bg-surface-light transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-text-primary font-medium">{report.name}</p>
                        <p className="text-text-muted text-xs">{report.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-sm">{report.role}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-text-primary text-sm font-medium">{report.currentProject}</p>
                        {report.currentProjectUtilization > 0 && (
                          <p className="text-text-muted text-xs">{report.currentProjectUtilization}% utilized</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.isAvailable)}`}>
                        {report.isAvailable}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-sm">
                      {report.tentativeProject || '-'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-sm">
                      {report.availableFrom || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-secondary/20 text-secondary rounded text-xs">
                        {report.practice}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted">No employees found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {showUpload && <ReportUpload onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />}
    </div>
  )
}
