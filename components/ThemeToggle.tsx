'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface/50 hover:bg-surface border border-surface-light transition-all duration-200 hover:scale-105"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-text-primary" />
      ) : (
        <Sun className="w-5 h-5 text-text-primary" />
      )}
    </button>
  )
}
