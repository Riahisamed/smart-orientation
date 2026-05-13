"use client"

import { useRouter } from "next/navigation"
import { GraduationCap, Building2, Shield, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"

export default function ChooseRolePage() {
  const router = useRouter()

  const roles = [
    {
      id: "student",
      icon: GraduationCap,
      title: "Étudiant",
      description: "Découvre les filières qui te correspondent, test ton orientation et explore le marché du travail",
      href: "/login",
      gradient: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      id: "enterprise",
      icon: Building2,
      title: "Entreprise / RH",
      description: "Publie des offres, trouve les talents compatibles et analyse les statistiques étudiants",
      href: "/enterprise/login",
      gradient: "from-green-500 to-emerald-600",
      bgLight: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      id: "admin",
      icon: Shield,
      title: "Administrateur",
      description: "Accède au tableau de bord administrateur, gère les utilisateurs et les données",
      href: "/admin/login",
      gradient: "from-purple-500 to-violet-600",
      bgLight: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12 animate-[fadeIn_0.5s_ease-in-out]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Smart Orientation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Choisissez votre espace
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Sélectionnez le type de compte qui correspond à votre profil
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role, index) => {
            const Icon = role.icon
            return (
              <div
                key={role.id}
                className={`rounded-3xl border-2 ${role.borderColor} ${role.bgLight} bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-[fadeIn_0.6s_ease-in-out] cursor-pointer`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => router.push(role.href)}
              >
                <div className="p-8 text-center">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{role.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{role.description}</p>
                  <button
                    onClick={() => router.push(role.href)}
                    className={`w-full rounded-xl h-11 bg-gradient-to-r ${role.gradient} hover:opacity-90 text-white font-medium inline-flex items-center justify-center gap-2`}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}