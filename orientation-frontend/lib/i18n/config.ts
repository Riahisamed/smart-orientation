export type Locale = 'fr' | 'en' | 'ar'

export const locales: Locale[] = ['fr', 'en', 'ar']
export const defaultLocale: Locale = 'fr'

export const localeLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
}

export const localeShortLabels: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
}

export const isRTL = (locale: Locale): boolean => locale === 'ar'