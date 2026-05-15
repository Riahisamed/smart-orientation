"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { API_BASE_URL } from "@/lib/api/config"
import { useTranslations } from "@/lib/i18n/context"
import BackToHomeButton from "../components/navigation/BackToHomeButton"

export default function ForgotPasswordPage() {
  const t = useTranslations()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email) {
      setError(t("errors.required"))
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || t("errors.generic"))
        return
      }
      
      setSuccess(true)
      setEmail("")
    } catch (err) {
      setError(t("errors.generic"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 px-4 py-8 sm:py-10 dark:bg-slate-950">
      <div className="fixed top-4 left-4 z-50">
        <BackToHomeButton />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {t("forgotPassword.title")}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  {t("forgotPassword.subtitle")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-900/70 dark:bg-green-950/50 dark:text-green-300">
                {t("forgotPassword.emailSent")}
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      className="rounded-xl pl-10"
                      placeholder={t("auth.email")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl"
                >
                  {loading ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
                </Button>
              </form>
            )}

            {success && (
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {t("forgotPassword.emailSent")}
                </p>
                <Link href="/login">
                  <Button variant="outline" className="h-11 w-full rounded-xl">
                    {t("forgotPassword.backToLogin")}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}