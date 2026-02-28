'use client'

import { useMemo } from 'react'

interface FringeTrackerProps {
  monthlyRecords: any[]
  selectedFY: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function FringeTracker({ monthlyRecords, selectedFY }: FringeTrackerProps) {
  const { fringeData, maxFringe, avgFringe, totalFringe } = useMemo(() => {
    // Filter records by selected FY
    const filteredRecords = monthlyRecords
      .filter(record => record.financialYear === selectedFY)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Create a map of month -> data, aggregating multiple weekly records per month
    const dataMap = new Map()
    filteredRecords.forEach(record => {
      const existing = dataMap.get(record.month)
      if (existing) {
        // Sum all values for multiple weekly records in the same month
        dataMap.set(record.month, {
          month: record.month,
          fringe: existing.fringe + (record.fringe || 0),
          targetHours: record.targetHours || existing.targetHours,
          project: existing.project + (record.project || 0),
          pmn: existing.pmn + (record.pmn || 0),
          wPresales: existing.wPresales + (record.wPresales || 0),
        })
      } else {
        // First record for this month
        dataMap.set(record.month, {
          month: record.month,
          fringe: record.fringe || 0,
          targetHours: record.targetHours || 160,
          project: record.project || 0,
          pmn: record.pmn || 0,
          wPresales: record.wPresales || 0,
        })
      }
    })
    
    const maxFringe = Math.max(...Array.from(dataMap.values()).map(d => d.fringe), 1)
    const totalFringe = Array.from(dataMap.values()).reduce((sum, d) => sum + d.fringe, 0)
    const avgFringe = dataMap.size > 0 ? totalFringe / dataMap.size : 0
    
    return { fringeData: dataMap, maxFringe, avgFringe, totalFringe }
  }, [monthlyRecords, selectedFY])

  const getColorIntensity = (fringe: number) => {
    if (fringe === 0) return 'bg-slate-800/50 border-slate-700/30'
    const intensity = (fringe / maxFringe) * 100
    
    if (intensity >= 67) return 'bg-red-500/80 border-red-400/50 shadow-lg shadow-red-500/20'
    if (intensity >= 33) return 'bg-yellow-500/60 border-yellow-400/50 shadow-md shadow-yellow-500/20'
    return 'bg-emerald-500/50 border-emerald-400/50 shadow-md shadow-emerald-500/20'
  }

  const getTextColor = (fringe: number) => {
    if (fringe === 0) return 'text-slate-500'
    const intensity = (fringe / maxFringe) * 100
    if (intensity >= 33) return 'text-white font-bold'
    return 'text-slate-200 font-semibold'
  }

  if (fringeData.size === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-purple-500/10 rounded-full mb-4">
            <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No Fringe Data</h3>
          <p className="text-sm text-slate-500">Upload monthly data to track fringe hours</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            Fringe Hours Heat Map
          </h3>
          <p className="text-sm text-slate-400 mt-1">Monthly activity intensity - {selectedFY}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {totalFringe.toFixed(0)}h
          </div>
          <div className="text-xs text-slate-500">Total fringe</div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {MONTHS.map((month) => {
          const data = fringeData.get(month)
          const fringe = data?.fringe || 0
          const hasData = data !== undefined
          
          return (
            <div
              key={month}
              className={`
                group relative rounded-xl p-4 transition-all duration-300
                ${hasData ? 'hover:scale-110 cursor-pointer' : 'opacity-40'}
                ${getColorIntensity(fringe)}
                border-2
              `}
            >
              {/* Month Content */}
              <div className="text-center space-y-1">
                <div className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                  {month}
                </div>
                <div className={`text-2xl ${getTextColor(fringe)}`}>
                  {hasData ? fringe : '-'}
                </div>
                {hasData && (
                  <div className="text-[10px] text-slate-400">
                    hours
                  </div>
                )}
              </div>

              {/* Hover Tooltip */}
              {hasData && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                  <div className="text-xs font-semibold text-white mb-1">{month} {selectedFY}</div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Fringe:</span>
                      <span className="text-purple-400 font-medium">{fringe}h</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Project:</span>
                      <span className="text-blue-400 font-medium">{data.project}h</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">PMN:</span>
                      <span className="text-emerald-400 font-medium">{data.pmn}h</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Presales:</span>
                      <span className="text-amber-400 font-medium">{data.wPresales}h</span>
                    </div>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-700">
                    <div className="text-[10px] text-slate-500">
                      {((fringe / data.targetHours) * 100).toFixed(1)}% of {data.targetHours}h target
                    </div>
                  </div>
                </div>
              )}

              {/* Pulse Animation for High Values */}
              {hasData && fringe >= maxFringe * 0.67 && (
                <div className="absolute inset-0 rounded-xl bg-red-500/20 animate-pulse pointer-events-none"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Stats Row */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-500 mb-1">Average</div>
            <div className="text-lg font-bold text-slate-200">{avgFringe.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Peak Month</div>
            <div className="text-lg font-bold text-red-400">
              {Array.from(fringeData.entries()).reduce((max, [month, data]) => 
                data.fringe > (max.fringe || 0) ? { month, fringe: data.fringe } : max
              , { month: '-', fringe: 0 }).month}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Months Tracked</div>
            <div className="text-lg font-bold text-emerald-400">{fringeData.size}/12</div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Intensity</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Low</span>
            <div className="flex gap-1">
              <div className="w-8 h-3 rounded bg-emerald-500/50"></div>
              <div className="w-8 h-3 rounded bg-yellow-500/60"></div>
              <div className="w-8 h-3 rounded bg-red-500/80"></div>
            </div>
            <span className="text-xs text-slate-500">High</span>
          </div>
        </div>
      </div>
    </div>
  )
}
