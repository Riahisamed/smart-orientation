import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IntentDetectorService } from './intent-detector.service';

export type AdmissionLevel = 'safe' | 'possible' | 'hard';
export type ProgramDomain = 'tech' | 'health' | 'business' | 'sport' | 'art' | 'engineering' | 'letters' | 'other';

export type RagQuery = {
  message?: string;
  bacType?: string;
  score?: number;
  limit?: number;
  interest?: string;
};

export type GuideBacType = {
  type: string;
  capacity?: number;
  lastScore?: number | null;
};

export type GuideProgram = {
  code: string;
  name?: string;
  program: string;
  institution: string;
  specialization?: string;
  description?: string;
  domain?: ProgramDomain;
  formula?: string;
  bacTypes?: GuideBacType[];
};

export type FieldData = {
  field: string;
  keywords: string[];
  demand_in_tunisia?: string;
  future_outlook?: string;
  unemployment_risk?: string;
};

export type JobData = {
  title: string;
  description: string;
  skills: string[];
  demand: string;
  unemployment_rate: number;
  salary_level?: string;
  senior_salary?: string;
};

export type JobDomainData = {
  field: string;
  keywords: string[];
  jobs: JobData[];
};

export type RankedProgram = GuideProgram & {
  matchingBac?: GuideBacType;
  admissionLevel: AdmissionLevel;
  admissionGap?: number;
  rankScore: number;
  matchedKeywords: string[];
};

export type RagResult = {
  bacType?: string;
  score?: number;
  field?: FieldData;
  jobs: JobData[];
  programs: RankedProgram[];
};

// ============================================
// 🧠 DECISION ENGINE TYPES
// ============================================

export type DifficultyLevel = 'Safe' | 'Medium' | 'Difficult';

export type ClassifiedProgram = RankedProgram & {
  difficulty: DifficultyLevel;
  gap: number;
};

export type DecisionOptions = {
  best: ClassifiedProgram;
  backup?: ClassifiedProgram;
  risky?: ClassifiedProgram;
};

export type MemoryData = {
  interest?: string;
  difficulty?: 'easy' | 'challenge';
  preferredTrack?: string;
  askedQuestions: string[];
  rejectedDomains: string[];
};

export type FollowUpQuestion = {
  text: string;
  category: 'refinement' | 'confirmation' | 'comparison';
};

export type DecisionContext = {
  field: FieldData | null;
  programs: ClassifiedProgram[];
  jobs: JobData[];
  options: DecisionOptions | null;
  memory: MemoryData;
  followUp: FollowUpQuestion;
};

export type RagMergedResult = RagResult & {
  demand?: string;
  unemployment?: string;
  outlook?: string;
  unemploymentRate?: number | null;
  decisionOptions?: DecisionOptions;
  followUpQuestion?: string;
};

export type EmploymentInsights = {
  demand: string;
  demandLevel: 'high' | 'medium' | 'low' | 'unknown';
  unemploymentRisk: string;
  unemploymentRiskLevel: 'low' | 'moderate' | 'high' | 'unknown';
  unemploymentRate: number | null;
  outlook: string;
  jobs: JobData[];
};

type FieldsJsonData = {
  fields?: FieldData[];
};

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFormulaSearchTerms(formula?: string): string {
  if (!formula) return '';

  const normalizedFormula = formula.toUpperCase();
  const terms: string[] = [];

  const formulaAliases: [RegExp, string][] = [
    [/\bANG\b/, 'anglais langues'],
    [/\bAR\b/, 'arabe lettres'],
    [/\bF\b|\bFR\b/, 'francais français langues'],
    [/\bESP\b/, 'espagnol langues'],
    [/\bIT\b/, 'italien langues'],
    [/\bALL\b/, 'allemand langues'],
    [/\bHG\b/, 'histoire geographie géographie sciences humaines humanites humanités'],
    [/\bPH\b/, 'philosophie psychologie sciences humaines humanites humanités'],
  ];

  for (const [pattern, words] of formulaAliases) {
    if (pattern.test(normalizedFormula)) terms.push(words);
  }

  return terms.join(' ');
}

export const FIELD_ALIASES = {
  engineering: [
    "génie",
    "engineering",
    "ingenierie",
    "civil",
    "mécanique",
    "mecanique",
    "electrique",
    "électrique",
    "industrie",
    "industriel",
    "الهندسة",
    "مدنية",
    "ميكانيك",
    "كهرباء",
    "صناعة"
  ],

  it: [
    "informatique",
    "dev",
    "web",
    "data",
    "cyber",
    "programmation",
    "اعلامية",
    "معلوماتية",
    "برمجة"
  ],

  health: [
    "santé",
    "medical",
    "médecine",
    "pharmacie",
    "طب",
    "صيدلة",
    "صحة"
  ],

  sport: [
    "sport",
    "coach",
    "kiné",
    "رياضة",
    "تربية بدنية"
  ],

  art: [
    "art",
    "design",
    "cinema",
    "musique",
    "فن",
    "تصميم"
  ],

  business: [
    "business",
    "finance",
    "management",
    "gestion",
    "commerce",
    "تصرف",
    "اقتصاد"
  ],

  letters: [
    "lettres",
    "langues",
    "litterature",
    "littérature",
    "francais",
    "français",
    "anglais",
    "arabe",
    "traduction",
    "communication",
    "journalisme",
    "droit",
    "civilisation",
    "sciences humaines",
    "humanites",
    "humanités",
    "philosophie",
    "histoire",
    "géographie",
    "geographie",
    "sociologie",
    "psychologie",
    "education",
    "éducation",
    "law",
    "حقوق",
    "آداب",
    "لغات",
    "ترجمة",
    "صحافة",
    "تواصل"
  ]
} as const;

type FieldAliasKey = keyof typeof FIELD_ALIASES;

export function detectField(message: string): FieldAliasKey | null {
  const normalized = normalizeText(message);

  if (/\b(litterair\w*|litterature|lettres?|langues?|droit|humanites?|humaines?|traduction|journalisme|communication)\b/.test(normalized)) {
    return 'letters';
  }

  for (const [field, keywords] of Object.entries(FIELD_ALIASES)) {
    if (
      keywords.some(keyword =>
        normalized.includes(normalizeText(keyword))
      )
    ) {
      return field as FieldAliasKey;
    }
  }

  return null;
}

export function findProgramsByField<T extends {
  program?: string;
  name?: string;
  institution?: string;
  description?: string;
  specialization?: string;
  formula?: string;
  domain?: string;
  bacTypes?: GuideBacType[];
  matchingBac?: GuideBacType;
}>(
  field: FieldAliasKey | string | null,
  guides: T[],
  bacType?: string,
): T[] {
  if (!field) return [];

  const aliases = FIELD_ALIASES[field as FieldAliasKey] || [];

  return guides.filter(program => {
    const searchableText = normalizeText(`
      ${program.program || ""}
      ${program.name || ""}
      ${program.institution || ""}
      ${program.specialization || ""}
      ${program.description || ""}
      ${program.formula || ""}
      ${getFormulaSearchTerms(program.formula)}
      ${program.domain || ""}
    `);

    const hasKeyword = aliases.some(alias =>
      searchableText.includes(normalizeText(alias))
    );

    const supportsBac =
      !bacType ||
      !!program.matchingBac ||
      program.bacTypes?.some(b =>
        normalizeText(b.type).includes(normalizeText(bacType))
      );

    return hasKeyword && supportsBac;
  });
}

/**
 * Sub-domain keywords for filtering jobs and skills within a field
 */
const SUB_DOMAIN_KEYWORDS: Record<string, string[]> = {
  medecine: ['médecine', 'medecine', 'médecin', 'medecin', 'doctor', 'طبيب', 'طب'],
  pharmacie: ['pharmacie', 'pharmacien', 'pharmacy', 'صيدلة', 'صيدلي'],
  dentaire: ['dentaire', 'dentiste', 'أسنان', 'طبيب أسنان'],
  infirmier: ['infirmier', 'nurse', 'تمريض', 'ممرض'],
  developpeur: ['dev', 'développeur', 'developpeur', 'developer', 'برمجة', 'مطور', 'programmeur'],
  cyber: ['cyber', 'sécurité', 'secu', 'pentest', 'hacker', 'أمن معلومات', 'أمن سيبراني'],
  data: ['data', 'analyse', 'analyst', 'بيانات', 'تحليل'],
  reseau: ['réseau', 'reseau', 'network', 'شبكات'],
  frontend: ['frontend', 'front-end', 'front', 'ui', 'ux'],
  backend: ['backend', 'back-end', 'back'],
  mobile: ['mobile', 'app', 'ios', 'android', 'تطبيقات'],
  coaching: ['coach', 'coaching', 'تدريب', 'مدرب'],
  kine: ['kiné', 'kine', 'kinésithérapeute', 'kinesitherapeute', 'علاج طبيعي'],
  commerce: ['commerce', 'تجارة'],
  finance: ['finance', 'مالية', 'بنوك'],
  marketing: ['marketing', 'تسويق'],
  design: ['design', 'تصميم', 'graphiste'],
};

/** 
 * REUSABLE: detectField helper
 * Maps user message to ONE detected domain field
 */
const DOMAIN_DETECTION_RULES: { field: string; keywords: RegExp[] }[] = [
  { field: 'IT', keywords: [
    /informatique|informatia|dev|developpement|programmation|software|reseau|reseaux|cyber|data|ia|ai|intelligence artificielle|web|mobile|cloud|devops|it|tech|code|fullstack|frontend|backend|برمجة|اعلامية|معلوماتية|شبكات|أمن معلومات|تطوير/i,
  ]},
  { field: 'SPORT', keywords: [
    /sport|sportif|sportive|kine|kinesitherapie|entrainement|entraînement|coach|coaching|fitness|eps|education physique|performance sportive|athlete|football|basket|tennis|رياضة|الرياضة|بدنية|تربية بدنية|تدريب|مدرب|علاج طبيعي|لياقة/i,
  ]},
  { field: 'HEALTH', keywords: [
    /medecine|medicine|medical|sante|santé|pharmacie|infirmier|infirmiere|dentaire|dentiste|biologie|biologiste|paramedical|paramédical|soins|hopital|hospital|clinique|patient|diagnostic|urgences|chirurgie|anesthesie|radiologie|laboratoire medical|طب|صحة|صيدلة|تمريض|بيولوجيا|مستشفى|علاج/i,
  ]},
  { field: 'BUSINESS', keywords: [
    /business|gestion|commerce|finance|marketing|economie|economie|comptabilite|comptabilite|audit|banque|assurance|management|administration|ressources humaines|rh|logistique|supply chain|trading|bourse|entrepreneur|startup|أعمال|إدارة|محاسبة|مالية|تصرف|تجارة|اقتصاد|تسويق/i,
  ]},
  { field: 'ENGINEERING', keywords: [
    /ingenieur|ingenierie|genie|mecanique|electrique|electronique|civil|industriel|production|maintenance|mines|ponts|geophysique|petrole|energie|automatique|robotique|genie civil|genie mecanique|هندسة|مهندس|مدني|ميكانيك|كهرباء|إلكترونيك|طاقة/i,
  ]},
  { field: 'DESIGN', keywords: [
    /design|graphisme|graphique|graphiste|illustration|typographie|branding|ui|ux|figma|photoshop|illustrator|mode|fashion|decoration|interieur|تصميم|جرافيك|فنون تطبيقية|ديكور/i,
  ]},
  { field: 'MEDIA', keywords: [
    /media|audiovisuel|cinema|theatre|journalisme|journalist|communication|radio|television|tv|presse|publicite|publicité|rédaction|redaction|content creator|إعلام|صحافة|اتصال|إذاعة|تلفزة|سينما|مسرح/i,
  ]},
  { field: 'SCIENCE', keywords: [
    /science|physique|chimie|mathematiques|mathematique|biologie|biologiste|recherche|laboratoire|environnement|agronomie|geologie|astronomie|recherche scientifique|علوم|كيمياء|فيزياء|رياضيات|أحياء|بحث علمي|مختبر/i,
  ]},
  { field: 'LAW', keywords: [
    /droit|law|juridique|justice|avocat|notaire|magistrat|juge|tribunal|juriste|legal|contentieux|loi|réglementation|reglementation|compliance|قانون|عدالة|محامي|قاضي|محكمة|قضاء/i,
  ]},
  { field: 'ECONOMY', keywords: [
    /economie|economie|economique|economique|macro|micro|politique economique|analyse economique|econometrie|بنوك|أسواق|مالية|استثمار|اقتصاد كلي|اقتصاد جزئي/i,
  ]},
  { field: 'EDUCATION', keywords: [
    /education|enseignement|formation|pedagogie|professeur|enseignant|maitre|maître|educateur|ecole|ecole|universite|université|tutorat|apprentissage|didactique|تربية|تعليم|أستاذ|مدرس|تكوين|تعليمي|مدرسة|جامعة/i,
  ]},
];

