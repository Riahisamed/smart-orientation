import { Injectable, Logger } from '@nestjs/common';
import { OllamaConfigService } from '../common/services/ollama-config.service';
import { AiMemory, AiService } from './ai.service';
import { IntentDetectorService, AdvisorIntent } from './intent-detector.service';
import { SafetyRulesService } from './safety-rules.service';
import { ResponseBuilderService } from './response-builder.service';
import { FIELD_ALIASES, RagService, FieldData, JobData, RankedProgram, detectField, normalizeText } from './rag.service';
import { MemoryService, ConversationMemory } from './memory.service';
import { FollowupGenerator } from '../ai/generators/followup.generator';
import * as fs from 'fs';
import * as path from 'path';

type ConversationMessage = { role: 'user' | 'assistant'; content: string };

type StudentData = {
  name?: string;
  bacType?: string;
  score?: number;
  bacAverage?: number;
  FG?: number;
  selectedFiliere?: string;
  language?: 'fr' | 'ar';
  interest?: string;
  difficulty?: 'easy' | 'challenge';
  preferredDomain?: string;
  refinedDomain?: string;
  journeyStep?: 'identify_interest' | 'refine_domain' | 'suggest_options' | 'give_decision';
  rejectedDomains?: string[];
  lastQuestionsAsked?: string[];
};

type FullFieldData = {
  field: string;
  keywords?: string[];
  programs: string[];
  possible_jobs: string[];
  required_skills: { technical_skills: string[]; soft_skills: string[]; tools_and_technologies: string[]; };
  demand_in_tunisia: string;
  future_outlook: string;
  unemployment_risk: string;
  recommended: boolean;
  reason: string;
};

function detectLanguage(message: string): 'fr' | 'ar' {
  return /[\u0600-\u06FF]/.test(message) ? 'ar' : 'fr';
}

// ============================================================
// PART 1 — cleanMessage()
// Removes: (mon score: xxx), question marks, punctuation,
// extra whitespace
// IMPORTANT: DOES NOT strip accents (preserves é, è, ê, etc.)
// ============================================================
function cleanMessage(raw: string): string {
  let m = raw
    // Remove complete (mon score: XXX) / (score:xxx) etc
    .replace(/\([^)]*(?:score|note|moyenne|معدل)[^)]*\)/gi, '')
    // Remove incomplete score parens: (mon sc...), (mon scor... etc
    .replace(/\([^)]*mon\s+sc[^)]*/gi, ' ')
    .replace(/\([^)]*sc[^)]*/gi, ' ')
    // Remove standalone score/number patterns
    .replace(/(?:score|note|moyenne|معدل)\s*[:\\-]*\s*\d*/gi, '')
    // Remove question marks
    .replace(/[؟?]+/g, '')
    // Remove punctuation but KEEP accented letters (Unicode letters)
    .replace(/[^\p{L}\p{N}\s\/\\-]/gu, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  // NOTE: Do NOT strip accents — keep génie, mécanique, ingénieur intact

  return m;
}

// ============================================================
// DOMAIN KEYWORDS — clean, non-overlapping, priority-ready
// HEALTH keywords are comprehensive to prevent falling through
// LETTRES/LANGUAGES are separate from ART
// ENGINEERING has BOTH accented and unaccented forms
// ============================================================
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  HEALTH: [
    'medecine', 'médecine', 'médecin', 'medical', 'sante', 'santé',
    'pharmacie', 'pharmacien', 'infirmier', 'infirmiere', 'soignant',
    'biologie', 'biologiste', 'paramedical', 'paramédical',
    'dentaire', 'dentiste', 'veterinaire', 'vétérinaire',
    'hopital', 'hôpital', 'clinique', 'diagnostic', 'chirurgie',
    'anesthesie', 'radiologie', 'laboratoire medical',
    'kine', 'kiné', 'kinésithérapeute', 'kinesitherapeute', 'kinésithérapie',
    'soins', 'patient', 'urgences', 'sang', 'traitement',
    'طب', 'صحة', 'صيدلة', 'تمريض', 'بيولوجيا', 'علاج', 'مستشفى',
    'ممرض', 'طبيب', 'صيدلي', 'مخبر', 'تشخيص',
  ],
  ENGINEERING: [
    'ingenieur', 'ingénieur', 'ingenierie', 'ingénierie',
    'genie', 'génie',
    'mecanique', 'mécanique',
    'electrique', 'électrique', 'electronique', 'électronique',
    'civil', 'industriel', 'production', 'maintenance',
    'electromecanique', 'électromécanique',
    'mines', 'ponts', 'geophysique', 'géophysique',
    'petrole', 'pétrole', 'energie', 'énergie',
    'automatique', 'robotique',
    'technologie', 'technology',
    'هندسة', 'مهندس', 'مدني', 'ميكانيك', 'كهرباء',
    'إلكترونيك', 'طاقة', 'إنتاج', 'صناعي',
  ],
  SPORT: [
    'sport', 'sportif', 'sportive', 'coaching', 'coach',
    'fitness', 'activite physique', 'activité physique',
    'eps', 'education physique', 'éducation physique',
    'entrainement', 'entraînement', 'performance sportive',
    'athlete', 'athlète', 'football', 'basket', 'tennis',
    'رياضة', 'الرياضة', 'بدنية', 'تربية بدنية', 'تدريب', 'مدرب',
    'علاج طبيعي', 'لياقة',
  ],
  LAW: [
    'droit', 'avocat', 'juridique', 'justice', 'notaire',
    'magistrat', 'juge', 'tribunal', 'juriste', 'legal',
    'contentieux', 'loi', 'reglementation', 'réglementation',
    'compliance', 'قانون', 'عدالة', 'محامي', 'قاضي', 'محكمة',
    'قضاء', 'موثق', 'عدلي',
  ],
  LANGUAGES: [
    'lettres', 'lettre', 'litterature', 'littérature',
    'langues', 'langue', 'traduction', 'traducteur',
    'communication', 'journalisme', 'journaliste',
    'redacteur', 'rédacteur', 'redaction', 'rédaction',
    'enseignement', 'enseignant', 'professeur',
    'anglais', 'francais', 'français', 'arabe',
    'espagnol', 'allemand', 'italien',
    'adab', 'litteraire', 'littéraire',
    'ترجمة', 'لغات', 'لغة', 'أدب', 'آداب', 'كتابة', 'تحرير',
    'إعلام', 'صحافة', 'اتصال',
  ],
  BUSINESS: [
    'business', 'gestion', 'commerce', 'finance', 'marketing',
    'economie', 'économie', 'comptabilité', 'comptabilite',
    'management', 'administration', 'ressources humaines', 'rh',
    'logistique', 'supply chain', 'audit', 'banque', 'assurance',
    'bourse', 'trading', 'entrepreneur', 'startup', 'investissement',
    'إدارة', 'تجارة', 'أعمال', 'محاسبة', 'مالية', 'تصرف',
    'اقتصاد', 'تسويق', 'استثمار', 'بنوك',
  ],
  ART: [
    'art', 'arts', 'design', 'architecture', 'architecte',
    'musique', 'theatre', 'theâtre', 'cinema', 'cinéma',
    'arts plastiques', 'dessin', 'graphisme', 'graphique',
    'mode', 'fashion', 'decoration', 'décoration',
    'création', 'creation', 'artistique',
    'فن', 'فنون', 'تصميم', 'عمارة', 'موسيقى',
    'سينما', 'مسرح', 'جرافيك', 'أزياء',
  ],
  IT: [
    'informatique', 'informatia', 'dev', 'développement',
    'programmation', 'software', 'logiciel',
    'reseau', 'réseau', 'reseaux', 'réseaux',
    'cyber', 'cybersecurite', 'cybersécurité',
    'data', 'ia', 'ai', 'intelligence artificielle',
    'web', 'mobile', 'cloud', 'devops', 'fullstack',
    'frontend', 'backend', 'back-end', 'front-end',
    'code', 'coding', 'programmeur', 'developer',
    'it', 'tech',
    'برمجة', 'اعلامية', 'معلوماتية', 'شبكات',
    'أمن معلومات', 'تطوير', 'حاسوب', 'تكنولوجيا',
    'ذكاء اصطناعي', 'بيانات',
  ],
};

