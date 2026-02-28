'use client'

import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { EmployeeUtilization } from '@/types/utilization'

interface UtilizationChartsProps {
  viewType: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  data: EmployeeUtilization[]
  onRangeSelect?: (min: number, max: number, label: string) => void
  selectedRange?: {min: number, max: number, label: string} | null
}

export default function UtilizationCharts({ viewType, data, onRangeSelect, selectedRange }: UtilizationChartsProps) {
  // Calculate top performers from real data
  const topPerformers = useMemo(() => {
    return [...data]
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 5)
      .map(emp => ({
        name: emp.name.length > 20 ? emp.name.substring(0, 20) + '...' : emp.name,
        utilization: emp.utilization
      }))
  }, [data])

  // Calculate role distribution
  const roleDistribution = useMemo(() => {
    const roleCounts: Record<string, number> = {}
    data.forEach(emp => {
      const role = emp.title || 'Unknown'
      roleCounts[role] = (roleCounts[role] || 0) + 1
    })

    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']
    const totalCount = data.length
    const threshold = 0.05 // 5% threshold
    
    // Sort by count
    const sorted = Object.entries(roleCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalCount) * 100
      }))
      .sort((a, b) => b.value - a.value)
    
    // Group small segments into "Other"
    const mainRoles = sorted.filter(role => role.percentage >= threshold * 100)
    const otherRoles = sorted.filter(role => role.percentage < threshold * 100)
    
    const result = mainRoles.map((role, index) => ({
      ...role,
      color: colors[index % colors.length],
      isOther: false,
      breakdown: null as { name: string; value: number; percentage: number; }[] | null
    }))
    
    // Add "Other" category if there are small roles
    if (otherRoles.length > 0) {
      result.push({
        name: 'Other',
        value: otherRoles.reduce((sum, role) => sum + role.value, 0),
        percentage: otherRoles.reduce((sum, role) => sum + role.percentage, 0),
        color: '#6b7280', // gray
        isOther: true,
        breakdown: otherRoles as { name: string; value: number; percentage: number; }[] | null
      })
    }
    
    return result
  }, [data])

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null
    
    const data = payload[0].payload
    
    if (data.isOther && data.breakdown) {
      return (
        <div className="bg-surface border border-surface-light rounded-lg p-4 shadow-xl max-w-xs">
          <p className="font-bold text-text-primary mb-2">Other Roles Breakdown</p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-light">
                <tr>
                  <th className="text-left text-text-secondary py-1 pr-4">Role</th>
                  <th className="text-right text-text-secondary py-1 px-2">Count</th>
                  <th className="text-right text-text-secondary py-1">{"%"}</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((role: any, index: number) => (
                  <tr key={index} className="border-b border-surface-light/50">
                    <td className="text-text-primary py-1 pr-4">{role.name}</td>
                    <td className="text-text-primary text-right py-1 px-2">{role.value}</td>
                    <td className="text-text-primary text-right py-1">{role.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-text-secondary text-xs mt-2 border-t border-surface-light pt-2">
            Total: {data.value} employees ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    
    return (
      <div className="bg-surface border border-surface-light rounded-lg p-3 shadow-xl">
        <p className="text-text-primary font-semibold">{data.name}</p>
        <p className="text-text-secondary text-sm">
          {data.value} employees ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    )
  }

  // Calculate utilization distribution
  const utilizationDistribution = useMemo(() => {
    const ranges = [
      { range: '90% - 100%+', min: 90, max: Infinity, count: 0, color: 'bg-success' },
      { range: '80% - 90%', min: 80, max: 90, count: 0, color: 'bg-primary' },
      { range: '70% - 80%', min: 70, max: 80, count: 0, color: 'bg-warning' },
      { range: '60% - 70%', min: 60, max: 70, count: 0, color: 'bg-accent' },
      { range: 'Below 60%', min: 0, max: 60, count: 0, color: 'bg-danger' },
    ]

    data.forEach(emp => {
      const util = emp.utilization
      for (const range of ranges) {
        if (util >= range.min && util < range.max) {
          range.count++
          break
        }
      }
    })

    return ranges.map(r => ({
      ...r,
      percentage: data.length > 0 ? (r.count / data.length) * 100 : 0
    }))
  }, [data])

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-surface-light rounded-xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-light rounded-full mb-4">
          <LineChart className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">No Analytics Available</h3>
        <p className="text-text-secondary">Upload data to see charts and analytics</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Role Distribution */}
      {roleDistribution.length > 0 && (
      <div className="bg-surface border border-surface-light rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Employee Distribution by Role</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={roleDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {roleDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
      <div className="bg-surface border border-surface-light rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Top Performers</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topPerformers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
            <XAxis 
              type="number" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141824',
                border: '1px solid #1e2433',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
            />
            <Bar 
              dataKey="utilization" 
              fill="#10b981"
              radius={[0, 8, 8, 0]}
              name="Utilization %"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Utilization Distribution */}
      <div className="bg-surface border border-surface-light rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Utilization Distribution</h3>
        <div className="space-y-4 pt-4">
          {utilizationDistribution.map((item) => {
            const isSelected = selectedRange?.min === item.min && selectedRange?.max === item.max
            return (
              <div 
                key={item.range}
                onClick={() => onRangeSelect?.(item.min, item.max, item.range)}
                className={`cursor-pointer transition-all duration-200 p-3 rounded-lg ${
                  isSelected 
                    ? 'bg-primary/10 border border-primary/30 scale-[1.02]' 
                    : 'hover:bg-surface-light/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-text-primary'
                  }`}>{item.range}</span>
                  <span className={`text-sm ${
                    isSelected ? 'text-primary' : 'text-text-secondary'
                  }`}>{item.count} employees ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full h-3 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500 ${
                      isSelected ? 'opacity-100' : 'opacity-80'
                    }`}
                    style={{ width: `${Math.min(item.percentage * 3, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
