"use client"

import Link from "next/link"
import { Button } from "lib/components/ui/button"
import { Card, CardContent, CardHeader } from "lib/components/ui/card"
import { Sparkles } from "lucide-react"
import { useTranslations } from "@/lib/i18n/context"
import BackToHomeButton from "../components/navigation/BackToHomeButton"

export default function RegisterPage() {
  const t = useTranslations()
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="fixed top-4 left-4 z-50">
        <BackToHomeButton />
      </div>
      <Card className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">{t("register.aiOrientationLabel")}</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{t("register.title")}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("auth.noAccount")} {t("auth.signUpLink")} {t("auth.or")} {t("auth.signInLink")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login" className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            {t("register.goToLogin")}
          </Link>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <span className="relative mx-auto block w-fit bg-white px-2 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/90 dark:text-slate-400">
              {t("common.or")}
            </span>
          </div>
          <Link href="/choose-role" className="block w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
            {t("common.continue")}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}