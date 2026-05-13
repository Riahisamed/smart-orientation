"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "lib/components/ui/card"
import { TrendingUp, BarChart3, DollarSign, Users, Award, Target, Clock, Sparkles, Loader2 } from "lucide-react"

function getDemandColor(level: string): string {
  switch (level) {
    case "HIGH": return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
    case "MEDIUM": return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30"
    case "LOW": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
    default: return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
  }
}

function getDemandBadge(level: string): { text: string; color: string } {
  switch (level) {
    case "HIGH": return { text: "Haute", color: "green" }
    case "MEDIUM": return { text: "Moyenne", color: "amber" }
    case "LOW": return { text: "Faible", color: "red" }
    default: return { text: "Inconnue", color: "slate" }
  }
}

export default function MarketTrends() {
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<any>(null)
  const [selectedSector, setSelectedSector] = useState<string>("all")
  const [selectedDemand, setSelectedDemand] = useState<string>("all")

  useEffect(() => {
    fetch(`${API_BASE_URL}/market-trends/dashboard`)
      .then((r) => r.json())
      .then((data) => {
        setDashboard(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100" />
      </div>
    )
  }

  const trends = dashboard?.trends || []
  const filteredTrends = trends.filter((t: any) => {
    if (selectedSector !== "all" && t.category !== selectedSector) return false
    if (selectedDemand !== "all" && t.demandLevel !== selectedDemand) return false
    return true
  })

  const sectors = dashboard?.sectors || []
  const demandDist = dashboard?.demandDistribution || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tendances du Marché</h1>
              <p className="text-indigo-100">Analyse en temps réel du marché du travail Tunisien</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/20 backdrop-blur-sm">
              <Clock className="h-3 w-3" /> Mis à jour: {new Date(dashboard?.lastUpdated).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> {trends.length} métiers analysés
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{trends.length}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Métiers Analysés</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {dashboard?.mostDemanded?.length || 0}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Métiers en Forte Demande</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {dashboard?.salariesBySector?.length || 0}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Secteurs Salariaux</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {dashboard?.topSkills?.length || 0}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Compétences Clés</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les Secteurs</option>
              {sectors.map((s: any, i: number) => (
                <option key={i} value={s.name}>{s.name} ({s.count})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <select
              value={selectedDemand}
              onChange={(e) => setSelectedDemand(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous Niveaux</option>
              <option value="HIGH">Haute Demande</option>
              <option value="MEDIUM">Demande Moyenne</option>
              <option value="LOW">Faible Demande</option>
            </select>
          </div>
          <span className="text-sm text-slate-500 self-center">
            {filteredTrends.length} résultats
          </span>
        </div>

        {/* Market Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTrends.map((item: any, index: number) => {
            const badge = getDemandBadge(item.demandLevel)
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all animate-[fadeIn_0.5s_ease-in-out] bg-white dark:bg-slate-900"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-700`}>
                      {badge.text}
                    </span>
                    <span className="text-xs text-slate-400">{item.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{item.domain}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">Croissance</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">+{item.growthRate}%</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">Salaire</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.salaryAvg.toLocaleString()} TND</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">Chômage</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{item.unemploymentRate}%</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">Demande</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.demand}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-2">Compétences clés:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.topSkills?.slice(0, 4).map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                          {skill}
                        </span>
                      ))}
                      {item.topSkills?.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          +{item.topSkills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Skills */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Compétences Demandées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard?.topSkills?.slice(0, 10).map((skill: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{skill.skill}</span>
                        <span className="text-xs text-slate-400">{skill.count} métiers</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${(skill.count / Math.max(...dashboard.topSkills.slice(0, 10).map((s: any) => s.count))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Salaries by Sector */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Salaire Moyen par Secteur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard?.salariesBySector?.map((sector: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{sector.sector}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{sector.avgSalary.toLocaleString()} TND</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demand Distribution */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Répartition de la Demande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demandDist.map((d: any, i: number) => (
                <div key={i} className={`p-4 rounded-xl ${d.level === "HIGH" ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : d.level === "MEDIUM" ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{d.percentage}%</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {d.level === "HIGH" ? "Haute Demande" : d.level === "MEDIUM" ? "Demande Moyenne" : "Faible Demande"}
                  </p>
                  <p className="text-xs text-slate-400">{d.count} métiers</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Annual Evolution Table */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Évolution Annuelle par Secteur (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Année</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">Tech</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">Medical</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">Business</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">Engineering</th>
                    <th className="text-right py-2 px-3 text-slate-500 font-medium">Social</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.annualEvolution?.map((row: any, i: number) => (
                    <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 ${i === dashboard.annualEvolution.length - 1 ? "font-bold" : ""}`}>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{row.year}</td>
                      <td className="text-right py-2 px-3 text-green-600 dark:text-green-400">{row.tech}%</td>
                      <td className="text-right py-2 px-3 text-blue-600 dark:text-blue-400">{row.medical}%</td>
                      <td className="text-right py-2 px-3 text-amber-600 dark:text-amber-400">{row.business}%</td>
                      <td className="text-right py-2 px-3 text-purple-600 dark:text-purple-400">{row.engineering}%</td>
                      <td className="text-right py-2 px-3 text-slate-600 dark:text-slate-400">{row.social}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}