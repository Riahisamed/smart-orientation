"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.replace("/login")
      return
    }

    router.replace("/dashboard")
  }, [status, session, router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm font-medium">Authenticating...</p>
      </div>
    </div>
  )
}