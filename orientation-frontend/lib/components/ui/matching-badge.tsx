"use client"

interface MatchingBadgeProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MatchingBadge({
  percentage,
  showLabel = true,
  size = 'md',
  className = '',
}: MatchingBadgeProps) {
  const getBgColor = () => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (percentage >= 60) return 'bg-amber-100 dark:bg-amber-900/30'
    if (percentage >= 40) return 'bg-orange-100 dark:bg-orange-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const getTextColor = () => {
    if (percentage >= 80) return 'text-green-700 dark:text-green-400'
    if (percentage >= 60) return 'text-amber-700 dark:text-amber-400'
    if (percentage >= 40) return 'text-orange-700 dark:text-orange-400'
    return 'text-red-700 dark:text-red-400'
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const label = () => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Good'
    if (percentage >= 40) return 'Moderate'
    return 'Low'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${getBgColor()} ${getTextColor()} ${sizes[size]} ${className}`}
    >
      <span className="font-bold">{percentage}%</span>
      {showLabel && <span className="hidden sm:inline">{label()}</span>}
    </span>
  )
}
