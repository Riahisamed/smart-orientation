import { IntentEntities } from './intent.types';

/**
 * Normalize text for intent matching
 * Handles Tunisian arabic, french, accents, transliteration
 */
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[؟?.,:;!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if text contains any of the keywords
 */
export function hasAnyKeyword(normalizedText: string, keywords: string[]): boolean {
  return keywords.some(keyword =>
    normalizedText.includes(normalizeText(keyword))
  );
}

/**
 * Calculate keyword match count
 */
export function countMatches(normalizedText: string, keywords: string[]): number {
  return keywords.filter(keyword =>
    normalizedText.includes(normalizeText(keyword))
  ).length;
}

/**
 * Extract score number from message
 */
export function extractScore(text: string): number | undefined {
  const matches = text.match(/\b(\d{2,3}(?:[.,]\d{1,2})?)\b/);
  if (matches) {
    const score = parseFloat(matches[1].replace(',', '.'));
    if (score >= 50 && score <= 200) {
      return score;
    }
  }
  return undefined;
}

/**
 * Domain aliases mapping for multi language detection
 */
export const DOMAIN_MAPPINGS: Array<{ domain: string; aliases: string[] }> = [
  {
    domain: 'tech',
    aliases: [
      'it', 'tech', 'informatique', 'info', 'dev', 'software', 'programation', 'programming',
      'اعلامية', 'معلوماتية', 'برمجة', 'web', 'cyber', 'securite', 'data', 'ai', 'ia'
    ]
  },
  {
    domain: 'engineering',
    aliases: [
      'engineering', 'ingenieur', 'genie', 'ingenierie', 'civil', 'mecanique', 'electrique',
      'هندسة', 'مهندس', 'مدني', 'ميكانيك', 'كهرباء'
    ]
  },
  {
    domain: 'health',
    aliases: [
      'health', 'sante', 'medical', 'medecine', 'infirmier', 'pharmacie', 'paramedical',
      'طب', 'صحة', 'تمريض', 'صيدلة', 'kine', 'kiné', 'علاج طبيعي'
    ]
  },
  {
    domain: 'business',
    aliases: [
      'business', 'gestion', 'management', 'finance', 'marketing', 'commerce', 'economie',
      'اعمال', 'إدارة', 'محاسبة', 'مالية', 'تجارة', 'تسويق'
    ]
  },
  {
    domain: 'sport',
    aliases: [
      'sport', 'education physique', 'coaching', 'entrainement',
      'رياضة', 'تربية بدنية', 'مدرب', 'كينو'
    ]
  }
];

/**
 * Extract entities from message
 */
export function extractEntities(text: string): IntentEntities {
  const normalized = normalizeText(text);
  const entities: IntentEntities = {};

  // Extract score
  entities.score = extractScore(text);

  // Extract domain
  for (const mapping of DOMAIN_MAPPINGS) {
    if (hasAnyKeyword(normalized, mapping.aliases)) {
      entities.domain = mapping.domain;
      break;
    }
  }

  return entities;
}