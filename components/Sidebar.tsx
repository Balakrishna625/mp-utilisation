'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react'

interface NavItem {
  icon: any
  label: string
  href: string
  external?: boolean
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Mentor Mentee Mapping', href: '/mentor-mentee' },
    { icon: FileText, label: 'MP Projects', href: '/mp-projects' },
    { icon: FileText, label: 'Reports', href: '/reports' },
    { icon: Sparkles, label: 'AI Analytics', href: '/ai-analytics' },
    { icon: Upload, label: 'Upload Data', href: '/upload' },
    { icon: ExternalLink, label: 'MP 2025 updates', href: 'https://modernplatforms.app.presidio.com/', external: true },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <aside 
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-surface border-r border-surface-light transition-all duration-300 flex flex-col`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-light">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#00CED1] font-bold text-xs tracking-wide">PRESIDIO</span>
              <span className="text-text-primary font-semibold text-base leading-tight">MP Utilisation</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-surface-light rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = !item.external && pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : '_self'}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'justify-start'
              } px-3 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-20 bg-surface-light px-3 py-2 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  <span className="text-text-primary text-sm font-medium">{item.label}</span>
                </div>
              )}
            </a>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className={`border-t border-surface-light p-4 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">AD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium text-sm truncate">Admin User</p>
              <p className="text-text-muted text-xs truncate">admin@company.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
