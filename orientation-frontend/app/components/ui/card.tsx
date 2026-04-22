import * as React from "react"

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className = "", ...props }: DivProps) {
  return <div className={`rounded-2xl border bg-white text-slate-900 shadow-sm ${className}`} {...props} />
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
}

export function CardTitle({ className = "", ...props }: DivProps) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
}

export function CardDescription({ className = "", ...props }: DivProps) {
  return <p className={`text-sm text-slate-500 ${className}`} {...props} />
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />
}

export function CardFooter({ className = "", ...props }: DivProps) {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
}
