'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, ArrowRight, Upload, Trash2, UserCheck, UserX, Network } from 'lucide-react'
import { storageService } from '@/lib/storage'
import LastUpdated from '@/components/LastUpdated'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import type { EmployeeUtilization } from '@/types/utilization'

interface MentorMenteeRelation {
  mentor: EmployeeUtilization
  mentee: EmployeeUtilization
}

type FilterType = 'all' | 'with-mentors' | 'without-mentors' | 'mentors-only'

export default function MentorMenteePage() {
  const router = useRouter()
  const [data, setData] = useState<EmployeeUtilization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    
    // Listen for custom data update events from upload
    const handleDataUpdate = () => {
      console.log('🔔 Mentor-Mentee: Received data update notification')
      loadData()
    }
    
    window.addEventListener('utilizationDataUpdated', handleDataUpdate)
    
    // Reload data when page becomes visible (e.g., after navigating from upload page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData()
      }
    }
    
    const handleFocus = () => {
      loadData()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    // Also set up storage event listener for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mp-utilization-data') {
        loadData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('utilizationDataUpdated', handleDataUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const loadData = () => {
    setLoading(true)
    setTimeout(() => {
      const storedData = storageService.getData()
      const metadata = storageService.getMetadata()
      console.log('🔄 Mentor-Mentee: Loading data from localStorage, found', storedData.length, 'employees')
      setData(storedData)
      setLastUpdated(metadata?.lastUpdated || null)
      setLoading(false)
    }, 200)
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      storageService.clearData()
      loadData()
    }
  }

  const handleNavigateToUpload = () => {
    router.push('/upload')
  }

  // Build flat mentor-mentee relationships
  const relationships = useMemo(() => {
    const relations: MentorMenteeRelation[] = []
    
    data.forEach(emp => {
      if (emp.mentor) {
        const mentor = data.find(m => m.name === emp.mentor)
        if (mentor) {
          relations.push({ mentor, mentee: emp })
        }
      }
    })

    return relations.sort((a, b) => a.mentor.name.localeCompare(b.mentor.name))
  }, [data])

  const filteredRelationships = useMemo(() => {
    if (!searchTerm) return relationships
    
    const term = searchTerm.toLowerCase()
    return relationships.filter(rel => 
      rel.mentor.name.toLowerCase().includes(term) ||
      rel.mentee.name.toLowerCase().includes(term) ||
      rel.mentor.title.toLowerCase().includes(term) ||
      rel.mentee.title.toLowerCase().includes(term)
    )
  }, [relationships, searchTerm])

  // Get unique mentors
  const uniqueMentors = useMemo(() => {
    return new Set(relationships.map(r => r.mentor.name))
  }, [relationships])

  // Filter based on selected tile
  const displayedData = useMemo(() => {
    switch (filter) {
      case 'with-mentors':
        return data.filter(e => e.mentor)
      case 'without-mentors':
        return data.filter(e => !e.mentor)
      case 'mentors-only':
        return data.filter(e => uniqueMentors.has(e.name))
      default:
        return data
    }
  }, [data, filter, uniqueMentors])

  const displayedRelationships = useMemo(() => {
    const filtered = filteredRelationships.filter(rel => {
      switch (filter) {
        case 'mentors-only':
          return true // Show all relationships when viewing mentors
        default:
          return true
      }
    })
    return filtered
  }, [filteredRelationships, filter])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Data Available</h3>
          <p className="text-text-secondary mb-6">Upload Reports data to view mentor-mentee relationships</p>
          <button
            onClick={handleNavigateToUpload}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Go to Upload Data</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-full">
        {/* Header */}
        <div className="px-8 pt-6 pb-2">
          <LastUpdated timestamp={lastUpdated} />
        </div>
        <div className="px-8 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Mentor Mentee Mapping</h1>
            <p className="text-text-secondary">View mentorship relationships between employees</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleNavigateToUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/30"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload Data</span>
            </button>
            {data.length > 0 && (
              <button
                onClick={handleClearData}
                className="flex items-center space-x-2 px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Clear Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-8 grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              filter === 'all' 
                ? 'border-primary shadow-xl shadow-primary/30' 
                : 'border-surface-light hover:border-primary/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Total Employees</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                filter === 'all' ? 'bg-primary' : 'bg-primary/10 group-hover:bg-primary/20'
              }`}>
                <Users className={`w-5 h-5 ${filter === 'all' ? 'text-white' : 'text-primary'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{data.length}</p>
            {filter === 'all' && <p className="text-primary text-xs font-bold uppercase tracking-wide">VIEWING ALL</p>}
          </button>
          
          <button 
            onClick={() => setFilter('all')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              filter === 'all' 
                ? 'border-secondary shadow-xl shadow-secondary/30' 
                : 'border-surface-light hover:border-secondary/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Total Connections</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                filter === 'all' ? 'bg-secondary' : 'bg-secondary/10 group-hover:bg-secondary/20'
              }`}>
                <Network className={`w-5 h-5 ${filter === 'all' ? 'text-white' : 'text-secondary'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{relationships.length}</p>
            <p className="text-text-secondary text-xs">mentor-mentee pairs</p>
          </button>
          
          <button 
            onClick={() => setFilter('mentors-only')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              filter === 'mentors-only' 
                ? 'border-success shadow-xl shadow-success/30' 
                : 'border-surface-light hover:border-success/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Active Mentors</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                filter === 'mentors-only' ? 'bg-success' : 'bg-success/10 group-hover:bg-success/20'
              }`}>
                <UserCheck className={`w-5 h-5 ${filter === 'mentors-only' ? 'text-white' : 'text-success'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{uniqueMentors.size}</p>
            {filter === 'mentors-only' && <p className="text-success text-xs font-bold uppercase tracking-wide">VIEWING MENTORS</p>}
          </button>
          
          <button 
            onClick={() => setFilter('without-mentors')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              filter === 'without-mentors' 
                ? 'border-warning shadow-xl shadow-warning/30' 
                : 'border-surface-light hover:border-warning/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Unassigned</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                filter === 'without-mentors' ? 'bg-warning' : 'bg-warning/10 group-hover:bg-warning/20'
              }`}>
                <UserX className={`w-5 h-5 ${filter === 'without-mentors' ? 'text-white' : 'text-warning'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">
              {data.filter(e => !e.mentor).length}
            </p>
            {filter === 'without-mentors' && <p className="text-warning text-xs font-bold uppercase tracking-wide">NEEDS ASSIGNMENT</p>}
          </button>
        </div>

        {/* Search */}
        <div className="px-8 mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by mentor or mentee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-light rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Relationships Visualization */}
        <div className="bg-surface border-t border-surface-light p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-text-primary">
              {filter === 'without-mentors' 
                ? `Employees Without Mentors (${displayedData.length})`
                : filter === 'mentors-only'
                ? `Active Mentors (${uniqueMentors.size})`
                : `Mentor Network (${displayedRelationships.length} connections)`
              }
            </h2>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Clear Filter
              </button>
            )}
          </div>
          
          {filter === 'without-mentors' ? (
            displayedData.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-success blur-2xl opacity-30 animate-pulse"></div>
                  <UserCheck className="relative w-20 h-20 text-success mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Perfect Coverage!</h3>
                <p className="text-text-secondary">All employees have mentors assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedData.map((emp) => (
                  <div
                    key={emp.id}
                    className="group relative overflow-hidden bg-gradient-to-br from-surface to-surface-light border border-warning/30 rounded-2xl p-5 hover:border-warning hover:shadow-xl hover:shadow-warning/20 transition-all hover:scale-[1.02]"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl group-hover:bg-warning/20 transition-colors"></div>
                    <div className="relative flex items-start space-x-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-warning via-orange-500 to-danger rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-warning/30">
                          <span className="text-white text-base font-bold">
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-warning rounded-full flex items-center justify-center animate-pulse">
                          <UserX className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-bold text-base mb-1 truncate">{emp.name}</p>
                        <p className="text-text-secondary text-sm mb-2 truncate">{emp.title}</p>
                        <div className="inline-flex items-center px-3 py-1 bg-warning/20 rounded-full">
                          <div className="w-2 h-2 bg-warning rounded-full animate-pulse mr-2"></div>
                          <span className="text-warning text-xs font-bold uppercase">Needs Mentor</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : displayedRelationships.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-primary blur-2xl opacity-20"></div>
                <Network className="relative w-20 h-20 text-text-muted mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No Connections Found</h3>
              <p className="text-text-secondary">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start building your mentor network'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Group by mentor */}
              {(() => {
                const mentorGroups: Record<string, MentorMenteeRelation[]> = {}
                displayedRelationships.forEach(rel => {
                  if (!mentorGroups[rel.mentor.name]) {
                    mentorGroups[rel.mentor.name] = []
                  }
                  mentorGroups[rel.mentor.name].push(rel)
                })
                
                return Object.entries(mentorGroups).map(([mentorName, rels]) => (
                  <div key={mentorName} className="relative">
                    {/* Mentor Hub Card - Enhanced */}
                    <div className="relative group mb-8">
                      {/* Animated Glow Background */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-2xl rounded-3xl group-hover:opacity-30 transition-opacity duration-500"></div>
                      
                      <div className="relative bg-gradient-to-br from-surface via-surface-light to-surface border-2 border-primary/50 rounded-3xl p-8 hover:border-primary hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01]">
                        <div className="flex items-center space-x-6">
                          {/* Avatar with enhanced styling */}
                          <div className="relative flex-shrink-0">
                            {/* Pulsing glow ring */}
                            <div className="absolute -inset-3 bg-gradient-to-r from-primary via-secondary to-primary opacity-50 blur-xl rounded-full animate-pulse"></div>
                            
                            {/* Main avatar */}
                            <div className="relative w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-primary/30 group-hover:ring-primary/50 transition-all">
                              <span className="text-white text-2xl font-black">
                                {rels[0].mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            
                            {/* Mentor Badge - Animated */}
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-success via-accent to-cyan-500 rounded-xl flex items-center justify-center shadow-xl animate-bounce" style={{ animationDuration: '2s' }}>
                              <Network className="w-5 h-5 text-white" />
                            </div>
                            
                            {/* Connection Count Badge */}
                            <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-gradient-to-r from-accent to-cyan-500 rounded-full shadow-lg">
                              <span className="text-white text-xs font-bold">{rels.length}</span>
                            </div>
                          </div>
                          
                          {/* Info Section */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-text-primary font-black text-2xl truncate">{rels[0].mentor.name}</h3>
                              <span className="flex-shrink-0 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-black rounded-full uppercase tracking-wider shadow-lg">
                                Mentor
                              </span>
                            </div>
                            <p className="text-text-secondary text-base mb-3 truncate">{rels[0].mentor.title}</p>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2 px-4 py-2 bg-accent/10 rounded-xl border border-accent/30">
                                <Users className="w-5 h-5 text-accent" />
                                <span className="text-accent text-sm font-bold">{rels.length} Mentee{rels.length > 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex-1 h-1 bg-gradient-to-r from-accent/30 via-primary/30 to-transparent rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connected Mentees - Enhanced Grid */}
                    <div className="relative pl-6 md:pl-16">
                      {/* Vertical Connection Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-transparent rounded-full hidden md:block"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {rels.map((rel, idx) => (
                          <div key={`${rel.mentee.id}-${idx}`} className="relative group/mentee">
                            {/* Horizontal Connection Line - Desktop only */}
                            <div className="absolute -left-6 md:-left-16 top-1/2 w-6 md:w-16 h-0.5 hidden md:block">
                              <div className="h-full bg-gradient-to-r from-primary/40 to-accent rounded-full group-hover/mentee:from-primary group-hover/mentee:to-accent transition-all duration-300"></div>
                            </div>
                            
                            {/* Connection Node */}
                            <div className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-lg shadow-accent/50 hidden md:block group-hover/mentee:scale-150 group-hover/mentee:shadow-accent transition-all duration-300"></div>

                            {/* Mentee Card - Enhanced */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-surface to-surface-light border border-accent/30 rounded-2xl p-5 hover:border-accent hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1">
                              {/* Animated background glow */}
                              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover/mentee:bg-accent/20 transition-colors duration-300"></div>
                              
                              <div className="relative flex items-start space-x-4">
                                {/* Mentee Avatar */}
                                <div className="relative flex-shrink-0">
                                  <div className="w-14 h-14 bg-gradient-to-br from-accent via-cyan-500 to-primary rounded-xl flex items-center justify-center shadow-lg ring-2 ring-accent/30 group-hover/mentee:ring-accent/60 transition-all">
                                    <span className="text-white text-base font-bold">
                                      {rel.mentee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </span>
                                  </div>
                                  
                                  {/* Connection indicator */}
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-lg flex items-center justify-center shadow-md border-2 border-surface group-hover/mentee:scale-110 transition-transform">
                                    <ArrowRight className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                                
                                {/* Mentee Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-text-primary font-bold text-base mb-1 truncate group-hover/mentee:text-accent transition-colors">{rel.mentee.name}</p>
                                  <p className="text-text-secondary text-sm mb-2 truncate">{rel.mentee.title}</p>
                                  <div className="inline-flex items-center px-3 py-1 bg-accent/20 rounded-full group-hover/mentee:bg-accent/30 transition-colors">
                                    <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                                    <span className="text-accent text-xs font-bold uppercase">Mentee</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
