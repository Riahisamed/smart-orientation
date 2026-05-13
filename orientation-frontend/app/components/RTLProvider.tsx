"use client"

import { useEffect } from 'react'
import { useLocale } from '@/lib/i18n/context'

export default function RTLProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale()

  useEffect(() => {
    const isRtl = locale === 'ar'
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  return <>{children}</>
}
