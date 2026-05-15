"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import { Input } from "lib/components/ui/input"
import {
  Briefcase, Plus, ArrowLeft, MapPin, Clock, Search, ChevronRight, DollarSign, TrendingUp
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/context"
import { SkeletonLoader } from "@/lib/components/ui/skeleton-loader"
import { EmptyState } from "@/lib/components/ui/empty-state"
import { SkillTag } from "@/lib/components/ui/skill-tag"

export default function OffersListPage() {
  const t = useTranslations()
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [filteredOffers, setFilteredOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent")

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

  useEffect(() => {
    let result = offers

    // Apply search filter
    if (search) {
      result = result.filter(
        (offer) =>
          offer.title?.toLowerCase().includes(search.toLowerCase()) ||
          offer.location?.toLowerCase().includes(search.toLowerCase()) ||
          offer.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus === "active") {
      result = result.filter((o) => o.isActive)
    } else if (filterStatus === "inactive") {
      result = result.filter((o) => !o.isActive)
    }

    // Apply sorting
    if (sortBy === "popular") {
      result = result.sort((a, b) => (b.requiredSkills?.length || 0) - (a.requiredSkills?.length || 0))
    } else {
      result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    setFilteredOffers(result)
  }, [offers, search, filterStatus, sortBy])

  const activeCount = offers.filter((o) => o.isActive).length
  const inactiveCount = offers.filter((o) => !o.isActive).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button onClick={() => router.push("/enterprise/dashboard")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2">
              <ArrowLeft className="h-4 w-4" /> {t("enterprisePages.backToDashboard")}
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t("enterprise.myOffers")}</h1>
          </div>
          <SkeletonLoader count={6} type="card" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => router.push("/enterprise/dashboard")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2">
              <ArrowLeft className="h-4 w-4" /> {t("enterprisePages.backToDashboard")}
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t("enterprise.myOffers")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filteredOffers.length} {filteredOffers.length === 1 ? "offer" : "offers"}
            </p>
          </div>
          <Button onClick={() => router.push("/enterprise/offers/new")} className="rounded-xl whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" /> {t("enterprise.createOffer")}
          </Button>
        </div>

        {/* Stats Cards */}
        {offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("enterprise.totalOffers")}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{offers.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500/20" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("enterprisePages.active")}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{activeCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/20" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("enterprisePages.inactive")}</p>
                  <p className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-1">{inactiveCount}</p>
                </div>
                <Briefcase className="h-8 w-8 text-slate-500/20" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {offers.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">{t("common.search")}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search offers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">{t("common.status")}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">{t("common.sort")}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Skills</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={offers.length === 0 ? "No offers yet" : "No matching offers"}
            description={offers.length === 0 ? "Create your first job offer to get started" : "Try adjusting your search or filters"}
            action={offers.length === 0 ? {
              label: t("enterprise.createOffer"),
              onClick: () => router.push("/enterprise/offers/new")
            } : undefined}
            iconColor="blue"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer: any) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                onClick={() => router.push(`/enterprise/offers/${offer.id}`)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      offer.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {offer.isActive ? t("enterprisePages.active") : t("enterprisePages.inactive")}
                    </span>
                    {offer.salary && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        {offer.salary}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {offer.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    {offer.location || "—"}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {offer.description}
                  </p>

                  {/* Skills Tags */}
                  {offer.requiredSkills?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {offer.requiredSkills.length} {offer.requiredSkills.length === 1 ? "skill" : "skills"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {offer.requiredSkills.slice(0, 3).map((skill: any, i: number) => (
                          <SkillTag key={i} name={skill.name} variant="secondary" />
                        ))}
                        {offer.requiredSkills.length > 3 && (
                          <span className="text-xs text-slate-500">+{offer.requiredSkills.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}