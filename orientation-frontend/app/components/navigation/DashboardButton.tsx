"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

interface DashboardButtonProps {
  className?: string
  compact?: boolean
}

type UserRole = "STUDENT" | "ENTERPRISE" | "ADMIN" | null

function detectRole(): UserRole {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("role")
  if (stored === "STUDENT" || stored === "ENTERPRISE" || stored === "ADMIN") {
    return stored
  }
  // Fallback: check token presence and path patterns
  const token = localStorage.getItem("token")
  if (!token) return null
  // Default to STUDENT if we have a token but no role
  return "STUDENT"
}

function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case "STUDENT": return "/dashboard"
    case "ENTERPRISE": return "/enterprise/dashboard"
    case "ADMIN": return "/admin"
    default: return "/choose-role"
  }
}

export default function DashboardButton({ className = "", compact = false }: DashboardButtonProps) {
  const [role, setRole] = useState<UserRole>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setRole(detectRole())
    setMounted(true)

    // Listen for storage changes (e.g. role update)
    const handleStorage = () => setRole(detectRole())
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // During SSR / initial mount, render nothing to avoid hydration mismatch
  if (!mounted) {
    return <div className={`h-9 w-9 ${className}`} />
  }

  const href = getDashboardUrl(role)

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
        compact
          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400"
          : "bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300 shadow-sm backdrop-blur-sm"
      } ${className}`}
      aria-label="Back to dashboard"
    >
      <LayoutDashboard className="h-4 w-4" />
      {!compact && <span className="hidden sm:inline">Dashboard</span>}
    </Link>
  )
}