/**
 * Detect field from message (REUSABLE helper)
 */
function detectLegacyField(message?: string): string | null {
  if (!message) return null;
  const field = detectField(message);
  if (!field) return null;

  const map: Record<FieldAliasKey, string> = {
    engineering: 'ENGINEERING',
    it: 'IT',
    health: 'HEALTH',
    sport: 'SPORT',
    art: 'DESIGN',
    business: 'BUSINESS',
    letters: 'LANGUAGES',
  };

  return map[field];
}

/** Normalize a field name for comparison */
function normalizeField(fieldName?: string): string {
  return (fieldName || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/\s]+/g, '')
    .toLowerCase();
}

/** Map a normalized domain key to the canonical field name used in fields.json */
function mapToFieldsJsonField(detectedField: string | null): string | null {
  if (!detectedField) return null;
  const n = normalizeField(detectedField);
  const map: Record<string, string> = {
    'it': 'IT',
    'sport': 'Sport', // Sport is not in fields.json, we'll handle this virtually
    'health': 'Medical / Health',
    'business': 'Business / Management',
    'engineering': 'Engineering',
    'design': 'Arts & Design',
    'media': 'Media', // not in fields.json
    'science': 'Science',
    'law': 'Law',
    'economy': 'Economy', // not in fields.json
    'education': 'Education', // not in fields.json
  };
  return map[n] || null;
}

