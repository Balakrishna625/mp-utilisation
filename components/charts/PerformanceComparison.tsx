'use client'

interface ComparisonMetric {
  label: string
  current: number
  previous: number
  unit?: string
}

interface PerformanceComparisonProps {
  metrics: ComparisonMetric[]
}

export default function PerformanceComparison({ metrics }: PerformanceComparisonProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getChangeColor = (change: number) => {
    if (change > 5) return 'text-success'
    if (change < -5) return 'text-danger'
    return 'text-warning'
  }

  const getChangeBg = (change: number) => {
    if (change > 5) return 'bg-success/10'
    if (change < -5) return 'bg-danger/10'
    return 'bg-warning/10'
  }

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Period Comparison</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, i) => {
          const change = calculateChange(metric.current, metric.previous)
          const isPositive = change > 0
          
          return (
            <div key={i} className="bg-background rounded-lg p-4 border border-surface-light">
              <div className="text-sm text-text-muted mb-2">{metric.label}</div>
              
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-text-primary">
                    {metric.current.toFixed(1)}
                    {metric.unit && <span className="text-base font-normal text-text-muted ml-1">{metric.unit}</span>}
                  </div>
                  <div className="text-xs text-text-muted">
                    vs {metric.previous.toFixed(1)}{metric.unit} previous
                  </div>
                </div>
                
                <div className={`${getChangeBg(change)} ${getChangeColor(change)} px-2 py-1 rounded text-sm font-semibold`}>
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                </div>
              </div>
              
              {/* Visual bar comparison */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-text-muted">Current</div>
                  <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metric.current / Math.max(metric.current, metric.previous)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-text-muted">Previous</div>
                  <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-text-muted rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((metric.previous / Math.max(metric.current, metric.previous)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
