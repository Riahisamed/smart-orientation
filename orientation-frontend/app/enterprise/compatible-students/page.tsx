"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { API_BASE_URL } from "@/lib/api/config"
import { useRouter } from "next/navigation"
import { Users, Search, Mail, GraduationCap, Award, ArrowLeft, Filter, TrendingUp, Star, Zap } from "lucide-react"
import { useTranslations } from "@/lib/i18n/context"
import { SkeletonLoader } from "@/lib/components/ui/skeleton-loader"
import { EmptyState } from "@/lib/components/ui/empty-state"
import { MatchingBadge } from "@/lib/components/ui/matching-badge"
import { SkillTag } from "@/lib/components/ui/skill-tag"

interface Student {
  id: number
  name: string
  email: string
  bacType: string
  FG: number
  filieres?: string[]
  compatibility?: number
  matchingSkills?: string[]
}

export default function CompatibleStudentsPage() {
  const t = useTranslations()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "compatibility" | "score">("compatibility")
  const [filterQuality, setFilterQuality] = useState<"all" | "excellent" | "good" | "moderate">("all")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/enterprise/login")
      return
    }
    fetchCompatibleStudents()
  }, [])

  const fetchCompatibleStudents = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/enterprise/compatible-students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const studentsData = Array.isArray(data) ? data : []
      setStudents(studentsData)
    } catch (err) {
      console.error("Failed to fetch compatible students:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = students

    // Apply search filter
    if (search) {
      result = result.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.bacType?.toLowerCase().includes(search.toLowerCase()) ||
        s.filieres?.some(f => f.toLowerCase().includes(search.toLowerCase()))
      )
    }

    // Apply quality filter
    if (filterQuality !== "all") {
      result = result.filter(s => {
        const compatibility = s.compatibility || 0
        if (filterQuality === "excellent") return compatibility >= 80
        if (filterQuality === "good") return compatibility >= 60 && compatibility < 80
        if (filterQuality === "moderate") return compatibility >= 40 && compatibility < 60
        return true
      })
    }

    // Apply sorting
    if (sortBy === "compatibility") {
      result = result.sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0))
    } else if (sortBy === "score") {
      result = result.sort((a, b) => (b.FG || 0) - (a.FG || 0))
    }

    setFilteredStudents(result)
  }, [students, search, sortBy, filterQuality])

  const excellentMatch = students.filter(s => (s.compatibility || 0) >= 80).length
  const goodMatch = students.filter(s => (s.compatibility || 0) >= 60 && (s.compatibility || 0) < 80).length
  const avgCompatibility = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.compatibility || 0), 0) / students.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button onClick={() => router.push("/enterprise/dashboard")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Compatible Students</h1>
          </div>
          <SkeletonLoader count={4} type="list" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => router.push("/enterprise/dashboard")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Compatible Students</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filteredStudents.length} students found
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Students</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{students.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500/20" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg. Compatibility</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{avgCompatibility}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/20" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Excellent (80%+)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{excellentMatch}</p>
                </div>
                <Star className="h-8 w-8 text-green-500/20" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Good (60-79%)</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{goodMatch}</p>
                </div>
                <Zap className="h-8 w-8 text-amber-500/20" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {students.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, bac type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Quality Filter */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Match Quality</label>
                <select
                  value={filterQuality}
                  onChange={(e) => setFilterQuality(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="all">All</option>
                  <option value="excellent">Excellent (80%+)</option>
                  <option value="good">Good (60-79%)</option>
                  <option value="moderate">Moderate (40-59%)</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="compatibility">Compatibility</option>
                  <option value="score">Score (FG)</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title={students.length === 0 ? "No compatible students yet" : "No matching students"}
            description={students.length === 0 ? "Compatible students will appear here when they match your offers" : "Try adjusting your search or filters"}
            iconColor="blue"
          />
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {student.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{student.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" /> {student.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <GraduationCap className="h-4 w-4" />
                            <span>{student.bacType}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            FG: {student.FG?.toFixed(2) || "N/A"}
                          </div>
                        </div>
                        {student.filieres && student.filieres.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {student.filieres.map((filiere, i) => (
                              <SkillTag key={i} name={filiere} variant="primary" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 sm:items-end">
                      {student.compatibility !== undefined && (
                        <>
                          <MatchingBadge percentage={student.compatibility} size="lg" />
                          {student.matchingSkills && student.matchingSkills.length > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Matching Skills</p>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {student.matchingSkills.slice(0, 3).map((skill, i) => (
                                  <SkillTag key={i} name={skill} variant="success" />
                                ))}
                                {student.matchingSkills.length > 3 && (
                                  <span className="text-xs text-slate-500">+{student.matchingSkills.length - 3}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}