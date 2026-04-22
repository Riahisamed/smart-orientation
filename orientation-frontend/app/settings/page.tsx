"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, LogOut, Monitor, Moon, Settings2, Sun, UserCircle2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent } from "lib/components/ui/card"
import { useAuthUser } from "@/lib/use-auth-user"

const themeOptions = [
  {
    label: "System",
    value: "system",
    description: "Use your device preference automatically.",
    icon: Monitor,
  },
  {
    label: "Light",
    value: "light",
    description: "Bright interface for daytime work.",
    icon: Sun,
  },
  {
    label: "Dark",
    value: "dark",
    description: "Low-glare mode for evening sessions.",
    icon: Moon,
  },
] as const

export default function SettingsPage() {
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
              Preferences
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage appearance and account actions for {user.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
            >
              <UserCircle2 className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Appearance
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Theme selection</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Choose how Orientation IA looks. The header toggle stays in sync with the option you pick here.
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
                      <p className="mt-4 text-base font-semibold">{option.label}</p>
                      <p className="mt-2 text-sm opacity-80">{option.description}</p>
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
                      Account
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Connection details</h2>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                      {user.email || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Provider</p>
                    <p className="mt-1 text-base font-semibold capitalize text-slate-900 dark:text-slate-100">
                      {user.authProvider === "guest" ? "Not connected" : user.authProvider}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Local accounts can reset passwords from the login screen. Google accounts continue to be managed from Google.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Navigation
                </p>
                <Link
                  href="/dashboard"
                  className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
                >
                  Review profile details
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
