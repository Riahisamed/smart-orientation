"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { API_BASE_URL } from "@/lib/api/config"
import { Users, Search, Mail, GraduationCap, Award, Building2 } from "lucide-react"

interface Student {
  id: number
  name: string
  email: string
  bacType: string
  FG: number
  filieres?: string[]
}

export default function CompatibleStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchCompatibleStudents()
  }, [])

  const fetchCompatibleStudents = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/enterprise/compatible-students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch compatible students:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.bacType?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Compatible Students</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Students matching your offers</p>
          </div>
        </div>

        <div className="relative mb-6 mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Loading compatible students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No compatible students found</p>
              <p className="text-sm text-slate-500 mt-1">Students will appear here when they match your offers</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((student) => (
              <Card key={student.id} className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900/95">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                        {student.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {student.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        FG: {student.FG?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <GraduationCap className="h-4 w-4" />
                    <span>{student.bacType}</span>
                    {student.filieres && student.filieres.length > 0 && (
                      <>
                        <span className="text-slate-300">|</span>
                        <Award className="h-4 w-4" />
                        <span>{student.filieres.join(", ")}</span>
                      </>
                    )}
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