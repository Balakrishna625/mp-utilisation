'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Upload, Trash2, Search, Calendar, Users, BarChart3, TrendingUp, AlertTriangle, Filter, MapPin, Briefcase, X } from 'lucide-react'
import { projectStorageService } from '@/lib/projectStorage'
import ProjectUpload from '@/components/ProjectUpload'
import LastUpdated from '@/components/LastUpdated'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import type { MPProject } from '@/types/project'

type FilterType = 'all' | 'east' | 'west' | 'tm' | 'fixedfee' | 'pod' | 'active' | 'ending-soon'

export default function MPProjectsPage() {
  const [projects, setProjects] = useState<MPProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const projectsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = () => {
    setLoading(true)
    setTimeout(() => {
      const data = projectStorageService.getProjects()
      const metadata = projectStorageService.getMetadata()
      setProjects(data)
      setLastUpdated(metadata?.lastUpdated || null)
      setLoading(false)
    }, 200)
  }

  const handleUploadSuccess = () => {
    loadProjects()
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all project data?')) {
      projectStorageService.clearProjects()
      loadProjects()
    }
  }

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(activeFilter === filter ? 'all' : filter)
    // Auto-scroll to projects section
    setTimeout(() => {
      projectsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const active = projects.filter(p => p.status.toLowerCase() === 'active').length
    
    const typeCount: Record<string, number> = {}
    const regionCount: Record<string, number> = {}
    const practiceCount: Record<string, number> = {}
    
    projects.forEach(p => {
      typeCount[p.projectType] = (typeCount[p.projectType] || 0) + 1
      regionCount[p.region] = (regionCount[p.region] || 0) + 1
      practiceCount[p.practice] = (practiceCount[p.practice] || 0) + 1
    })
    
    const avgDuration = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.duration, 0) / projects.length)
      : 0
    
    // Projects ending in next 30 days
    const today = new Date()
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const endingSoon = projects.filter(p => {
      if (!p.endDate) return false
      const endDate = new Date(p.endDate)
      return endDate >= today && endDate <= thirtyDaysLater
    }).length

    // Region counts
    const east = projects.filter(p => p.region?.toLowerCase() === 'east').length
    const west = projects.filter(p => p.region?.toLowerCase() === 'west').length

    // Project type counts
    const tm = projects.filter(p => p.projectType?.toLowerCase() === 't&m').length
    const fixedFee = projects.filter(p => p.projectType?.toLowerCase() === 'fixed fee').length
    const pod = projects.filter(p => p.projectType?.toLowerCase() === 'pod').length
    
    return {
      total: projects.length,
      active,
      typeCount,
      regionCount,
      practiceCount,
      avgDuration,
      endingSoon,
      east,
      west,
      tm,
      fixedFee,
      pod
    }
  }, [projects])

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.accountManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.resources.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Apply active filter
      let matchesFilter = true
      if (activeFilter === 'active') {
        matchesFilter = p.status.toLowerCase() === 'active'
      } else if (activeFilter === 'ending-soon') {
        const today = new Date()
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (p.endDate) {
          const endDate = new Date(p.endDate)
          matchesFilter = endDate >= today && endDate <= thirtyDaysLater
        } else {
          matchesFilter = false
        }
      } else if (activeFilter === 'east') {
        matchesFilter = p.region?.toLowerCase() === 'east'
      } else if (activeFilter === 'west') {
        matchesFilter = p.region?.toLowerCase() === 'west'
      } else if (activeFilter === 'tm') {
        matchesFilter = p.projectType?.toLowerCase() === 't&m'
      } else if (activeFilter === 'fixedfee') {
        matchesFilter = p.projectType?.toLowerCase() === 'fixed fee'
      } else if (activeFilter === 'pod') {
        matchesFilter = p.projectType?.toLowerCase() === 'pod'
      }
      
      return matchesSearch && matchesFilter
    })
  }, [projects, searchTerm, activeFilter])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Projects Data</h3>
          <p className="text-text-secondary mb-6">Upload a CSV file to get started</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Projects Data</span>
          </button>
        </div>
        {showUpload && <ProjectUpload onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />}
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
            <h1 className="text-3xl font-bold text-text-primary mb-2">MP Projects</h1>
            <p className="text-text-secondary">Track and manage Modern Platforms projects</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/30"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload Data</span>
            </button>
            <button
              onClick={handleClearData}
              className="flex items-center space-x-2 px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Clear Data</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Projects */}
          <button
            onClick={() => handleFilterClick('all')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              activeFilter === 'all' 
                ? 'border-primary shadow-xl shadow-primary/30' 
                : 'border-surface-light hover:border-primary/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Total Projects</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                activeFilter === 'all' ? 'bg-primary' : 'bg-primary/10 group-hover:bg-primary/20'
              }`}>
                <BarChart3 className={`w-5 h-5 ${activeFilter === 'all' ? 'text-white' : 'text-primary'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{stats.total}</p>
            <p className="text-success text-sm font-semibold">{stats.active} Active</p>
          </button>

          {/* Active Projects */}
          <button
            onClick={() => handleFilterClick('active')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              activeFilter === 'active' 
                ? 'border-success shadow-xl shadow-success/30' 
                : 'border-surface-light hover:border-success/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Active Projects</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                activeFilter === 'active' ? 'bg-success' : 'bg-success/10 group-hover:bg-success/20'
              }`}>
                <TrendingUp className={`w-5 h-5 ${activeFilter === 'active' ? 'text-white' : 'text-success'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{stats.active}</p>
            <p className="text-text-secondary text-sm">currently running</p>
          </button>

          {/* Ending Soon */}
          <button
            onClick={() => handleFilterClick('ending-soon')}
            className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.02] ${
              activeFilter === 'ending-soon' 
                ? 'border-warning shadow-xl shadow-warning/30' 
                : 'border-surface-light hover:border-warning/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Ending Soon</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                activeFilter === 'ending-soon' ? 'bg-warning' : 'bg-warning/10 group-hover:bg-warning/20'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${activeFilter === 'ending-soon' ? 'text-white' : 'text-warning'}`} />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{stats.endingSoon}</p>
            <p className="text-warning text-sm font-semibold">next 30 days</p>
          </button>

          {/* Avg Duration */}
          <div className="bg-surface border border-surface-light rounded-xl p-6 hover:border-accent/50 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Avg Duration</p>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-text-primary text-5xl font-black mb-2">{stats.avgDuration}</p>
            <p className="text-text-secondary text-sm">days per project</p>
          </div>
        </div>

        {/* Region Filters */}
        <div className="px-8 mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Projects by Region</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* East */}
            <button
              onClick={() => handleFilterClick('east')}
              className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.01] ${
                activeFilter === 'east' 
                  ? 'border-primary shadow-xl shadow-primary/30' 
                  : 'border-surface-light hover:border-primary/50 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">East Region</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  activeFilter === 'east' ? 'bg-primary' : 'bg-primary/10 group-hover:bg-primary/20'
                }`}>
                  <MapPin className={`w-5 h-5 ${activeFilter === 'east' ? 'text-white' : 'text-primary'}`} />
                </div>
              </div>
              <p className="text-text-primary text-5xl font-black mb-2">{stats.east}</p>
              <p className="text-text-secondary text-sm">
                {((stats.east / stats.total) * 100).toFixed(1)}% of total
              </p>
            </button>

            {/* West */}
            <button
              onClick={() => handleFilterClick('west')}
              className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.01] ${
                activeFilter === 'west' 
                  ? 'border-secondary shadow-xl shadow-secondary/30' 
                  : 'border-surface-light hover:border-secondary/50 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">West Region</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  activeFilter === 'west' ? 'bg-secondary' : 'bg-secondary/10 group-hover:bg-secondary/20'
                }`}>
                  <MapPin className={`w-5 h-5 ${activeFilter === 'west' ? 'text-white' : 'text-secondary'}`} />
                </div>
              </div>
              <p className="text-text-primary text-5xl font-black mb-2">{stats.west}</p>
              <p className="text-text-secondary text-sm">{((stats.west / stats.total) * 100).toFixed(1)}% of total</p>
            </button>
          </div>
        </div>

        {/* Project Type Filters */}
        <div className="px-8 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Projects by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* T&M */}
            <button
              onClick={() => handleFilterClick('tm')}
              className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.01] ${
                activeFilter === 'tm' 
                  ? 'border-accent shadow-xl shadow-accent/30' 
                  : 'border-surface-light hover:border-accent/50 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Time & Material</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  activeFilter === 'tm' ? 'bg-accent' : 'bg-accent/10 group-hover:bg-accent/20'
                }`}>
                  <Briefcase className={`w-5 h-5 ${activeFilter === 'tm' ? 'text-white' : 'text-accent'}`} />
                </div>
              </div>
              <p className="text-text-primary text-5xl font-black mb-2">{stats.tm}</p>
              <p className="text-text-secondary text-sm">{((stats.tm / stats.total) * 100).toFixed(1)}% of total</p>
            </button>

            {/* Fixed Fee */}
            <button
              onClick={() => handleFilterClick('fixedfee')}
              className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.01] ${
                activeFilter === 'fixedfee' 
                  ? 'border-success shadow-xl shadow-success/30' 
                  : 'border-surface-light hover:border-success/50 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Fixed Fee</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  activeFilter === 'fixedfee' ? 'bg-success' : 'bg-success/10 group-hover:bg-success/20'
                }`}>
                  <Briefcase className={`w-5 h-5 ${activeFilter === 'fixedfee' ? 'text-white' : 'text-success'}`} />
                </div>
              </div>
              <p className="text-text-primary text-5xl font-black mb-2">{stats.fixedFee}</p>
              <p className="text-text-secondary text-sm">{((stats.fixedFee / stats.total) * 100).toFixed(1)}% of total</p>
            </button>

            {/* POD */}
            <button
              onClick={() => handleFilterClick('pod')}
              className={`group bg-surface border rounded-xl p-6 text-left transition-all hover:scale-[1.01] ${
                activeFilter === 'pod' 
                  ? 'border-warning shadow-xl shadow-warning/30' 
                  : 'border-surface-light hover:border-warning/50 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">POD</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  activeFilter === 'pod' ? 'bg-warning' : 'bg-warning/10 group-hover:bg-warning/20'
                }`}>
                  <Briefcase className={`w-5 h-5 ${activeFilter === 'pod' ? 'text-white' : 'text-warning'}`} />
                </div>
              </div>
              <p className="text-text-primary text-5xl font-black mb-2">{stats.pod}</p>
              <p className="text-text-secondary text-sm">{((stats.pod / stats.total) * 100).toFixed(1)}% of total</p>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div ref={projectsRef} className="bg-surface border-t border-surface-light p-8">
          {/* Clear Filter Button */}
          {activeFilter !== 'all' && (
            <div className="mb-4 flex justify-between items-center">
              <div className="text-text-secondary">
                Showing <span className="text-primary font-semibold">{filteredProjects.length}</span> of {projects.length} projects
              </div>
              <button
                onClick={() => setActiveFilter('all')}
                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear Filter</span>
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by project name, manager, or resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-light border border-surface-light rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-6">
              Projects ({filteredProjects.length})
            </h2>
            
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface-light border border-surface-light rounded-xl p-6 hover:border-primary/30 transition-all"
                >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary mb-1">{project.projectName}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status.toLowerCase() === 'active' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-text-muted/20 text-text-muted'
                      }`}>
                        {project.status}
                      </span>
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                        {project.projectType}
                      </span>
                      <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-semibold">
                        {project.practice}
                      </span>
                      <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-semibold">
                        {project.region}
                      </span>
                    </div>
                  </div>
                  {project.duration > 0 && (
                    <div className="text-right">
                      <p className="text-text-muted text-xs">Duration</p>
                      <p className="text-text-primary font-bold">{project.duration} days</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {project.accountManager && (
                    <div>
                      <p className="text-text-muted">Account Manager</p>
                      <p className="text-text-primary font-medium">{project.accountManager}</p>
                    </div>
                  )}
                  {project.deliveryPOC && (
                    <div>
                      <p className="text-text-muted">Delivery POC</p>
                      <p className="text-text-primary font-medium">{project.deliveryPOC}</p>
                    </div>
                  )}
                  {project.startDate && (
                    <div>
                      <p className="text-text-muted">Start Date</p>
                      <p className="text-text-primary font-medium">{project.startDate}</p>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <p className="text-text-muted">End Date</p>
                      <p className="text-text-primary font-medium">{project.endDate}</p>
                    </div>
                  )}
                  {project.techstack && (
                    <div className="md:col-span-2">
                      <p className="text-text-muted">Tech Stack</p>
                      <p className="text-text-primary font-medium">{project.techstack}</p>
                    </div>
                  )}
                </div>

                {project.resources && (
                  <div className="mt-4 pt-4 border-t border-surface-light">
                    <p className="text-text-muted text-xs mb-2">Resources</p>
                    <p className="text-text-primary text-sm">{project.resources}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {showUpload && <ProjectUpload onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />}
    </div>
  )
}
