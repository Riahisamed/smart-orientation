"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Loader2, BarChart3, TrendingUp, User } from "lucide-react"
import { Card, CardContent } from "lib/components/ui/card"
import { Button } from "lib/components/ui/button"
import { Input } from "lib/components/ui/input"
import { Select } from "lib/components/ui/select"

export default function Dashboard() {
  const [fg, setFG] = useState(0)
  const [student, setStudent] = useState<any>(null)
  const [filieres, setFilieres] = useState<any[]>([])
  const [comparison, setComparison] = useState<any>(null)

  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token && !session) {
      router.push("/login")
      return
    }

    if (token) {
      fetch("http://localhost:3001/student/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(async (res) => {
        if (!res.ok) {
          console.log("❌ error from backend")
          return
        }

        const text = await res.text()

        if (!text) {
          console.log("❌ empty response")
          return
        }

        const data = JSON.parse(text)

        setStudent(data)
        setFG(data?.FG || 0)
      })
      .catch(err => {
        console.error("ERROR:", err)
      })
    }

    // ✅ filieres
    fetch("http://localhost:3001/student/me/orientation")
      .then(res => res.json())
      .then(data => {
        console.log("FILIERES:", data)
        setFilieres(data || [])
      })
  }, [status, session, router])

  // ✅ Load comparison data automatically from localStorage
  useEffect(() => {
    const data = localStorage.getItem("comparisonData")
    if (data) {
      setComparison(JSON.parse(data))
    }
  }, [])

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 py-8 sm:py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl">
        {/* TOP */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Access score summaries, comparisons, and quick navigation to your orientation tools.
            </p>
          </div>

        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-lg transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">FG Score</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-2">{fg}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-lg transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bac Type</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-2">
                    {student?.bacType || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-lg transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Average</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-2">
                    {student?.bacAverage ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        {/* Comparison Section */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Latest Calculation</h2>

            {comparison ? (
              <>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                  {comparison.filiereName}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
                    <CardContent className="p-4 text-center">
                      <h3 className="text-sm text-slate-500 dark:text-slate-400">Your T Score</h3>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {parseFloat(comparison.tScore).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
                    <CardContent className="p-4 text-center">
                      <h3 className="text-sm text-slate-500 dark:text-slate-400">Last Year Score</h3>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {parseFloat(comparison.lastScore).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
                    <CardContent className="p-4 text-center">
                      <h3 className="text-sm text-slate-500 dark:text-slate-400">Acceptance Probability</h3>
                      <p className={`text-xl font-bold ${
                        comparison.probability >= 70 ? "green" : 
                        comparison.probability >= 40 ? "orange" : "red"
                      }-600 dark:${
                        comparison.probability >= 70 ? "green" : 
                        comparison.probability >= 40 ? "orange" : "red"
                      }-400 mt-1`}>
                        {comparison.probability}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                No calculation data available yet. Go to T Calculator to compute your score.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}