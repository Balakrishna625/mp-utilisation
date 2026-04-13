#!/usr/bin/env python3
"""Writes the new Mentor-Mentee tree-view page."""
import os

PAGE = r'''"use client"
import ConfirmDialog from '@/components/ConfirmDialog'
import { useState, useEffect, useMemo } from 'react'
import {
  Search, Users, Upload, Trash2, UserCheck, UserX, Network,
  Mail, Briefcase, ChevronDown, ChevronRight, Activity,
  CheckCircle, AlertCircle, X as XIcon, GitBranch, List,
} from 'lucide-react'
import LastUpdated from '@/components/LastUpdated'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ReportUpload from '@/components/ReportUpload'

/* ─── types ─────────────────────────────────────────────── */
interface Employee {
  id: string
  name: string
  role: string
  email: string
  currentProject: string
  isAvailable: string
  tentativeProject?: string
  availableFrom?: string
  practice: string
  mentor?: string
  utilization: number
  remarks?: string
}

interface TreeNode {
  employee: Employee
  children: TreeNode[]
  depth: number
  descendantCount: number
}

type FilterType = 'employees' | 'connections' | 'without-mentors' | 'mentors-only'
type ViewMode = 'list' | 'tree'

/* ─── tree builder ───────────────────────────────────────── */
function buildMentorForest(employees: Employee[]): TreeNode[] {
  const byName = new Map<string, Employee>()
  employees.forEach(e => byName.set(e.name.toLowerCase().trim(), e))

  const menteesByMentor = new Map<string, Employee[]>()
  employees.forEach(e => {
    if (!e.mentor) return
    const key = e.mentor.toLowerCase().trim()
    if (!menteesByMentor.has(key)) menteesByMentor.set(key, [])
    menteesByMentor.get(key)!.push(e)
  })

  const isMentor = new Set(menteesByMentor.keys())

  // roots = employees who ARE mentors AND whose own mentor is absent in dataset
  const roots: Employee[] = []
  employees.forEach(e => {
    const key = e.name.toLowerCase().trim()
    if (!isMentor.has(key)) return
    if (!e.mentor || !byName.has(e.mentor.toLowerCase().trim())) {
      roots.push(e)
    }
  })

  function buildNode(emp: Employee, depth: number, visited: Set<string>): TreeNode {
    const key = emp.name.toLowerCase().trim()
    const nextVisited = new Set(visited)
    nextVisited.add(key)

    const childEmps = (menteesByMentor.get(key) || [])
      .filter(c => !nextVisited.has(c.name.toLowerCase().trim()))

    const children = childEmps
      .map(c => buildNode(c, depth + 1, nextVisited))
      .sort((a, b) => b.descendantCount - a.descendantCount)

    const descendantCount = children.reduce((s, c) => s + c.descendantCount + 1, 0)
    return { employee: emp, children, depth, descendantCount }
  }

  return roots
    .map(r => buildNode(r, 0, new Set()))
    .sort((a, b) => b.descendantCount - a.descendantCount)
}

/* ─── shared helpers ─────────────────────────────────────── */
function getInitials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function UtilizationBar({ value }: { value: number }) {
  const pct = Math.min(value, 100)
  const color =
    value >= 80 ? 'bg-green-500' : value >= 40 ? 'bg-blue-500' : 'bg-yellow-500'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-secondary w-10 text-right">{value}%</span>
    </div>
  )
}

/* ─── flat list components ───────────────────────────────── */
function MenteeCard({ mentee }: { mentee: Employee }) {
  return (
    <div className="relative overflow-hidden bg-surface border border-surface-light rounded-xl p-4 hover:border-accent/50 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-accent/80 to-cyan-500 rounded-xl flex items-center justify-center ring-1 ring-accent/30 shadow">
          <span className="text-white text-xs font-bold">{getInitials(mentee.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-semibold text-sm mb-0.5">{mentee.name}</p>
          <p className="text-text-secondary text-xs mb-1.5">{mentee.role}</p>
          {mentee.currentProject && mentee.currentProject !== 'N/A' && (
            <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
              <Briefcase className="w-3 h-3 flex-shrink-0 text-accent" />
              <span className="truncate">{mentee.currentProject}</span>
            </div>
          )}
          {mentee.email && (
            <div className="flex items-center gap-1 text-xs text-text-muted mb-1.5">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{mentee.email}</span>
            </div>
          )}
          {mentee.utilization > 0 && (
            <>
              <p className="text-text-muted text-xs">Utilization</p>
              <UtilizationBar value={mentee.utilization} />
            </>
          )}
          {mentee.availableFrom && (
            <p className="text-text-muted text-xs mt-1.5">
              Available from: <span className="text-text-secondary">{mentee.availableFrom}</span>
            </p>
          )}
          {mentee.remarks && (
            <p className="text-text-muted text-xs mt-1 italic truncate" title={mentee.remarks}>
              {mentee.remarks}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function MentorSection({
  mentor,
  mentees,
}: {
  mentor: Employee
  mentees: Employee[]
  searchTerm: string
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-5">
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left">
        <div className="relative overflow-hidden bg-gradient-to-r from-surface to-surface-light border border-primary/40 rounded-2xl p-5 hover:border-primary hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-primary/30">
                <span className="text-white text-lg font-black">{getInitials(mentor.name)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-accent to-cyan-500 rounded-lg flex items-center justify-center shadow-md border-2 border-surface">
                <Network className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-text-primary font-bold text-lg">{mentor.name}</h3>
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30 uppercase">
                  Mentor
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-1">{mentor.role}</p>
              <div className="flex items-center flex-wrap gap-3 text-xs text-text-muted">
                {mentor.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{mentor.email}</span>
                )}
                {mentor.currentProject && mentor.currentProject !== 'N/A' && (
                  <span className="flex items-center gap-1 max-w-xs truncate">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />{mentor.currentProject}
                  </span>
                )}
                {mentor.utilization > 0 && (
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{mentor.utilization}%</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
                <span className="text-accent text-xs font-black">{mentees.length}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted text-xs">
                <Users className="w-3 h-3" />
                {mentees.length} mentee{mentees.length !== 1 ? 's' : ''}
                {expanded ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronRight className="w-3.5 h-3.5 ml-1" />}
              </div>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 ml-6 pl-4 border-l-2 border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mentees.map((m, i) => (
              <MenteeCard key={m.id + i} mentee={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── TREE components ────────────────────────────────────── */
const DEPTH_STYLES = [
  {
    border: 'border-violet-500/60',
    gradient: 'from-violet-500/15 via-violet-500/5 to-transparent',
    line: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    avatar: 'from-violet-600 to-purple-500',
    ring: 'ring-violet-500/30',
    dot: 'bg-violet-500',
  },
  {
    border: 'border-blue-500/50',
    gradient: 'from-blue-500/10 via-blue-500/4 to-transparent',
    line: 'border-blue-500/25',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    avatar: 'from-blue-600 to-cyan-500',
    ring: 'ring-blue-500/25',
    dot: 'bg-blue-500',
  },
  {
    border: 'border-cyan-500/40',
    gradient: 'from-cyan-500/8 via-cyan-500/3 to-transparent',
    line: 'border-cyan-500/20',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    avatar: 'from-cyan-600 to-teal-500',
    ring: 'ring-cyan-500/20',
    dot: 'bg-cyan-400',
  },
  {
    border: 'border-teal-500/30',
    gradient: 'from-teal-500/6 to-transparent',
    line: 'border-teal-500/15',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
    avatar: 'from-teal-600 to-emerald-500',
    ring: 'ring-teal-500/15',
    dot: 'bg-teal-400',
  },
  {
    border: 'border-emerald-500/25',
    gradient: 'from-emerald-500/5 to-transparent',
    line: 'border-emerald-500/15',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    avatar: 'from-emerald-600 to-green-500',
    ring: 'ring-emerald-500/15',
    dot: 'bg-emerald-400',
  },
]

function depthStyle(depth: number) {
  return DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)]
}

function MentorTreeNode({
  node,
  searchTerm,
  depth,
}: {
  node: TreeNode
  searchTerm: string
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const ds = depthStyle(depth)
  const hasChildren = node.children.length > 0
  const isRoot = depth === 0
  const isBoth = hasChildren && !!node.employee.mentor

  const highlighted =
    searchTerm.length > 1 &&
    node.employee.name.toLowerCase().includes(searchTerm.toLowerCase())

  /* badge label */
  let badgeLabel = ''
  if (isRoot && hasChildren) badgeLabel = 'MENTOR'
  else if (isBoth) badgeLabel = 'MENTOR · MENTEE'
  else if (!hasChildren && depth > 0) badgeLabel = 'MENTEE'

  /* size scaling by depth */
  const cardPad = isRoot ? 'p-5' : depth === 1 ? 'p-4' : 'p-3'
  const avatarCls = isRoot
    ? 'w-12 h-12 text-base rounded-2xl'
    : depth === 1
    ? 'w-10 h-10 text-sm rounded-xl'
    : 'w-8 h-8 text-xs rounded-lg'
  const nameCls = isRoot ? 'text-base font-extrabold' : depth === 1 ? 'text-sm font-bold' : 'text-xs font-semibold'

  return (
    <div className="relative">
      {/* Node card */}
      <div
        className={`
          relative overflow-hidden bg-gradient-to-r ${ds.gradient}
          border ${ds.border} rounded-xl ${cardPad}
          transition-all duration-200 hover:shadow-lg hover:brightness-110
          ${highlighted ? 'ring-2 ring-accent shadow-accent/20 shadow-lg' : ''}
          ${isRoot ? 'rounded-2xl shadow-md' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className={`flex-shrink-0 ${avatarCls} bg-gradient-to-br ${ds.avatar} flex items-center justify-center shadow-md ring-1 ${ds.ring}`}
          >
            <span className="text-white font-bold leading-none">
              {getInitials(node.employee.name)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`text-text-primary ${nameCls}`}>
                {node.employee.name}
              </span>
              {badgeLabel && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${ds.badge} uppercase tracking-wide`}
                >
                  {badgeLabel}
                </span>
              )}
            </div>

            <p className="text-text-secondary text-xs mb-1">{node.employee.role}</p>

            {/* Show email + project only for shallow levels */}
            {depth <= 1 && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-text-muted">
                {node.employee.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {node.employee.email}
                  </span>
                )}
                {node.employee.currentProject &&
                  node.employee.currentProject !== 'N/A' && (
                    <span className="flex items-center gap-1 max-w-[220px] truncate">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      {node.employee.currentProject}
                    </span>
                  )}
              </div>
            )}

            {/* Utilisation bar */}
            {node.employee.utilization > 0 && depth <= 2 && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-24 h-1 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      node.employee.utilization >= 80
                        ? 'bg-green-500'
                        : node.employee.utilization >= 40
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(node.employee.utilization, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-text-secondary">
                  {node.employee.utilization}%
                </span>
              </div>
            )}
          </div>

          {/* Right side: stats + expand button */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-2">
            {node.descendantCount > 0 && (
              <div
                className={`px-2 py-0.5 text-[10px] font-black rounded-lg border ${ds.badge} whitespace-nowrap`}
              >
                {node.descendantCount} total
              </div>
            )}
            {hasChildren && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-text-muted text-xs hover:text-text-primary transition-colors"
              >
                <Users className="w-3 h-3" />
                {node.children.length}
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Child branch */}
      {hasChildren && expanded && (
        <div className={`mt-2 ml-6 pl-4 border-l-2 ${ds.line} space-y-2`}>
          {node.children.map((child, i) => (
            <MentorTreeNode
              key={child.employee.id + '-d' + (depth + 1) + '-' + i}
              node={child}
              searchTerm={searchTerm}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── page ───────────────────────────────────────────────── */
export default function MentorMenteePage() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('employees')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    loadData()
    const onFocus = () => loadData()
    const onVis = () => { if (!document.hidden) loadData() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports')
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        setData(
          result.data.map((r: any) => ({
            id: r.id || r.name,
            name: (r.name || '').trim(),
            role: r.role || '',
            email: r.email || '',
            currentProject: r.currentProject || '',
            isAvailable: r.isAvailable || 'Available',
            tentativeProject: r.tentativeProject,
            availableFrom: r.availableFrom,
            practice: r.practice || '',
            mentor: r.mentor ? (r.mentor as string).trim() || undefined : undefined,
            utilization:
              typeof r.currentProjectUtilization === 'number'
                ? r.currentProjectUtilization
                : 0,
            remarks: r.remarks,
          }))
        )
        setLastUpdated(result.metadata?.uploadedAt || null)
      } else {
        setData([])
      }
    } catch (e) {
      console.error('Failed to load:', e)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = async () => {
    const res = await fetch('/api/reports', { method: 'DELETE' })
    const r = await res.json()
    if (r.success) loadData()
  }

  /* ── flat-list groups (kept intact) ── */
  const mentorGroups = useMemo(() => {
    const byName = new Map<string, Employee>()
    data.forEach(e => byName.set(e.name.toLowerCase().trim(), e))

    const groups = new Map<string, { mentor: Employee; mentees: Employee[] }>()
    data.forEach(emp => {
      if (!emp.mentor) return
      const m = byName.get(emp.mentor.toLowerCase().trim())
      if (!m) return
      if (!groups.has(m.name)) groups.set(m.name, { mentor: m, mentees: [] })
      groups.get(m.name)!.mentees.push(emp)
    })

    return Array.from(groups.values()).sort((a, b) =>
      a.mentor.name.localeCompare(b.mentor.name)
    )
  }, [data])

  const totalConnections = mentorGroups.reduce((s, g) => s + g.mentees.length, 0)

  const unassigned = useMemo(() => {
    const mentorNameSet = new Set(mentorGroups.map(g => g.mentor.name.toLowerCase().trim()))
    return data.filter(e => !e.mentor && !mentorNameSet.has(e.name.toLowerCase().trim()))
  }, [data, mentorGroups])

  /* ── tree roots ── */
  const treeRoots = useMemo(() => buildMentorForest(data), [data])

  /* ── search-filtered tree ── */
  function filterTree(node: TreeNode, term: string): TreeNode | null {
    const matchesSelf = node.employee.name.toLowerCase().includes(term) ||
      node.employee.role.toLowerCase().includes(term) ||
      node.employee.email.toLowerCase().includes(term) ||
      node.employee.currentProject.toLowerCase().includes(term)
    const filteredChildren = node.children
      .map(c => filterTree(c, term))
      .filter(Boolean) as TreeNode[]
    if (matchesSelf || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }
    return null
  }

  const filteredTreeRoots = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return treeRoots
    const t = searchTerm.toLowerCase()
    return treeRoots.map(r => filterTree(r, t)).filter(Boolean) as TreeNode[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeRoots, searchTerm])

  /* ── flat list search ── */
  const displayedGroups = useMemo(() => {
    if (!searchTerm) return mentorGroups
    const t = searchTerm.toLowerCase()
    return mentorGroups
      .map(g => {
        const mentorMatches = g.mentor.name.toLowerCase().includes(t)
        return {
          mentor: g.mentor,
          mentees: mentorMatches
            ? g.mentees
            : g.mentees.filter(
                m =>
                  m.name.toLowerCase().includes(t) ||
                  m.role.toLowerCase().includes(t) ||
                  m.currentProject.toLowerCase().includes(t) ||
                  m.email.toLowerCase().includes(t)
              ),
        }
      })
      .filter(g => g.mentees.length > 0 || g.mentor.name.toLowerCase().includes(t))
  }, [mentorGroups, searchTerm])

  const displayedUnassigned = useMemo(() => {
    if (!searchTerm) return unassigned
    const t = searchTerm.toLowerCase()
    return unassigned.filter(e => e.name.toLowerCase().includes(t) || e.role.toLowerCase().includes(t))
  }, [unassigned, searchTerm])

  /* ── render ── */
  if (loading) return <LoadingSkeleton />

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Data Available</h3>
          <p className="text-text-secondary mb-6">
            Upload the Resource Tracker CSV to view mentor-mentee relationships
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Data</span>
          </button>
        </div>
        {showUpload && (
          <ReportUpload
            onClose={() => setShowUpload(false)}
            onUploadSuccess={count => {
              setToast({ type: 'success', msg: `${count ?? 0} records uploaded successfully` })
              loadData()
            }}
            onUploadError={msg => setToast({ type: 'error', msg })}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ConfirmDialog
        open={showConfirm}
        title="Clear Mentor-Mentee Data"
        message="Are you sure you want to clear all mentor-mentee data? This action cannot be undone."
        onConfirm={() => { setShowConfirm(false); handleClearData() }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border max-w-sm ${
            toast.type === 'success'
              ? 'bg-green-500/20 border-green-500/40 text-green-400'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium flex-1">{toast.msg}</p>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="px-8 pt-6 pb-2">
        <LastUpdated timestamp={lastUpdated} />
      </div>

      {/* Header */}
      <div className="px-8 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Mentor Mentee Mapping</h1>
          <p className="text-text-secondary">
            Mentorship relationships across {data.length} employees
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/20"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">Upload Data</span>
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Clear</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(
          [
            { label: 'Total Employees', value: data.length, Icon: Users, colorClass: 'border-primary shadow-primary/20', iconBg: 'bg-primary/10', iconColor: 'text-primary', key: 'employees' as FilterType },
            { label: 'Total Connections', value: totalConnections, Icon: Network, colorClass: 'border-secondary shadow-secondary/20', iconBg: 'bg-secondary/10', iconColor: 'text-secondary', key: 'connections' as FilterType },
            { label: 'Active Mentors', value: mentorGroups.length, Icon: UserCheck, colorClass: 'border-green-500 shadow-green-500/20', iconBg: 'bg-green-500/10', iconColor: 'text-green-400', key: 'mentors-only' as FilterType },
            { label: 'Without Mentor', value: unassigned.length, Icon: UserX, colorClass: 'border-yellow-500 shadow-yellow-500/20', iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-400', key: 'without-mentors' as FilterType },
          ] as const
        ).map(({ label, value, Icon, colorClass, iconBg, iconColor, key }) => (
          <button
            key={label}
            onClick={() => setFilter(key)}
            className={`bg-surface border rounded-xl p-5 text-left transition-all hover:shadow-md ${
              filter === key ? `${colorClass} shadow-lg` : 'border-surface-light'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">{label}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <p className="text-text-primary text-4xl font-black">{value}</p>
            {filter === key && (
              <p className={`${iconColor} text-xs font-bold uppercase mt-1`}>Active</p>
            )}
          </button>
        ))}
      </div>

      {/* Search + view toggle */}
      <div className="px-8 mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, role, project or email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-light rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        {/* View mode toggle — only show when not in "without-mentors" filter */}
        {filter !== 'without-mentors' && (
          <div className="flex items-center gap-1 bg-surface border border-surface-light rounded-lg p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'tree'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-8 pb-10">
        {filter === 'without-mentors' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                Employees Without Mentors ({displayedUnassigned.length})
              </h2>
              <button
                onClick={() => setFilter('employees')}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Show all
              </button>
            </div>
            {displayedUnassigned.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-xl border border-surface-light">
                <UserCheck className="w-16 h-16 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-text-primary mb-1">Perfect Coverage!</h3>
                <p className="text-text-secondary">All employees have mentors assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedUnassigned.map(emp => (
                  <MenteeCard key={emp.id} mentee={emp} />
                ))}
              </div>
            )}
          </>
        ) : viewMode === 'tree' ? (
          /* ══════════════ TREE VIEW ══════════════ */
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Mentor Tree
                <span className="ml-1 text-text-muted font-normal text-base">
                  — {filteredTreeRoots.length} root mentor{filteredTreeRoots.length !== 1 ? 's' : ''}
                </span>
              </h2>
              {/* depth legend */}
              <div className="hidden md:flex items-center gap-3 text-xs text-text-muted">
                {(['Level 1','Level 2','Level 3','Level 4+'] as const).map((lbl, i) => (
                  <span key={lbl} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${DEPTH_STYLES[i].dot}`} />
                    {lbl}
                  </span>
                ))}
              </div>
            </div>

            {filteredTreeRoots.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-xl border border-surface-light">
                <GitBranch className="w-16 h-16 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-bold text-text-primary mb-1">No Tree Found</h3>
                <p className="text-text-secondary">
                  {searchTerm ? 'Try adjusting your search' : 'No mentor-mentee hierarchy detected'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTreeRoots.map((root, i) => (
                  <MentorTreeNode
                    key={root.employee.id + '-root-' + i}
                    node={root}
                    searchTerm={searchTerm}
                    depth={0}
                  />
                ))}
              </div>
            )}

            {/* Unassigned section at bottom */}
            {!searchTerm && filter === 'employees' && unassigned.length > 0 && (
              <div className="mt-10 pt-6 border-t border-surface-light">
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-yellow-400" />
                  Employees Without Mentor Assignment
                  <span className="ml-1 px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-xs font-bold rounded-full border border-yellow-400/30">
                    {unassigned.length}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unassigned.map(emp => (
                    <MenteeCard key={emp.id} mentee={emp} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ══════════════ LIST VIEW (original) ══════════════ */
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">
                Mentor Network
                <span className="ml-2 text-text-muted font-normal text-base">
                  — {displayedGroups.length} mentor{displayedGroups.length !== 1 ? 's' : ''},{' '}
                  {displayedGroups.reduce((s, g) => s + g.mentees.length, 0)} connections
                </span>
              </h2>
              {(filter !== 'employees' || searchTerm) && (
                <button
                  onClick={() => { setFilter('employees'); setSearchTerm('') }}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            {displayedGroups.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-xl border border-surface-light">
                <Network className="w-16 h-16 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-bold text-text-primary mb-1">No Connections Found</h3>
                <p className="text-text-secondary">
                  {searchTerm ? 'Try adjusting your search' : 'No mentor-mentee pairs detected'}
                </p>
              </div>
            ) : (
              displayedGroups.map(({ mentor, mentees }) => (
                <MentorSection
                  key={mentor.id}
                  mentor={mentor}
                  mentees={mentees}
                  searchTerm={searchTerm}
                />
              ))
            )}

            {!searchTerm && filter === 'employees' && unassigned.length > 0 && (
              <div className="mt-8 pt-6 border-t border-surface-light">
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-yellow-400" />
                  Employees Without Mentor Assignment
                  <span className="ml-1 px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-xs font-bold rounded-full border border-yellow-400/30">
                    {unassigned.length}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unassigned.map(emp => (
                    <MenteeCard key={emp.id} mentee={emp} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && (
        <ReportUpload
          onClose={() => setShowUpload(false)}
          onUploadSuccess={count => {
            setToast({ type: 'success', msg: `${count ?? 0} records uploaded successfully` })
            loadData()
          }}
          onUploadError={msg => setToast({ type: 'error', msg })}
        />
      )}
    </div>
  )
}
'''

dest = os.path.join(os.path.dirname(__file__), '..', 'app', 'mentor-mentee', 'page.tsx')
dest = os.path.normpath(dest)

with open(dest, 'w', encoding='utf-8') as f:
    f.write(PAGE)

print(f"Written {len(PAGE)} chars to {dest}")
