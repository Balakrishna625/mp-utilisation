import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0e1a',
        surface: '#141824',
        'surface-light': '#1e2433',
        primary: '#3b82f6',
        'primary-dark': '#2563eb',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
      },
    },
  },
  plugins: [],
}
export default config
