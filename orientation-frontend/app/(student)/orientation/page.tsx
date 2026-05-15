"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/lib/components/ui/input"
import { Select } from "@/lib/components/ui/select"
import { Card, CardContent } from "@/lib/components/ui/card"
import { API_BASE_URL } from "@/lib/api/config"
import { useTranslations } from "@/lib/i18n/context"

export default function Orientation() {
  const t = useTranslations()
  const [search, setSearch] = useState("")
  const [domainFilter, setDomainFilter] = useState("")
  const [institutionFilter, setInstitutionFilter] = useState("")
  const [bacTypeFilter, setBacTypeFilter] = useState("")

  const [filieres, setFilieres] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")

    // Fetch student data
    fetch(`${API_BASE_URL}/student/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setStudent(data)
    })

    // Fetch filieres
    fetch(`${API_BASE_URL}/student/me/orientation`)
      .then(res => res.json())
      .then(data => {
        setFilieres(data || [])
      })
  }, [])

  // Extract unique institutions
  const uniqueInstitutions = useMemo(() => {
    const institutions = filieres.map(f => f.institution).filter(Boolean)
    return [...new Set(institutions)].sort()
  }, [filieres])

  // Extract unique bac types
  const uniqueBacTypes = useMemo(() => {
    const bacTypes = filieres.flatMap(f => f.bacTypes?.map((bt: any) => bt.type) || []).filter(Boolean)
    return [...new Set(bacTypes)].sort()
  }, [filieres])

  // Get last score for a filiere and bac type
  const getLastScore = (f: any, bacType?: string) => {
    const targetBacType = bacType || student?.bacType
    if (!targetBacType) return t("orientation.notAvailable")

    const bacTypeData = f.bacTypes?.find((bt: any) => 
      bt.type?.toLowerCase() === targetBacType.toLowerCase()
    )

    if (bacTypeData && bacTypeData.lastScore != null) {
      return Number(bacTypeData.lastScore).toFixed(2)
    }
    return t("orientation.notAvailable")
  }

  // Filtered and sorted filieres
  const filteredFilieres = useMemo(() => {
    let filtered = filieres.filter(f => {
      const matchesSearch = !search || 
        f.program.toLowerCase().includes(search.toLowerCase()) ||
        f.institution.toLowerCase().includes(search.toLowerCase())
      
      const matchesDomain = !domainFilter || f.domain?.toLowerCase().includes(domainFilter.toLowerCase())
      
      const matchesInstitution = !institutionFilter || f.institution?.toLowerCase() === institutionFilter.toLowerCase()
      
      const matchesBacType = !bacTypeFilter || f.bacTypes?.some((bt: any) => 
        bt.type?.toLowerCase() === bacTypeFilter.toLowerCase()
      )

      return matchesSearch && matchesDomain && matchesInstitution && matchesBacType
    })

    // Sort by lastScore DESC
    filtered.sort((a, b) => {
      const scoreA = getLastScore(a, bacTypeFilter)
      const scoreB = getLastScore(b, bacTypeFilter)
      
      if (scoreA === t("orientation.notAvailable")) return 1
      if (scoreB === t("orientation.notAvailable")) return -1
      
      return parseFloat(scoreB) - parseFloat(scoreA)
    })

    return filtered
  }, [filieres, search, domainFilter, institutionFilter, bacTypeFilter, student, t])

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t("orientation.title")}</h1>

        {/* Search and Filters */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90 mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("orientation.searchPrograms")}</label>
                <Input
                  placeholder={t("orientation.searchPlaceholder")}
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("orientation.domain")}</label>
                <Select
                  value={domainFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDomainFilter(e.target.value)}
                  className="rounded-xl"
                >
                  <option value="">{t("orientation.allDomains")}</option>
                  <option value="engineering">{t("orientation.engineering")}</option>
                  <option value="medicine">{t("orientation.medicine")}</option>
                  <option value="science">{t("orientation.science")}</option>
                  <option value="humanities">{t("orientation.humanities")}</option>
                  <option value="business">{t("orientation.business")}</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("orientation.institution")}</label>
                <Select
                  value={institutionFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInstitutionFilter(e.target.value)}
                  className="rounded-xl"
                >
                  <option value="">{t("orientation.allInstitutions")}</option>
                  {uniqueInstitutions.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("orientation.bacType")}</label>
                <Select
                  value={bacTypeFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBacTypeFilter(e.target.value)}
                  className="rounded-xl"
                >
                  <option value="">{t("orientation.allBacTypes")}</option>
                  {uniqueBacTypes.map(bac => (
                    <option key={bac} value={bac}>{bac}</option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("orientation.availablePrograms")} ({filteredFilieres.length})
          </h2>
        </div>

        {filteredFilieres.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t("orientation.noProgramsFound")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFilieres.map((f, i) => (
              <button
                key={f.id || i}
                onClick={() => {
                  router.push(`/t-calculator?filiereId=${f.id}`)
                }}
                className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90 hover:shadow-[0_24px_40px_-20px_rgba(15,23,42,0.2)] hover:scale-105 transition-all duration-300 text-left"
              >
                <Card className="w-full h-full">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                        {f.program}
                      </h3>
                      {f.domain && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {f.domain}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {f.institution}
                      </p>
                    </div>
                    <div className="mt-auto">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("orientation.lastYearScore")}:
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {getLastScore(f, bacTypeFilter)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}