"use client"

import { useState, useEffect } from "react"
import { 
  Loader2, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Award,
  Briefcase,
  ArrowLeft,
  Target,
  Zap
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
  level: 'beginner' | 'intermediate' | 'advanced'
  phases: RoadmapPhase[]
  totalDuration: string
  prerequisites: string[]
  certifications: string[]
  careerPaths: string[]
}

interface RoadmapDisplayProps {
  domain: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  language?: 'fr' | 'ar'
  onBack?: () => void
}

const levelLabels = {
  fr: {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé'
  },
  ar: {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  }
}

const translations = {
  fr: {
    loading: 'Chargement du roadmap...',
    duration: 'Durée totale',
    prerequisites: 'Prérequis',
    certifications: 'Certifications recommandées',
    careers: 'Débouchés professionnels',
    phase: 'Phase',
    skills: 'Compétences',
    projects: 'Projets',
    resources: 'Ressources',
    milestones: 'Objectifs',
    back: 'Retour aux suggestions',
    weeks: 'semaines',
    months: 'mois'
  },
  ar: {
    loading: 'جاري تحميل المسار...',
    duration: 'المدة الإجمالية',
    prerequisites: 'المتطلبات الأساسية',
    certifications: 'الشهادات الموصى بها',
    careers: 'الفرص المهنية',
    phase: 'المرحلة',
    skills: 'المهارات',
    projects: 'المشاريع',
    resources: 'الموارد',
    milestones: 'الأهداف',
    back: 'العودة للاقتراحات',
    weeks: 'أسابيع',
    months: 'أشهر'
  }
}

export default function RoadmapDisplay({ 
  domain, 
  level = 'beginner',
  language = 'ar',
  onBack 
}: RoadmapDisplayProps) {
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0)

  const t = translations[language]

  useEffect(() => {
    fetchRoadmap()
  }, [domain, level])

  const fetchRoadmap = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/chatbot/roadmap?domain=${encodeURIComponent(domain)}&level=${level}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء تحميل المسار' 
        : 'Erreur lors du chargement du roadmap')
    } finally {
      setLoading(false)
    }
  }

  const togglePhase = (index: number) => {
    setExpandedPhase(expandedPhase === index ? null : index)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <span className="ml-4 text-gray-300 text-lg">{t.loading}</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400 text-lg">{error}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-[#334155] text-white rounded-lg hover:bg-[#475569] transition-colors"
          >
            {t.back}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Roadmap {data.domain}
            </h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
                {levelLabels[language][data.level]}
              </span>
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                {t.duration}: {data.totalDuration}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Prerequisites */}
        <div className="bg-[#1e293b]/80 border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">{t.prerequisites}</h3>
          </div>
          <ul className="space-y-1">
            {data.prerequisites.slice(0, 3).map((prereq, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>{prereq}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Certifications */}
        <div className="bg-[#1e293b]/80 border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">{t.certifications}</h3>
          </div>
          <ul className="space-y-1">
            {data.certifications.slice(0, 3).map((cert, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Career Paths */}
        <div className="bg-[#1e293b]/80 border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">{t.careers}</h3>
          </div>
          <ul className="space-y-1">
            {data.careerPaths.slice(0, 3).map((career, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{career}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Phases Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          {language === 'ar' ? 'المراحل التعليمية' : 'Phases d\'apprentissage'}
        </h3>

        {data.phases.map((phase, index) => (
          <div
            key={index}
            className={`
              bg-[#1e293b]/80 border rounded-xl overflow-hidden transition-all duration-300
              ${expandedPhase === index 
                ? 'border-blue-500/50' 
                : 'border-[#334155] hover:border-[#475569]'
              }
            `}
          >
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(index)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${expandedPhase === index 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-[#334155] text-gray-400'
                  }
                `}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{phase.title}</h4>
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {phase.duration}
                  </span>
                </div>
              </div>
              <ChevronRight 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedPhase === index ? 'rotate-90' : ''
                }`} 
              />
            </button>

            {/* Phase Content */}
            {expandedPhase === index && (
              <div className="px-4 pb-4 border-t border-[#334155]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {/* Skills */}
                  <div>
                    <h5 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {t.skills}
                    </h5>
                    <ul className="space-y-1">
                      {phase.skills.map((skill, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-1.5">•</span>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Projects */}
                  <div>
                    <h5 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {t.projects}
                    </h5>
                    <ul className="space-y-1">
                      {phase.projects.map((project, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1.5">•</span>
                          {project}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  <div>
                    <h5 className="font-medium text-purple-400 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {t.resources}
                    </h5>
                    <ul className="space-y-1">
                      {phase.resources.map((resource, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-purple-400 mt-1.5">•</span>
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h5 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.milestones}
                    </h5>
                    <ul className="space-y-1">
                      {phase.milestones.map((milestone, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-400 mt-1.5">✓</span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {data.phases.map((_, index) => (
          <div
            key={index}
            className={`
              h-2 rounded-full transition-all duration-300
              ${expandedPhase === index 
                ? 'w-8 bg-blue-500' 
                : 'w-2 bg-[#334155]'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
