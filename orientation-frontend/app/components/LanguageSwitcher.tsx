"use client"

import { useLocale } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/config'
import { locales, localeShortLabels, isRTL } from '@/lib/i18n/config'
import { Globe, Check } from 'lucide-react'
import { useState } from 'react'

const localeFullLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
}

const localeFlagColors: Record<Locale, string> = {
  fr: 'bg-blue-100 text-blue-700',
  en: 'bg-red-100 text-red-700',
  ar: 'bg-green-100 text-green-700',
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)

  const handleChange = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setOpen(false)
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`h-9 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors`}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span>{localeShortLabels[locale as Locale]}</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-1 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 py-1 overflow-hidden">
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => handleChange(l)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 ${
                    l === locale ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                  dir={isRTL(l) ? 'rtl' : 'ltr'}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    localeFlagColors[l]
                  }`}>
                    {localeShortLabels[l]}
                  </span>
                  <span className="flex-1">{localeFullLabels[l]}</span>
                  {l === locale && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5" dir="ltr">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            l === locale
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {localeShortLabels[l]}
        </button>
      ))}
    </div>
  )
}