/** Map a canonical fields.json field name back to our 11-domain key */
function mapToDomainKey(fieldsJsonField: string): string {
  const map: Record<string, string> = {
    'IT': 'IT',
    'Medical / Health': 'HEALTH',
    'Business / Management': 'BUSINESS',
    'Engineering': 'ENGINEERING',
    'Arts & Design': 'DESIGN',
    'Science': 'SCIENCE',
    'Law': 'LAW',
    'Languages': 'EDUCATION',
    'Social Sciences': 'EDUCATION',
  };
  return map[fieldsJsonField] || fieldsJsonField.toUpperCase();
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly guideData: GuideProgram[];
  private readonly fieldsData: FieldData[];
  private readonly jobsData: JobDomainData[];

  private readonly bacAliases: Record<string, string[]> = {
    math: ['math', 'maths', 'mathematique', 'mathematiques', 'رياضيات'],
    sciences: ['science', 'sciences', 'svt', 'experimental', 'علوم تجريبية'],
    technique: ['tech', 'technique', 'technologique', 'العلوم التقنية', 'تقنية'],
    economie: ['eco', 'economie', 'gestion', 'اقتصاد وتصرف', 'اقتصاد', 'تصرف'],
    informatique: ['info', 'informatique', 'bac info', 'علوم الاعلامية', 'اعلامية'],
    lettres: ['lettres', 'lettre', 'adab', 'litteraire', 'اداب'],
    sport: ['sport', 'sportif', 'رياضة'],
  };

  private readonly bacDatasetMapping: Record<string, string> = {
    SPORT: 'رياضة',
    MATH: 'رياضيات',
    SVT: 'علوم تجريبية',
    ECO: 'اقتصاد وتصرف',
  };

  private readonly fieldAliases: Record<string, string[]> = {
    IT: [
      'informatique', 'info', 'it', 'dev', 'développement', 'programmation',
      'web', 'mobile', 'data', 'ai', 'ia', 'cyber', 'cloud', 'tech',
      'برمجة', 'اعلامية', 'معلوماتية', 'شبكات', 'أمن معلومات'
    ],
    'Medical / Health': [
      'medecine', 'medecin', 'medical', 'sante', 'pharmacie', 'infirmier', 'infirmière',
      'biologie', 'biologiste', 'laboratoire', 'paramedical', 'soins',
      'طب', 'صحة', 'صيدلة', 'تمريض', 'بيولوجيا'
    ],
    Engineering: [
      'ingenieur', 'ingenierie', 'genie', 'mecanique', 'electrique', 'civil',
      'industriel', 'production', 'energie', 'electronique',
      'هندسة', 'مهندس', 'مدني', 'ميكانيك', 'كهرباء'
    ],
    'Business / Management': [
      'gestion', 'business', 'commerce', 'marketing', 'finance',
      'comptabilite', 'economie', 'administration', 'audit', 'rh',
      'أعمال', 'إدارة', 'محاسبة', 'مالية', 'تصرف', 'تجارة'
    ],
    Sport: [
      'sport', 'sports', 'activite physique', 'education physique', 'entrainement',
      'coaching', 'kinesitherapie', 'kine', 'performance', 'athletisme', 'fitness',
      'رياضة', 'تربية بدنية', 'تدريب', 'مدرب', 'علاج طبيعي'
    ],
    'Arts & Design': [
      'art', 'design', 'graphique', 'architecture', 'mode', 'fashion',
      'multimedia', 'audiovisuel', 'cinema', 'musique', 'beaux-arts',
      'فن', 'تصميم', 'عمارة', 'أزياء', 'موسيقى', 'سينما'
    ],
    Languages: [...FIELD_ALIASES.letters],
    'Social Sciences': [...FIELD_ALIASES.letters],
    Science: [
      'science', 'recherche', 'laboratoire', 'chimie', 'physique', 'biologie',
      'mathematiques', 'environnement', 'agronomie', 'geologie',
      'علوم', 'كيمياء', 'فيزياء', 'أحياء', 'رياضيات', 'بحث'
    ],
    Education: [
      'education', 'enseignement', 'formation', 'pedagogie', 'professeur',
      'enseignant', 'maitre', 'educateur', 'ecole', 'universite',
      'تربية', 'تعليم', 'أستاذ', 'مدرس', 'تكوين'
    ],
    Law: [
      'droit', 'law', 'juridique', 'avocat', 'justice', 'notaire',
      'juriste', 'legal', 'magistrat', 'juge', 'tribunal',
      'قانون', 'عدالة', 'محامي', 'قاضي', 'محكمة', 'قضاء'
    ],
    Media: [
      'media', 'audiovisuel', 'journalisme', 'communication', 'cinema',
      'television', 'radio', 'presse', 'publicite',
      'إعلام', 'صحافة', 'اتصال', 'إذاعة', 'تلفزة', 'وسائط'
    ],
    Economy: [
      'economie', 'economique', 'macroeconomic', 'microeconomic',
      'banque', 'finance', 'investissement', 'marché', 'marche',
      'اقتصاد', 'مالية', 'بنوك', 'استثمار', 'أسواق'
    ],
  };

  // map normalized bac keys to likely fields in fields.json
  private readonly bacToFields: Record<string, string[]> = {
    informatique: ['IT'],
    math: ['Engineering', 'Science', 'IT'],
    sciences: ['Medical / Health', 'Science', 'Engineering'],
    technique: ['Engineering', 'Arts & Design'],
    economie: ['Business / Management'],
    lettres: ['Languages', 'Law', 'Social Sciences', 'Education', 'Arts & Design'],
    sport: ['Sport', 'Medical / Health', 'Education'],
  };

  private readonly bacToProgramDomains: Record<string, ProgramDomain[]> = {
    informatique: ['tech'],
    math: ['tech', 'health', 'engineering'],
    sciences: ['health', 'tech', 'engineering'],
    technique: ['tech', 'art', 'engineering'],
    economie: ['business'],
    lettres: ['letters', 'art'],
    sport: ['sport', 'health'],
  };

  private readonly programDomainKeywords: Record<Exclude<ProgramDomain, 'other'>, string[]> = {
    engineering: [...FIELD_ALIASES.engineering],
    tech: [
      'informatique',
      'informatia',
      'developpement',
      'dev',
      'programmation',
      'reseau',
      'reseaux',
      'it',
      'data',
      'cyber',
      'software',
      'logiciel',
      'web',
      'mobile',
      'ia',
      'ai',
      'intelligence artificielle',
      'technologies informations',
      'اعلامية',
      'معلوماتية',
      'شبكات',
      'برمجة',
      'حاسوب',
      'تكنولوجيات المعلومات',
      'ذكاء اصطناعي',
    ],
    health: [
      'biologie',
      'sante',
      'medical',
      'paramedical',
      'medecine',
      'pharmacie',
      'dentaire',
      'infirmier',
      'soins',
      'طب',
      'صحة',
      'صيدلة',
      'بيولوجيا',
      'احياء',
      'تمريض',
    ],
    business: [
      'gestion',
      'commerce',
      'finance',
      'marketing',
      'economie',
      'comptabilite',
      'management',
      'administration',
      'business',
      'اعمال',
      'الاعمال',
      'ادارة',
      'تصرف',
      'تجارة',
      'اقتصاد',
      'محاسبة',
      'مالية',
    ],
    sport: [
      'sport',
      'sportif',
      'sportive',
      'kine',
      'kinesitherapie',
      'nutrition',
      'eps',
      'education physique',
      'رياضة',
      'الرياضة',
      'بدنية',
      'البدنية',
      'تربية بدنية',
    ],
    art: [
      'art',
      'arts',
      'design',
      'architecture',
      'architecte',
      'theatre',
      'musique',
      'cinema',
      'audiovisuel',
      'graphique',
      'فنون',
      'الفنون',
      'تصميم',
      'معمارية',
      'المعمارية',
      'عمارة',
      'موسيقى',
      'سينما',
      'مسرح',
    ],
    letters: [...FIELD_ALIASES.letters],
  };

  constructor(private readonly intentDetector: IntentDetectorService) {
    this.guideData = this.loadJsonFile<GuideProgram[]>('prisma/guide.json', []).map((program) => ({
      ...program,
      domain: this.detectProgramDomain(program),
    }));
    this.fieldsData = this.loadJsonFile<FieldsJsonData>('lib/data/fields.json', {
      fields: [],
    }).fields || [];
    this.jobsData = this.loadJsonFile<JobDomainData[]>('lib/data/jobs.json', []);

    this.logger.log(`Loaded ${this.guideData.length} guide programs`);
    this.logger.log(`Loaded ${this.fieldsData.length} fields`);
    this.logger.log(`Loaded ${this.jobsData.length} job domains`);
  }

  // ============================================
  // 🔍 PUBLIC HELPER: detectField from message
  // Returns: canonical field name or null
  // ============================================
  detectFieldFromMessage(message?: string): string | null {
    return detectLegacyField(message);
  }

  // ============================================
  // 🔍 PUBLIC HELPER: get jobs for a detected field
  // ============================================
  getJobsByField(detectedField: string | null): JobData[] {
    if (!detectedField) return [];
    
    // Try to find in jobs.json directly by canonical name
    const fieldsJsonName = mapToFieldsJsonField(detectedField);
    if (fieldsJsonName) {
      const domainJobs = this.jobsData.find(
        (jd) => normalizeField(jd.field) === normalizeField(fieldsJsonName),
      );
      if (domainJobs) return domainJobs.jobs.slice(0, 3);
    }
    
    // Fallback: try by detected field key
    const domainJobs = this.jobsData.find(
      (jd) => normalizeField(jd.field) === normalizeField(detectedField),
    );
    if (domainJobs) return domainJobs.jobs.slice(0, 3);
    
    return [];
  }

  // ============================================
  // 🔍 PUBLIC HELPER: filter programs by detected field
  // ============================================
  filterProgramsByField(programs: RankedProgram[], detectedField: string | null): RankedProgram[] {
    if (!detectedField || programs.length === 0) return [];

    return findProgramsByField(this.toAliasFieldKey(detectedField), programs);
    
    const domainKey = normalizeField(detectedField || '');
    
    return programs.filter((p) => {
      const haystack = normalizeField([p.name, p.program, p.domain, p.formula].filter(Boolean).join(' '));
      
      // Strong keyword matching per domain
      if (domainKey === 'it') {
        return /\b(informatique|informatia|developpement|programmation|reseau|logiciel|software|cyber|data|ia|ai|web|mobile|cloud|devops|tech|اعلامية|معلوماتية|برمجة|شبكات|تكنولوجيا)\b/i.test(haystack);
      }
      if (domainKey === 'sport') {
        return /\b(sport|activite physique|kine|kinesitherapie|entrainement|eps|education physique|nutrition sportive|performance sportive|fitness|coaching|رياضة|تربية بدنية|بدنية)\b/i.test(haystack);
      }
      if (domainKey === 'health' || domainKey === 'medical / health') {
        return /\b(biologie|sante|paramedical|medecine|pharmacie|dentaire|infirmier|soins|veterinaire|anesthesie|radiologie|chirurgie|laboratoire medical|طب|صحة|صيدلة|تمريض|بيولوجيا|علاج)\b/i.test(haystack);
      }
      if (domainKey === 'business' || domainKey === 'business / management') {
        return /\b(gestion|commerce|finance|marketing|economie|comptabilite|audit|bank|assurance|management|administration|ressources humaines|logistique|تجارة|أعمال|إدارة|محاسبة|مالية|تصرف|اقتصاد)\b/i.test(haystack);
      }
      if (domainKey === 'engineering') {
        return /\b(ingenieur|ingenierie|genie|mecanique|electrique|electronique|civil|industriel|production|maintenance|mines|ponts|geophysique|petrole|energie|automatique|robotique|هندسة|مهندس|مدني|ميكانيك|كهرباء)\b/i.test(haystack);
      }
      if (domainKey === 'design' || domainKey === 'arts & design') {
        return /\b(art|design|graphisme|graphique|architecture|architecte|mode|fashion|cinema|audiovisuel|theatre|musique|beaux-arts|decoration|creation|artistique|تصميم|فن|عمارة|جرافيك)\b/i.test(haystack);
      }
      if (domainKey === 'media') {
        return /\b(media|journalisme|journalist|communication|television|radio|presse|publicite|redaction|content|إعلام|صحافة|اتصال|إذاعة|تلفزة|وسائط)\b/i.test(haystack);
      }
      if (domainKey === 'science') {
        return /\b(physique|chimie|mathematiques|science|biologie|environnement|agronomie|geologie|astronomie|recherche|laboratoire|علوم|كيمياء|فيزياء|رياضيات|أحياء|مختبر)\b/i.test(haystack);
      }
      if (domainKey === 'law') {
        return /\b(droit|juridique|justice|avocat|notaire|magistrat|juge|tribunal|juriste|legal|قانون|عدالة|محامي|قاضي|محكمة|قضاء)\b/i.test(haystack);
      }
      if (domainKey === 'economy') {
        return /\b(economie|economique|banque|finance|investissement|marche|bourse|macro|micro|اقتصاد|مالية|بنوك|استثمار|أسواق)\b/i.test(haystack);
      }
      if (domainKey === 'education') {
        return /\b(education|enseignement|formation|pedagogie|professeur|enseignant|maitre|educateur|ecole|universite|تربية|تعليم|أستاذ|مدرس|تكوين|مدرسة|جامعة)\b/i.test(haystack);
      }
      
      return false;
    });
  }

  // ============================================
  // 🔍 PUBLIC HELPER: get follow-up question for a field
  // ============================================
  getFollowUpForField(detectedField: string | null, lang: 'fr' | 'ar'): string {
    if (!detectedField) {
      return lang === 'ar' ? 'شنو المجال اللي يهمك؟' : 'Quel domaine t\'intéresse ?';
    }
    const key = normalizeField(detectedField);
    
    const chains: Record<string, { ar: string; fr: string }[]> = {
      it: [
        { ar: 'تحب dev ولا réseaux؟', fr: 'Tu préfères dev ou réseaux ?' },
        { ar: 'تحب web ولا data؟', fr: 'Tu préfères web ou data ?' },
        { ar: 'Frontend ولا backend؟', fr: 'Frontend ou backend ?' },
      ],
      sport: [
        { ar: 'تحب coaching ولا kiné؟', fr: 'Tu préfères coaching ou kiné ?' },
        { ar: 'performance ولا enseignement؟', fr: 'Performance ou enseignement ?' },
      ],
      health: [
        { ar: 'تحب médecine ولا paramédical؟', fr: 'Tu préfères médecine ou paramédical ?' },
        { ar: 'مستشفى ولا عيادة؟', fr: 'Hôpital ou clinique ?' },
      ],
      business: [
        { ar: 'تحب finance ولا marketing؟', fr: 'Tu préfères finance ou marketing ?' },
        { ar: 'محاسبة ولا إدارة؟', fr: 'Comptabilité ou gestion ?' },
      ],
      engineering: [
        { ar: 'تحب mécanique ولا électrique؟', fr: 'Tu préfères mécanique ou électrique ?' },
        { ar: 'مدني ولا صناعي؟', fr: 'Civil ou industriel ?' },
      ],
      design: [
        { ar: 'تحب graphisme ولا architecture؟', fr: 'Tu préfères graphisme ou architecture ?' },
        { ar: 'تصميم ولا أزياء؟', fr: 'Design ou mode ?' },
      ],
      media: [
        { ar: 'تحب journalisme ولا audiovisuel؟', fr: 'Tu préfères journalisme ou audiovisuel ?' },
        { ar: 'إذاعة ولا تلفزة؟', fr: 'Radio ou télévision ?' },
      ],
      science: [
        { ar: 'تحب chimie ولا biologie؟', fr: 'Tu préfères chimie ou biologie ?' },
        { ar: 'بحث ولا تطبيق؟', fr: 'Recherche ou application ?' },
      ],
      law: [
        { ar: 'تحب avocat ولا notaire؟', fr: 'Tu préfères avocat ou notaire ?' },
        { ar: 'قانون خاص ولا عام؟', fr: 'Droit privé ou public ?' },
      ],
      economy: [
        { ar: 'تحب banque ولا finance؟', fr: 'Tu préfères banque ou finance ?' },
        { ar: 'macro ولا microéconomie؟', fr: 'Macro ou microéconomie ?' },
      ],
      education: [
        { ar: 'تحب تعليم أساسي ولا ثانوي؟', fr: 'Tu préfères primaire ou secondaire ?' },
        { ar: 'تكوين مهني ولا أكاديمي؟', fr: 'Formation pro ou académique ?' },
      ],
    };
    
    const qs = Object.entries(chains).find(([k]) => key.includes(k))?.[1] || [
      { ar: 'تحب نشوفلك برامج ولا خدمات؟', fr: 'Tu veux voir des programmes ou des métiers ?' },
    ];
    
    return qs[0][lang];
  }

  getRecommendations(query: RagQuery): RagMergedResult {
    this.logger.log(
      `RAG input: bacType=${query.bacType || 'undefined'}, score=${
        typeof query.score === 'number' ? query.score : 'undefined'
      }, interest=${query.interest || 'undefined'}`,
    );

    const limit = this.normalizeLimit(query.limit);
    // PRIORITY 1: Detect field from interest (overrides everything)
    const field = this.detectField(query.message || '', query.bacType, query.interest);
    const jobs = this.findJobs(field, query.message || '').slice(0, 3);

    // ALWAYS get fresh candidates from all programs
    let allPrograms = this.filterProgramsByBacType(query.bacType);

    // Get requested domain from interest
    const selectedInterestDomain = this.normalizeProgramDomain(query.interest);
    const detectedInterestDomain = !selectedInterestDomain
      ? this.detectInterestFromMessage(query.message || '')
      : undefined;
    const requestedDomain = selectedInterestDomain || detectedInterestDomain;

    console.log('Detected field:', field?.field || 'none', '| Requested domain:', requestedDomain || 'none');

    // HARD FILTER: Use STRICT name-based filtering from fields.json if field is detected
    // This ensures ONLY programs matching the detected field's Arabic names are returned
    let candidates = allPrograms;
    const aliasField = detectField(`${query.interest || ''} ${query.message || ''}`) || this.toAliasFieldKey(field?.field);

    if (aliasField) {
      const aliasPrograms = findProgramsByField(aliasField, allPrograms, query.bacType);
      if (aliasPrograms.length > 0) {
        this.logger.log(`Alias field filter: ${aliasPrograms.length}/${allPrograms.length} programs match field=${aliasField}`);
        candidates = aliasPrograms;
      }
    }

    if (field && candidates === allPrograms) {
      // 1) Try strict name filter using fields.json program names
      const strictFiltered = this.filterProgramsByFieldName(field, allPrograms);

      if (strictFiltered.length > 0) {
        this.logger.log(`STRICT name filter: ${strictFiltered.length}/${allPrograms.length} programs match field=${field.field}`);
        candidates = strictFiltered;
      } else {
        // 2) Fallback to regex matching
        const fieldFiltered = allPrograms.filter((program) => this.matchesField(program, field));
        if (fieldFiltered.length > 0) {
          this.logger.log(`Regex field filter: ${fieldFiltered.length}/${allPrograms.length} programs match field=${field.field}`);
          candidates = fieldFiltered;
        } else if (requestedDomain) {
          // 3) Fallback: use domain matching
          const domainFiltered = allPrograms.filter((program) => program.domain === requestedDomain);
          if (domainFiltered.length > 0) {
            this.logger.log(`Domain filter fallback: ${domainFiltered.length}/${allPrograms.length} programs match domain=${requestedDomain}`);
            candidates = domainFiltered;
          }
        }
      }
    } else if (requestedDomain) {
      // No field detected, use domain filtering
      const interestFiltered = allPrograms.filter((program) => program.domain === requestedDomain);
      if (interestFiltered.length > 0) {
        this.logger.log(`Domain filter: ${interestFiltered.length}/${allPrograms.length} programs match domain=${requestedDomain}`);
        candidates = interestFiltered;
      }
    }

    candidates = this.excludeOtherDomainUnlessEmpty(candidates);

    // Score and rank using detected field
    let rankedPrograms = this.rankPrograms(candidates, {
      ...query,
      field,
    }).slice(0, limit);

    // FALLBACK: Ensure we always return programs (fresh computation)
    if (!rankedPrograms || rankedPrograms.length === 0) {
      this.logger.warn('No programs after ranking, applying fallback with fresh computation');

      // Fallback 1: Try all programs for this bac type, filtered by field/domain
      if (query.bacType) {
        let fallbackCandidates = this.guideData
          .filter((p) => p.bacTypes?.some((b) => this.matchesBacType(b.type, query.bacType)))
          .map(p =>
            this.toRankedProgram(
              p,
              p.bacTypes?.find((b) => this.matchesBacType(b.type, query.bacType)),
            ),
          );

        // Re-filter by detected field if available
        if (field) {
          const fieldFiltered = fallbackCandidates.filter((p) => this.matchesField(p, field));
          if (fieldFiltered.length > 0) {
            fallbackCandidates = fieldFiltered;
          }
        } else if (requestedDomain) {
          fallbackCandidates = fallbackCandidates.filter((p) => p.domain === requestedDomain);
        }

        rankedPrograms = fallbackCandidates.slice(0, 3);
      }

      // Fallback 2: Return easiest programs (lowest lastScore) - only if no interest/domain specified
      if (!requestedDomain && !field && rankedPrograms.length === 0) {
        rankedPrograms = (this.guideData
          .map(p => this.toRankedProgram(p, p.bacTypes?.[0]))
          .sort((a, b) => (a.matchingBac?.lastScore ?? 999) - (b.matchingBac?.lastScore ?? 999)) as RankedProgram[]).slice(0, 3);
      }

      // Fallback 3: Return any 3 programs (last resort)
      if (rankedPrograms.length === 0) {
        rankedPrograms = (this.guideData.slice(0, 3).map(p => ({
          ...p,
          domain: this.detectProgramDomain(p),
          admissionLevel: 'possible' as AdmissionLevel,
          rankScore: 0,
          matchedKeywords: [],
        })) as RankedProgram[]);
      }
    }

    rankedPrograms = this.excludeOtherDomainUnlessEmpty(rankedPrograms);
    console.log('FINAL PROGRAM DOMAINS:', rankedPrograms.map((p) => p.domain));

    this.logger.log(`RAG programs: ${rankedPrograms.length}`);

    const demand = field?.demand_in_tunisia;
    const unemployment = field?.unemployment_risk;
    const outlook = field?.future_outlook;
    const unemploymentRate = this.calculateAverageUnemploymentRate(jobs);

    return {
      bacType: query.bacType,
      score: query.score,
      field,
      jobs,
      programs: rankedPrograms,
      demand,
      unemployment,
      outlook,
      unemploymentRate,
    };
  }

  getEmploymentInsights(query: RagQuery): EmploymentInsights {
    const field = this.detectField(query.message || '', query.bacType, query.interest);
    const jobs = this.findJobs(field, query.message || '').slice(0, 3);

    const demand = field?.demand_in_tunisia || 'Non précisé';
    const unemploymentRisk = field?.unemployment_risk || 'Non précisé';
    const outlook = field?.future_outlook || 'Non précisé';

    return {
      demand,
      demandLevel: this.categorizeDemand(demand),
      unemploymentRisk,
      unemploymentRiskLevel: this.categorizeUnemploymentRisk(unemploymentRisk),
      unemploymentRate: this.calculateAverageUnemploymentRate(jobs),
      outlook,
      jobs,
    };
  }

  private calculateAverageUnemploymentRate(jobs: JobData[]): number | null {
    const rates = jobs
      .map((job) => job.unemployment_rate)
      .filter((rate): rate is number => typeof rate === 'number' && Number.isFinite(rate));

    if (rates.length === 0) return null;

    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    return Math.round(average * 10) / 10;
  }

  private categorizeDemand(demand?: string): 'high' | 'medium' | 'low' | 'unknown' {
    if (!demand) return 'unknown';
    const normalized = this.normalize(demand);
    if (normalized.includes('very') || normalized.includes('high') || normalized.includes('très') || normalized.includes('haut') || normalized.includes('eleve')) {
      return 'high';
    }
    if (normalized.includes('moderate') || normalized.includes('moyen') || normalized.includes('modere')) {
      return 'medium';
    }
    if (normalized.includes('low') || normalized.includes('faible') || normalized.includes('weak')) {
      return 'low';
    }
    return 'unknown';
  }

  private categorizeUnemploymentRisk(risk?: string): 'low' | 'moderate' | 'high' | 'unknown' {
    if (!risk) return 'unknown';
    const normalized = this.normalize(risk);
    if (normalized.includes('low') || normalized.includes('faible') || normalized.includes('bas')) {
      return 'low';
    }
    if (normalized.includes('moderate') || normalized.includes('moyen') || normalized.includes('modere')) {
      return 'moderate';
    }
    if (normalized.includes('high') || normalized.includes('haut') || normalized.includes('eleve')) {
      return 'high';
    }
    return 'unknown';
  }

  filterProgramsByBacType(bacType?: string): RankedProgram[] {
    const normalizedBac = this.normalizeBac(bacType);

    return this.guideData.flatMap((program) => {
      const bacMatches = this.findMatchingBacTypes(program, normalizedBac);

      return bacMatches.map((matchingBac) =>
        this.toRankedProgram(program, matchingBac),
      );
    });
  }

  // STRICT interest matcher - only returns true for strong matches
  private matchesInterestStrict(program: RankedProgram, interest?: string): boolean {
    if (!interest) return false;

    const name = (program.name || program.program || '').toLowerCase();
    const domain = (program.domain || '').toLowerCase();
    const haystack = `${name} ${domain}`;

    // STRICT patterns - must contain these keywords
    if (interest === 'sport') {
      return /\b(sport|kin[ée]|kine|nutrition sportive|[ée]ducation physique|eps|activit[ée] physique|entra[iî]nement|performance sportive|m[ée]decine du sport|science du sport|gestion sportive)\b/i.test(haystack);
    }

    if (interest === 'tech') {
      return /\b(informatique|informatia|r[ée]seau|réseaux|d[ée]veloppement|dev|programmation|software|it|tech|cyber|cloud|data|ia|ai|intelligence artificielle|g[ée]nie [ée]lectrique|g[ée]nie m[ée]canique|automatique|robotique|syst[èe]me|software|web|mobile|coding)\b/i.test(haystack);
    }

    if (interest === 'health') {
      return /\b(biologie|sant[ée]|paramedical|param[ée]dical|m[ée]decine|medecine|pharmacie|dentaire|dentiste|nurse|soignant|kin[ée]|infirmier|m[ée]decin|chirurgie|anesth[ée]sie|radiologie|laboratoire m[ée]dical|biologie m[ée]dicale)\b/i.test(haystack);
    }

    if (interest === 'business') {
      return /\b(gestion|commerce|finance|marketing|[ée]conomie|economie|comptabilit[ée]|management|business|administration|ressources humaines|logistique|supply chain|audit|banque|assurance|bourse|trading)\b/i.test(haystack);
    }

    if (interest === 'art') {
      return /\b(art|design|architecture|architecte|graphique|graphisme|mode|fashion|cin[ée]ma|audiovisuel|th[ée][aâ]tre|musique|plastique|beaux-arts|d[ée]cor|d[ée]coration|cr[ée]ation|artistique)\b/i.test(haystack);
    }

    return false;
  }

  private matchesInterest(program: RankedProgram, interest?: string): boolean {
    const requestedDomain = this.normalizeProgramDomain(interest);
    return !!requestedDomain && program.domain === requestedDomain;
  }

  classifyAdmission(score: number | undefined, lastScore?: number | null): AdmissionLevel {
    if (typeof score !== 'number' || !Number.isFinite(score)) return 'hard';
    if (typeof lastScore !== 'number' || !Number.isFinite(lastScore)) return 'hard';
    if (score >= lastScore + 10) return 'safe';
    if (score >= lastScore) return 'possible';
    return 'hard';
  }

  rankPrograms(
    programs: RankedProgram[],
    query: RagQuery & { field?: FieldData },
  ): RankedProgram[] {
    const studentScore = query.score;
    const detectedField = query.field;

    // STEP 1: STRICT FILTER FIRST - Only keep programs matching the detected field
    let filteredPrograms = programs;
    if (detectedField) {
      const fieldFiltered = programs.filter((program) => this.matchesField(program, detectedField));

      if (fieldFiltered.length > 0) {
        this.logger.log(`STRICT FILTER: ${fieldFiltered.length}/${programs.length} programs match field=${detectedField.field}`);
        filteredPrograms = fieldFiltered;
      } else {
        // Keep the original programs (already domain-filtered) instead of falling back to ALL programs
        this.logger.warn(`STRICT FILTER: No programs match field=${detectedField.field}, keeping pre-filtered ${programs.length} programs`);
      }
    }

    // STEP 2: SCORE only filtered programs
    const scoredPrograms = filteredPrograms.map((program) => {
      let score = 0;
      const lastScore = program.matchingBac?.lastScore;
      const programBacType = program.matchingBac?.type;

      // +3 if bac type matches
      if (programBacType && this.normalizeBac(programBacType) === this.normalizeBac(query.bacType)) {
        score += 3;
      }

      // +2 if matches detected field (already filtered, but double-check)
      if (detectedField && this.matchesField(program, detectedField)) {
        score += 2;
      }

      // +2 if matches interest
      if (this.matchesInterest(program, query.interest)) {
        score += 2;
      }

      // +1 if lastScore <= studentScore + 10 (achievable)
      if (typeof lastScore === 'number' && typeof studentScore === 'number') {
        if (lastScore <= studentScore + 10) {
          score += 1;
        }
      }

      const admissionLevel = this.classifyAdmission(studentScore, lastScore);

      return {
        ...program,
        admissionLevel,
        admissionGap:
          typeof studentScore === 'number' && typeof lastScore === 'number'
            ? Number((studentScore - lastScore).toFixed(2))
            : undefined,
        rankScore: score,
        matchedKeywords: detectedField && this.matchesField(program, detectedField) ? ['field-match'] : [],
      };
    });

    // STEP 3: SORT by score descending
    scoredPrograms.sort((a, b) => b.rankScore - a.rankScore);

    // DIVERSITY-AWARE SELECTION: Ensure variety in results
    const diverseResult = this.selectDiversePrograms(scoredPrograms, detectedField, 4);

    this.logger.log(`Ranked ${diverseResult.length} programs with diversity (institutions: ${new Set(diverseResult.map(p => p.institution)).size}, domains: ${new Set(diverseResult.map(p => p.domain)).size})`);

    // Ensure at least 1 program
    if (diverseResult.length === 0 && scoredPrograms.length > 0) {
      return scoredPrograms.slice(0, 1);
    }

    return diverseResult;
  }

  /**
   * Select diverse programs ensuring variety by institution
   * STRICT RULES:
   * 1. Remove duplicates by name
   * 2. Max 1 program per institution
   * 3. Return max 3 programs from different institutions
   */
  private selectDiversePrograms(
    programs: RankedProgram[],
    _targetField?: FieldData,
    _maxResults = 3,
  ): RankedProgram[] {
    if (programs.length === 0) return [];

    // Step 1: Remove duplicates by name
    const uniqueByName: RankedProgram[] = [];
    const seenNames = new Set<string>();

    for (const p of programs) {
      const normalizedName = this.normalize(p.name || p.program || '');
      if (!normalizedName || seenNames.has(normalizedName)) continue;

      seenNames.add(normalizedName);
      uniqueByName.push(p);
    }

    // Step 2: Select max 1 per institution
    const selected: RankedProgram[] = [];
    const usedInstitutions = new Set<string>();

    for (const p of uniqueByName) {
      if (!usedInstitutions.has(p.institution)) {
        selected.push(p);
        usedInstitutions.add(p.institution);
      }

      if (selected.length === 3) break; // Max 3 different institutions
    }

    // Step 3: If not enough results, fill with next best programs
    // (even if same institution, we need to return something)
    if (selected.length < 3) {
      for (const p of uniqueByName) {
        if (selected.find(s => s.code === p.code)) continue; // Already selected

        selected.push(p);
        if (selected.length === 3) break;
      }
    }

    // Final: max 3 programs from different institutions
    return selected.slice(0, 3);
  }

  private matchesField(program: RankedProgram, field: FieldData): boolean {
    const aliasKey = this.toAliasFieldKey(field.field);
    if (aliasKey) {
      return findProgramsByField(aliasKey, [program]).length > 0;
    }

    const normalizedField = this.normalize(field.field);

    const haystack = [
      program.name,
      program.program,
      program.institution,
      program.specialization,
      program.description,
      program.domain,
      program.formula,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // STRICT matching for each field - only specific keywords allowed
    if (normalizedField === 'sport') {
      return /\b(sport|activite physique|activité physique|kine|kin[eé]sitherapie|entrainement|entraînement|eps|education physique|éducation physique|nutrition sportive|performance sportive|gestion sportive|sciences du sport|medecine du sport)\b/i.test(haystack);
    }

    if (normalizedField === 'it') {
      return /\b(informatique|informatia|d[eé]veloppement|programmation|r[eé]seau|r[eé]seaux|syst[eè]me|logiciel|software|cyber|data|ia|ai|intelligence artificielle|web|mobile|cloud|devops|informatia|اعلامية|معلوماتية|برمجة|شبكات)\b/i.test(haystack);
    }

    if (normalizedField === 'medical' || normalizedField === 'medical / health') {
      return /\b(biologie|biologique|sant[eé]|paramedical|param[eé]dical|m[eé]decine|medecine|pharmacie|dentaire|dentiste|infirmier|soignant|v[eé]t[eé]rinaire|anesth[eé]sie|radiologie|chirurgie|laboratoire medical|biologie medicale|طب|صحة|صيدلة|بيولوجيا|تمريض)\b/i.test(haystack);
    }

    if (normalizedField === 'business' || normalizedField === 'business / management') {
      return /\b(gestion|commerce|finance|marketing|[eé]conomie|economie|comptabilit[eé]|audit|banque|assurance|bourse|trading|management|administration|ressources humaines|logistique|supply chain|تجارة|أعمال|ادارة|تصرف|اقتصاد|محاسبة|مالية)\b/i.test(haystack);
    }

    if (normalizedField === 'art' || normalizedField === 'arts & design') {
      return /\b(art|design|architecture|architecte|graphisme|graphique|mode|fashion|cin[eé]ma|audiovisuel|th[eé][aâ]tre|theatre|musique|beaux-arts|beaux arts|d[eé]coration|cr[eé]ation|artistique|plastique|فن|تصميم|عمارة|موسيقى|سينما)\b/i.test(haystack);
    }

    if (normalizedField === 'engineering') {
      return /\b(ing[eé]nieur|ingenierie|g[eé]nie|m[eé]canique|[eé]lectrique|[eé]lectronique|civil|industriel|production|maintenance|mines|ponts|g[eé]ophysique|petrole|energie|طاقة|هندسة|مهندس|مدني|ميكانيك|كهرباء)\b/i.test(haystack);
    }

    if (normalizedField === 'law') {
      return /\b(droit|law|juridique|justice|avocat|notaire|magistrature|قانون|قضاء|محاماة)\b/i.test(haystack);
    }

    if (normalizedField === 'science') {
      return /\b(physique|chimie|math[eé]matiques|science|agronomie|environnement|g[eé]ologie|astronomie|فيزياء|كيمياء|رياضيات|علوم|فلك)\b/i.test(haystack);
    }

    if (normalizedField === 'education') {
      return /\b([eé]ducation|pedagogie|enseignement|professeur|ma[iî]tre|[eé]cole|formation|تربية|تعليم|أستاذ|مدرس)\b/i.test(haystack);
    }

    // Default: use field name and keywords
    const fieldName = field.field.toLowerCase();
    const fieldKeywords = [
      fieldName,
      ...(field.keywords || []),
    ].map(k => k.toLowerCase());

    return fieldKeywords.some(keyword => haystack.includes(keyword));
  }

  private loadJsonFile<T>(relativePath: string, fallback: T): T {
    const candidates = [
      path.join(process.cwd(), relativePath),
      path.join(process.cwd(), 'dist', relativePath),
      path.join(__dirname, '..', '..', relativePath),
    ];

    try {
      const filePath = candidates.find((candidate) => fs.existsSync(candidate));
      if (!filePath) throw new Error(`File not found: ${relativePath}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch (error) {
      this.logger.warn(
        `Could not load ${relativePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return fallback;
    }
  }

  private findMatchingBacTypes(
    program: GuideProgram,
    normalizedBac: string,
  ): GuideBacType[] {
    const bacTypes = program.bacTypes || [];
    if (!normalizedBac) return bacTypes.filter((bac) => this.hasLastScore(bac));

    const aliases = this.getBacAliases(normalizedBac);
    const matches = bacTypes.filter((bac) => {
      const normalizedType = this.normalize(bac.type);

      return aliases.some(
        (alias) =>
          normalizedType === alias ||
          normalizedType.includes(alias) ||
          alias.includes(normalizedType),
      );
    });

    return matches.filter((bac) => this.hasLastScore(bac));
  }

  private toRankedProgram(
    program: GuideProgram,
    matchingBac?: GuideBacType,
  ): RankedProgram {
    return {
      ...program,
      domain: this.detectProgramDomain(program),
      matchingBac,
      admissionLevel: 'hard',
      rankScore: 0,
      matchedKeywords: [],
    };
  }

  private detectProgramDomain(program: Pick<GuideProgram, 'name' | 'program'>): ProgramDomain {
    const name = this.normalize([program.name, program.program].filter(Boolean).join(' '));
    const tokens = this.tokenize(name);

    for (const domain of ['engineering', 'tech', 'health', 'business', 'sport', 'art', 'letters'] as const) {
      if (
        this.programDomainKeywords[domain].some((keyword) =>
          this.matchesProgramDomainKeyword(name, tokens, keyword),
        )
      ) {
        return domain;
      }
    }

    return 'other';
  }

  private matchesProgramDomainKeyword(text: string, tokens: string[], keyword: string): boolean {
    const normalizedKeyword = this.normalize(keyword);
    if (!normalizedKeyword) return false;

    if (normalizedKeyword.length <= 3 && !normalizedKeyword.includes(' ')) {
      return tokens.includes(normalizedKeyword);
    }

    return text.includes(normalizedKeyword);
  }

  private normalizeProgramDomain(interest?: string): ProgramDomain | undefined {
    const normalized = this.normalize(interest || '');
    if (!normalized) return undefined;

    const aliases: Record<Exclude<ProgramDomain, 'other'>, string[]> = {
      tech: ['tech', 'it', 'info', 'informatique', 'technology', 'technologie'],
      health: ['health', 'sante', 'medical', 'medecine'],
      business: ['business', 'gestion', 'commerce', 'finance', 'marketing'],
      sport: ['sport', 'sports'],
      art: ['art', 'arts', 'design', 'architecture'],
      engineering: ['engineering', 'ingenierie', 'genie', 'civil', 'mecanique', 'electrique', 'industriel'],
      letters: [...FIELD_ALIASES.letters],
    };

    for (const [domain, values] of Object.entries(aliases) as [Exclude<ProgramDomain, 'other'>, string[]][]) {
      if (values.map((value) => this.normalize(value)).includes(normalized)) {
        return domain;
      }
    }

    return undefined;
  }

  private detectInterestFromMessage(message: string): ProgramDomain | undefined {
    const field = detectField(message);
    if (field) {
      return field === 'it' ? 'tech' : field;
    }

    const msg = message || '';

    if (/\b(informatique|dev|developpement|programmation|it|reseau|reseaux|code)\b/i.test(msg)) {
      return 'tech';
    }

    if (/\b(sante|santé|medecine|medicine|biologie|paramedical|paramédical|pharmacie)\b/i.test(msg)) {
      return 'health';
    }

    if (/\b(sport|kine|kin[eé]|fitness|eps)\b/i.test(msg)) {
      return 'sport';
    }

    if (/\b(gestion|commerce|business|finance)\b/i.test(msg)) {
      return 'business';
    }

    return undefined;
  }

  private isCompatibleWithBacDomain(program: RankedProgram, bacType?: string): boolean {
    const normalizedBac = this.normalizeBac(bacType);
    const domain = (program.domain || 'other') as string;

    if (normalizedBac === 'sciences' || normalizedBac === 'svt') {
      return ['health', 'sport'].includes(domain);
    }

    if (normalizedBac === 'math') {
      return ['tech', 'engineering'].includes(domain);
    }

    if (normalizedBac === 'economie' || normalizedBac === 'eco') {
      return ['business'].includes(domain);
    }

    const allowedDomains = this.bacToProgramDomains[normalizedBac] || [];
    return allowedDomains.includes(program.domain ?? 'other');
  }

  private excludeOtherDomainUnlessEmpty(programs: RankedProgram[]): RankedProgram[] {
    const withoutOther = programs.filter((program) => program.domain !== 'other');
    if (withoutOther.length > 0) {
      return withoutOther;
    }

    return programs;
  }

  /**
   * STRICT name-based program filter using fields.json program names.
   * Only keeps programs whose program name matches one of the field's allowed program names.
   */
  private filterProgramsByFieldName(field: FieldData, programs: RankedProgram[]): RankedProgram[] {
    if (!field || !field.keywords) return [];

    const aliasKey = this.toAliasFieldKey(field.field);
    if (aliasKey) return findProgramsByField(aliasKey, programs);

    const allowedProgramNames: string[] = [];
    const aliases = this.fieldAliases[field.field] || [];
    if (aliases.length === 0) return [];
    
    const normalizedAliases = aliases.map(a => this.normalize(a)).filter(a => a.length > 0);

    return programs.filter(program => {
      const haystack = [
      program.name,
      program.program,
      program.institution,
      program.specialization,
      program.description,
      program.formula,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      const normalizedHaystack = this.normalize(haystack);
      return normalizedAliases.some(alias => normalizedHaystack.includes(alias));
    });
  }

  private mapInterestToField(interest?: string): string | undefined {
    const normalizedInterest = this.normalizeProgramDomain(interest);
    if (!normalizedInterest) return undefined;

    if (normalizedInterest === 'tech') return 'IT';
    if (normalizedInterest === 'health') return 'Medical / Health';
    if (normalizedInterest === 'sport') return 'Sport';
    if (normalizedInterest === 'business') return 'Business / Management';
    if (normalizedInterest === 'art') return 'Arts & Design';
    if (normalizedInterest === 'engineering') return 'Engineering';
    if (normalizedInterest === 'letters') return 'Languages';

    return undefined;
  }

  private resolveFieldByName(target?: string): FieldData | undefined {
    if (!target) return undefined;
    const normalizedTarget = this.normalize(target);
    if (!normalizedTarget) return undefined;

    const aliases: Record<string, string[]> = {
      it: ['it', 'informatique', 'information technology'],
      engineering: ['engineering', 'ingenierie', 'genie'],
      medicalhealth: ['medical health', 'medical', 'health', 'sante', 'medecine'],
      businessmanagement: ['business management', 'business', 'management', 'gestion', 'commerce', 'finance'],
      sport: ['sport', 'sports', 'kine', 'education physique'],
      artsdesign: ['arts design', 'art', 'design', 'architecture', 'arts'],
      languages: [...FIELD_ALIASES.letters],
      socialsciences: ['social sciences', 'sciences humaines', ...FIELD_ALIASES.letters],
      media: ['media', 'audiovisuel', 'journalisme', 'communication', 'cinema'],
      economy: ['economy', 'economic', 'economic', 'banque', 'finance'],
      education: ['education', 'enseignement', 'formation', 'pedagogie'],
      law: ['law', 'droit', 'justice', 'juridique'],
      science: ['science', 'recherche', 'laboratoire', 'chimie', 'physique', 'biologie'],
    };

    const targetVariants = Object.values(aliases).find((items) =>
      items.some((item) => this.normalize(item) === normalizedTarget),
    ) || [target];

    const resolved = this.fieldsData.find((field) => {
      const normalizedField = this.normalize(field.field);
      const fieldAliases = this.getFieldTerms(field);
      return targetVariants.some((variant) => {
        const normalizedVariant = this.normalize(variant);
        return normalizedField === normalizedVariant || fieldAliases.includes(normalizedVariant);
      });
    });

    if (resolved) return resolved;
    if (normalizedTarget === 'sport' || normalizedTarget === 'sports') {
      return this.getSportVirtualField();
    }

    return undefined;
  }

  private detectExplicitFieldFromMessage(message: string): string | undefined {
    const normalizedMessage = this.normalize(message);
    if (!normalizedMessage) return undefined;

    if (/\b(informatique|info|it|developpement|programmation|reseau|code)\b/i.test(normalizedMessage)) {
      return 'IT';
    }
    if (/\b(medecine|medical|sante|pharmacie|biologie|paramedical)\b/i.test(normalizedMessage)) {
      return 'Medical / Health';
    }
    if (/\b(sport|kine|kinesitherapie|eps|education physique|fitness)\b/i.test(normalizedMessage)) {
      return 'Sport';
    }
    if (/\b(gestion|commerce|business|finance|marketing)\b/i.test(normalizedMessage)) {
      return 'Business / Management';
    }

    return undefined;
  }

  private resolveFieldByAliasKey(field: FieldAliasKey): FieldData | undefined {
    const map: Record<FieldAliasKey, string> = {
      engineering: 'Engineering',
      it: 'IT',
      health: 'Medical / Health',
      sport: 'Sport',
      art: 'Arts & Design',
      business: 'Business / Management',
      letters: 'Languages',
    };

    if (field === 'sport') {
      return this.fieldsData.find((f) => f.field === map[field]) || this.getSportVirtualField();
    }

    if (field === 'letters') {
      return this.fieldsData.find((f) => f.field === map[field]) || this.getLettersVirtualField();
    }

    return this.fieldsData.find((f) => f.field === map[field]);
  }

  private detectField(message: string, bacType?: string, interest?: string): FieldData | undefined {
    const aliasField =
      detectField(`${interest || ''} ${message || ''}`) ||
      this.toAliasFieldKey(this.mapInterestToField(interest));

    if (aliasField) {
      const resolvedAliasField = this.resolveFieldByAliasKey(aliasField);
      if (resolvedAliasField) {
        this.logger.log(`Domain detected by aliases: ${resolvedAliasField.field}`);
        return resolvedAliasField;
      }
    }

    // Priority 1: user interest (ALWAYS overrides everything)
    const interestField = this.resolveFieldByName(this.mapInterestToField(interest));
    if (interestField) {
      this.logger.log(`Domain detected by INTEREST: ${interestField.field}`);
      return interestField;
    }

    // Priority 2: explicit message (only if no interest)
    const explicitField = this.resolveFieldByName(this.detectExplicitFieldFromMessage(message));
    if (explicitField) return explicitField;

    // Priority 3: bacType fallback (only if no interest and no explicit message)
    const normalizedBac = this.normalizeBac(bacType);
    const bacFallbackField =
      normalizedBac === 'sciences' || normalizedBac === 'svt'
        ? 'Medical / Health'
        : normalizedBac === 'math'
          ? 'Engineering'
          : normalizedBac === 'sport'
            ? 'Sport'
          : undefined;
    const resolvedBacField = this.resolveFieldByName(bacFallbackField);
    if (resolvedBacField) return resolvedBacField;

    const normalizedMessage = this.normalize(message);
    const extractedFields = this.intentDetector
      .extractKeywords(message)
      .filter((keyword) => keyword.category === 'field')
      .map((keyword) => keyword.value);

    const bacPreferredFields = this.bacToFields[normalizedBac] || [];

    const candidates = this.fieldsData.map((field) => {
      const aliases = this.getFieldTerms(field);
      const extractedMatch = extractedFields.some((value) =>
        aliases.includes(this.normalize(value)),
      );
      const textMatches = this.getMatchedTerms(normalizedMessage, aliases).length;

      // demand and unemployment scoring
      const demandScore = this.scoreDemand(field.demand_in_tunisia);
      const unemploymentScore = this.scoreUnemployment(field.unemployment_risk);

      // bac match boost
      const bacMatch = bacPreferredFields.includes(field.field) ? 6 : 0;

      const score = textMatches + (extractedMatch ? 3 : 0) + demandScore + unemploymentScore + bacMatch;

      return {
        field,
        score,
      };
    });

    // Prefer fields with higher combined score (message relevance + demand + low unemployment + bac match)
    const best = candidates
      .sort((a, b) => b.score - a.score)
      .filter((c) => c.score > 0);

    return best[0]?.field;
  }

  private scoreDemand(demand?: string): number {
    if (!demand) return 0;
    const d = this.normalize(demand);
    if (d.includes('very') || d.includes('very high') || d.includes('très') || d.includes('elev')) return 8;
    if (d.includes('high') || d.includes('haut') || d.includes('eleve')) return 6;
    if (d.includes('moderate') || d.includes('moyen') || d.includes('moder')) return 3;
    if (d.includes('low') || d.includes('faible') || d.includes('weak')) return 0;
    return 0;
  }

  private scoreUnemployment(unemployment?: string): number {
    if (!unemployment) return 0;
    const u = this.normalize(unemployment);
    if (u.includes('low') || u.includes('faible') || u.includes('bas')) return 6;
    if (u.includes('moderate') || u.includes('moyen') || u.includes('mod')) return 3;
    if (u.includes('high') || u.includes('haut') || u.includes('elev') || u.includes('eleve')) return 0;
    return 0;
  }

  /**
   * Detect sub-domain from message (e.g. "cyber", "frontend", "medecine", "pharmacie")
   */
  private detectSubDomain(message: string): string | null {
    const normalized = this.normalize(message);
    if (!normalized) return null;

    for (const [subKey, keywords] of Object.entries(SUB_DOMAIN_KEYWORDS)) {
      if (keywords.some(kw => normalized.includes(kw))) {
        return subKey;
      }
    }
    return null;
  }

  /**
   * Filter jobs by sub-domain keyword from the message
   */
  private filterJobsByMessageKeyword(jobs: JobData[], message: string): JobData[] {
    const normalized = this.normalize(message);
    if (!normalized) return jobs;

    // Check for specific sub-domain
    const subDomain = this.detectSubDomain(message);
    if (subDomain) {
      const keywords = SUB_DOMAIN_KEYWORDS[subDomain] || [];
      const filtered = jobs.filter(job => {
        const haystack = this.normalize(job.title + ' ' + job.description + ' ' + job.skills.join(' '));
        return keywords.some(kw => haystack.includes(kw));
      });
      if (filtered.length > 0) return filtered;
    }

    // General keyword matching: filter jobs by relevant keywords in message
    // Extract meaningful words from message (e.g., "cyber", "frontend", "web", "data")
    const messageWords = normalized.split(/\s+/).filter(w => w.length > 2);
    if (messageWords.length > 0) {
      const filtered = jobs.filter(job => {
        const haystack = this.normalize(job.title + ' ' + job.description + ' ' + job.skills.join(' '));
        return messageWords.some(word => haystack.includes(word));
      });
      if (filtered.length > 0) return filtered;
    }

    return jobs;
  }

  private findJobs(field: FieldData | undefined, message: string): JobData[] {
    const normalizedFieldName = this.normalize(field?.field);
    
    // Try to find jobs by matching field name against jobs.json field keys
    const domainJobs = this.jobsData.find(
      (jd) => this.normalize(jd.field) === normalizedFieldName,
    );
    
    if (domainJobs) {
      const jobs = domainJobs.jobs.slice(0, 3);
      return this.filterJobsByMessageKeyword(jobs, message);
    }
    
    // Fallback: for fields like Sport that are in jobs.json with a different key
    if (normalizedFieldName === 'sport') {
        return [
          {
            title: 'Coach sportif',
            description: 'Encadre et forme des athlètes et équipes',
            skills: ['Planification entraînement', 'Préparation physique', 'Communication'],
            demand: 'Medium',
            unemployment_rate: 9,
          },
          {
            title: 'Préparateur physique',
            description: 'Optimise la condition physique des sportifs',
            skills: ['Condition physique', 'Analyse performance', 'Programmation entraînement'],
            demand: 'Medium',
            unemployment_rate: 8,
          },
          {
            title: 'Kinésithérapeute',
            description: 'Rééducation et soins des patients en kinésithérapie',
            skills: ['Rééducation', 'Anatomie', 'Suivi patient'],
            demand: 'High',
            unemployment_rate: 6,
          },
        ];
      }

    // Fallback to full scoring across all jobs if no direct match found
    const fieldTerms = this.getFieldTerms(field);
    const messageTerms = this.tokenize(this.normalize(message));
    const isSportField = normalizedFieldName === 'sport';

    const rankedJobs = this.jobsData
      .flatMap((domain) =>
        domain.jobs.map((job) => {
          const text = this.normalize(
            [domain.field, ...domain.keywords, job.title, ...job.skills].join(' '),
          );
          if (
            isSportField &&
            !/\b(sport|education|formation|sante|health|kine|kin[eé]|nutrition|activite physique|activité physique|entrainement|entraînement|eps)\b/i.test(
              text,
            )
          ) {
            return { job, score: 0 };
          }

          const score =
            this.getMatchedTerms(text, fieldTerms).length * 10 +
            this.getMatchedTerms(text, messageTerms).length * 4 +
            (typeof job.unemployment_rate === 'number'
              ? Math.max(0, 20 - job.unemployment_rate)
              : 0);

          return { job, score };
        }),
      )
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.job);

    // Apply sub-domain filtering from message
    return this.filterJobsByMessageKeyword(rankedJobs, message);
  }

  private getMatchedTerms(text: string, terms: string[]): string[] {
    const tokens = this.tokenize(text);
    const matched = new Set<string>();

    for (const term of terms) {
      const normalizedTerm = this.normalize(term);
      if (normalizedTerm.length < 2) continue;

      if (normalizedTerm.length <= 3 && tokens.includes(normalizedTerm)) {
        matched.add(normalizedTerm);
      } else if (normalizedTerm.length > 3 && text.includes(normalizedTerm)) {
        matched.add(normalizedTerm);
      }
    }

    return [...matched];
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || !Number.isFinite(limit)) return 5;
    return Math.min(5, Math.max(3, Math.floor(limit)));
  }

  private normalizeBac(bacType?: string): string {
    const normalized = this.normalize(bacType || '');
    if (!normalized) return '';

    for (const [key, aliases] of Object.entries(this.bacAliases)) {
      if (
        aliases.some((alias) => {
          const normalizedAlias = this.normalize(alias);
          return (
            normalized === normalizedAlias ||
            normalized.includes(normalizedAlias) ||
            normalizedAlias.includes(normalized)
          );
        })
      ) {
        return key;
      }
    }

    return normalized;
  }

  private getBacAliases(normalizedBac: string): string[] {
    const mappedDatasetLabel = this.getDatasetBacLabel(normalizedBac);
    return [
      normalizedBac,
      mappedDatasetLabel,
      ...(this.bacAliases[normalizedBac] || []),
    ]
      .filter(Boolean)
      .map((alias) => this.normalize(alias as string));
  }

  private getDatasetBacLabel(bacTypeOrNormalized?: string): string | undefined {
    if (!bacTypeOrNormalized) return undefined;
    const normalized = this.normalizeBac(bacTypeOrNormalized);
    const canonicalKey = normalized.toUpperCase();
    return this.bacDatasetMapping[canonicalKey];
  }

  private matchesBacType(programBacType?: string, inputBacType?: string): boolean {
    if (!programBacType || !inputBacType) return false;

    const normalizedInput = this.normalizeBac(inputBacType);
    const aliases = this.getBacAliases(normalizedInput);
    const normalizedProgramType = this.normalize(programBacType);

    return aliases.some((alias) =>
      normalizedProgramType === alias ||
      normalizedProgramType.includes(alias) ||
      alias.includes(normalizedProgramType),
    );
  }

  private getAdmissionRankScore(
    level: AdmissionLevel,
    admissionGap?: number,
  ): number {
    const base = {
      safe: 60,
      possible: 40,
      hard: 10,
    }[level];

    return base + Math.max(-20, Math.min(admissionGap || 0, 20));
  }

  private getAdmissionSortWeight(level: AdmissionLevel): number {
    return {
      safe: 3,
      possible: 2,
      hard: 1,
    }[level];
  }

  private hasLastScore(bac: GuideBacType): boolean {
    return typeof bac.lastScore === 'number' && Number.isFinite(bac.lastScore);
  }

  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(/[^a-z0-9\u0600-\u06FF]+/i)
      .filter((token) => token.length > 1);
  }

  private normalize(value?: string): string {
    return (value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0640\u064B-\u065F\u0670]/g, '')
      .replace(/[’'`´]/g, ' ')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private getSportVirtualField(): FieldData {
    return {
      field: 'Sport',
      keywords: ['sport', 'éducation physique', 'kinésithérapie', 'préparation physique', 'coaching'],
      demand_in_tunisia: 'Moderate',
      future_outlook: 'Positive',
      unemployment_risk: 'Moderate',
    };
  }

  private getLettersVirtualField(): FieldData {
    return {
      field: 'Letters',
      keywords: [...FIELD_ALIASES.letters],
      demand_in_tunisia: 'Moderate',
      future_outlook: 'Moderate',
      unemployment_risk: 'Moderate to high',
    };
  }

  private toAliasFieldKey(fieldName?: string | null): FieldAliasKey | null {
    const normalized = normalizeText(fieldName || '');
    if (!normalized) return null;

    const direct: Record<string, FieldAliasKey> = {
      engineering: 'engineering',
      ingenierie: 'engineering',
      genie: 'engineering',
      الهندسه: 'engineering',
      it: 'it',
      tech: 'it',
      informatique: 'it',
      health: 'health',
      medical: 'health',
      medecine: 'health',
      sante: 'health',
      sport: 'sport',
      art: 'art',
      arts: 'art',
      design: 'art',
      business: 'business',
      management: 'business',
      gestion: 'business',
      commerce: 'business',
      finance: 'business',
      letters: 'letters',
      lettres: 'letters',
      language: 'letters',
      languages: 'letters',
      langue: 'letters',
      langues: 'letters',
      humanities: 'letters',
      humanites: 'letters',
      litterature: 'letters',
      law: 'letters',
      droit: 'letters',
      media: 'letters',
      communication: 'letters',
      journalisme: 'letters',
      education: 'letters',
    };

    const compact = normalized.replace(/\s+/g, '');
    if (direct[normalized]) return direct[normalized];
    if (direct[compact]) return direct[compact];
    if (normalized.includes('engineering')) return 'engineering';
    if (normalized.includes('medical') || normalized.includes('health')) return 'health';
    if (normalized.includes('business') || normalized.includes('management')) return 'business';
    if (normalized.includes('arts') || normalized.includes('design')) return 'art';
    if (
      normalized.includes('language') ||
      normalized.includes('langue') ||
      normalized.includes('lettre') ||
      normalized.includes('litterature') ||
      normalized.includes('humanite') ||
      normalized.includes('humanities') ||
      normalized.includes('social sciences') ||
      normalized.includes('droit') ||
      normalized.includes('law')
    ) return 'letters';

    return detectField(fieldName || '');
  }

  private getFieldTerms(field?: FieldData): string[] {
    if (!field) return [];

    const aliasKey = this.toAliasFieldKey(field.field);
    const aliases = aliasKey ? FIELD_ALIASES[aliasKey] : this.fieldAliases[field.field] || [];

    return [
      field.field,
      ...aliases,
      ...(field.keywords || []),
      field.demand_in_tunisia || '',
      field.future_outlook || '',
    ]
      .map((term) => this.normalize(term))
      .filter(Boolean);
  }

  // ============================================
  // 🧠 STRICT PIPELINE - DECISION ENGINE
  // ============================================

  /**
   * MAIN PIPELINE: Execute strict 5-step decision process
   * STEP 1: detectField()
   * STEP 2: retrievePrograms()
   * STEP 3: retrieveJobs()
   * STEP 4: rankPrograms()
   * STEP 5: buildDecisionContext()
   */
  buildDecisionContext(
    query: RagQuery,
    memory: MemoryData = { askedQuestions: [], rejectedDomains: [] },
  ): DecisionContext {
    this.logger.log(
      `[DECISION ENGINE] Input: bacType=${query.bacType}, score=${query.score}, interest=${query.interest}`,
    );

    // STEP 1: Detect Field (Priority: explicit > memory > bacType)
    const detectedField = this.detectFieldStrict(
      query.message || '',
      query.bacType,
      query.interest,
      memory.interest,
    );

    // STEP 2: Retrieve Programs (strict filtering)
    const programs = this.retrieveProgramsStrict(
      detectedField,
      query.bacType,
      query.score,
      memory.rejectedDomains,
    );

    // STEP 3: Retrieve Jobs (from jobs.json only)
    const jobs = this.retrieveJobsStrict(detectedField, query.message || '');

    // STEP 4: Rank and Classify Programs
    const classifiedPrograms = this.classifyProgramsByDifficulty(programs, query.score);

    // STEP 5: Select Best/Backup/Risky
    const decisionOptions = this.selectDecisionOptions(classifiedPrograms);

    // Generate Dynamic Follow-Up
    const followUp = this.generateFollowUpQuestion(detectedField, memory, query.message || '');

    this.logger.log(
      `[DECISION ENGINE] Output: ${classifiedPrograms.length} programs, ${jobs.length} jobs, followUp=${followUp.text}`,
    );

    return {
      field: detectedField,
      programs: classifiedPrograms,
      jobs,
      options: decisionOptions,
      memory,
      followUp,
    };
  }

  /**
   * STEP 1: STRICT Field Detection
   * Priority: 1. explicit message > 2. memory.interest > 3. bacType fallback
   * NEVER override explicit user intent
   */
  private detectFieldStrict(
    message: string,
    bacType?: string,
    queryInterest?: string,
    memoryInterest?: string,
  ): FieldData | null {
    // Priority 1: Explicit message detection
    const explicitField = this.detectFieldFromMessageDetailed(message);
    if (explicitField) {
      this.logger.log(`[STEP 1] Field from explicit message: ${explicitField.field}`);
      return explicitField;
    }

    // Priority 2: Memory interest (if no explicit message override)
    if (memoryInterest && !this.containsFieldOverride(message)) {
      const memoryField = this.findFieldByName(memoryInterest);
      if (memoryField) {
        this.logger.log(`[STEP 1] Field from memory: ${memoryField.field}`);
        return memoryField;
      }
    }

    // Priority 3: Query interest parameter
    if (queryInterest) {
      const queryField = this.findFieldByName(queryInterest);
      if (queryField) {
        this.logger.log(`[STEP 1] Field from query interest: ${queryField.field}`);
        return queryField;
      }
    }

    // Priority 4: BacType fallback
    if (bacType) {
      const bacField = this.inferFieldFromBacType(bacType);
      if (bacField) {
        this.logger.log(`[STEP 1] Field from bacType: ${bacField.field}`);
        return bacField;
      }
    }

    this.logger.warn('[STEP 1] No field detected');
    return null;
  }

  private containsFieldOverride(message: string): boolean {
    // Check if message contains explicit field keywords that override memory
    const fieldKeywords = [
      'informatique', 'sport', 'medecine', 'sante', 'art', 'design',
      'gestion', 'commerce', 'droit', 'science', 'ingenieur', 'lettres',
      'langues', 'litterature', 'anglais', 'francais', 'traduction',
      'journalisme', 'communication', 'sciences humaines',
    ];
    const normalized = this.normalize(message);
    return fieldKeywords.some((kw) => normalized.includes(kw));
  }

  private detectFieldFromMessageDetailed(message: string): FieldData | null {
    const normalized = this.normalize(message);

    // Check each field's keywords
    for (const field of this.fieldsData) {
      const fieldName = this.normalize(field.field);
      const keywords = [fieldName, ...(field.keywords || []).map((k) => this.normalize(k))];

      if (keywords.some((kw) => normalized.includes(kw))) {
        return field;
      }
    }

    // Check sport virtual field
    if (/\b(sport|رياضة|coach|kiné|entraînement|eps)\b/i.test(normalized)) {
      return this.getSportVirtualField();
    }

    if (detectField(message) === 'letters') {
      return this.getLettersVirtualField();
    }

    return null;
  }

  private findFieldByName(interest: string): FieldData | null {
    const normalized = this.normalize(interest);

    // Direct match
    const direct = this.fieldsData.find((f) => this.normalize(f.field) === normalized);
    if (direct) return direct;

    // Alias match
    for (const [fieldName, aliases] of Object.entries(this.fieldAliases)) {
      if (aliases.some((a) => this.normalize(a) === normalized)) {
        return this.fieldsData.find((f) => f.field === fieldName) || null;
      }
    }

    return null;
  }

  private inferFieldFromBacType(bacType: string): FieldData | null {
    const normalized = this.normalize(bacType);

    const bacFieldMap: Record<string, string> = {
      informatique: 'IT',
      math: 'Engineering',
      sciences: 'Medical / Health',
      technique: 'Engineering',
      economie: 'Business / Management',
      sport: 'Sport',
      lettres: 'Languages',
    };

    for (const [bac, fieldName] of Object.entries(bacFieldMap)) {
      if (normalized.includes(bac)) {
        return this.fieldsData.find((f) => f.field === fieldName) || null;
      }
    }

    return null;
  }

  /**
   * STEP 2: STRICT Program Retrieval
   * Only returns programs that match BOTH field AND bacType
   * Rejects unrelated programs completely
   */
  private retrieveProgramsStrict(
    field: FieldData | null,
    bacType?: string,
    score?: number,
    rejectedDomains: string[] = [],
  ): RankedProgram[] {
    if (!field) {
      this.logger.warn('[STEP 2] No field provided, returning empty programs');
      return [];
    }

    // Filter by bac type first
    let candidates = bacType
      ? this.filterProgramsByBacType(bacType)
      : this.guideData.map((p) => this.toRankedProgram(p, p.bacTypes?.[0]));

    // STRICT: Filter by field matching
    const aliasKey = this.toAliasFieldKey(field.field);
    candidates = aliasKey
      ? findProgramsByField(aliasKey, candidates, bacType)
      : candidates.filter((p) => this.matchesFieldStrict(p, field));

    // STRICT: Exclude rejected domains
    if (rejectedDomains.length > 0) {
      candidates = candidates.filter((p) => {
        const programDomain = p.domain || this.detectProgramDomain(p);
        return !rejectedDomains.includes(programDomain || '');
      });
    }

    this.logger.log(`[STEP 2] Retrieved ${candidates.length} programs for field=${field.field}`);
    return candidates;
  }

  private matchesFieldStrict(program: RankedProgram, field: FieldData): boolean {
    const aliasKey = this.toAliasFieldKey(field.field);
    if (aliasKey) {
      return findProgramsByField(aliasKey, [program]).length > 0;
    }

    const normalizedField = this.normalize(field.field);
    const haystack = [
      program.name,
      program.program,
      program.institution,
      program.specialization,
      program.description,
      program.domain,
      program.formula,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // STRICT matching rules by field (normalized field names)
    const fieldRules: Record<string, RegExp> = {
      sport: /\b(sport|activite physique|kine|kinesitherapie|entrainement|eps|education physique|nutrition sportive|performance sportive|fitness|coaching|رياضة|تربية بدنية)\b/i,
      it: /\b(informatique|developpement|programmation|reseau|systeme|logiciel|software|cyber|data|ia|ai|intelligence artificielle|web|mobile|cloud|devops|برمجة|اعلامية|شبكات)\b/i,
      medical: /\b(biologie|sante|paramedical|medecine|pharmacie|dentaire|infirmier|soignant|veterinaire|anesthesie|radiologie|chirurgie|laboratoire medical|طب|صحة|صيدلة|تمريض)\b/i,
      business: /\b(gestion|commerce|finance|marketing|economie|comptabilite|audit|banque|assurance|management|administration|ressources humaines|logistique|أعمال|إدارة|محاسبة|تجارة)\b/i,
      art: /\b(art|design|architecture|architecte|graphisme|graphique|mode|fashion|cinema|audiovisuel|theatre|musique|beaux-arts|decoration|creation|artistique|فن|تصميم|عمارة|سينما)\b/i,
      engineering: /\b(ingenieur|ingenierie|genie|mecanique|electrique|electronique|civil|industriel|production|maintenance|mines|ponts|geophysique|petrole|energie|هندسة|مهندس|مدني|ميكانيك)\b/i,
      law: /\b(droit|juridique|justice|avocat|notaire|magistrature|juge|tribunal|قانون|عدالة|محامي|قضاء)\b/i,
      science: /\b(physique|chimie|mathematiques|science|agronomie|environnement|geologie|astronomie|recherche|laboratoire|علوم|كيمياء|فيزياء|رياضيات)\b/i,
      education: /\b(education|pedagogie|enseignement|professeur|maitre|ecole|formation|تربية|تعليم|أستاذ|مدرس|تكوين)\b/i,
      media: /\b(media|audiovisuel|journalisme|communication|cinema|television|radio|presse|publicite|redaction|إعلام|صحافة|اتصال|إذاعة|تلفزة)\b/i,
      economy: /\b(economie|economique|banque|finance|investissement|marche|bourse|macro|micro|اقتصاد|مالية|بنوك|استثمار|أسواق)\b/i,
    };

    for (const [fieldKey, regex] of Object.entries(fieldRules)) {
      if (normalizedField.includes(fieldKey)) {
        const matches = regex.test(haystack);
        if (!matches) {
          this.logger.debug(`[STEP 2] REJECTED: ${program.program} - no ${fieldKey} keywords`);
        }
        return matches;
      }
    }

    // Default: use field keywords
    const fieldKeywords = [normalizedField, ...(field.keywords || [])].map((k) => this.normalize(k));
    return fieldKeywords.some((kw) => haystack.includes(kw));
  }

  /**
   * STEP 3: STRICT Job Retrieval
   * ONLY retrieves jobs from jobs.json
   * NEVER generates fake jobs
   */
  private retrieveJobsStrict(field: FieldData | null, _message: string): JobData[] {
    if (!field) {
      this.logger.warn('[STEP 3] No field provided, returning empty jobs');
      return [];
    }

    // Find jobs from jobs.json ONLY
    const fieldJobs = this.jobsData.find(
      (jd) => this.normalize(jd.field) === this.normalize(field.field),
    );

    if (!fieldJobs) {
      this.logger.warn(`[STEP 3] No jobs found for field=${field.field} in jobs.json`);
      return [];
    }

    // Return max 3 jobs with real data
    const jobs = fieldJobs.jobs.slice(0, 3);

    this.logger.log(`[STEP 3] Retrieved ${jobs.length} jobs from jobs.json for field=${field.field}`);
    return jobs;
  }

  /**
   * STEP 4: Rank and Classify Programs by Difficulty
   * Uses gap = studentScore - lastScore
   * Rules: gap >= 15 → Safe, gap 5-14 → Medium, gap < 5 → Difficult
   */
  private classifyProgramsByDifficulty(
    programs: RankedProgram[],
    studentScore?: number,
  ): ClassifiedProgram[] {
    return programs.map((program) => {
      const lastScore = program.matchingBac?.lastScore;
      let gap = -999;
      let difficulty: DifficultyLevel = 'Medium';

      if (studentScore && lastScore && Number.isFinite(lastScore)) {
        gap = studentScore - lastScore;

        if (gap >= 15) {
          difficulty = 'Safe';
        } else if (gap >= 5) {
          difficulty = 'Medium';
        } else {
          difficulty = 'Difficult';
        }
      }

      return {
        ...program,
        difficulty,
        gap,
      };
    });
  }

  /**
   * STEP 5: Select Best / Backup / Risky Options
   */
  private selectDecisionOptions(programs: ClassifiedProgram[]): DecisionOptions | null {
    if (programs.length === 0) {
      this.logger.warn('[STEP 5] No programs to select from');
      return null;
    }

    const sorted = [...programs].sort((a, b) => b.rankScore - a.rankScore);

    const best = sorted.find((p) => p.difficulty === 'Safe') || sorted[0];

    const backup =
      sorted.find((p) => p !== best && p.difficulty === 'Safe') ||
      sorted.find((p) => p !== best && p.difficulty === 'Medium') ||
      sorted[1];

    const risky = sorted.find((p) => p.difficulty === 'Difficult');

    this.logger.log(
      `[STEP 5] Selected: best=${best.program}(${best.difficulty}), backup=${backup?.program}(${backup?.difficulty}), risky=${risky?.program}(${risky?.difficulty})`,
    );

    return { best, backup, risky };
  }

  /**
   * FOLLOW-UP ENGINE: Generate dynamic follow-up questions
   */
  private generateFollowUpQuestion(
    field: FieldData | null,
    memory: MemoryData,
    _message: string,
  ): FollowUpQuestion {
    if (!field) {
      return {
        text: 'شنو المجال اللي يهمك؟',
        category: 'refinement',
      };
    }

    const normalizedField = this.normalize(field.field);

    // Field-specific follow-up chains (extended to all 11 domains)
    const followUpChains: Record<string, string[]> = {
      it: [
        'dev ولا réseaux؟',
        'web ولا data؟',
        'frontend ولا backend؟',
        'تطوير ولا أمن معلومات؟',
      ],
      sport: [
        'coaching ولا kiné؟',
        'performance ولا enseignement؟',
        'entraînement ولا réhabilitation؟',
      ],
      medical: [
        'médecine ولا paramédical؟',
        'hôpital ولا clinique؟',
        'recherche ولا pratique؟',
      ],
      business: [
        'finance ولا marketing؟',
        'gestion ولا comptabilité؟',
        'entreprise ولا banque؟',
      ],
      engineering: [
        'mécanique ولا électrique؟',
        'civil ولا industriel؟',
        'production ولا maintenance؟',
      ],
      design: [
        'graphisme ولا architecture؟',
        'mode ولا design intérieur؟',
      ],
      media: [
        'journalisme ولا audiovisuel؟',
        'radio ولا télévision؟',
      ],
      science: [
        'chimie ولا biologie؟',
        'recherche pure ولا appliquée؟',
      ],
      law: [
        'avocat ولا notaire؟',
        'droit privé ولا public؟',
      ],
      economy: [
        'banque ولا finance؟',
        'macréconomie ولا microéconomie؟',
      ],
      education: [
        'enseignement ولا formation؟',
        'primaire ولا secondaire؟',
      ],
    };

    const chain =
      Object.entries(followUpChains).find(([key]) => normalizedField.includes(key))?.[1] ||
      ['تحب نشوفلك الاختيارات من الأفضل للبديل؟', 'نبدأ نقارن بين البرامج ونختار؟'];

    const askedSet = new Set(memory.askedQuestions);
    const newQuestion = chain.find((q) => !askedSet.has(q)) || chain[chain.length - 1];

    return {
      text: `👉 ${newQuestion}`,
      category: 'refinement',
    };
  }

  /**
   * PUBLIC API: Enhanced getRecommendations using strict pipeline
   */
  getRecommendationsEnhanced(
    query: RagQuery,
    memory: MemoryData = { askedQuestions: [], rejectedDomains: [] },
  ): RagMergedResult {
    const context = this.buildDecisionContext(query, memory);

    return {
      bacType: query.bacType,
      score: query.score,
      field: context.field || undefined,
      jobs: context.jobs,
      programs: context.programs,
      demand: context.field?.demand_in_tunisia,
      unemployment: context.field?.unemployment_risk,
      outlook: context.field?.future_outlook,
      unemploymentRate: this.calculateAverageUnemploymentRate(context.jobs),
      decisionOptions: context.options || undefined,
      followUpQuestion: context.followUp.text,
    };
  }
}