// ============================================================
// PART 4 — detectDomain() with PRIORITY ORDER
// Priority: HEALTH > ENGINEERING > SPORT > LAW > LANGUAGES
//           > BUSINESS > ART > IT
// ENGINEERING is BEFORE SPORT to fix "école d'ingénieur" bug
// First match wins (stop on first found)
// ============================================================
function detectDomain(message?: string): string | null {
  if (!message) return null;
  const aliasField = detectField(message);
  if (aliasField) {
    const map: Record<string, string> = {
      engineering: 'ENGINEERING',
      it: 'IT',
      health: 'HEALTH',
      sport: 'SPORT',
      art: 'ART',
      business: 'BUSINESS',
    };
    return map[aliasField];
  }

  const cleaned = cleanMessage(message);
  if (!cleaned) return null;

  const normalized = cleaned;

  const PRIORITY_ORDER = [
    'HEALTH', 'ENGINEERING', 'SPORT', 'LAW', 'LANGUAGES',
    'BUSINESS', 'ART', 'IT',
  ];

  for (const domain of PRIORITY_ORDER) {
    const keywords = DOMAIN_KEYWORDS[domain] || [];
    for (const kw of keywords) {
      const normalizedKw = kw
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '');
      // Also normalize the message for comparison to handle mixed accented/unaccented
      const normalizedMsg = normalized
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '');
      if (normalizedMsg.includes(normalizedKw)) {
        return domain;
      }
    }
  }

  return null;
}

/** Map domain key to interest string — FIXED so LANGUAGES ≠ 'art' */
function domainToInterest(domain: string | null): string | undefined {
  if (!domain) return undefined;
  const map: Record<string, string> = {
    HEALTH: 'health',
    SPORT: 'sport',
    LAW: 'law',
    LANGUAGES: 'languages',
    BUSINESS: 'business',
    ENGINEERING: 'engineering',
    ART: 'art',
    IT: 'tech',
    SCIENCE: 'science',
    EDUCATION: 'education',
    MEDIA: 'media',
    ECONOMY: 'business',
  };
  return map[domain];
}

/** Map domain key to human-readable label */
function domainLabel(domain: string | null, lang: 'fr' | 'ar'): string {
  if (!domain) return '';
  const fr: Record<string, string> = {
    HEALTH: 'Santé / Médical',
    SPORT: 'Sport',
    LAW: 'Droit',
    LANGUAGES: 'Lettres / Langues',
    BUSINESS: 'Business / Gestion',
    ENGINEERING: 'Génie / Ingénierie',
    ART: 'Arts & Design',
    IT: 'Informatique / Tech',
    SCIENCE: 'Sciences',
    EDUCATION: 'Éducation',
    MEDIA: 'Média',
    ECONOMY: 'Économie',
  };
  const ar: Record<string, string> = {
    HEALTH: 'صحة / طب',
    SPORT: 'رياضة',
    LAW: 'قانون',
    LANGUAGES: 'آداب / لغات',
    BUSINESS: 'إدارة / أعمال',
    ENGINEERING: 'هندسة',
    ART: 'فنون / تصميم',
    IT: 'إعلامية / تكنولوجيا',
    SCIENCE: 'علوم',
    EDUCATION: 'تربية / تعليم',
    MEDIA: 'إعلام',
    ECONOMY: 'اقتصاد',
  };
  return lang === 'ar' ? (ar[domain] || domain) : (fr[domain] || domain);
}

/** Domain-specific follow-up questions */
const DOMAIN_FOLLOWUPS: Record<string, { ar: string[]; fr: string[] }> = {
  ART: {
    ar: ['تحب design graphique ولا architecture؟', 'تحب création ولا multimédia؟', 'تحب رسم ولا تصميم رقمي؟'],
    fr: ['Tu préfères design graphique ou architecture ?', 'Création ou multimédia ?', 'Dessin ou design numérique ?'],
  },
  SPORT: {
    ar: ['تحب coaching ولا rééducation؟', 'تحب منافسة ولا fitness؟', 'تدريب فردي ولا جماعي؟'],
    fr: ['Tu préfères coaching ou rééducation ?', 'Compétition ou fitness ?', 'Entraînement individuel ou collectif ?'],
  },
  HEALTH: {
    ar: ['تحب contact مع المرضى ولا مختبر؟', 'تحب médecine ولا paramédical؟', 'مستشفى ولا عيادة خاصة؟'],
    fr: ['Tu préfères contact patients ou laboratoire ?', 'Médecine ou médical ?', 'Hôpital ou clinique privée ?'],
  },
  IT: {
    ar: ['تحب web ولا data؟', 'تحب frontend ولا backend؟', 'تطوير ولا أمن معلومات؟'],
    fr: ['Tu préfères web ou data ?', 'Frontend ou backend ?', 'Développement ou cybersécurité ?'],
  },
  LAW: {
    ar: ['تحب avocat ولا مستشار قانوني؟', 'تحب قانون خاص ولا عام؟', 'محامي ولا موثق؟'],
    fr: ['Tu préfères avocat ou conseiller juridique ?', 'Droit privé ou public ?', 'Avocat ou notaire ?'],
  },
  LANGUAGES: {
    ar: ['تحب ترجمة ولا تدريس؟', 'تحب صحافة ولا تحرير؟', 'كتابة ولا تواصل؟'],
    fr: ['Tu préfères traduction ou enseignement ?', 'Journalisme ou rédaction ?', 'Communication ou littérature ?'],
  },
  BUSINESS: {
    ar: ['تحب finance ولا marketing؟', 'تحب محاسبة ولا إدارة؟', 'شركة خاصة ولا بنك؟'],
    fr: ['Tu préfères finance ou marketing ?', 'Comptabilité ou gestion ?', 'Entreprise privée ou banque ?'],
  },
  ENGINEERING: {
    ar: ['تحب mécanique ولا électrique؟', 'تحب مدني ولا صناعي؟', 'تصميم ولا صيانة؟'],
    fr: ['Tu préfères mécanique ou électrique ?', 'Civil ou industriel ?', 'Conception ou maintenance ?'],
  },
  EDUCATION: {
    ar: ['تحب تدريس أساسي ولا ثانوي؟', 'تكوين مهني ولا أكاديمي؟', 'تعليم عمومي ولا خصوصي؟'],
    fr: ['Tu préfères enseignement primaire ou secondaire ?', 'Formation pro ou académique ?', 'Public ou privé ?'],
  },
  SCIENCE: {
    ar: ['تحب كيمياء ولا بيولوجيا؟', 'تحب بحث ولا تطبيق؟', 'مخبر ولا ميدان؟'],
    fr: ['Tu préfères chimie ou biologie ?', 'Recherche ou application ?', 'Laboratoire ou terrain ?'],
  },
  MEDIA: {
    ar: ['تحب صحافة ولا إعلام سمعي بصري؟', 'إذاعة ولا تلفزة؟', 'كتابة ولا إنتاج؟'],
    fr: ['Tu préfères journalisme ou audiovisuel ?', 'Radio ou télévision ?', 'Écriture ou production ?'],
  },
  ECONOMY: {
    ar: ['تحب بنوك ولا أسواق مالية؟', 'تحب اقتصاد كلي ولا جزئي؟', 'تحليل ولا استثمار؟'],
    fr: ['Tu préfères banque ou marchés financiers ?', 'Macroéconomie ou microéconomie ?', 'Analyse ou investissement ?'],
  },
};

