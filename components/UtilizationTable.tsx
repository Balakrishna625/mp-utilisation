'use client'

import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, Download } from 'lucide-react'
import type { EmployeeUtilization } from '@/types/utilization'

interface UtilizationTableProps {
  viewType: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  data: EmployeeUtilization[]
}

export default function UtilizationTable({ viewType, data }: UtilizationTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof EmployeeUtilization>('utilization')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof EmployeeUtilization) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let dataList = [...data]

    // Filter
    if (searchTerm) {
      dataList = dataList.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    dataList.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

    return dataList
  }, [data, searchTerm, sortField, sortDirection])

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-success'
    if (utilization >= 70) return 'text-warning'
    return 'text-danger'
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Title', 'Target Hours', 'Project', 'Utilization', 'Fringe', 'W/Presales']
    const rows = filteredAndSortedData.map(emp => [
      emp.name,
      emp.title,
      emp.targetHours,
      emp.project,
      emp.utilization,
      emp.fringe,
      emp.wPresales,
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `utilization-${viewType}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="bg-surface border border-surface-light rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="p-6 border-b border-surface-light">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Employee Utilization</h2>
          {data.length === 0 && (
            <p className="text-text-muted text-sm">No data available. Please upload a file.</p>
          )}
          {data.length > 0 && (
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors w-64"
                />
              </div>
              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-light hover:bg-opacity-80 text-text-primary rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Export</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {data.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'title', label: 'Title' },
                    { key: 'targetHours', label: 'Target Hours' },
                    { key: 'project', label: 'Project' },
                    { key: 'utilization', label: 'Utilization' },
                    { key: 'fringeImpact', label: 'Fringe Impact' },
                    { key: 'fringe', label: 'Fringe' },
                    { key: 'wPresales', label: 'W/Presales' },
                  ].map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors group"
                      onClick={() => handleSort(column.key as keyof EmployeeUtilization)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light">
                {filteredAndSortedData.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-surface-light/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <span className="ml-3 text-text-primary font-medium">{employee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{employee.title}</td>
                    <td className="px-6 py-4 text-text-primary font-mono">{employee.targetHours}</td>
                    <td className="px-6 py-4 text-text-primary font-mono">{employee.project}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold font-mono ${getUtilizationColor(employee.utilization)}`}>
                          {employee.utilization.toFixed(2)}%
                        </span>
                        <div className="w-24 h-2 bg-surface-light rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              employee.utilization >= 90
                                ? 'bg-success'
                                : employee.utilization >= 70
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}
                            style={{ width: `${Math.min(employee.utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono ${employee.fringeImpact < 0 ? 'text-danger' : 'text-success'}`}>
                      {employee.fringeImpact.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-text-primary font-mono">{employee.fringe}</td>
                    <td className="px-6 py-4">
                      <span className={`font-mono ${getUtilizationColor(employee.wPresales)}`}>
                        {employee.wPresales.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 bg-surface-light border-t border-surface-light flex items-center justify-between">
            <p className="text-text-secondary text-sm">
              Showing <span className="font-medium text-text-primary">{filteredAndSortedData.length}</span> employees
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-surface hover:bg-opacity-80 text-text-primary rounded transition-colors text-sm font-medium">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary text-white rounded transition-colors text-sm font-medium">
                1
              </button>
              <button className="px-3 py-1 bg-surface hover:bg-opacity-80 text-text-primary rounded transition-colors text-sm font-medium">
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-light rounded-full mb-4">
            <Search className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Data Available</h3>
          <p className="text-text-secondary">Upload a CSV or Excel file to get started</p>
        </div>
      )}
    </div>
  )
}
