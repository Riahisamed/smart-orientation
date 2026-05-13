"use client"

import { useRouter } from "next/navigation"
import { Shield, AlertTriangle, ArrowLeft, Home } from "lucide-react"
import { Card, CardContent } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"

export default function AccessDeniedPage() {
  const router = useRouter()
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null

  const getRedirectUrl = () => {
    switch (role) {
      case "STUDENT": return "/dashboard"
      case "ENTERPRISE": return "/enterprise/dashboard"
      case "ADMIN": return "/admin"
      default: return "/choose-role"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border border-red-200 dark:border-red-800 shadow-lg text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Accès Refusé</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">
            Cette section est réservée à un type de compte spécifique.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push(getRedirectUrl())} className="rounded-xl">
              <Home className="h-4 w-4 mr-2" />
              Retourner à mon espace
            </Button>
            <Button onClick={() => router.push("/choose-role")} variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Changer de compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}