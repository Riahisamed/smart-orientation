"use client"

interface SkillTagProps {
  name: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}

export function SkillTag({ name, variant = 'primary', className = '' }: SkillTagProps) {
  const variants = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    secondary: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {name}
    </span>
  )
}
