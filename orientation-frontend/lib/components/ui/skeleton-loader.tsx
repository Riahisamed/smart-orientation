"use client"

interface SkeletonLoaderProps {
  count?: number
  type?: 'card' | 'list' | 'chart' | 'bar'
  className?: string
}

export function SkeletonLoader({ count = 3, type = 'card', className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4 mb-4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full mb-3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-5/6" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className={`rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'bar') {
    return (
      <div className={`rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-1/4 mb-6" />
        <div className="flex items-end gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
              style={{ height: `${Math.random() * 100 + 40}px` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}
