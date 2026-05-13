"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import { Briefcase, Plus, ArrowLeft, Loader2, MapPin, Clock, Users } from "lucide-react"

export default function OffersListPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/enterprise/login")
      return
    }

    fetch(`${API_BASE_URL}/enterprise/offers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setOffers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push("/enterprise/dashboard")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2">
              <ArrowLeft className="h-4 w-4" /> Retour au Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mes Offres d'Emploi</h1>
          </div>
          <Button onClick={() => router.push("/enterprise/offers/new")} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Nouvelle Offre
          </Button>
        </div>

        {offers.length === 0 ? (
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="py-16 text-center">
              <Briefcase className="h-20 w-20 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Aucune Offre</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Créez votre première offre pour commencer</p>
              <Button onClick={() => router.push("/enterprise/offers/new")} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> Créer une Offre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: any) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all cursor-pointer p-6"
                onClick={() => router.push(`/enterprise/offers/${offer.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${offer.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                    {offer.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-slate-400">{offer.contractType || "—"}</span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">{offer.title}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <MapPin className="h-3 w-3" /> {offer.location || "Non spécifié"}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{offer.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {offer.requiredSkills?.length || 0} compétences</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(offer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}