"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthUser } from "@/lib/use-auth-user"

/**
 * Minimal client-side guard for student protected pages.
 * - Unauthenticated => /login
 * - Wrong role => /access-denied
 */
export default function StudentRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, logout, user } = useAuthUser()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    // Role stored in localStorage by existing auth flow
    const role = typeof window !== "undefined" ? window.localStorage.getItem("role") : null
    if (role && role !== "STUDENT") {
      router.replace("/access-denied")
    }
  }, [isAuthenticated, isLoading, router])

  // Prevent initial render flashing protected content
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  const role = typeof window !== "undefined" ? window.localStorage.getItem("role") : null
  if (role && role !== "STUDENT") {
    return null
  }

  return <>{children}</>
}

