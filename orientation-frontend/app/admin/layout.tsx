"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AdminNavbar from "../layouts/AdminNavbar"
import HomeButton from "../components/navigation/HomeButton"
import DashboardButton from "../components/navigation/DashboardButton"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Only run on client
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")

    const isAdminLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/")

    // Allow access to login page without auth
    if (isAdminLogin) {
      setAuthorized(true)
      return
    }

    if (!token) {
      router.replace("/admin/login")
      return
    }

    if (role !== "ADMIN") {
      router.replace("/access-denied")
      return
    }

    setAuthorized(true)
  }, [pathname, router])



  // Don't render anything while checking auth (prevents flash)
  if (!authorized && pathname !== "/admin/login") {
    return null
  }

  const isAuthPage = pathname === "/admin/login"

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <AdminNavbar />
      <main className="min-h-screen w-full pt-16">
        {children}
      </main>
      {/* Fixed navigation buttons - bottom-left for quick access */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2">
        <HomeButton compact />
        <DashboardButton compact />
      </div>
    </>
  )
}
