"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, BarChart3, Users, Building2, Bell, 
  TrendingUp, Settings, Shield, LogOut, Menu, X, Sparkles,
  Megaphone
} from "lucide-react"
import { ThemeToggle } from "../components/theme-toggle"
import LanguageSwitcher from "../components/LanguageSwitcher"
import { useAuthUser } from "@/lib/use-auth-user"
import { useState } from "react"

const links = [
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Enterprises", href: "/admin/enterprises", icon: Building2 },
  { label: "Market Trends", href: "/market-trends", icon: TrendingUp },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    localStorage.removeItem("role")
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token")
      window.localStorage.removeItem("email")
      window.localStorage.removeItem("comparisonData")
    }
    router.push("/admin/login")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-purple-200/80 dark:border-purple-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white hidden sm:block">Admin Panel</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Link href="/admin/notifications" className="relative h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Bell className="h-4 w-4 text-slate-600" />
          </Link>

          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm font-medium">
              {user.initials}
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 py-2">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">Admin</span>
                  </div>
                  <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Settings className="h-4 w-4" /> Paramètres
                  </Link>
                  <hr className="my-1 border-slate-100 dark:border-slate-800" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                    <LogOut className="h-4 w-4" /> Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${pathname === link.href ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"}`}
              >
                <Icon className="h-4 w-4" /> {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}