"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, LogOut, Monitor, Moon, Settings2, Sun, UserCircle2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent } from "lib/components/ui/card"
import { useAuthUser } from "@/lib/use-auth-user"
import { useTranslations } from "@/lib/i18n/context"

const themeOptions = [
  {
    labelKey: "settings.system",
    value: "system",
    icon: Monitor,
  },
  {
    labelKey: "settings.light",
    value: "light",
    icon: Sun,
  },
  {
    labelKey: "settings.dark",
    value: "dark",
    icon: Moon,
  },
] as const

export default function SettingsPage() {
  const t = useTranslations()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
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

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-10 pt-24 dark:bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("settings.title")}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{t("settings.title")}</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
            >
              <UserCircle2 className="h-4 w-4" />
              {t("settings.profileTab")}
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t("settings.themeLabel")}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{t("settings.themeLabel")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {t("settings.themeDesc")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = (theme ?? "system") === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                          <Icon className="h-5 w-5" />
                        </div>
                        {isActive && <Check className="h-5 w-5" />}
                      </div>
                      <p className="mt-4 text-base font-semibold">{t(option.labelKey)}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {t("profile.userAccount")}
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("profile.userAccount")}</h2>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("auth.email")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                      {user.email || t("common.notAvailable")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.connectionMethod")}</p>
                    <p className="mt-1 text-base font-semibold capitalize text-slate-900 dark:text-slate-100">
                      {user.authProvider === "guest" ? t("common.notConnected") : user.authProvider}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t("profile.shortcuts")}
                </p>
                <Link
                  href="/dashboard"
                  className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
                >
                  {t("settings.backToDashboard")}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}