'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface InteractiveTooltipProps {
  title: string
  value: string | number
  details?: string[]
  comparison?: {
    label: string
    value: string | number
  }
  children: React.ReactNode
}

export default function InteractiveTooltip({ title, value, details, comparison, children }: InteractiveTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative inline-block cursor-help"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="fixed z-50 animate-in fade-in duration-200"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-background border border-surface-light rounded-lg shadow-2xl p-4 max-w-xs">
            {/* Header */}
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
                <p className="text-lg font-bold text-primary mt-1">{value}</p>
              </div>
            </div>

            {/* Details */}
            {details && details.length > 0 && (
              <div className="mb-3 space-y-1">
                {details.map((detail, i) => (
                  <p key={i} className="text-xs text-text-muted flex items-start gap-1">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{detail}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Comparison */}
            {comparison && (
              <div className="pt-3 border-t border-surface-light">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{comparison.label}</span>
                  <span className="font-semibold text-text-primary">{comparison.value}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-background border-r border-b border-surface-light transform rotate-45 -mt-1.5" />
        </div>
      )}
    </>
  )
}
