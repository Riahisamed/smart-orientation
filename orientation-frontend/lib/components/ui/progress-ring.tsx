"use client"

interface ProgressRingProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  strokeWidth?: number
  label?: string
  className?: string
}

export function ProgressRing({
  percentage,
  size = 'md',
  strokeWidth = 4,
  label,
  className = '',
}: ProgressRingProps) {
  const sizes = {
    sm: 60,
    md: 80,
    lg: 120,
  }

  const radius = sizes[size]
  const circumference = 2 * Math.PI * (radius - strokeWidth)
  const offset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 80) return '#10b981' // green
    if (percentage >= 60) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="transform -rotate-90"
      >
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {percentage}%
        </span>
        {label && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</span>}
      </div>
    </div>
  )
}
