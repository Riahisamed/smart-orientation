"use client"

import { useEffect, useState } from "react"
import { Bell, Check } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : ""

  const load = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    const res = await fetch(`${API_BASE_URL}/notifications/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setNotifications(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [token])

  const markRead = async (id: number) => {
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Mises a jour de la plateforme, rappels et annonces administratives.
          </p>
        </div>

        <div className="space-y-3">
          {loading && <p className="text-slate-500">Chargement...</p>}
          {!loading && notifications.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              Aucune notification pour le moment.
            </div>
          )}
          {notifications.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h2>
                    {!item.readAt && (
                      <button
                        onClick={() => markRead(item.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Check className="h-3 w-3" />
                        Lu
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.message}</p>
                  <p className="mt-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
