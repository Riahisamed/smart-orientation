import React from 'react'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
  children: React.ReactNode
  htmlFor?: string
}

export function Label({ className, children, htmlFor, ...props }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-semibold text-slate-700 dark:text-slate-200 ${className || ''}`} {...props}>
      {children}
    </label>
  )
}