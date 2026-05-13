"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Locale } from './config'
import { defaultLocale, isRTL } from './config'
import fr from '@/messages/fr.json'
import en from '@/messages/en.json'
import ar from '@/messages/ar.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messages: Record<Locale, any> = { fr, en, ar }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, params?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (path: string) => path,
  dir: 'ltr',
  isLoading: true,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale') as Locale | null
      if (stored && ['fr', 'en', 'ar'].includes(stored)) {
        setLocaleState(stored)
      } else {
        // Detect browser language
        const browserLang = navigator.language.slice(0, 2)
        if (browserLang === 'ar') setLocaleState('ar')
        else if (browserLang === 'en') setLocaleState('en')
        // default is fr
      }
    } catch { /* ignore */ }
    setIsLoading(false)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem('locale', newLocale)
    } catch { /* ignore */ }
  }, [])

  // Update HTML dir attribute
  useEffect(() => {
    const dir = isRTL(locale) ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.')
    let value: any = messages[locale]

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        // Try fallback to French
        let fallback: any = messages['fr']
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in fallback) {
            fallback = fallback[k]
          } else {
            return path
          }
        }
        if (typeof fallback === 'string') {
          return replaceParams(fallback, params)
        }
        return path
      }
    }

    if (typeof value === 'string') {
      return replaceParams(value, params)
    }
    return path
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: isRTL(locale) ? 'rtl' : 'ltr', isLoading }}>
      {children}
    </I18nContext.Provider>
  )
}

function replaceParams(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }, text)
}

export function useLocale() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider')
  }
  return context
}

export function useTranslations() {
  const { t } = useLocale()
  return t
}