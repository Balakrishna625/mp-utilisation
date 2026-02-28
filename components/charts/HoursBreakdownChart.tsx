'use client'

import { useMemo } from 'react'

interface HoursBreakdownChartProps {
  targetHours: number
  projectHours: number
  fringe: number
}

export default function HoursBreakdownChart({ 
  targetHours, 
  projectHours, 
  fringe 
}: HoursBreakdownChartProps) {
  const chartData = useMemo(() => {
    const total = targetHours
    const productive = projectHours
    const remaining = Math.max(0, total - productive)

    return [
      { 
        label: 'Project Hours', 
        value: productive, 
        percentage: (productive / total) * 100,
        color: '#00CED1' // primary/cyan
      },
      { 
        label: 'Remaining Hours', 
        value: remaining, 
        percentage: (remaining / total) * 100,
        color: '#6b7280' // gray
      },
    ].filter(item => item.value > 0)
  }, [targetHours, projectHours])

  // Calculate angles for pie chart
  let currentAngle = -90
  const segments = chartData.map(item => {
    const angle = (item.percentage / 100) * 360
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    }
    currentAngle += angle
    return segment
  })

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', x, y,
      'Z'
    ].join(' ')
  }

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Hours Breakdown</h3>
      
      <div className="flex items-center justify-between gap-8">
        {/* Pie Chart */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {segments.map((segment, i) => (
              <path
                key={i}
                d={describeArc(50, 50, 45, segment.startAngle, segment.endAngle)}
                fill={segment.color}
                opacity="0.9"
                className="transition-opacity hover:opacity-100"
              />
            ))}
            {/* Center circle for donut effect */}
            <circle cx="50" cy="50" r="25" fill="currentColor" className="text-background" />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-text-primary">{Math.round(targetHours)}</div>
            <div className="text-xs text-text-muted">Total Hours</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {chartData.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-text-muted">{item.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-text-primary">{Math.round(item.value)}h</div>
                <div className="text-xs text-text-muted">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
