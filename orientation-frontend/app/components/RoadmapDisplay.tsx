"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Target,
  Zap,
} from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

interface RoadmapPhase {
  title: string
  duration: string
  skills: string[]
  projects: string[]
  resources: string[]
  milestones: string[]
}

interface RoadmapData {
  domain: string
  level: "beginner" | "intermediate" | "advanced"
  phases: RoadmapPhase[]
  totalDuration: string
  prerequisites: string[]
  certifications: string[]
  careerPaths: string[]
}

interface RoadmapDisplayProps {
  domain: string
  level?: "beginner" | "intermediate" | "advanced"
  language?: "fr" | "ar"
  onBack?: () => void
}

const labels = {
  fr: {
    loading: "Chargement du roadmap...",
    duration: "Duree totale",
    prerequisites: "Prerequis",
    certifications: "Certifications recommandees",
    careers: "Debouches professionnels",
    phase: "Phase",
    skills: "Competences",
    projects: "Projets",
    resources: "Ressources",
    milestones: "Milestones",
    back: "Retour aux suggestions",
    title: "Timeline d apprentissage",
    error: "Erreur lors du chargement du roadmap",
    levels: { beginner: "Debutant", intermediate: "Intermediaire", advanced: "Avance" },
  },
  ar: {
    loading: "Chargement du roadmap...",
    duration: "Duree totale",
    prerequisites: "Prerequis",
    certifications: "Certifications recommandees",
    careers: "Debouches professionnels",
    phase: "Phase",
    skills: "Competences",
    projects: "Projets",
    resources: "Ressources",
    milestones: "Milestones",
    back: "Retour",
    title: "Timeline",
    error: "Erreur lors du chargement du roadmap",
    levels: { beginner: "Debutant", intermediate: "Intermediaire", advanced: "Avance" },
  },
}

const phaseStyles = [
  { label: "BEGINNER", icon: CheckCircle2, color: "from-emerald-500 to-teal-500", soft: "bg-emerald-500/10 text-emerald-300" },
  { label: "INTERMEDIATE", icon: Zap, color: "from-blue-500 to-cyan-500", soft: "bg-blue-500/10 text-blue-300" },
  { label: "ADVANCED", icon: Award, color: "from-amber-500 to-orange-500", soft: "bg-amber-500/10 text-amber-300" },
]

function InfoCard({ icon: Icon, title, items, color }: { icon: any; title: string; items: string[]; color: string }) {
  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b]/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
            <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DetailList({ title, icon: Icon, items, color }: { title: string; icon: any; items: string[]; color: string }) {
  return (
    <div className="rounded-lg border border-[#334155] bg-[#0f172a]/40 p-3">
      <h5 className={`mb-2 flex items-center gap-2 font-medium ${color}`}>
        <Icon className="h-4 w-4" />
        {title}
      </h5>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
            <span className={`mt-1 ${color}`}>-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RoadmapDisplay({ domain, level = "beginner", language = "ar", onBack }: RoadmapDisplayProps) {
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0)
  const t = labels[language]

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/chatbot/roadmap?domain=${encodeURIComponent(domain)}&level=${level}`)
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
        setData(await response.json())
      } catch {
        setError(t.error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoadmap()
  }, [domain, level, t.error])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        <span className="ml-4 text-lg text-gray-300">{t.loading}</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <p className="text-lg text-red-400">{error}</p>
        {onBack && (
          <button onClick={onBack} className="mt-4 rounded-lg bg-[#334155] px-4 py-2 text-white transition-colors hover:bg-[#475569]">
            {t.back}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mb-6">
        {onBack && (
          <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>{t.back}</span>
          </button>
        )}
        <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/80 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Roadmap {data.domain}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
                  {t.levels[data.level]}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  {t.duration}: {data.totalDuration}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {phaseStyles.map((phase) => (
                <div key={phase.label} className={`rounded-xl px-3 py-2 text-xs font-bold ${phase.soft}`}>
                  {phase.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard icon={Target} title={t.prerequisites} items={data.prerequisites} color="text-purple-400" />
        <InfoCard icon={Award} title={t.certifications} items={data.certifications} color="text-yellow-400" />
        <InfoCard icon={Briefcase} title={t.careers} items={data.careerPaths} color="text-green-400" />
      </div>

      <div className="space-y-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Zap className="h-5 w-5 text-blue-400" />
          {t.title}
        </h3>

        {data.phases.map((phase, index) => {
          const phaseStyle = phaseStyles[index % phaseStyles.length]
          const PhaseIcon = phaseStyle.icon
          return (
            <div key={index} className="relative pl-5">
              <div className="absolute left-0 top-0 h-full w-px bg-[#334155]" />
              <div className={`absolute left-[-7px] top-5 h-4 w-4 rounded-full bg-gradient-to-br ${phaseStyle.color} shadow-lg`} />
              <div className={`overflow-hidden rounded-xl border bg-[#1e293b]/80 transition-all duration-300 ${expandedPhase === index ? "border-blue-500/50 shadow-xl shadow-blue-950/30" : "border-[#334155] hover:border-[#475569]"}`}>
                <button onClick={() => setExpandedPhase(expandedPhase === index ? null : index)} className="flex w-full items-center justify-between p-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${phaseStyle.soft}`}>
                      <PhaseIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${phaseStyle.soft}`}>{phaseStyle.label}</span>
                        <span className="text-xs text-gray-500">{t.phase} {index + 1}</span>
                      </div>
                      <h4 className="font-semibold text-white">{phase.title}</h4>
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Clock className="h-3 w-3" />
                        {phase.duration}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedPhase === index ? "rotate-90" : ""}`} />
                </button>

                {expandedPhase === index && (
                  <div className="border-t border-[#334155] px-4 pb-4">
                    <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                      <DetailList title={t.skills} icon={BookOpen} items={phase.skills} color="text-blue-400" />
                      <DetailList title={t.projects} icon={Target} items={phase.projects} color="text-green-400" />
                      <DetailList title={t.resources} icon={BookOpen} items={phase.resources} color="text-purple-400" />
                      <DetailList title={t.milestones} icon={CheckCircle2} items={phase.milestones} color="text-yellow-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        {data.phases.map((_, index) => (
          <div key={index} className={`h-2 rounded-full transition-all duration-300 ${expandedPhase === index ? "w-8 bg-blue-500" : "w-2 bg-[#334155]"}`} />
        ))}
      </div>
    </div>
  )
}
