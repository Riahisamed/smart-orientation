export type BacType = 'MATH' | 'SVT' | 'ECO' | 'LETTRES' | 'SPORT' | 'TECH' | 'INFO';

export type BacDomains = {
  includesFieldKeywords: string[];
  includesAliasKeywords: string[];
  /**
   * STRICT WHITELIST: Only these exact domain fields are allowed for this BAC type.
   * This ensures students ONLY see relevant domains.
   */
  allowedDomains: string[];
};

/**
 * STRICT BAC → Domain whitelist mapping.
 * Students will ONLY see domains listed in allowedDomains for their BAC type.
 */
export const BAC_DOMAINS: Record<BacType, BacDomains> = {
  // INFO / MATH: ONLY tech domains
  INFO: {
    includesFieldKeywords: ['IT', 'Frontend', 'Backend', 'Cybersecurity', 'AI', 'Machine Learning'],
    includesAliasKeywords: ['informatique', 'informatia', 'dev', 'web', 'frontend', 'backend', 'cyber', 'ai', 'machine learning', 'data'],
    allowedDomains: [
      'Frontend Development',
      'Backend Development',
      'AI & Machine Learning',
      'Cybersecurity',
      'Data Science',
      'Génie Logiciel',
      'Cloud Computing',
      'DevOps',
    ],
  },
  MATH: {
    includesFieldKeywords: ['IT', 'Frontend', 'Backend', 'Cybersecurity', 'AI', 'Machine Learning'],
    includesAliasKeywords: ['informatique', 'informatia', 'dev', 'web', 'frontend', 'backend', 'cyber', 'ai', 'machine learning', 'data'],
    allowedDomains: [
      'Frontend Development',
      'Backend Development',
      'AI & Machine Learning',
      'Cybersecurity',
      'Data Science',
      'Génie Logiciel',
      'Cloud Computing',
      'DevOps',
    ],
  },

  // SVT: ONLY medical/health domains
  SVT: {
    includesFieldKeywords: ['Médecine', 'Santé', 'Medical'],
    includesAliasKeywords: ['medecine', 'médecine', 'santé', 'pharmacie', 'patient', 'médecin', 'docteur'],
    allowedDomains: [
      'Médecine / Santé',
      'Pharmacie',
      'Biologie',
      'Nutrition',
      'Santé Publique',
    ],
  },

  // ECO: ONLY business/economics domains
  ECO: {
    includesFieldKeywords: ['Business', 'Management', 'Finance'],
    includesAliasKeywords: ['business', 'gestion', 'commerce', 'finance', 'marketing', 'comptabilité', 'économie'],
    allowedDomains: [
      'Business / Management',
      'Marketing',
      'Finance',
      'Communication',
      'Gestion / Commerce',
    ],
  },

  // LETTRES: ONLY language/law/communication domains
  LETTRES: {
    includesFieldKeywords: ['Traduction', 'Langues', 'Journalisme', 'Médias', 'Droit'],
    includesAliasKeywords: ['traduction', 'translation', 'langues', 'journalisme', 'médias', 'media', 'communication', 'droit', 'law', 'avocat'],
    allowedDomains: [
      'Droit / Avocat',
      'Traduction / Langues',
      'Journalisme / Médias',
      'Communication',
    ],
  },

  // SPORT: ONLY sport/coaching domains
  SPORT: {
    includesFieldKeywords: ['Coaching', 'Sport'],
    includesAliasKeywords: ['coaching', 'coach', 'fitness', 'sport', 'nutrition sportive', 'préparation physique', 'entraîneur'],
    allowedDomains: [
      'Coaching / Sport',
      'Nutrition Sportive',
      'Préparation Physique',
    ],
  },

  // TECH: Same as INFO (engineering + IT)
  TECH: {
    includesFieldKeywords: ['IT', 'Frontend', 'Backend', 'Cybersecurity', 'AI', 'Machine Learning'],
    includesAliasKeywords: ['ingénieur', 'genie', 'technique', 'informatique', 'dev', 'web', 'backend', 'frontend', 'cyber', 'ai', 'data'],
    allowedDomains: [
      'Frontend Development',
      'Backend Development',
      'AI & Machine Learning',
      'Cybersecurity',
      'Data Science',
      'Génie Logiciel',
      'Cloud Computing',
      'DevOps',
    ],
  },
};
