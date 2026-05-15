"use client"

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  iconColor?: 'slate' | 'blue' | 'green' | 'amber' | 'red'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  iconColor = 'slate',
}: EmptyStateProps) {
  const iconColors = {
    slate: 'text-slate-300 dark:text-slate-600',
    blue: 'text-blue-300 dark:text-blue-600',
    green: 'text-green-300 dark:text-green-600',
    amber: 'text-amber-300 dark:text-amber-600',
    red: 'text-red-300 dark:text-red-600',
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center ${className}`}
    >
      {Icon && <Icon className={`h-16 w-16 mx-auto mb-4 ${iconColors[iconColor]}`} />}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
