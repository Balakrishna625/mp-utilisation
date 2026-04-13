'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { HistoricalUtilization } from '@/types/utilization'

interface UtilizationTrendChartProps {
  data: HistoricalUtilization[]
  title: string
  color?: string
  selectedFY?: string // Use the FY from parent component
}

export default function UtilizationTrendChart({ 
  data, 
  title,
  color = '#00CED1',
  selectedFY
}: UtilizationTrendChartProps) {
  // Note: fiscal years span Jul->Jun. When `selectedFY` is provided we filter
  // by the `period` string (which is formatted like "Jul FY25") rather than by calendar year.
  const selectedYear = useMemo(() => {
    if (!selectedFY) return null
    return selectedFY
  }, [selectedFY])

  // Group data by quarters for the selected year
  const quarterlyData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Filter data for selected fiscal year (preferred) or fallback to calendar year
    const yearData = selectedYear
      ? data.filter(item => item.period && item.period.includes(selectedYear))
      : data.filter(item => {
        const itemYear = new Date(item.date).getFullYear()
        return itemYear === new Date().getFullYear()
      })

    if (yearData.length === 0) return null

    // Group by quarter
    const quarters: { [key: string]: { utilization: number, hours: number, count: number } } = {
      'Q1': { utilization: 0, hours: 0, count: 0 },
      'Q2': { utilization: 0, hours: 0, count: 0 },
      'Q3': { utilization: 0, hours: 0, count: 0 },
      'Q4': { utilization: 0, hours: 0, count: 0 },
    }

    yearData.forEach(item => {
      const month = new Date(item.date).getMonth() + 1 // 1-12
      let quarter: string
      
      // Financial Year Quarters: Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
      if (month >= 7 && month <= 9) quarter = 'Q1'
      else if (month >= 10 && month <= 12) quarter = 'Q2'
      else if (month >= 1 && month <= 3) quarter = 'Q3'
      else quarter = 'Q4'

      quarters[quarter].utilization += item.utilization
      quarters[quarter].hours += item.projectHours
      quarters[quarter].count += 1
    })

    // Convert to array and calculate averages
    const quarterArray = ['Q1', 'Q2', 'Q3', 'Q4']
      .map(q => ({
        period: q,
        utilization: quarters[q].count > 0 ? quarters[q].utilization / quarters[q].count : 0,
        projectHours: quarters[q].hours,
        date: `${selectedYear}-${q}`,
        hasData: quarters[q].count > 0
      }))
      .filter(q => q.hasData)

    if (quarterArray.length === 0) return null

    const maxValue = Math.max(...quarterArray.map(d => d.utilization), 100)
    const minValue = Math.min(...quarterArray.map(d => d.utilization), 0)
    const range = maxValue - minValue || 100

    return {
      points: quarterArray.map((item, index) => ({
        x: (index / Math.max(quarterArray.length - 1, 1)) * 100,
        y: 100 - ((item.utilization - minValue) / range) * 100,
        value: item.utilization,
        label: item.period,
      })),
      trend: quarterArray.length >= 2 ? 
        quarterArray[quarterArray.length - 1].utilization - quarterArray[0].utilization : 0,
      average: quarterArray.reduce((sum, d) => sum + d.utilization, 0) / quarterArray.length,
    }
  }, [data, selectedYear])

  if (!quarterlyData || !data || data.length === 0) {
    return (
      <div className="bg-surface border border-surface-light rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
        <p className="text-text-muted text-center py-8">No data available for {selectedFY}</p>
      </div>
    )
  }

  const pathData = quarterlyData.points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `${pathData} L 100 100 L 0 100 Z`

  const getTrendIcon = () => {
    if (quarterlyData.trend > 2) return <TrendingUp className="w-5 h-5 text-success" />
    if (quarterlyData.trend < -2) return <TrendingDown className="w-5 h-5 text-danger" />
    return <Minus className="w-5 h-5 text-warning" />
  }

  const getTrendText = () => {
    if (quarterlyData.trend > 2) return 'Improving'
    if (quarterlyData.trend < -2) return 'Declining'
    return 'Stable'
  }

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}{selectedFY ? ` - ${selectedFY}` : ''}</h3>
        <div className="flex items-center gap-2 text-sm">
          {getTrendIcon()}
          <span className="text-text-muted">{getTrendText()}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-primary">
          {quarterlyData.average.toFixed(1)}%
        </div>
        <div className="text-sm text-text-muted">Average Utilization</div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mb-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.2" className="text-surface-light" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-surface-light" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.2" className="text-surface-light" />

          {/* Area fill */}
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {quarterlyData.points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-text-muted border-t border-surface-light pt-4">
        {quarterlyData.points.map((point, i) => (
          <span key={i}>{point.label}</span>
        ))}
      </div>
    </div>
  )
}
