import React from 'react'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={`bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-300/20 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90 ${className || ''}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={`p-6 pb-0 ${className || ''}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  className?: string
  children: React.ReactNode
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold ${className || ''}`}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  className?: string
  children: React.ReactNode
}

export function CardContent({ className, children }: CardContentProps) {
  return (
    <div className={`p-6 pt-0 ${className || ''}`}>
      {children}
    </div>
  )
}

interface CardDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-slate-500 ${className || ''}`}>
      {children}
    </p>
  )
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={`p-6 pt-0 ${className || ''}`}>
      {children}
    </div>
  )
}
