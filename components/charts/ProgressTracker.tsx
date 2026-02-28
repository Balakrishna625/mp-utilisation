'use client'

import { Target, Calendar, Clock, Award } from 'lucide-react'

interface ProgressMilestone {
  label: string
  value: number
  target: number
  unit: string
  icon: any
}

interface ProgressTrackerProps {
  milestones: ProgressMilestone[]
}

export default function ProgressTracker({ milestones }: ProgressTrackerProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success'
    if (percentage >= 70) return 'bg-warning'
    return 'bg-danger'
  }

  const getProgressBg = (percentage: number) => {
    if (percentage >= 90) return 'bg-success/10'
    if (percentage >= 70) return 'bg-warning/10'
    return 'bg-danger/10'
  }

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Progress Milestones</h3>
      
      <div className="space-y-6">
        {milestones.map((milestone, i) => {
          const Icon = milestone.icon
          const percentage = Math.min((milestone.value / milestone.target) * 100, 100)
          
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${getProgressBg(percentage)} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${getProgressColor(percentage).replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {milestone.label}
                  </span>
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  {milestone.value} / {milestone.target} {milestone.unit}
                </div>
              </div>
              
              <div className="relative h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${getProgressColor(percentage)} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="mt-1 text-xs text-text-muted text-right">
                {percentage.toFixed(0)}% Complete
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
