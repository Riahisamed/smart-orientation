"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, FileUp, GraduationCap, LineChart, PieChart, TrendingUp, Users } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

type ChartItem = { label: string; value: number; color?: string }

const palette = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316"]

function MiniBarChart({ items }: { items: ChartItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="max-w-[70%] truncate">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color ?? palette[index % palette.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ items }: { items: ChartItem[] }) {
  const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1)
  let offset = 25
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0 -rotate-90">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="7" />
        {items.map((item, index) => {
          const dash = (item.value / total) * 100
          const segment = (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.9"
              fill="transparent"
              stroke={item.color ?? palette[index % palette.length]}
              strokeWidth="7"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
            />
          )
          offset -= dash
          return segment
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-2">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? palette[index % palette.length] }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-semibold">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineTrend({ items }: { items: ChartItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const points = items.map((item, index) => `${20 + index * 48},${110 - (item.value / max) * 80}`).join(" ")
  return (
    <svg viewBox="0 0 340 130" className="h-44 w-full">
      <polyline points="20,110 320,110" fill="none" stroke="#e2e8f0" strokeWidth="1" />
      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {items.map((item, index) => {
        const x = 20 + index * 48
        const y = 110 - (item.value / max) * 80
        return (
          <g key={item.label}>
            <circle cx={x} cy={y} r="4" fill="#2563eb" />
            <text x={x} y="126" textAnchor="middle" fontSize="8" fill="#64748b">{item.label.slice(5)}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [notification, setNotification] = useState({ title: "", message: "" })

  const token = useMemo(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("token") ?? ""
  }, [])

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setMessage("Impossible de charger les statistiques"))

    fetch(`${API_BASE_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))

    fetch(`${API_BASE_URL}/admin/domains`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setDomains(Array.isArray(data) ? data : []))
      .catch(() => setDomains([]))

    fetch(`${API_BASE_URL}/admin/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
  }, [token])

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${API_BASE_URL}/filiere/upload-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      setMessage(data.message || "Guide importe")
    } catch {
      setMessage("Erreur pendant l'import")
    } finally {
      setLoading(false)
    }
  }

  const sendNotification = async () => {
    if (!notification.title || !notification.message) return
    setLoading(true)
    try {
      await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notification),
      })
      setNotification({ title: "", message: "" })
      setMessage("Notification envoyee")
      setNotifications((current) => [
        { id: Date.now(), ...notification, createdAt: new Date().toISOString() },
        ...current,
      ])
    } catch {
      setMessage("Erreur notification")
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: "Etudiants", value: stats?.totals?.students ?? 0, icon: Users },
    { label: "Utilisateurs", value: stats?.totals?.users ?? 0, icon: GraduationCap },
    { label: "Filieres", value: stats?.totals?.filieres ?? 0, icon: LineChart },
    { label: "Tests", value: stats?.totals?.tests ?? 0, icon: Bell },
  ]
  const bacChart = (stats?.bacTypes ?? []).map((item: any, index: number) => ({ label: item.bacType, value: item.count, color: palette[index % palette.length] }))
  const domainChart = (stats?.popularDomains ?? []).map((item: any, index: number) => ({ label: item.domain, value: item.count, color: palette[index % palette.length] }))
  const trendChart = (stats?.orientationTrends ?? []).map((item: any) => ({ label: item.date, value: item.count }))
  const marketChart = (stats?.market ?? []).map((item: any, index: number) => ({ label: item.domain, value: item.jobs, color: palette[index % palette.length] }))

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Administration</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Gestion des etudiants, statistiques, notifications et import du guide.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            {message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{card.label}</span>
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Domaines populaires</h2>
              <LineChart className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-5">
              {domainChart.length > 0 ? <MiniBarChart items={domainChart} /> : <p className="text-sm text-slate-500">Pas encore de tests.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Distribution bac</h2>
              <PieChart className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-5">
              {bacChart.length > 0 ? <DonutChart items={bacChart} /> : <p className="text-sm text-slate-500">Aucune distribution disponible.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tendances orientation</h2>
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div className="mt-2">
              {trendChart.length > 0 ? <LineTrend items={trendChart} /> : <p className="text-sm text-slate-500">Aucune tendance disponible.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Demande marche</h2>
            <div className="mt-5">
              {marketChart.length > 0 ? <MiniBarChart items={marketChart} /> : <p className="text-sm text-slate-500">Aucun snapshot marche.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Importer le guide PDF</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input type="file" accept=".pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-slate-400"
              >
                <FileUp className="h-4 w-4" />
                {loading ? "Traitement..." : "Importer"}
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Envoyer une notification</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Titre"
              value={notification.title}
              onChange={(event) => setNotification((current) => ({ ...current, title: event.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Message"
              value={notification.message}
              onChange={(event) => setNotification((current) => ({ ...current, message: event.target.value }))}
            />
            <button onClick={sendNotification} className="rounded-lg bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-950">
              Envoyer
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gestion des domaines</h2>
            <div className="mt-4 max-h-80 space-y-2 overflow-auto">
              {domains.slice(0, 30).map((domain) => (
                <div key={domain.id || domain.field} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{domain.field}</span>
                    <span className="text-xs text-slate-500">{domain.category ?? domain.demand ?? "domain"}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{(domain.careerPaths ?? []).slice(0, 3).join(", ")}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications envoyees</h2>
            <div className="mt-4 max-h-80 space-y-2 overflow-auto">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.message}</p>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-sm text-slate-500">Aucune notification envoyee.</p>}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Etudiants recents</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Nom</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Bac</th>
                  <th className="py-2">FG</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">{student.name}</td>
                    <td className="py-2">{student.user?.email ?? "-"}</td>
                    <td className="py-2">{student.bacType}</td>
                    <td className="py-2">{student.FG ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
