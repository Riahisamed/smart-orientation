"use client"

import { useEffect, useState } from "react"
import { Download, Send } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

type OrientationQuestion = {
  id: string
  label: string
  category: string
  domains: string[]
  skills: string[]
}

export default function OrientationTestPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [questions, setQuestions] = useState<OrientationQuestion[]>([])
  const [interests, setInterests] = useState("")
  const [result, setResult] = useState<any>(null)
  const [latest, setLatest] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : ""

  useEffect(() => {
    fetch(`${API_BASE_URL}/orientation-test/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQuestions([]))

    if (!token) return
    fetch(`${API_BASE_URL}/orientation-test/me/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setLatest(data?.id ? data : null))
      .catch(() => setLatest(null))
  }, [token])

  const submit = async () => {
    setLoading(true)
    setError("")

    try {
      const payload = {
        interests,
        answers: questions.map((question) => ({
          questionId: question.id,
          label: question.label,
          value: answers[question.id] ?? 0,
          domains: question.domains,
          skills: question.skills,
        })),
      }

      const res = await fetch(`${API_BASE_URL}/orientation-test/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Submit failed")
      const data = await res.json()
      setResult(data)
      setLatest(data.test)
    } catch {
      setError("Impossible d'enregistrer le test. Connectez-vous puis reessayez.")
    } finally {
      setLoading(false)
    }
  }

  const reportId = result?.report?.id ?? latest?.report?.id

  const downloadReport = async () => {
    if (!reportId) return
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `orientation-report-${reportId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Test d'orientation</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Repondez aux questions pour generer des recommandations et un rapport PDF.
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {questions.map((question) => (
            <div key={question.id} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              <label className="block font-medium text-slate-900 dark:text-slate-100">{question.label}</label>
              <input
                type="range"
                min="0"
                max="5"
                value={answers[question.id] ?? 0}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: Number(event.target.value) }))}
                className="mt-3 w-full"
              />
              <div className="mt-1 text-right text-sm text-slate-500">{answers[question.id] ?? 0}/5</div>
            </div>
          ))}

          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Interets personnels, metiers preferes, contraintes..."
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
          />

          <button
            onClick={submit}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:bg-slate-400"
          >
            <Send className="h-4 w-4" />
            {loading ? "Analyse..." : "Envoyer le test"}
          </button>
        </section>

        {(result || latest) && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Resultats</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {((result?.test ?? latest)?.dominantDomains ?? []).map((item: any) => (
                <div key={item.domain} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <p className="font-medium">{item.domain}</p>
                  <p className="text-sm text-slate-500">Score {item.score}</p>
                </div>
              ))}
            </div>
            {reportId && (
              <button
                onClick={downloadReport}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-950"
              >
                <Download className="h-4 w-4" />
                Telecharger le rapport PDF
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
