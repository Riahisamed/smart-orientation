"use client"

import { useState, useEffect } from "react"
import { Loader2, Sparkles, TrendingUp, Target, Zap } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

interface DomainSuggestion {
  domain: string
  field: string
  relevanceScore: number
  reason: string
  icon: string
  color: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  demand: string
}

interface RoadmapSelectorData {
  title: string
  subtitle: string
  suggestions: DomainSuggestion[]
  maxSuggestions: number
  showScores: boolean
  personalized: boolean
}

interface RoadmapSelectorProps {
  message: string
  bacType?: string
  score?: number
  detectedInterest?: string
  onDomainSelect: (domain: string) => void
  onClose?: () => void
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

const getDifficultyLabel = (difficulty: string, language: 'fr' | 'ar') => {
  const labels = {
    fr: { easy: 'Accessible', medium: 'Modéré', hard: 'Exigeant' },
    ar: { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
  }
  return labels[language][difficulty as keyof typeof labels['fr']] || difficulty
}

const getDemandColor = (demand: string) => {
  const demandLower = demand.toLowerCase()
  if (demandLower.includes('high') || demandLower.includes('very')) {
    return 'text-green-400'
  } else if (demandLower.includes('moderate')) {
    return 'text-yellow-400'
  } else {
    return 'text-red-400'
  }
}

export default function RoadmapSelector({
  message,
  bacType,
  score,
  detectedInterest,
  onDomainSelect,
  onClose
}: RoadmapSelectorProps) {
  const [data, setData] = useState<RoadmapSelectorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  const language: 'fr' | 'ar' = /[\u0600-\u06FF]/.test(message) ? 'ar' : 'fr'

  useEffect(() => {
    fetchRoadmapSelector()
  }, [message, bacType, score, detectedInterest])

  const fetchRoadmapSelector = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/roadmap-selector`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          bacType,
          score,
          detectedInterest
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء تحميل الاقتراحات' 
        : 'Erreur lors du chargement des suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleDomainClick = (domain: string) => {
    setSelectedDomain(domain)
    onDomainSelect(domain)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-3 text-gray-300">
          {language === 'ar' ? 'جاري تحميل الاقتراحات...' : 'Chargement des suggestions...'}
        </span>
      </div>
    )
  }

  if (error || !data || data.suggestions.length === 0) {
    return (
      <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400">{error || (language === 'ar' 
          ? 'لا توجد اقتراحات متاحة' 
          : 'Aucune suggestion disponible')}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">{data.title}</h3>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <p className="text-gray-400 text-sm">{data.subtitle}</p>
        {data.personalized && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            {bacType && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                {language === 'ar' ? 'نوع الباكا: ' : 'Bac: '} {bacType}
              </span>
            )}
            {score !== undefined && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                {language === 'ar' ? 'المعدل: ' : 'Score: '} {score}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.suggestions.map((suggestion, index) => (
          <button
            key={suggestion.domain}
            onClick={() => handleDomainClick(suggestion.domain)}
            disabled={selectedDomain === suggestion.domain}
            className={`
              relative group p-5 rounded-xl border-2 transition-all duration-300
              ${selectedDomain === suggestion.domain 
                ? 'bg-blue-600/20 border-blue-500' 
                : 'bg-[#1e293b]/80 border-[#334155] hover:border-blue-500/50 hover:bg-[#1e293b]'
              }
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Rank Badge */}
            <div className={`
              absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center
              text-sm font-bold ${index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' : 'bg-[#334155] text-gray-400'}
            `}>
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${suggestion.color}20`, border: `2px solid ${suggestion.color}40` }}
              >
                {suggestion.icon}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white text-lg">{suggestion.domain}</h4>
                  {data.showScores && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      {Math.round(suggestion.relevanceScore * 100)}%
                    </span>
                  )}
                </div>
                
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {suggestion.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className={`
                    text-xs px-2 py-1 rounded-full border
                    ${getDifficultyColor(suggestion.difficulty)}
                  `}>
                    {getDifficultyLabel(suggestion.difficulty, language)}
                  </span>
                  
                  <span className={`
                    text-xs px-2 py-1 rounded-full border bg-blue-500/10 border-blue-500/30
                    ${getDemandColor(suggestion.demand)}
                  `}>
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {suggestion.demand}
                  </span>
                </div>

                {/* Reason */}
                <p className="text-xs text-gray-500 mt-2 italic">
                  {suggestion.reason}
                </p>
              </div>
            </div>

            {/* Hover Effect Indicator */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          {language === 'ar' 
            ? 'اختر المجال الأنسب لك لرؤية roadmap مخصصة'
            : 'Choisissez le domaine qui vous correspond pour voir un roadmap personnalisé'}
        </p>
      </div>
    </div>
  )
}
