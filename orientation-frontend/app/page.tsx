"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Sparkles, GraduationCap, Building2, TrendingUp, 
  Shield, ArrowRight, BarChart3, Target, Users, User,
  CheckCircle, BookOpen, ChevronRight, Star, Globe,
  Lightbulb, Rocket, Zap, Bot
} from "lucide-react"
import { Button } from "lib/components/ui/button"
import { Card, CardContent } from "lib/components/ui/card"
import { useTranslations } from "@/lib/i18n/context"
import LanguageSwitcher from "./components/LanguageSwitcher"

export default function HomePage() {
  const t = useTranslations()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleStart = () => router.push("/choose-role")

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">{t("common.appName")}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
            <Link href="/choose-role" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              {t("home.login")}
            </Link>
            <Button onClick={() => router.push("/choose-role")} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm h-9">
              {t("home.getStarted")}
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 dark:opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-20 right-40 w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8 animate-[fadeIn_0.5s_ease-in-out]">
            <Sparkles className="h-4 w-4" />
            {t("home.smartPlatform")}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight animate-[fadeIn_0.6s_ease-in-out]">
            {t("home.heroTagline")}
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 animate-[fadeIn_0.7s_ease-in-out]">
            {t("home.heroDesc")}
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-[fadeIn_0.8s_ease-in-out]">
            <Button onClick={handleStart} className="rounded-xl h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-medium shadow-lg shadow-blue-500/25">
              <Rocket className="h-5 w-5 mr-2" />
              {t("home.startOrientation")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={() => router.push("/market-trends")} variant="outline" className="rounded-xl h-12 px-8 border-slate-300 dark:border-slate-700 text-base">
              <TrendingUp className="h-5 w-5 mr-2" />
              {t("home.exploreMarket")}
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: "50+", label: t("home.statsFilieres") },
              { value: "1000+", label: t("home.statsStudents") },
              { value: "95%", label: t("home.statsSatisfaction") },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t("home.howItWorks")}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              {t("home.simpleProcess")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: t("home.step1Title"), desc: t("home.step1Desc"), icon: User },
              { step: "2", title: t("home.step2Title"), desc: t("home.step2Desc"), icon: BookOpen },
              { step: "3", title: t("home.step3Title"), desc: t("home.step3Desc"), icon: Lightbulb },
              { step: "4", title: t("home.step4Title"), desc: t("home.step4Desc"), icon: Target },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t("home.features")}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              {t("home.featuresDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: t("home.academicAnalysis"), desc: t("home.featureAcademicDesc"), color: "blue" },
              { icon: Target, title: t("home.matching"), desc: t("home.featureMatchingDesc"), color: "indigo" },
              { icon: TrendingUp, title: t("home.marketData"), desc: t("home.featureMarketDesc"), color: "purple" },
              { icon: Bot, title: t("home.aiAssistant"), desc: t("home.featureAIDesc"), color: "pink" },
              { icon: Building2, title: t("home.enterpriseSpace"), desc: t("home.featureEnterpriseDesc"), color: "green" },
              { icon: Shield, title: t("home.recommendations"), desc: t("home.featureRecommendationsDesc"), color: "orange" },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all group">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== MARKET PREVIEW ===== */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("home.marketPreview")}
          </h2>
          <p className="text-indigo-100 text-lg mb-12 max-w-3xl mx-auto">
            {t("home.marketDesc")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { value: "40%", label: t("home.marketGrowthTech") },
              { value: "55K TND", label: t("home.marketSalaryAI") },
              { value: "18+", label: t("home.marketSectors") },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-indigo-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <Button onClick={() => router.push("/market-trends")} className="rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 h-12 px-8 font-medium">
            {t("home.viewTrends")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ===== FOR ENTERPRISES ===== */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
                <Building2 className="h-4 w-4" />
                {t("home.recruiterSpace")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {t("home.enterpriseSection")}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                {t("home.enterpriseDesc")}
              </p>
              <div className="space-y-4 mb-8">
                {[
                  t("home.enterpriseFeature1"),
                  t("home.enterpriseFeature2"),
                  t("home.enterpriseFeature3"),
                  t("home.enterpriseFeature4"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => router.push("/enterprise/register")} className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 px-8">
                <Building2 className="h-5 w-5 mr-2" />
                {t("home.joinEnterprise")}
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8 border border-green-200 dark:border-green-800">
                <div className="space-y-4">
                  {["Développeur Full Stack", "Data Scientist", "Chef de Projet Digital"].map((job) => (
                    <div key={job} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{job}</p>
                        <p className="text-xs text-slate-500">12 profils compatibles</p>
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">92% match</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            {t("home.ctaSubtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleStart} className="rounded-xl h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-medium shadow-lg">
              <Rocket className="h-5 w-5 mr-2" />
              {t("home.startNow")}
            </Button>
            <Button onClick={() => router.push("/enterprise/register")} variant="outline" className="rounded-xl h-12 px-8 border-slate-300 dark:border-slate-700 text-base">
              <Building2 className="h-5 w-5 mr-2" />
              {t("home.enterpriseSpace")}
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{t("common.appName")}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("home.footerDesc")}
              </p>
            </div>
            {[
              { title: t("home.footerPlatform"), links: t("home.footerPlatformLinks").split(",") },
              { title: t("home.footerEnterprises"), links: t("home.footerEnterpriseLinks").split(",") },
              { title: t("home.footerSupport"), links: t("home.footerSupportLinks").split(",") },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
            {t("home.copyright")}
          </div>
        </div>
      </footer>
    </div>
  )
}