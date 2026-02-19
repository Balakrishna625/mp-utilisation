import { Clock } from 'lucide-react'

interface LastUpdatedProps {
  timestamp: string | null
}

export default function LastUpdated({ timestamp }: LastUpdatedProps) {
  if (!timestamp) return null

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="flex items-center space-x-2 text-text-muted text-xs">
      <Clock className="w-3 h-3" />
      <span>Last updated: {formatTimestamp(timestamp)}</span>
    </div>
  )
}
