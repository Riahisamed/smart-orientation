"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import { Input } from "lib/components/ui/input"
import { Label } from "lib/components/ui/label"
import { Building2, ArrowLeft, Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import { storeRole } from "@/lib/use-role"

export default function EnterpriseLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Email ou mot de passe incorrect")
        return
      }

      localStorage.setItem("token", data.access_token)
      localStorage.setItem("email", data.user.email)
      storeRole("ENTERPRISE")

      router.push("/enterprise/dashboard")
    } catch {
      setError("Erreur réseau. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => router.push("/choose-role")} className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Choisir un autre rôle
        </button>

        <Card className="rounded-3xl border border-green-200/80 dark:border-green-800/80 shadow-[0_24px_70px_-30px_rgba(22,163,74,0.35)] dark:bg-slate-900/90">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Connexion Entreprise</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Accédez à votre espace RH
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@entreprise.com" required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="rounded-xl pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium">
                {loading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Connexion...</span> : (
                  <span className="flex items-center gap-2"><LogIn className="h-4 w-4" /> Se connecter</span>
                )}
              </Button>
            </form>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Pas encore inscrit ?{" "}
              <button onClick={() => router.push("/enterprise/register")} className="text-green-600 dark:text-green-400 hover:underline font-medium">
                Créer un compte
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}