// ============================================================
// SANTIZED JOBS per domain (hardcoded fallbacks)
// LETTRES jobs MUST be: traducteur, enseignant, journaliste, etc.
// HEALTH jobs MUST be medical only
// ENGINEERING jobs MUST be civil, mécanique, électrique, industriel
// ============================================================
const DOMAIN_JOBS: Record<string, { title: string; description: string; skills: string[]; demand: string; unemployment_rate: number }[]> = {
  LANGUAGES: [
    { title: 'Traducteur', description: 'Traduction de textes entre plusieurs langues', skills: ['Maîtrise linguistique', 'Rédaction', 'Recherche terminologique'], demand: 'Medium', unemployment_rate: 8 },
    { title: 'Enseignant', description: 'Enseignement des langues dans des établissements scolaires ou centres', skills: ['Pédagogie', 'Communication', 'Patience'], demand: 'High', unemployment_rate: 5 },
    { title: 'Journaliste', description: 'Rédaction d\'articles, reportages et enquêtes pour médias', skills: ['Rédaction', 'Investigation', 'Communication'], demand: 'Medium', unemployment_rate: 10 },
    { title: 'Rédacteur', description: 'Création de contenu écrit pour divers supports', skills: ['Écriture', 'Synthèse', 'Créativité'], demand: 'Medium', unemployment_rate: 7 },
    { title: 'Chargé de communication', description: 'Gestion de la communication interne et externe', skills: ['Communication', 'Rédaction', 'Relation publique'], demand: 'High', unemployment_rate: 6 },
  ],
  HEALTH: [
    { title: 'Médecin', description: 'Soins médicaux et diagnostic des patients', skills: ['Diagnostic', 'Soins cliniques', 'Empathie'], demand: 'High', unemployment_rate: 2 },
    { title: 'Pharmacien', description: 'Délivrance de médicaments et conseil pharmaceutique', skills: ['Pharmacologie', 'Conseil', 'Gestion'], demand: 'High', unemployment_rate: 3 },
    { title: 'Infirmier', description: 'Soins infirmiers et suivi des patients', skills: ['Soins', 'Suivi patient', 'Travail d\'équipe'], demand: 'High', unemployment_rate: 4 },
    { title: 'Biologiste médical', description: 'Analyses biologiques en laboratoire', skills: ['Analyse', 'Biologie', 'Précision'], demand: 'Medium', unemployment_rate: 5 },
    { title: 'Kinésithérapeute', description: 'Rééducation fonctionnelle des patients', skills: ['Rééducation', 'Anatomie', 'Suivi'], demand: 'High', unemployment_rate: 4 },
  ],
  ENGINEERING: [
    { title: 'Ingénieur mécanique', description: 'Conception et maintenance de systèmes mécaniques', skills: ['Mécanique', 'CAO/DAO', 'Résistance des matériaux'], demand: 'High', unemployment_rate: 3 },
    { title: 'Ingénieur civil', description: 'Conception et réalisation d\'infrastructures (ponts, routes, bâtiments)', skills: ['Génie civil', 'BTP', 'Calcul de structures'], demand: 'High', unemployment_rate: 3 },
    { title: 'Ingénieur électrique', description: 'Conception de systèmes électriques et électroniques', skills: ['Électrotechnique', 'Automatisme', 'Schémas électriques'], demand: 'High', unemployment_rate: 4 },
    { title: 'Ingénieur industriel', description: 'Optimisation des processus de production en industrie', skills: ['Gestion de production', 'Lean manufacturing', 'Supply chain'], demand: 'High', unemployment_rate: 4 },
    { title: 'Ingénieur en maintenance', description: 'Gestion et optimisation de la maintenance industrielle', skills: ['Maintenance', 'GMAO', 'Fiabilité'], demand: 'Medium', unemployment_rate: 5 },
  ],
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private sessionStudentData: Partial<StudentData> = {};
  private conversationMemory: ConversationMemory;
  private fullFieldsData: FullFieldData[] = [];

  constructor(
    private readonly ollamaConfig: OllamaConfigService,
    private readonly aiService: AiService,
    private readonly intentDetector: IntentDetectorService,
    private readonly safetyRules: SafetyRulesService,
    private readonly responseBuilder: ResponseBuilderService,
    private readonly ragService: RagService,
    private readonly memoryService: MemoryService,
    private readonly followupGenerator: FollowupGenerator,
  ) {
    this.conversationMemory = this.memoryService.initializeMemory();
    this.loadFullFieldsData();
  }

  private loadFullFieldsData(): void {
    for (const p of [
      path.join(process.cwd(), 'lib', 'data', 'fields.json'),
      path.join(__dirname, '..', '..', '..', 'lib', 'data', 'fields.json'),
    ]) {
      try {
        if (fs.existsSync(p)) {
          const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
          this.fullFieldsData = parsed.fields || [];
          this.logger.log(`Loaded ${this.fullFieldsData.length} fields`);
          return;
        }
      } catch { /* next */ }
    }
  }

  private getFieldByInterest(interest: string): FullFieldData | undefined {
    const map: Record<string, string> = {
      tech: 'IT', sport: 'Sport', health: 'Medical / Health',
      business: 'Business / Management', art: 'Arts & Design',
    };
    const name = map[interest];
    return name ? this.fullFieldsData.find(f => f.field === name) : undefined;
  }

  // ============================================================
  // 🧠 MAIN ENTRY POINT
  // ============================================================
  async processMessage(
    message: string,
    studentData?: StudentData,
    conversationHistory: ConversationMessage[] = [],
  ): Promise<string> {
    const userMessage = message?.trim();
    if (!userMessage) return 'Message non valide';

    this.mergeSessionStudentData(studentData);
    const parsed = this.extractStudentDataFromMessage(userMessage);
    this.mergeSessionStudentData(parsed);
    this.syncMemoryToSessionData();

    const lang = studentData?.language || detectLanguage(userMessage);

    // ⚠️ DETECT DOMAIN FIRST using priority-ordered detectDomain()
    const rawCleaned = cleanMessage(userMessage);
    const detectedDomain = detectDomain(rawCleaned || userMessage);
    const advisorIntent = this.intentDetector.detectIntent(userMessage);

    // Store domain in memory (only if not rejected)
    if (detectedDomain) {
      const rejected = this.getMemory().rejectedDomains || [];
      if (!rejected.includes(detectedDomain)) {
        const interestValue = domainToInterest(detectedDomain);
        if (interestValue && this.sessionStudentData.interest !== interestValue) {
          this.sessionStudentData.interest = interestValue;
        }
        this.sessionStudentData.preferredDomain = detectedDomain;
      }
    }

    // Extract from memory
    const extractedIntent = this.memoryService.extractFromMessage(userMessage, this.conversationMemory);
    this.conversationMemory = this.memoryService.updateMemory(this.conversationMemory, extractedIntent, userMessage);

    console.log('INTENT:', advisorIntent);
    console.log('DOMAIN:', detectedDomain || 'none');

    // Rejection
    if (advisorIntent === 'rejection') {
      return this.handleRejection(userMessage, lang);
    }

    // Greeting
    if (advisorIntent === 'greeting') {
      return lang === 'ar'
        ? 'سلام 👋 أنا مساعد التوجيه.\nتقدر تسأل على: برامج دراسة، خدمات، مهارات، مقارنات، رواتب، roadmap'
        : 'Salut 👋 Je suis ton assistant.\nTu peux demander: programmes, métiers, compétences, comparaisons, salaires, roadmap';
    }

    // If no domain detected, ask user
    if (!detectedDomain && !this.sessionStudentData.interest) {
      return lang === 'ar'
        ? '❌ لم أفهم المجال المطلوب.\nحدد المجال اللي تحب: مثلاً "informatique" أو "sport" أو "طب"'
        : '❌ Je n\'ai pas compris le domaine.\nPrécise le domaine: ex: "informatique", "sport", "médecine"';
    }

    // DYNAMIC ROUTING — each intent has its own generator
    switch (advisorIntent) {
      case 'ask_programs':
        return this.recommendationGenerator(userMessage, lang, detectedDomain);
      case 'ask_jobs':
        return this.jobsGenerator(userMessage, lang, detectedDomain);
      case 'ask_skills':
        return this.skillsGenerator(userMessage, lang, detectedDomain);
      case 'ask_comparison':
        return this.comparisonGenerator(userMessage, lang, detectedDomain);
      case 'ask_roadmap':
        return this.roadmapGenerator(userMessage, lang, detectedDomain);
      case 'ask_salary':
        return this.salaryGenerator(userMessage, lang, detectedDomain);
      default:
        return lang === 'ar'
          ? 'تقصد برامج دراسة ولا خدمات ولا مهارات؟'
          : 'Tu cherches des programmes, des métiers ou des compétences ?';
    }
  }

  // ============================================================
  // 🚨 REJECTION HANDLER
  // ============================================================
  private handleRejection(message: string, lang: 'fr' | 'ar'): string {
    const normalized = message.toLowerCase().trim();
    const rejectedDomains: string[] = [];
    const map: Record<string, string> = {
      réseaux: 'tech', reseau: 'tech', network: 'tech', cyber: 'tech',
      informatique: 'tech', dev: 'tech', sport: 'sport',
      kine: 'sport', kiné: 'sport', médecine: 'health', medecine: 'health',
      santé: 'health', sante: 'health', business: 'business', commerce: 'business',
      art: 'art', design: 'art', برمجة: 'tech', رياضة: 'sport', طب: 'health',
    };
    for (const [term, domain] of Object.entries(map)) {
      if (normalized.includes(term) && !rejectedDomains.includes(domain)) {
        rejectedDomains.push(domain);
      }
    }
    if (rejectedDomains.length > 0) {
      const existing = new Set(this.sessionStudentData.rejectedDomains || []);
      rejectedDomains.forEach(d => existing.add(d));
      this.sessionStudentData.rejectedDomains = Array.from(existing);
      rejectedDomains.forEach(d => {
        if (this.sessionStudentData.interest === d) {
          this.sessionStudentData.interest = undefined;
          this.sessionStudentData.preferredDomain = undefined;
        }
      });
      return lang === 'ar'
        ? `تمام، نحّينا ${rejectedDomains.join('، ')} من الاختيارات 👍`
        : `D'accord, j'ai retiré ${rejectedDomains.join(', ')} des options 👍`;
    }
    return lang === 'ar' ? 'تمام 👍' : 'D\'accord 👍';
  }

  // ============================================================
  // PART 6 — FIX HEALTH PROGRAM FILTERING
  // Ensures HEALTH queries NEVER return IT programs
  // ============================================================
  private enforceDomainPrograms(
    programs: RankedProgram[],
    domain: string | null | undefined,
  ): RankedProgram[] {
    if (!domain) return programs;
    if (programs.length === 0) return programs;

    const domainKey = domain.toUpperCase();
    const aliasField = detectField(domain) || (
      domainKey === 'ENGINEERING' ? 'engineering' :
      domainKey === 'IT' || domainKey === 'TECH' ? 'it' :
      domainKey === 'HEALTH' ? 'health' :
      domainKey === 'SPORT' ? 'sport' :
      domainKey === 'ART' || domainKey === 'DESIGN' ? 'art' :
      domainKey === 'BUSINESS' ? 'business' :
      null
    );

    if (aliasField) {
      const aliases = FIELD_ALIASES[aliasField];
      const filtered = programs.filter((program) => {
        const searchableText = normalizeText(`
          ${program.program || ''}
          ${program.name || ''}
          ${program.institution || ''}
          ${program.formula || ''}
          ${program.domain || ''}
        `);

        return aliases.some((alias) => searchableText.includes(normalizeText(alias))) ||
          normalizeText(program.domain || '') === normalizeText(aliasField);
      });

      if (filtered.length > 0) return filtered;
    }

    // HEALTH domain: ONLY health/biomedical programs
    if (domainKey === 'HEALTH') {
      return programs.filter(p => {
        const haystack = [p.name, p.program, p.formula, p.domain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '');
        // MUST contain health keywords
        const healthMatch = /\b(biologie|sante|medical|medecine|pharmacie|dentaire|infirmier|soins|paramedical|veterinaire|anesthesie|radiologie|chirurgie|laboratoire|kin[eé]|clinique|hopital|patient|diagnostic|traitement)\b/i.test(haystack);
        // MUST NOT contain IT keywords
        const itMatch = /\b(informatique|developpement|programmation|reseau|logiciel|software|cyber|data|ia|ai|intelligence artificielle|web|mobile|dev|code)\b/i.test(haystack);
        return healthMatch && !itMatch;
      });
    }

    // LANGUAGES domain: ONLY language/literature/communication programs
    if (domainKey === 'LANGUAGES') {
      return programs.filter(p => {
        const haystack = [p.name, p.program, p.formula, p.domain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '');
        const langMatch = /\b(langues|traduction|lettres|litterature|journalisme|communication|enseignement|anglais|francais|arabe|redaction|traducteur|enseignant)\b/i.test(haystack);
        const artMatch = /\b(design|architecture|graphisme|mode|cinema|musique|theatre)\b/i.test(haystack);
        return langMatch && !artMatch;
      });
    }

    // ART domain: ONLY art/design programs
    if (domainKey === 'ART') {
      return programs.filter(p => {
        const haystack = [p.name, p.program, p.formula, p.domain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '');
        return /\b(art|design|architecture|graphisme|graphique|mode|cinema|audiovisuel|musique|theatre|beaux-arts|decoration|creation)\b/i.test(haystack);
      });
    }

    // ENGINEERING domain: ONLY engineering programs
    if (domainKey === 'ENGINEERING') {
      return programs.filter(p => {
        const haystack = [p.name, p.program, p.formula, p.domain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '');
        const engMatch = /\b(genie|génie|ingenieur|ingénieur|mecanique|mécanique|electrique|électrique|civil|industriel|production|maintenance|electromecanique|robotique|automatique|energie)\b/i.test(haystack);
        const sportMatch = /\b(sport|coaching|fitness|eps|football|basket|tennis|entrainement)\b/i.test(haystack);
        return engMatch && !sportMatch;
      });
    }

    return programs;
  }

  // ============================================================
  // 🏫 RECOMMENDATION GENERATOR — programs ONLY (domain-filtered)
  // ============================================================
  private recommendationGenerator(message: string, lang: 'fr' | 'ar', detectedDomain: string | null): string {
    const interest = this.resolveEffectiveInterest(message);
    const rejected = this.getMemory().rejectedDomains || [];
    const bacType = this.sessionStudentData.bacType;
    const score = this.sessionStudentData.score;

    // For LANGUAGES/LETTRES domain, DO NOT map to 'art' interest
    let effectiveInterest = interest;
    if (detectedDomain === 'LANGUAGES') {
      effectiveInterest = undefined; // Don't use interest to avoid art mapping
    }

    const recs = this.ragService.getRecommendations({
      message,
      bacType,
      score,
      interest: effectiveInterest || undefined,
      limit: 5,
    });

    // Filter out rejected and non-matching domains
    let programs = (recs.programs || []).filter(p => {
      if (p.domain && rejected.includes(p.domain)) return false;
      const pInterest = effectiveInterest;
      if (pInterest && p.domain && p.domain !== pInterest) return false;
      return true;
    });

    // PART 6 — Enforce HEALTH domain filter (strip IT programs)
    programs = this.enforceDomainPrograms(programs, detectedDomain || this.sessionStudentData.preferredDomain);

    const field = recs.field;
    const blocks: string[] = [];

    // If no programs match, return clear message
    if (programs.length === 0) {
      const domainName = domainLabel(detectedDomain || this.sessionStudentData.preferredDomain || null, lang);
      if (!domainName) {
        return lang === 'ar'
          ? '❌ لا توجد بيانات كافية لهذا المجال حالياً.'
          : '❌ Pas assez de données pour ce domaine actuellement.';
      }
      return lang === 'ar'
        ? `❌ لا توجد برامج متاحة لمجال ${domainName} حالياً.`
        : `❌ Aucun programme disponible pour ${domainName} actuellement.`;
    }

    // 👤 Student info summary
    if (bacType || score) {
      const infoParts: string[] = [];
      if (bacType) infoParts.push(lang === 'ar' ? `باك ${bacType}` : `Bac ${bacType}`);
      if (score) infoParts.push(lang === 'ar' ? `معدل ${score}` : `score ${score}`);
      blocks.push(`👤 ${infoParts.join(' - ')}`);
    }

    // 🏫 Programs
    if (programs.length > 0) {
      const progLines = programs.slice(0, 4).map(p => {
        const lastScore = p.matchingBac?.lastScore;
        let level = 'Medium';
        let emoji = '⚡';
        if (score && lastScore) {
          const gap = score - lastScore;
          if (gap >= 10) { level = 'Safe'; emoji = '✅'; }
          else if (gap < -5) { level = 'Difficult'; emoji = '🚀'; }
        }
        const name = p.name || p.program || '';
        const inst = p.institution ? `@ ${p.institution}` : '';
        if (lang === 'ar') {
          return `${emoji} ${name}\n   🏛 ${inst}\n   📊 آخر score: ${lastScore || '?'} — ${level === 'Safe' ? 'آمن' : level === 'Medium' ? 'متوسط' : 'صعب'}`;
        }
        return `${emoji} ${name}\n   🏛 ${inst}\n   📊 Dernier score: ${lastScore || '?'} — ${level}`;
      });
      blocks.push(progLines.join('\n\n'));
    }

    // ✅ Score compatibility
    if (score && programs.length > 0) {
      const safeCount = programs.filter(p => {
        const ls = p.matchingBac?.lastScore;
        return typeof ls === 'number' && (score - ls) >= 10;
      }).length;
      if (safeCount > 0) {
        blocks.push(lang === 'ar' ? `✅ **التوافق:** معدلك يضمن ${safeCount} برامج` : `✅ **Compatibilité:** ton score sécurise ${safeCount} programme(s)`);
      }
    }

    // 🔮 Future (use domain-specific field data if available)
    if (field) {
      blocks.push(lang === 'ar'
        ? `🔮 **المستقبل:** ${field.future_outlook}\n📈 **الطلب:** ${field.demand_in_tunisia}\n⚠️ **البطالة:** ${field.unemployment_risk}`
        : `🔮 **Perspectives:** ${field.future_outlook}\n📈 **Demande:** ${field.demand_in_tunisia}\n⚠️ **Chômage:** ${field.unemployment_risk}`);
    }

    // Follow-up (domain-aware)
    const followUp = this.buildDomainFollowUp(detectedDomain || interest, lang);
    return blocks.join('\n\n') + '\n\n' + followUp;
  }

  /** Get the effective domain (from whichever source) */
  private getEffectiveDomain(message: string, detectedDomain?: string | null): string | null {
    if (detectedDomain) {
      const interest = domainToInterest(detectedDomain);
      return interest || detectedDomain;
    }
    return this.sessionStudentData.interest || null;
  }

  // ============================================================
  // 💼 JOBS GENERATOR — PART 5: FIX CAREERS
  // LETTRES/LANGUAGES returns: traducteur, enseignant, journaliste,
  // rédacteur, communication — NEVER designer, UX/UI, architecte
  // ENGINEERING returns: ingénieur mécanique, civil, électrique, etc.
  // ============================================================
  private jobsGenerator(message: string, lang: 'fr' | 'ar', effectiveDomain?: string | null): string {
    const domainKey = this.resolveJobsDomain(message, effectiveDomain);

    // LANGUAGES / LETTRES: Use hardcoded jobs to avoid art fallback
    if (domainKey === 'LANGUAGES' || domainKey === 'LETTERS') {
      return this.formatDomainJobs('LANGUAGES', lang);
    }

    // HEALTH: Use hardcoded medical jobs
    if (domainKey === 'HEALTH') {
      return this.formatDomainJobs('HEALTH', lang);
    }

    // ENGINEERING: Use hardcoded engineering jobs
    if (domainKey === 'ENGINEERING') {
      return this.formatDomainJobs('ENGINEERING', lang);
    }

    const interest = this.resolveEffectiveInterest(message);
    const domain = this.getEffectiveDomain(message, effectiveDomain);

    const jobs = this.ragService.getJobsByField(domainKey);

    // Fallback via recommendations
    const fallbackJobs: JobData[] = jobs.length > 0 ? jobs : (this.ragService.getRecommendations({
      message,
      bacType: this.sessionStudentData.bacType,
      score: this.sessionStudentData.score,
      interest: interest || undefined,
      limit: 5,
    }).jobs || []);

    if (fallbackJobs.length === 0) {
      return lang === 'ar'
        ? '❌ لا توجد خدمات مطابقة لهذا المجال حالياً.'
        : '❌ Aucun métier trouvé pour ce domaine actuellement.';
    }

    const blocks: string[] = [];
    const jobsToShow = fallbackJobs.slice(0, 3);

    if (jobsToShow.length > 0) {
      const jobBlocks = jobsToShow.map(j => {
        const salary = j.salary_level
          ? (lang === 'ar' ? `💰 **الراتب:** ${this.salaryLabel(j.salary_level, lang)}` : `💰 **Salaire:** ${this.salaryLabel(j.salary_level, lang)}`)
          : '';
        if (lang === 'ar') {
          return `🛡️ **${j.title}**\n📌 ${j.description || ''}\n📈 **الطلب:** ${j.demand || 'Medium'}\n⚠️ **البطالة:** ${j.unemployment_rate !== undefined ? `${j.unemployment_rate}%` : '?'}\n🛠 **المهارات:** ${j.skills?.slice(0, 5).join(', ') || ''}\n${salary}`;
        }
        return `🛡️ **${j.title}**\n📌 ${j.description || ''}\n📈 **Demande:** ${j.demand || 'Medium'}\n⚠️ **Chômage:** ${j.unemployment_rate !== undefined ? `${j.unemployment_rate}%` : '?'}\n🛠 **Compétences:** ${j.skills?.slice(0, 5).join(', ') || ''}\n${salary}`;
      });
      blocks.push(jobBlocks.join('\n\n---\n\n'));
    }

    return blocks.join('\n\n');
  }

  /**
   * Resolve the domain for jobs queries.
   * Special case: "carrière en technologie" → ENGINEERING
   */
  private resolveJobsDomain(message: string, effectiveDomain?: string | null): string {
    const domainKey = (effectiveDomain || this.sessionStudentData.preferredDomain || '').toUpperCase();

    // PART 4: Career + technology → engineering jobs
    const careerTerms = /carrière|carriere|débouchés|debouches|métiers|metiers|opportunités|opportunites|travail/i;
    const techTerms = /technologie|technology/i;
    if (careerTerms.test(message) && techTerms.test(message)) {
      return 'ENGINEERING';
    }

    return domainKey;
  }

  /** Format hardcoded domain jobs (for LANGUAGES, HEALTH, ENGINEERING, etc.) */
  private formatDomainJobs(domainKey: string, lang: 'fr' | 'ar'): string {
    const jobs = DOMAIN_JOBS[domainKey];
    if (!jobs || jobs.length === 0) {
      return lang === 'ar'
        ? '❌ لا توجد خدمات مطابقة لهذا المجال حالياً.'
        : '❌ Aucun métier trouvé pour ce domaine actuellement.';
    }

    const blocks: string[] = [];
    const domainName = domainLabel(domainKey, lang);
    if (lang === 'ar') {
      blocks.push(`💼 **خدمات ${domainName}**\n`);
    } else {
      blocks.push(`💼 **Métiers ${domainName}**\n`);
    }

    const jobBlocks = jobs.slice(0, 4).map(j => {
      if (lang === 'ar') {
        return `🛡️ **${j.title}**\n📌 ${j.description || ''}\n📈 **الطلب:** ${j.demand || 'Medium'}\n⚠️ **البطالة:** ${j.unemployment_rate !== undefined ? `${j.unemployment_rate}%` : '?'}\n🛠 **المهارات:** ${j.skills?.slice(0, 5).join(', ') || ''}`;
      }
      return `🛡️ **${j.title}**\n📌 ${j.description || ''}\n📈 **Demande:** ${j.demand || 'Medium'}\n⚠️ **Chômage:** ${j.unemployment_rate !== undefined ? `${j.unemployment_rate}%` : '?'}\n🛠 **Compétences:** ${j.skills?.slice(0, 5).join(', ') || ''}`;
    });
    blocks.push(jobBlocks.join('\n\n---\n\n'));

    return blocks.join('\n');
  }

  // ============================================================
  // 🛠 SKILLS GENERATOR
  // ============================================================
  private readonly frontendSkills = {
    tech: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'Git/GitHub'],
    tools: ['VSCode', 'Figma basics', 'Chrome DevTools'],
    projects: ['Landing page', 'Dashboard', 'Portfolio'],
    nextStep: 'freelance or internship',
  };

  private readonly backendSkills = {
    tech: ['Node.js', 'Python', 'SQL', 'APIs', 'Databases', 'Docker'],
    tools: ['Postman', 'VSCode', 'Terminal'],
    projects: ['REST API', 'CRUD app', 'Auth system'],
    nextStep: 'backend internship',
  };

  private detectSkillsSubDomain(message: string): string | null {
    const m = message.toLowerCase();
    if (/(frontend|front-end|front|react|ui|ux|html|css)/i.test(m)) return 'frontend';
    if (/(backend|back-end|back|node|express|api|sql)/i.test(m)) return 'backend';
    if (/(cyber|sécurité|security|hack|pentest)/i.test(m)) return 'cyber';
    if (/(data|machine learning|ai|analyse)/i.test(m)) return 'data';
    if (/(mobile|ios|android|app)/i.test(m)) return 'mobile';
    if (/(réseau|reseau|network|admin sys)/i.test(m)) return 'reseau';
    return null;
  }

  private skillsGenerator(message: string, lang: 'fr' | 'ar', effectiveDomain?: string | null): string {
    const domain = this.getEffectiveDomain(message, effectiveDomain);
    const subDomain = this.detectSkillsSubDomain(message);
    if (subDomain && domain === 'tech') {
      if (subDomain === 'frontend') {
        return this.formatSkillsResponse('Frontend Developer', this.frontendSkills, lang);
      }
      if (subDomain === 'backend') {
        return this.formatSkillsResponse('Backend Developer', this.backendSkills, lang);
      }
    }

    const interest = this.resolveEffectiveInterest(message);
    if (!interest && !domain) {
      return lang === 'ar'
        ? '❌ ما عنديش معلومات كافية. حدد المجال اللي تحب.'
        : '❌ Pas assez d\'informations. Précise le domaine.';
    }

    const fullField = this.getFieldByInterest(interest || domain || '');
    if (!fullField) {
      return lang === 'ar'
        ? '❌ معلومات المهارات غير متوفرة لهذا المجال حالياً.'
        : '❌ Compétences non disponibles pour ce domaine.';
    }

    const techSkills = fullField.required_skills?.technical_skills?.slice(0, 6) || [];
    const softSkills = fullField.required_skills?.soft_skills?.slice(0, 5) || [];
    const tools = fullField.required_skills?.tools_and_technologies?.slice(0, 5) || [];
    const fieldName = fullField.field;

    const learningOrder = this.buildLearningOrder(interest || domain || '', lang);

    const result: string[] = [];
    if (lang === 'ar') {
      result.push(`🛠 **مهارات ${fieldName}**\n`);
      result.push(`**🔧 تقنية:**\n${techSkills.map(s => `• ${s}`).join('\n')}\n`);
      result.push(`**🤝 لطيفة:**\n${softSkills.map(s => `• ${s}`).join('\n')}\n`);
      result.push(`**⚙️ تكنولوجيات:**\n${tools.map(s => `• ${s}`).join('\n')}\n`);
      if (learningOrder) result.push(`**📚 ترتيب التعلم:**\n${learningOrder}`);
    } else {
      result.push(`🛠 **Compétences ${fieldName}**\n`);
      result.push(`**🔧 Techniques:**\n${techSkills.map(s => `• ${s}`).join('\n')}\n`);
      result.push(`**🤝 Humaines:**\n${softSkills.map(s => `• ${s}`).join('\n')}\n`);
      result.push(`**⚙️ Technologies:**\n${tools.map(s => `• ${s}`).join('\n')}\n`);
      if (learningOrder) result.push(`**📚 Ordre d\'apprentissage:**\n${learningOrder}`);
    }

    return result.join('\n');
  }

  private formatSkillsResponse(title: string, skills: { tech: string[]; tools: string[]; projects: string[]; nextStep: string }, lang: 'fr' | 'ar'): string {
    if (lang === 'ar') {
      return `🎨 **${title}**\n\n` +
        `🛠 **لازم تتعلم:**\n${skills.tech.map(s => `• ${s}`).join('\n')}\n\n` +
        `⚙️ **أدوات:**\n${skills.tools.map(s => `• ${s}`).join('\n')}\n\n` +
        `📁 **مشاريع:**\n${skills.projects.map(s => `• ${s}`).join('\n')}\n\n` +
        `🚀 **الخطوة الجاية:**\n${skills.nextStep}`;
    }
    return `🎨 **${title}**\n\n` +
      `🛠 **Skills:**\n${skills.tech.map(s => `• ${s}`).join('\n')}\n\n` +
      `⚙️ **Tools:**\n${skills.tools.map(s => `• ${s}`).join('\n')}\n\n` +
      `📁 **Projects:**\n${skills.projects.map(s => `• ${s}`).join('\n')}\n\n` +
      `🚀 **Next step:**\n${skills.nextStep}`;
  }

  private buildLearningOrder(interestOrDomain: string, lang: 'fr' | 'ar'): string {
    const interest = domainToInterest(interestOrDomain) || interestOrDomain;
    const orders: Record<string, string[]> = {
      tech: ['1. أساسيات البرمجة', '2. تطوير ويب (HTML, CSS, JS)', '3. إطار عمل (React, Angular)', '4. Backend + قاعدة بيانات', '5. مشاريع شخصية'],
      sport: ['1. علوم الرياضة', '2. تشريح وفسيولوجيا', '3. تدريب عملي', '4. شهادة تخصص', '5. تطبيق مع أندية'],
      health: ['1. علوم أساسية (بيولوجيا، كيمياء)', '2. دراسة طبية', '3. تخصص', '4. تربص عملي', '5. ممارسة'],
      business: ['1. أساسيات الإدارة', '2. محاسبة / تمويل', '3. تسويق', '4. خبرة ميدانية', '5. تخصص (MBA...)'],
      art: ['1. أساسيات التصميم', '2. أدوات (Photoshop, Figma)', '3. مشاريع', '4. معرض أعمال (Portfolio)', '5. تخصص'],
      languages: ['1. إتقان لغة أجنبية', '2. دراسة لغوية معمقة', '3. تخصص (ترجمة / صحافة / تدريس)', '4. تطبيق عملي', '5. شهادة مهنية'],
      engineering: ['1. أساسيات الرياضيات والفيزياء', '2. تخصص هندسي', '3. مشاريع تطبيقية', '4. تربص ميداني', '5. شهادة مهنية'],
    };
    const order = orders[interest];
    if (!order) return '';
    if (lang !== 'ar') {
      const en: Record<string, string[]> = {
        tech: ['1. Programming basics', '2. Web dev (HTML, CSS, JS)', '3. Framework (React, Angular)', '4. Backend + DB', '5. Personal projects'],
        sport: ['1. Sport science', '2. Anatomy/physiology', '3. Practical training', '4. Certification', '5. Apply with clubs'],
        health: ['1. Basic sciences', '2. Medical study', '3. Specialization', '4. Internship', '5. Practice'],
        business: ['1. Management basics', '2. Accounting/finance', '3. Marketing', '4. Field experience', '5. Specialization (MBA...)'],
        art: ['1. Design basics', '2. Tools (Photoshop, Figma)', '3. Projects', '4. Portfolio', '5. Specialization'],
        languages: ['1. Master a foreign language', '2. Advanced language study', '3. Specialize (translation/journalism/teaching)', '4. Practical application', '5. Professional certification'],
        engineering: ['1. Math and physics basics', '2. Engineering specialization', '3. Applied projects', '4. Field internship', '5. Professional certification'],
      };
      return (en[interest] || []).join('\n');
    }
    return order.join('\n');
  }

  // ============================================================
  // PART 3 — FIX comparisonGenerator()
  // For EACH entity: search separately, compute independently
  // NEVER reuse first entity values
  // ============================================================
  private comparisonGenerator(message: string, lang: 'fr' | 'ar', effectiveDomain?: string | null): string {
    const score = this.sessionStudentData.score;

    // PART 2 — Use clean comparison entities
    const items = this.extractComparisonEntities(message);
    const item1 = items[0] || 'option A';
    const item2 = items[1] || 'option B';

    // INDEPENDENT queries — each entity gets its OWN results
    // No shared interest override — detect each entity's domain separately
    const e1Domain = detectDomain(item1);
    const e2Domain = detectDomain(item2);

    // Map domain to interest for RAG queries (but bypass session interest)
    const e1Interest = domainToInterest(e1Domain);
    const e2Interest = domainToInterest(e2Domain);

    // Build entity-specific messages that include domain keywords
    // This prevents interest override in RAG by using entity-specific interest
    const recs1 = this.ragService.getRecommendations({
      message: item1,
      bacType: this.sessionStudentData.bacType,
      score,
      interest: e1Interest,  // Entity-specific interest, NOT session interest
      limit: 3,
    });
    const recs2 = this.ragService.getRecommendations({
      message: item2,
      bacType: this.sessionStudentData.bacType,
      score,
      interest: e2Interest,  // Entity-specific interest, NOT session interest
      limit: 3,
    });

    // Apply domain enforcement for each entity
    let prog1Entities = (recs1.programs || []);
    if (e1Domain) {
      prog1Entities = this.enforceDomainPrograms(prog1Entities, e1Domain);
    }
    let prog2Entities = (recs2.programs || []);
    if (e2Domain) {
      prog2Entities = this.enforceDomainPrograms(prog2Entities, e2Domain);
    }

    const field1 = recs1.field;
    const field2 = recs2.field;
    // Use first matching program from each entity's independent results
    const prog1 = (prog1Entities.filter(p => p.domain !== 'other')[0] || prog1Entities[0]);
    const prog2 = (prog2Entities.filter(p => p.domain !== 'other')[0] || prog2Entities[0]);

    const score1 = prog1?.matchingBac?.lastScore;
    const score2 = prog2?.matchingBac?.lastScore;

    const blocks: string[] = [];

    if (lang === 'ar') {
      blocks.push(`⚖️ **مقارنة بين ${item1} و ${item2}**\n`);

      blocks.push(`**1️⃣ ${item1}**`);
      if (score1 !== undefined) blocks.push(`📊 **آخر score:** ${score1}`);
      if (prog1?.name) blocks.push(`🏫 ${prog1.name}@${prog1.institution}`);
      if (field1?.future_outlook) blocks.push(`📈 **المستقبل:** ${field1.future_outlook}`);
      if (field1?.demand_in_tunisia) blocks.push(`📈 **الطلب:** ${field1.demand_in_tunisia}`);
      if (field1?.unemployment_risk) blocks.push(`⚠️ **البطالة:** ${field1.unemployment_risk}`);

      blocks.push(`\n**2️⃣ ${item2}**`);
      if (score2 !== undefined) blocks.push(`📊 **آخر score:** ${score2}`);
      if (prog2?.name) blocks.push(`🏫 ${prog2.name}@${prog2.institution}`);
      if (field2?.future_outlook) blocks.push(`📈 **المستقبل:** ${field2.future_outlook}`);
      if (field2?.demand_in_tunisia) blocks.push(`📈 **الطلب:** ${field2.demand_in_tunisia}`);
      if (field2?.unemployment_risk) blocks.push(`⚠️ **البطالة:** ${field2.unemployment_risk}`);

      // INDEPENDENT comparison logic:
      if (score !== undefined && score1 != null && score2 != null) {
        const gap1 = score - score1;
        const gap2 = score - score2;
        if (gap1 >= 0 && gap2 >= 0) {
          blocks.push(`\n🎯 **الخلاصة:** بمعدل ${score}، التخصصين متاحين لك.`);
        } else if (gap1 >= 0 && gap2 < 0) {
          blocks.push(`\n🎯 **الخلاصة:** بمعدل ${score}، ${item1} أضمن من ${item2}.`);
        } else if (gap2 >= 0 && gap1 < 0) {
          blocks.push(`\n🎯 **الخلاصة:** بمعدل ${score}، ${item2} أضمن من ${item1}.`);
        } else {
          const closer = gap1 > gap2 ? item1 : item2;
          blocks.push(`\n🎯 **الخلاصة:** ${closer} أقرب لمعدلك (فرق ${Math.abs(Math.min(gap1, gap2))} نقطة).`);
        }
      }
    } else {
      blocks.push(`⚖️ **Comparaison: ${item1} vs ${item2}**\n`);

      blocks.push(`**1️⃣ ${item1}**`);
      if (score1 !== undefined) blocks.push(`📊 **Dernier score:** ${score1}`);
      if (prog1?.name) blocks.push(`🏫 ${prog1.name}@${prog1.institution}`);
      if (field1?.future_outlook) blocks.push(`📈 **Avenir:** ${field1.future_outlook}`);
      if (field1?.demand_in_tunisia) blocks.push(`📈 **Demande:** ${field1.demand_in_tunisia}`);
      if (field1?.unemployment_risk) blocks.push(`⚠️ **Chômage:** ${field1.unemployment_risk}`);

      blocks.push(`\n**2️⃣ ${item2}**`);
      if (score2 !== undefined) blocks.push(`📊 **Dernier score:** ${score2}`);
      if (prog2?.name) blocks.push(`🏫 ${prog2.name}@${prog2.institution}`);
      if (field2?.future_outlook) blocks.push(`📈 **Avenir:** ${field2.future_outlook}`);
      if (field2?.demand_in_tunisia) blocks.push(`📈 **Demande:** ${field2.demand_in_tunisia}`);
      if (field2?.unemployment_risk) blocks.push(`⚠️ **Chômage:** ${field2.unemployment_risk}`);

      if (score != null && score1 != null && score2 != null) {
        const gap1 = score - score1;
        const gap2 = score - score2;
        if (gap1 >= 0 && gap2 >= 0) {
          blocks.push(`\n🎯 **Conclusion:** Avec ${score}, les deux sont accessibles.`);
        } else if (gap1 >= 0 && gap2 < 0) {
          blocks.push(`\n🎯 **Conclusion:** Avec ${score}, ${item1} est plus sûr que ${item2}.`);
        } else if (gap2 >= 0 && gap1 < 0) {
          blocks.push(`\n🎯 **Conclusion:** Avec ${score}, ${item2} est plus sûr que ${item1}.`);
        } else {
          const closer = gap1 > gap2 ? item1 : item2;
          blocks.push(`\n🎯 **Conclusion:** ${closer} est plus proche de ton score (écart ${Math.abs(Math.min(gap1, gap2))} pts).`);
        }
      }
    }

    return blocks.join('\n');
  }

  // ============================================================
  // PART 2 — extractComparisonEntities()
  // Clean the message FIRST, then split ONLY on separators
  // NEVER keep "(mon score", "?", extra fragments
  // ============================================================
  private extractComparisonEntities(message: string): string[] {
    // Step 1: Clean the message thoroughly
    const cleaned = cleanMessage(message);
    if (!cleaned) return ['option 1', 'option 2'];

    // Step 2: Remove comparison verbs
    let m = cleaned;
    const comparisonVerbs = [
      'قارن', 'قارن بين', 'مقارنة', 'comparer', 'compare',
      'comparaison', 'فرق بين', 'difference', 'différence',
      'خير بين', 'أفضل', 'افضل', 'الفرق',
    ];
    for (const verb of comparisonVerbs) {
      m = m.replace(verb, '');
    }

    // Step 3: Split ONLY using separators
    const separators = /(?:ou|ou bien|vs|versus|\/|ولا|walou|أو|او|or|\|)/i;
    let parts = m.split(separators)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Step 4: Remove stop words
    const stopWords = [
      'entre', 'between', 'et', 'and', 'و', 'مع', 'بين',
      'comparer', 'compare', 'مقارنة', 'قارن',
      'الفرق', 'difference', 'فرق',
    ];
    parts = parts.filter(p => !stopWords.includes(p));

    // Step 5: If we still don't have 2 items, try to find known entities
    if (parts.length < 2) {
      const knownItems = [
        'medecine', 'médecine', 'pharmacie', 'infirmier',
        'informatique', 'web', 'data', 'dev', 'reseaux', 'réseaux', 'cyber',
        'sport', 'kine', 'kiné', 'coaching',
        'business', 'commerce', 'gestion', 'finance', 'marketing',
        'art', 'design', 'architecture',
        'droit', 'avocat', 'notaire',
        'lettres', 'traduction', 'journalisme',
        'genie civil', 'génie civil', 'mecanique', 'mécanique',
        'industriel', 'electrique', 'électrique',
        'math', 'physique', 'chimie', 'biologie',
        'frontend', 'backend', 'mobile',
      ];
      const found = knownItems.filter(i => {
        return cleaned.includes(i);
      });
      if (found.length >= 2) return found.slice(0, 2);
      if (found.length === 1) return [found[0], parts[0] || 'option 2'];
    }

    return parts.length >= 2 ? parts.slice(0, 2) : ['option 1', 'option 2'];
  }

  // ============================================================
  // 🗺️ ROADMAP GENERATOR
  // ============================================================
  private roadmapGenerator(message: string, lang: 'fr' | 'ar', effectiveDomain?: string | null): string {
    const domain = this.getEffectiveDomain(message, effectiveDomain);
    const interest = domainToInterest(domain) || domain;

    if (!interest) {
      return lang === 'ar'
        ? '🗺️ **الroadmap:** حدد المجال اللي تحب (مثلاً: "roadmap cyber")'
        : '🗺️ **Roadmap:** Précise le domaine (ex: "roadmap dev web")';
    }

    const fullField = this.getFieldByInterest(interest);
    const fieldName = fullField?.field || domainLabel(effectiveDomain || null, lang) || interest;

    if (lang === 'ar') {
      return `🗺️ **Roadmap ${fieldName}**\n\n`
        + `**١. الأساسيات 📚**\n${this.buildLearningOrder(interest, lang)}\n\n`
        + `**٢. المشاريع 🔨**\n• ابنِ ٢-٣ مشاريع شخصية\n• انشرها على GitHub / منصات\n\n`
        + `**٣. الشهادات 📜**\n• شهادات مهنية معترف بها\n• منصات: Coursera, Udemy, Google\n\n`
        + `**٤. التربص 🏢**\n• ابحث عن تربص في شركة\n• تطبيق عملي للمهارات\n\n`
        + `**٥. التوظيف 🚀**\n• صمم CV محترف\n• قدم على LinkedIn / مواقع توظيف`;
    }

    return `🗺️ **Roadmap ${fieldName}**\n\n`
      + `**1. Basics 📚**\n${this.buildLearningOrder(interest, lang)}\n\n`
      + `**2. Projects 🔨**\n• Build 2-3 personal projects\n• Publish on GitHub/portfolios\n\n`
      + `**3. Certifications 📜**\n• Get recognized professional certs\n• Platforms: Coursera, Udemy, Google\n\n`
      + `**4. Internship 🏢**\n• Find an internship/entry position\n• Apply skills in real projects\n\n`
      + `**5. Job Search 🚀**\n• Build a strong CV\n• Apply on LinkedIn / job platforms`;
  }

  // ============================================================
  // 💰 SALARY GENERATOR
  // ============================================================
  private salaryGenerator(message: string, lang: 'fr' | 'ar', effectiveDomain?: string | null): string {
    const domain = this.getEffectiveDomain(message, effectiveDomain);

    const jobs = this.ragService.getJobsByField(domain || null);
    
    if (jobs.length === 0) {
      return lang === 'ar'
        ? '💰 ما عنديش معلومات رواتب لهذا المجال.'
        : '💰 Pas d\'infos salaires pour ce domaine.';
    }

    const blocks: string[] = [];
    if (lang === 'ar') blocks.push('💰 **الرواتب في هذا المجال:**\n');
    else blocks.push('💰 **Salaires dans ce domaine:**\n');

    jobs.slice(0, 3).forEach(j => {
      const salary = j.salary_level
        ? this.salaryLabel(j.salary_level, lang)
        : lang === 'ar' ? '800 - 1500 دينار' : '800 - 1500 DT';
      const senior = j.senior_salary || (lang === 'ar' ? '2000+ دينار' : '2000+ DT');
      if (lang === 'ar') {
        blocks.push(`**${j.title}**\n• مبتدئ: ${salary}\n• خبير: ${senior}\n`);
      } else {
        blocks.push(`**${j.title}**\n• Junior: ${salary}\n• Senior: ${senior}\n`);
      }
    });

    return blocks.join('\n');
  }

  private salaryLabel(level: string, lang: 'fr' | 'ar'): string {
    const labels: Record<string, Record<string, string>> = {
      Low: { ar: '800 - 1200 دينار', fr: '800 - 1200 DT' },
      Medium: { ar: '1500 - 2500 دينار', fr: '1500 - 2500 DT' },
      High: { ar: '2500 - 4000 دينار', fr: '2500 - 4000 DT' },
    };
    return labels[level]?.[lang] || level;
  }

  // ============================================================
  // 🧠 DOMAIN-AWARE FOLLOW-UP
  // ============================================================
  private buildDomainFollowUp(domainOrInterest: string | null | undefined, lang: 'fr' | 'ar'): string {
    if (!domainOrInterest) {
      return lang === 'ar' ? 'شنو المجال اللي تحب؟' : 'Quel domaine veux-tu ?';
    }

    const memory = this.getMemory();
    const asked = memory.lastQuestionsAsked || [];

    // Map interest back to domain key for followups
    const interestToDomain: Record<string, string> = {
      tech: 'IT',
      sport: 'SPORT',
      health: 'HEALTH',
      business: 'BUSINESS',
      art: 'ART',
      languages: 'LANGUAGES',
      engineering: 'ENGINEERING',
    };
    
    const domainKey = interestToDomain[domainOrInterest] || domainOrInterest.toUpperCase();
    const followups = DOMAIN_FOLLOWUPS[domainKey] || {
      ar: ['تحب نشوفلك برامج ولا خدمات؟'],
      fr: ['Tu veux voir des programmes ou des métiers ?'],
    };

    const questions = followups[lang === 'ar' ? 'ar' : 'fr'];
    const fresh = questions.filter(q => !asked.includes(q));
    const chosen = fresh.length > 0 ? fresh[Math.floor(Math.random() * fresh.length)] : questions[0];
    this.trackAskedQuestion(chosen);

    return `👉 ${chosen}`;
  }

  // ============================================================
  // 🧠 MEMORY HELPERS
  // ============================================================

  private trackAskedQuestion(question: string): void {
    const e = this.sessionStudentData.lastQuestionsAsked || [];
    this.sessionStudentData.lastQuestionsAsked = [...e, question].slice(-6);
  }

  private getMemory(): AiMemory {
    return {
      interest: this.sessionStudentData.interest,
      difficulty: this.sessionStudentData.difficulty,
      preferredDomain: this.sessionStudentData.preferredDomain,
      refinedDomain: this.sessionStudentData.refinedDomain,
      journeyStep: this.getJourneyStep(),
      rejectedDomains: this.sessionStudentData.rejectedDomains || [],
      lastQuestionsAsked: this.sessionStudentData.lastQuestionsAsked || [],
    };
  }

  private getJourneyStep(): AiMemory['journeyStep'] {
    if (!this.sessionStudentData.interest && !this.sessionStudentData.preferredDomain) return 'identify_interest';
    if (!this.sessionStudentData.refinedDomain) return 'refine_domain';
    if (!this.sessionStudentData.difficulty) return 'suggest_options';
    return 'give_decision';
  }

  private resolveEffectiveInterest(message: string): string | undefined {
    const rejected = this.getMemory().rejectedDomains || [];
    const explicitInterest = this.detectDynamicIntent(message);
    if (explicitInterest) return rejected.includes(explicitInterest) ? undefined : explicitInterest;
    const memInterest = this.sessionStudentData.interest || this.sessionStudentData.preferredDomain;
    return (memInterest && !rejected.includes(memInterest)) ? memInterest : undefined;
  }

  private detectDynamicIntent(message: string): string | null {
    if (!message) return null;
    const field = detectField(message);
    if (field) return field === 'it' ? 'tech' : field;

    const m = normalizeText(message);
    const h = (k: string[]) => k.some(kw => m.includes(normalizeText(kw)));
    if (h(['informatique', 'informatia', 'dev', 'développement', 'programmation', 'software', 'réseau', 'reseau', 'cyber', 'data', 'ia', 'ai', 'it', 'tech', 'coding', 'برمجة', 'تكنولوجيا', 'ديف', 'اعلامية', 'معلوماتية', 'frontend', 'backend', 'fullstack', 'web', 'mobile'])) return 'tech';
    if (h(['sport', 'kiné', 'kine', 'football', 'basket', 'tennis', 'رياضة', 'سبور', 'تدريب'])) return 'sport';
    if (h(['médecine', 'medecine', 'santé', 'sante', 'pharmacie', 'infirmier', 'طب', 'صحة', 'تمريض'])) return 'health';
    if (h(['business', 'gestion', 'commerce', 'finance', 'marketing', 'économie', 'economie', 'comptabilité', 'comptabilite', 'تجارة', 'أعمال', 'محاسبة'])) return 'business';
    if (h(['art', 'design', 'architecture', 'graphisme', 'mode', 'فن', 'تصميم', 'عمارة'])) return 'art';
    return null;
  }

  private isGreeting(message: string): boolean {
    return /^(salut|bonjour|hello|hi|hey|صباح|مساء|سلام|bienvenue|اهلا)/i.test(message.toLowerCase().trim());
  }

  // ============================================================
  // 🧠 LEGACY HELPERS
  // ============================================================

  private extractStudentDataFromMessage(message: string): Partial<StudentData> {
    const r: Partial<StudentData> = {};
    const m = message.toLowerCase();
    const sc = m.match(/(?:score|note|moyenne|معدل)\s*[:\\-]*\s*(\d+)/i);
    if (sc) { const n = Number(sc[1]); if (n > 0 && n < 1000) r.score = n; }
    const bc = m.match(/\b(?:bac|baccalaureat)\s*[:\\-]*\s*([\w\-]+)/i);
    if (bc) r.bacType = bc[1].trim();
    return r;
  }

  private mergeSessionStudentData(incoming?: Partial<StudentData>): void {
    if (!incoming) return;
    if (typeof incoming.score === 'number' && Number.isFinite(incoming.score)) this.sessionStudentData.score = incoming.score;
    if (incoming.bacType?.trim()) this.sessionStudentData.bacType = incoming.bacType.trim();
    if (incoming.interest?.trim()) this.sessionStudentData.interest = incoming.interest.trim();
    if (incoming.difficulty) this.sessionStudentData.difficulty = incoming.difficulty;
    if (incoming.refinedDomain?.trim()) this.sessionStudentData.refinedDomain = incoming.refinedDomain.trim();
    if (incoming.journeyStep) this.sessionStudentData.journeyStep = incoming.journeyStep;
    if (incoming.preferredDomain?.trim()) { this.sessionStudentData.preferredDomain = incoming.preferredDomain.trim(); this.sessionStudentData.interest = incoming.preferredDomain.trim(); }
    if (incoming.rejectedDomains?.length) { const es = new Set(this.sessionStudentData.rejectedDomains || []); incoming.rejectedDomains.forEach(d => { if (d.trim()) es.add(d.trim()); }); this.sessionStudentData.rejectedDomains = Array.from(es); }
    if (incoming.name?.trim()) this.sessionStudentData.name = incoming.name.trim();
    if (incoming.selectedFiliere?.trim()) this.sessionStudentData.selectedFiliere = incoming.selectedFiliere.trim();
    if (incoming.language) this.sessionStudentData.language = incoming.language;
  }

  private syncMemoryToSessionData(): void {
    const m = this.conversationMemory;
    if (m.interest && !this.sessionStudentData.interest) { this.sessionStudentData.interest = m.interest; this.sessionStudentData.preferredDomain = m.interest; }
    if ((m.difficulty === 'easy' || m.difficulty === 'challenge') && !this.sessionStudentData.difficulty) this.sessionStudentData.difficulty = m.difficulty;
    if (m.preferredTrack && !this.sessionStudentData.refinedDomain) this.sessionStudentData.refinedDomain = m.preferredTrack;
    if (m.rejectedTracks.length > 0) { const cr = this.sessionStudentData.rejectedDomains || []; const nr = m.rejectedTracks.filter(r => !cr.includes(r)); if (nr.length > 0) this.sessionStudentData.rejectedDomains = [...cr, ...nr]; }
  }

  resetMemory(): void {
    this.conversationMemory = this.memoryService.initializeMemory();
    this.sessionStudentData = {};
  }

  getConversationMemory(): ConversationMemory {
    return { ...this.conversationMemory };
  }
}
