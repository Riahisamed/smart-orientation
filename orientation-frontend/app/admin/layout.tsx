"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AdminNavbar from "../layouts/AdminNavbar"

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
    </>
  )
}
