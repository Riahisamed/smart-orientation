"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type StudentProfile = {
  name?: string | null
  email?: string | null
  bacType?: string | null
  bacAverage?: number | string | null
  FG?: number | string | null
}

export type AuthUser = {
  name: string
  email: string
  bacType: string
  bacAverage: number | null
  fg: number | null
  initials: string
  authProvider: "local" | "google" | "guest"
}

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const getInitials = (name: string, email: string) => {
  const source = name || email || "Utilisateur"
  const parts = source
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "U"

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
}

export function useAuthUser() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [storedEmail, setStoredEmail] = useState("")
  const [hasLocalToken, setHasLocalToken] = useState(false)
  const [studentLoading, setStudentLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const token = window.localStorage.getItem("token")
    const email = window.localStorage.getItem("email") ?? ""

    setStoredEmail(email)
    setHasLocalToken(Boolean(token))

    if (!token) {
      setStudent(null)
      setStudentLoading(false)
      return
    }

    let active = true
    setStudentLoading(true)

    fetch(`${API_BASE_URL}/student/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const text = await response.text()
        return text ? (JSON.parse(text) as StudentProfile) : null
      })
      .then((data) => {
        if (!active) return
        setStudent(data)
      })
      .catch(() => {
        if (!active) return
        setStudent(null)
      })
      .finally(() => {
        if (!active) return
        setStudentLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user?.email, status])

  const user = useMemo<AuthUser>(() => {
    const email = student?.email || session?.user?.email || storedEmail || ""
    const name = student?.name || session?.user?.name || email.split("@")[0] || "Utilisateur"

    return {
      name,
      email,
      bacType: student?.bacType || "Non renseigné",
      bacAverage: parseNumber(student?.bacAverage),
      fg: parseNumber(student?.FG),
      initials: getInitials(name, email),
      authProvider: hasLocalToken ? "local" : session ? "google" : "guest",
    }
  }, [hasLocalToken, session, storedEmail, student])

  const isLoading = status === "loading" || studentLoading
  const isAuthenticated = hasLocalToken || Boolean(session)

  const logout = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token")
      window.localStorage.removeItem("email")
      window.localStorage.removeItem("comparisonData")
    }

    setHasLocalToken(false)
    setStudent(null)

    if (session) {
      await signOut({ callbackUrl: "/login" })
      return
    }

    router.replace("/login")
    router.refresh()
  }

  return {
    isAuthenticated,
    isLoading,
    logout,
    session,
    status,
    student,
    user,
  }
}
