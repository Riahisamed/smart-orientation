"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BadgePercent, GraduationCap, Loader2, LogOut, Mail, Settings, UserCircle2 } from "lucide-react"
import { Card, CardContent } from "lib/components/ui/card"
import { useAuthUser } from "@/lib/use-auth-user"

const formatMetric = (value: number | null) => {
  if (value == null) return "--"
  return value.toFixed(2)
}

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, logout, user } = useAuthUser()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const stats = [
    { label: "Bac Type", value: user.bacType, icon: GraduationCap },
    { label: "Bac Average", value: formatMetric(user.bacAverage), icon: BadgePercent },
    { label: "FG Score", value: formatMetric(user.fg), icon: BadgePercent },
  ]

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-10 pt-24 dark:bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-8 text-white">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-2 ring-white/30">
                    <UserCircle2 className="h-12 w-12" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-100">Compte utilisateur</p>
                    <h1 className="mt-2 text-3xl font-bold">{user.name}</h1>
                    <p className="mt-2 flex items-center gap-2 text-sm text-blue-50">
                      <Mail className="h-4 w-4" />
                      {user.email || "Email non disponible"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                    Parametres
                  </Link>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-950/30"
                  >
                    <LogOut className="h-4 w-4" />
                    Deconnexion
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-3">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Informations
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Resume du profil</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nom affiche</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Methode de connexion</p>
                  <p className="mt-2 text-base font-semibold capitalize text-slate-900 dark:text-slate-100">
                    {user.authProvider === "guest" ? "Non connecte" : user.authProvider}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:col-span-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Adresse email</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {user.email || "Aucun email enregistre"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Raccourcis
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Acces rapide</h2>
              </div>

              <Link
                href="/dashboard"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
              >
                Retour au dashboard
              </Link>
              <Link
                href="/orientation"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
              >
                Voir les orientations
              </Link>
              <Link
                href="/settings"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
              >
                Ouvrir les parametres
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
