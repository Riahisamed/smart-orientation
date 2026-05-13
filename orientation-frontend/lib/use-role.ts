"use client"

/**
 * Role detection hook
 * Determines the current user's role from JWT token or localStorage
 */
export function useRole() {
  if (typeof window === "undefined") {
    return { role: null, isStudent: false, isEnterprise: false, isAdmin: false, isLoading: true }
  }

  const token = localStorage.getItem("token")
  const storedRole = localStorage.getItem("role")

  // Try to decode role from JWT payload
  let role: string | null = storedRole

  if (!role && token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      role = payload.role || "STUDENT"
    } catch {
      role = "STUDENT"
    }
  }

  return {
    role,
    isStudent: role === "STUDENT",
    isEnterprise: role === "ENTERPRISE",
    isAdmin: role === "ADMIN",
    isLoading: false,
  }
}

/**
 * Get role from token without React hook (for middleware)
 */
export function getRoleFromToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token")
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.role || "STUDENT"
  } catch {
    return null
  }
}

/**
 * Store role after login
 */
export function storeRole(role: string) {
  localStorage.setItem("role", role)
}

/**
 * Clear role on logout
 */
export function clearRole() {
  localStorage.removeItem("role")
}