"use client"

import { useRouter } from "next/navigation"
import { Home } from "lucide-react"
import { useTranslations } from "@/lib/i18n/context"

export default function BackToHomeButton() {
  const router = useRouter()
  const t = useTranslations()

  return (
    <button
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-2 rounded-xl bg-white/80 dark:bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl dark:text-slate-300 dark:hover:bg-slate-900"
      aria-label={t("navigation.backToHome")}
    >
      <Home className="h-4 w-4" />
      <span>{t("navigation.backToHome")}</span>
    </button>
  )
}