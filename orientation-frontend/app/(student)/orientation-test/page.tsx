"use client"

import { useEffect, useState } from "react"
import { Award, BriefcaseBusiness, Download, GraduationCap, Lightbulb, Send, TrendingUp } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"
import { useTranslations } from "@/lib/i18n/context"

type OrientationQuestion = {
  id: string
  label: string
  category: string
  domains: string[]
  skills: string[]
}

const domainStyles = [
  { icon: GraduationCap, color: "blue", label: "Academique" },
  { icon: BriefcaseBusiness, color: "emerald", label: "Marche fort" },
  { icon: Lightbulb, color: "amber", label: "Innovation" },
  { icon: TrendingUp, color: "violet", label: "Croissance" },
]

const toneClasses: Record<string, { bg: string; text: string; bar: string; ring: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", bar: "bg-blue-600", ring: "border-blue-200 dark:border-blue-800" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-600", ring: "border-emerald-200 dark:border-emerald-800" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500", ring: "border-amber-200 dark:border-amber-800" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", bar: "bg-violet-600", ring: "border-violet-200 dark:border-violet-800" },
}

const demandFor = (percent: number) => (percent >= 80 ? "Elevee" : percent >= 55 ? "Stable" : "Niche")
const outlookFor = (percent: number) => (percent >= 80 ? "Tres prometteur" : percent >= 55 ? "Bon potentiel" : "A explorer")

export default function OrientationTestPage() {
  const t = useTranslations()
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

      if (!res.ok) throw new Error(t("orientationTest.errorSave"))
      const data = await res.json()
      setResult(data)
      setLatest(data.test)
    } catch {
      setError(t("orientationTest.errorSave"))
    } finally {
      setLoading(false)
    }
  }

  const reportId = result?.report?.id ?? latest?.report?.id
  const visibleResult = result?.test ?? latest
  const domainResults = (visibleResult?.dominantDomains ?? []) as any[]
  const maxScore = Math.max(...domainResults.map((item) => Number(item.score) || 0), 1)
  const topDomain = domainResults[0]

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t("orientationTest.title")}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("orientationTest.description")}
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
            placeholder={t("orientationTest.personalInterests")}
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
          />

          <button
            onClick={submit}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:bg-slate-400"
          >
            <Send className="h-4 w-4" />
            {loading ? t("orientationTest.analyzing") : t("orientationTest.submitTest")}
          </button>
        </section>

        {(result || latest) && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t("orientationTest.smartResults")}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("orientationTest.compatibilityDesc")}</p>
                </div>
                {topDomain && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <Award className="h-4 w-4" />
                      {t("orientationTest.topRecommendation")}
                    </div>
                    <p className="mt-1 font-bold">{topDomain.domain}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {domainResults.map((item: any, index: number) => {
                const style = domainStyles[index % domainStyles.length]
                const tone = toneClasses[style.color]
                const Icon = style.icon
                const percent = Math.min(100, Math.round(((Number(item.score) || 0) / maxScore) * 100))
                return (
                  <div key={item.domain} className={`rounded-2xl border p-4 ${tone.bg} ${tone.ring}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl bg-white p-2 shadow-sm dark:bg-slate-900 ${tone.text}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-slate-50">{item.domain}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{style.label}</p>
                        </div>
                      </div>
                      <span className={`rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-sm dark:bg-slate-900 ${tone.text}`}>
                        {percent}%
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{t("orientationTest.score")} {item.score}</span>
                        <span>{t("orientationTest.compatibility")}</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${tone.bar} transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">{t("orientationTest.demand")}: {demandFor(percent)}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">{t("orientationTest.outlook")}: {outlookFor(percent)}</span>
                      {index === 0 && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-white">{t("orientationTest.recommended")}</span>}
                    </div>
                  </div>
                )
              })}
              {domainResults.length === 0 && <p className="text-sm text-slate-500">{t("orientationTest.noResultsYet")}</p>}
            </div>
            {reportId && (
              <button
                onClick={downloadReport}
                className="mx-5 mb-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-100 dark:text-slate-950"
              >
                <Download className="h-4 w-4" />
                {t("orientationTest.downloadPdf")}
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  )
}