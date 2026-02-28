'use client'

import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import type { HistoricalUtilization } from '@/types/utilization'

interface MonthOnMonthComparisonProps {
  data: HistoricalUtilization[]
}

export default function MonthOnMonthComparison({ data }: MonthOnMonthComparisonProps) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-surface border border-surface-light rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Month-on-Month Analysis</h3>
        <p className="text-text-muted text-center py-8">Insufficient data for comparison</p>
      </div>
    )
  }

  const getLastTwoMonths = () => {
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return {
      current: sorted[0],
      previous: sorted[1],
    }
  }

  const { current, previous } = getLastTwoMonths()

  const calculateChange = (currentVal: number, previousVal: number) => {
    if (previousVal === 0) return 0
    return ((currentVal - previousVal) / previousVal) * 100
  }

  const metrics = [
    {
      label: 'Utilization Rate',
      current: current.utilization,
      previous: previous.utilization,
      unit: '%',
      suffix: '',
      format: (val: number) => val.toFixed(1),
    },
    {
      label: 'Project Hours',
      current: current.projectHours,
      previous: previous.projectHours,
      unit: '',
      suffix: 'h',
      format: (val: number) => val.toFixed(0),
    },
    {
      label: 'Target Hours',
      current: current.targetHours,
      previous: previous.targetHours,
      unit: '',
      suffix: 'h',
      format: (val: number) => val.toFixed(0),
    },
    {
      label: 'Efficiency',
      current: (current.projectHours / current.targetHours) * 100,
      previous: (previous.projectHours / previous.targetHours) * 100,
      unit: '%',
      suffix: '',
      format: (val: number) => val.toFixed(1),
    },
  ]

  const getChangeColor = (change: number) => {
    if (change > 2) return 'text-success'
    if (change < -2) return 'text-danger'
    return 'text-warning'
  }

  const getChangeBgColor = (change: number) => {
    if (change > 2) return 'bg-success/10 border-success/20'
    if (change < -2) return 'bg-danger/10 border-danger/20'
    return 'bg-warning/10 border-warning/20'
  }

  const getTrendIcon = (change: number) => {
    if (change > 2) return <TrendingUp className="w-4 h-4" />
    if (change < -2) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Month-on-Month Analysis</h3>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>{previous.period}</span>
          <ArrowRight className="w-4 h-4" />
          <span className="font-semibold text-text-primary">{current.period}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const change = calculateChange(metric.current, metric.previous)
          const isPositive = change > 0

          return (
            <div
              key={i}
              className={`border rounded-lg p-4 transition-all hover:shadow-lg cursor-pointer ${getChangeBgColor(change)}`}
            >
              <div className="text-xs font-medium text-text-muted mb-3">{metric.label}</div>

              {/* Current Value */}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-text-primary">
                  {metric.format(metric.current)}
                </span>
                <span className="text-sm text-text-muted">{metric.suffix || metric.unit}</span>
              </div>

              {/* Comparison */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-text-muted">
                  vs {metric.format(metric.previous)}{metric.suffix || metric.unit}
                </div>
                <div className={`flex items-center gap-1 ${getChangeColor(change)}`}>
                  {getTrendIcon(change)}
                  <span className="text-xs font-semibold">
                    {isPositive ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex gap-2">
                  <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/40 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metric.previous / Math.max(metric.current, metric.previous)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metric.current / Math.max(metric.current, metric.previous)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t border-surface-light">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Key Insights</h4>
        <div className="space-y-2">
          {metrics.map((metric, i) => {
            const change = calculateChange(metric.current, metric.previous)
            if (Math.abs(change) < 2) return null
            
            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className={`mt-0.5 ${getChangeColor(change)}`}>
                  {getTrendIcon(change)}
                </div>
                <p className="text-text-muted">
                  <span className="font-medium text-text-primary">{metric.label}</span>
                  {change > 0 ? ' increased' : ' decreased'} by{' '}
                  <span className={`font-semibold ${getChangeColor(change)}`}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                  {' '}compared to {previous.period}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
