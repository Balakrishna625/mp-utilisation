'use client'

interface PerformanceGaugeProps {
  value: number
  label: string
  maxValue?: number
}

export default function PerformanceGauge({ 
  value, 
  label,
  maxValue = 100 
}: PerformanceGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  const rotation = (percentage / 100) * 180 - 90

  const getColor = () => {
    if (percentage >= 90) return '#10b981' // success
    if (percentage >= 70) return '#f59e0b' // warning
    return '#ef4444' // danger
  }

  const getTextColor = () => {
    if (percentage >= 90) return 'text-success'
    if (percentage >= 70) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 mb-4">
        {/* Background arc */}
        <svg className="w-full h-full overflow-visible" viewBox="0 0 160 90">
          <path
            d="M 15 75 A 65 65 0 0 1 145 75"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-surface-light"
          />
          {/* Progress arc */}
          <path
            d="M 15 75 A 65 65 0 0 1 145 75"
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 204} 204`}
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className={`text-3xl font-bold ${getTextColor()}`}>
            {value.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="text-sm font-medium text-text-muted text-center">
        {label}
      </div>
    </div>
  )
}
