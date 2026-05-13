"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent, CardHeader, CardTitle } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import {
  Building2, Briefcase, Users, TrendingUp, Plus,
  LogOut, Loader2, MapPin, Globe, Mail, Phone,
  ArrowUpRight, Target, Award
} from "lucide-react"

export default function EnterpriseDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "offers" | "stats">("overview")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/enterprise/login")
      return
    }

    Promise.all([
      fetch(`${API_BASE_URL}/enterprise/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/enterprise/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/enterprise/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profileData, offersData, statsData]) => {
        setProfile(profileData)
        setOffers(offersData)
        setStats(statsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("email")
    localStorage.removeItem("role")
    router.replace("/enterprise/login")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100" />
      </div>
    )
  }

  const activeOffers = offers.filter((o) => o.isActive).length
  const totalOffers = offers.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile?.name || "Enterprise Dashboard"}</h1>
                <p className="text-blue-100 text-sm">{profile?.sector || "Entreprise"} • {profile?.location || "Tunisie"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/enterprise/offers/new")}
                className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Offre
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalOffers}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Offres d'Emploi</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">Actives</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeOffers}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Offres Actives</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">Talents</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.totalStudents || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Étudiants Disponibles</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">Domaine</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile?.sector || "—"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Secteur</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          {(["overview", "offers", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              {tab === "overview" && "Vue d'Ensemble"}
              {tab === "offers" && "Mes Offres"}
              {tab === "stats" && "Statistiques"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Offres Récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {offers.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">Aucune offre pour le moment</p>
                      <Button onClick={() => router.push("/enterprise/offers/new")} className="mt-4 rounded-xl" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer une Offre
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {offers.slice(0, 5).map((offer: any) => (
                        <div
                          key={offer.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          onClick={() => router.push(`/enterprise/offers/${offer.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${offer.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{offer.title}</p>
                              <p className="text-xs text-slate-500">{offer.contractType || "Non spécifié"} • {offer.location || "Non spécifié"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{offer.requiredSkills?.length || 0} compétences</span>
                            <ArrowUpRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Profil Entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Site Web</p>
                        <p className="text-sm font-medium">{profile?.website || "Non renseigné"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Localisation</p>
                        <p className="text-sm font-medium">{profile?.location || "Non renseigné"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Email Contact</p>
                        <p className="text-sm font-medium">{profile?.contactEmail || "Non renseigné"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Téléphone</p>
                        <p className="text-sm font-medium">{profile?.contactPhone || "Non renseigné"}</p>
                      </div>
                    </div>
                  </div>
                  {profile?.description && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{profile.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => router.push("/enterprise/offers/new")} className="w-full rounded-xl justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Publier une Offre
                  </Button>
                  <Button onClick={() => router.push("/enterprise/offers")} className="w-full rounded-xl justify-start" variant="outline">
                    <Briefcase className="h-4 w-4 mr-2" /> Voir les Offres
                  </Button>
                  <Button onClick={() => router.push("/market-trends")} className="w-full rounded-xl justify-start" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" /> Tendances du Marché
                  </Button>
                </CardContent>
              </Card>

              {stats?.topSkills && stats.topSkills.length > 0 && (
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" /> Top Compétences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topSkills.slice(0, 8).map((skill: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{skill.skill}</span>
                          <span className="text-xs text-slate-400">{skill.count} étudiants</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === "offers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Toutes les Offres</h2>
              <Button onClick={() => router.push("/enterprise/offers/new")} className="rounded-xl" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle Offre
              </Button>
            </div>
            {offers.length === 0 ? (
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Aucune offre</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Commencez par créer votre première offre d'emploi
                  </p>
                  <Button onClick={() => router.push("/enterprise/offers/new")} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" /> Créer une Offre
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer: any) => (
                  <div
                    key={offer.id}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 p-6"
                    onClick={() => router.push(`/enterprise/offers/${offer.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${offer.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {offer.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-slate-400">{offer.contractType || "—"}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{offer.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{offer.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{offer.location || "Non spécifié"}</span>
                      <span>{offer.requiredSkills?.length || 0} compétences</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Statistiques des Étudiants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Par Type de Bac</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.byBacType && Object.keys(stats.byBacType).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.byBacType).map(([type, count]: any) => (
                        <div key={type} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{type}</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Domaines d'Intérêt</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.byDomain && stats.byDomain.length > 0 ? (
                    <div className="space-y-3">
                      {stats.byDomain.slice(0, 10).map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{d.domain}</span>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}