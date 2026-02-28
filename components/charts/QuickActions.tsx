'use client'

import { useState } from 'react'
import { Download, FileText, TrendingUp, Info, Lightbulb, Target } from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  action: () => void
  color: string
}

interface QuickActionsProps {
  onExportPDF?: () => void
  onViewTips?: () => void
  onSetGoals?: () => void
}

export default function QuickActions({ 
  onExportPDF, 
  onViewTips,
  onSetGoals 
}: QuickActionsProps) {
  const [showTips, setShowTips] = useState(false)

  const actions: QuickAction[] = [
    {
      id: 'export',
      title: 'Export Report',
      description: 'Download your performance summary',
      icon: Download,
      action: () => {
        // Generate and download PDF/Excel report
        const data = {
          exportDate: new Date().toISOString(),
          // Add performance data here
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        onExportPDF?.()
      },
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'tips',
      title: 'View Tips',
      description: 'Get performance improvement suggestions',
      icon: Lightbulb,
      action: () => {
        setShowTips(!showTips)
        onViewTips?.()
      },
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      id: 'goals',
      title: 'Set Goals',
      description: 'Define your performance targets',
      icon: Target,
      action: () => {
        onSetGoals?.()
        alert('Goal setting feature coming soon!')
      },
      color: 'from-green-500 to-green-600',
    },
  ]

  const tips = [
    {
      title: 'Consistency is Key',
      description: 'Try to maintain steady utilization rather than peaks and valleys.',
      icon: TrendingUp,
    },
    {
      title: 'Log Hours Daily',
      description: 'Update your time entries at the end of each day for accuracy.',
      icon: FileText,
    },
    {
      title: 'Plan Ahead',
      description: 'Review your weekly schedule on Mondays to optimize billable time.',
      icon: Target,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="bg-surface border border-surface-light rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon
            
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="group relative overflow-hidden bg-background border border-surface-light rounded-lg p-4 text-left transition-all hover:shadow-lg hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h4 className="text-sm font-semibold text-text-primary mb-1">
                    {action.title}
                  </h4>
                  <p className="text-xs text-text-muted">
                    {action.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Performance Tips */}
      {showTips && (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Performance Tips</h3>
          </div>
          
          <div className="space-y-3">
            {tips.map((tip, i) => {
              const Icon = tip.icon
              
              return (
                <div key={i} className="bg-surface/50 backdrop-blur-sm border border-surface-light rounded-lg p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-1">{tip.title}</h4>
                    <p className="text-xs text-text-muted">{tip.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
