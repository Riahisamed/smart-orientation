"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/api/config"
import { Card, CardContent, CardHeader, CardTitle } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import { ArrowLeft, Loader2, MapPin, Briefcase, Users, Calendar, DollarSign, CheckCircle, XCircle, Award } from "lucide-react"

export default function OfferDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [offer, setOffer] = useState<any>(null)
  const [compatibleStudents, setCompatibleStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMatching, setShowMatching] = useState(false)

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card><CardContent className="p-8 text-center"><p className="text-slate-500">Offre non trouvée</p></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{offer.title}</h1>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${offer.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <MapPin className="h-4 w-4 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500">Localisation</p>
                    <p className="text-sm font-medium">{offer.location || "Non spécifié"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Briefcase className="h-4 w-4 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500">Contrat</p>
                    <p className="text-sm font-medium">{offer.contractType || "Non spécifié"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <DollarSign className="h-4 w-4 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500">Salaire</p>
                    <p className="text-sm font-medium">{offer.salary || "Non spécifié"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Calendar className="h-4 w-4 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500">Publiée le</p>
                    <p className="text-sm font-medium">{new Date(offer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Description</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{offer.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compatible Students */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Étudiants Compatibles ({compatibleStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compatibleStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">Aucun étudiant compatible trouvé pour cette offre</p>
                    <p className="text-xs text-slate-400 mt-1">Ajoutez des compétences requises pour améliorer le matching</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {compatibleStudents.map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{student.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.bacType} • MG: {student.bacAverage}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            student.compatibility >= 70 ? "bg-green-100 text-green-700" :
                            student.compatibility >= 40 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            <Award className="h-3 w-3" />
                            {student.compatibility}%
                          </span>
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
            {/* Required Skills */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Compétences Requises
                </CardTitle>
              </CardHeader>
              <CardContent>
                {offer.requiredSkills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {offer.requiredSkills.map((skill: any, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Aucune compétence spécifiée</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full rounded-xl" variant={offer.isActive ? "outline" : "default"} onClick={async () => {
                  const token = localStorage.getItem("token")
                  await fetch(`${API_BASE_URL}/enterprise/offers/${offer.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ isActive: !offer.isActive }),
                  })
                  window.location.reload()
                }}>
                  {offer.isActive ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {offer.isActive ? "Désactiver" : "Activer"}
                </Button>
                <Button className="w-full rounded-xl" variant="outline" onClick={() => router.push(`/enterprise/offers/${offer.id}/edit`)}>
                  Modifier l'Offre
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}