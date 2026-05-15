"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent, CardHeader, CardTitle } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import { ArrowLeft, MapPin, Briefcase, Users, Calendar, DollarSign, CheckCircle, XCircle, Award, Zap, Target, TrendingUp } from "lucide-react"
import { useTranslations } from "@/lib/i18n/context"
import { SkeletonLoader } from "@/lib/components/ui/skeleton-loader"
import { EmptyState } from "@/lib/components/ui/empty-state"
import { MatchingBadge } from "@/lib/components/ui/matching-badge"
import { SkillTag } from "@/lib/components/ui/skill-tag"

export default function OfferDetailPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const [offer, setOffer] = useState<any>(null)
  const [compatibleStudents, setCompatibleStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/enterprise/login")
      return
    }

    const offerId = params.id

    fetch(`${API_BASE_URL}/enterprise/offers/${offerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setOffer(data)
        if (data) {
          fetch(`${API_BASE_URL}/enterprise/offers/${offerId}/compatible-students`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.ok ? r.json() : [])
            .then(setCompatibleStudents)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </button>
          </div>
          <SkeletonLoader count={1} type="chart" />
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 flex items-center justify-center">
        <EmptyState
          icon={Briefcase}
          title="Offer not found"
          description="This offer may have been deleted or is no longer available."
          action={{ label: "Back to offers", onClick: () => router.back() }}
        />
      </div>
    )
  }

  const avgCompatibility = compatibleStudents.length > 0
    ? Math.round(compatibleStudents.reduce((sum, s) => sum + s.compatibility, 0) / compatibleStudents.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">{offer.title}</h1>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${offer.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {offer.isActive ? t("enterprisePages.active") : t("enterprisePages.inactive")}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t("enterprise.location")}</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{offer.location || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t("enterprise.contractType")}</p>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{offer.contractType || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t("enterprise.salary")}</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{offer.salary || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t("common.updated")}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{new Date(offer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    {t("enterprise.jobDescription")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{offer.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compatible Students */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {t("enterprise.compatibleStudents")}
                  <span className="ml-auto text-base font-normal text-slate-500">({compatibleStudents.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compatibleStudents.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No compatible students yet"
                    description="Students will appear here when they match your offer requirements"
                    iconColor="blue"
                    className="p-8"
                  />
                ) : (
                  <div className="space-y-3">
                    {compatibleStudents.map((student: any) => (
                      <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-white text-sm">{student.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{student.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {student.bacType} {student.bacAverage && `• Avg: ${student.bacAverage}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MatchingBadge percentage={student.compatibility} size="md" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Matching Stats */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Matching Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Avg. Compatibility</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{avgCompatibility}%</p>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Total Students</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{compatibleStudents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Excellent Match (80%+)</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {compatibleStudents.filter((s) => s.compatibility >= 80).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Good Match (60-79%)</span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {compatibleStudents.filter((s) => s.compatibility >= 60 && s.compatibility < 80).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Required Skills */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {t("enterprise.requiredSkills")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {offer.requiredSkills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {offer.requiredSkills.map((skill: any, i: number) => (
                      <SkillTag key={i} name={skill.name} variant="secondary" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">{t("common.noData")}</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">{t("common.actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full rounded-xl"
                  variant={offer.isActive ? "outline" : "default"}
                  onClick={async () => {
                    const token = localStorage.getItem("token")
                    await fetch(`${API_BASE_URL}/enterprise/offers/${offer.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ isActive: !offer.isActive }),
                    })
                    window.location.reload()
                  }}
                >
                  {offer.isActive ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {offer.isActive ? t("enterprisePages.deactivate") : t("enterprisePages.activate")}
                </Button>
                <Button className="w-full rounded-xl" variant="outline" onClick={() => router.push(`/enterprise/offers/${offer.id}/edit`)}>
                  {t("enterprise.editOffer")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}