"use client"

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon?: LucideIcon
  label: string
  value: string | number
  change?: { value: number; isPositive: boolean }
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  className = ''
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {change && (
            <p
              className={`text-xs mt-2 ${
                change.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}% vs last period
            </p>
          )}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    </div>
  )
}
