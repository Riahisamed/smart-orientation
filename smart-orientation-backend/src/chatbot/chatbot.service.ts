import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { OllamaConfigService } from '../common/services/ollama-config.service';
import { AiService } from './ai.service';
import { IntentDetectorService } from './intent-detector.service';
import { SafetyRulesService } from './safety-rules.service';
import fieldsJson from '../../lib/data/fields.json';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type StudentData = {
  name?: string;
  bacType?: string;
  bacAverage?: number;
  FG?: number;
  score?: number;
  selectedFiliere?: string;
  language?: 'fr' | 'ar';
};

type JobData = {
  title: string;
  skills: string[];
  unemployment_rate?: number;
};

type DomainData = {
  domain: string;
  keywords: string[];
  jobs: JobData[];
};

type GuideBacType = {
  type: string;
  capacity?: number;
  lastScore?: number | null;
};

type GuideProgram = {
  code: string;
  name?: string;
  program: string;
  institution: string;
  domain?: string;
  formula?: string;
  bacTypes?: GuideBacType[];
};

type RankedJob = JobData & {
  score: number;
  reason?: string;
};

type RankedGuideProgram = GuideProgram & {
  score: number;
  matchingBac?: GuideBacType;
};

type RankedDomain = {
  domain: DomainData;
  score: number;
  matchedTerms: string[];
};

type FilteredRagData = {
  domain?: RankedDomain;
  field?: FieldData;
  jobs: RankedJob[];
  programs: RankedGuideProgram[];
  difficulty?: 'safe' | 'risky' | 'hard';
  intent?: QueryIntent;
};

type QueryIntent =
  | 'best_chances'
  | 'location'
  | 'field_explanation'
  | 'requirements'
  | 'best_choice'
  | 'career'
  | 'general';

type FieldData = {
  field: string;
  programs: string[];
  possible_jobs: string[];
  required_skills?: {
    technical_skills?: string[];
    soft_skills?: string[];
    tools_and_technologies?: string[];
  };
  demand_in_tunisia?: string;
  future_outlook?: string;
  unemployment_risk?: string;
  recommended?: boolean;
  reason?: string;
};

type RankingData = {
  rank: number;
  field: string;
};

type FieldsJsonData = {
  fields: FieldData[];
  ranking: RankingData[];
};

function detectLanguage(message: string): 'fr' | 'ar' {
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(message)) {
    return 'ar';
  }
  return 'fr';
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private jobsData: DomainData[] = [];
  private guideData: GuideProgram[] = [];
  private fieldsData = (fieldsJson as FieldsJsonData).fields;
  private ranking = (fieldsJson as FieldsJsonData).ranking;

  private readonly domainAliases: Record<string, string[]> = {
    informatique: [
      'dev',
      'developpement',
      'developpeur',
      'developer',
      'coding',
      'code',
      'programming',
      'programmation',
      'informatique',
      'info',
      'software',
      'full stack',
      'frontend',
      'backend',
      'web',
      'mobile',
      'data',
      'ia',
      'ai',
      'cyber',
      'reseau',
      'systeme',
      'cloud',
      'database',
      'base de donnees',
      'برمجة',
      'مطور',
      'اعلامية',
      'إعلامية',
    ],
    gestion: [
      'gestion',
      'comptabilite',
      'finance',
      'audit',
      'rh',
      'business',
      'management',
      'economie',
      'تصرف',
      'محاسبة',
      'مالية',
      'اقتصاد',
    ],
    ingenierie: [
      'ingenieur',
      'ingenierie',
      'mecanique',
      'genie civil',
      'electrique',
      'production',
      'chimie',
      'هندسة',
      'مهندس',
      'ميكانيك',
      'كهرباء',
    ],
    commerce: [
      'commerce',
      'marketing',
      'vente',
      'communication',
      'publicite',
      'brand',
      'تجارة',
      'تسويق',
      'اتصال',
      'بيع',
    ],
    sante: [
      'sante',
      'medecin',
      'medecine',
      'medicine',
      'health',
      'infirmier',
      'pharmacie',
      'biologie',
      'medical',
      'طب',
      'صيدلة',
      'تمريض',
      'صحة',
      'بيولوجيا',
    ],
    education: [
      'education',
      'enseignement',
      'professeur',
      'formation',
      'pedagogie',
      'تعليم',
      'تربية',
      'استاذ',
    ],
    tourisme: [
      'tourisme',
      'hotel',
      'restauration',
      'guide',
      'accueil',
      'سياحة',
      'فندقة',
      'مطاعم',
    ],
    droit: [
      'droit',
      'justice',
      'avocat',
      'notaire',
      'administration',
      'legal',
      'قانون',
      'حقوق',
      'محاماة',
      'ادارة',
    ],
    energie: [
      'energie',
      'electricite',
      'environnement',
      'ecologie',
      'renouvelable',
      'eau',
      'طاقة',
      'بيئة',
      'مياه',
    ],
    logistique: [
      'logistique',
      'transport',
      'supply chain',
      'distribution',
      'douane',
      'import',
      'export',
      'نقل',
      'لوجستيك',
      'توريد',
    ],
    arts: [
      'art',
      'design',
      'graphique',
      'architecture',
      'creation',
      'mode',
      'ux',
      'ui',
      'فنون',
      'تصميم',
      'معمار',
    ],
    languages: [
      'langue',
      'langues',
      'francais',
      'anglais',
      'traduction',
      'translator',
      'interpreter',
      'philosophie',
      'histoire',
      'lettres',
      'آداب',
      'لغات',
      'ترجمة',
      'فلسفة',
      'تاريخ',
    ],
  };

  private readonly guideHints: Record<string, string[]> = {
    informatique: [
      'informatique',
      'info',
      'اعلامية',
      'إعلامية',
      'تكنولوجيا',
      'اتصالات',
      'شبكات',
      'برمجيات',
    ],
    gestion: ['gestion', 'comptabilite', 'تصرف', 'اقتصاد', 'محاسبة', 'مالية'],
    ingenierie: [
      'ingenierie',
      'genie',
      'هندسة',
      'مهندس',
      'تقنيات',
      'ميكانيك',
      'كهرباء',
    ],
    commerce: ['commerce', 'marketing', 'تجارة', 'تسويق', 'اتصال'],
    sante: ['sante', 'pharmacie', 'طب', 'صيدلة', 'صحة', 'تمريض', 'بيولوجيا'],
    education: ['education', 'enseignement', 'تربية', 'تعليم', 'اساتذة'],
    tourisme: ['tourisme', 'hotel', 'سياحة', 'فندقة'],
    droit: ['droit', 'administration', 'حقوق', 'قانون', 'ادارة'],
    energie: ['energie', 'environnement', 'طاقة', 'بيئة', 'مياه'],
    logistique: ['logistique', 'transport', 'نقل', 'لوجستيك'],
    arts: ['art', 'design', 'فنون', 'تصميم', 'معمار'],
    languages: [
      'langues',
      'language',
      'francais',
      'anglais',
      'traduction',
      'translation',
      'philosophie',
      'histoire',
      'آداب',
      'لغات',
      'ترجمة',
    ],
  };

  private readonly bacTypeAliases: Record<string, string[]> = {
    math: [
      'math',
      'maths',
      'mathematique',
      'mathematiques',
      'رياضيات',
      'Ų±ŁŲ§Ų¶ŁŲ§ŲŖ',
      'ļŗ­ļ»³ļŗˇļŗæļ»´ļŗˇļŗ•',
    ],
    svt: [
      'svt',
      'science',
      'sciences',
      'sc',
      'علوم تجريبية',
      'Ų¹Ł„ŁŁ… ŲŖŲ¬Ų±ŁŲØŁŲ©',
      'ļ»‹ļ» ļ»®ļ» ļŗ—ļŗ ļŗ®ļ»³ļŗ’ļ»´ļŗ”',
    ],
    eco: [
      'eco',
      'economie',
      'economiques',
      'gestion',
      'اقتصاد وتصرف',
      'Ų§Ł‚ŲŖŲµŲ§ŲÆ ŁŲŖŲµŲ±Ł',
      'ļŗ‡ļ»—ļŗļŗ¼ļŗˇļŗ© ļ»­ļŗ—ļŗ¼ļŗ®ļ»‘',
    ],
    tech: [
      'tech',
      'technique',
      'techniques',
      'علوم تقنية',
      'Ų¹Ł„ŁŁ… ŲŖŁ‚Ł†ŁŲ©',
      'ļŗ¨ļ»ļ»ļ» ļ»®ļ» ļŗ¨ļ»ļŗļ»ļ»Øļ»´ļŗ”',
    ],
    info: [
      'info',
      'informatique',
      'علوم الاعلامية',
      'علوم الإعلامية',
      'Ų¹Ł„ŁŁ… Ų§Ł„ŲŲ¹Ł„Ų§Ł…ŁŲ©',
      'ļ»‹ļ» ļ»®ļ» ļŗ¨ļ»¹ļ»‹ļ»¼ļ»£ļ»´ļŗ”',
    ],
    lettres: [
      'lettres',
      'lettre',
      'litteraire',
      'adab',
      'آداب',
      'Ų¢ŲÆŲ§ŲØ',
      'ļŗļŗ©ļŗ¨ļŗ‘',
      'ļŗļŗ©ļŗ¨ļŗ¸',
    ],
    sport: [
      'sport',
      'sportif',
      'رياضة',
      'Ų±ŁŲ§Ų¶Ų©',
      'ļŗ¨ļ»ļŗ®ļ»³ļŗˇļŗæļŗ”',
    ],
  };

  constructor(
    private readonly ollamaConfig: OllamaConfigService,
    private readonly aiService: AiService,
    private readonly intentDetector: IntentDetectorService,
    private readonly safetyRules: SafetyRulesService,
  ) {
    this.loadLocalData();
  }

  async processMessage(
    message: string,
    studentData?: StudentData,
    conversationHistory: ConversationMessage[] = [],
  ): Promise<string> {
    const userMessage = message?.trim();
    if (!userMessage) return 'Message non valide';

    // Extract any fresh student info from the incoming message (score, bacType, etc.)
    const parsed = this.extractStudentDataFromMessage(userMessage);

    // Merge parsed values into studentData, parsed values take precedence
    studentData = {
      ...(studentData || {}),
      ...(parsed || {}),
    };

    // Log merged studentData for debugging; keep concise
    this.logger.debug(`studentData (merged): score=${studentData.score} bacType=${studentData.bacType} parsed=${JSON.stringify(parsed)}`);

    const routeIntent = this.intentDetector.detectIntent(userMessage);
    const intent = this.detectQueryIntent(userMessage);
    const effectiveScore =
      studentData?.score ?? studentData?.FG ?? studentData?.bacAverage;
    const lang = studentData?.language || detectLanguage(userMessage);
    const memory = this.getRecentConversationMemory(conversationHistory);

    if (routeIntent === 'general') {
      return this.processGeneralMessage(userMessage, lang, memory);
    }

    if (effectiveScore === undefined && intent === 'best_chances') {
      return lang === 'ar'
        ? 'عطيني score متاعك باش نحسبلك فرص القبول بدقة.'
        : "Donne-moi ton score pour que je puisse calculer tes chances d'admission.";
    }

    studentData = {
      ...(studentData || {}),
      ...(effectiveScore !== undefined ? { score: Number(effectiveScore) } : {}),
    };

    try {
      const ragData = this.filterRagData(userMessage, studentData);

      // ALWAYS proceed with recommendations - no early returns
      // Even if field or programs seem empty, we continue to provide guidance

      const ragContext = this.buildRagContext(
        ragData,
        userMessage,
        studentData,
      );
      const prompt = this.buildFullPrompt(
        userMessage,
        ragContext,
        lang,
        memory,
      );
      const config = this.ollamaConfig.getConfig();

      try {
        const response = await axios.post(
          config.url,
          {
            model: config.model,
            prompt,
            stream: false,
            options: {
              num_predict: Math.max(config.num_predict, 900),
              temperature: config.temperature,
              top_p: 0.9,
            },
          },
          { timeout: config.timeout },
        );

        const aiResponse = response.data?.response?.trim();

        if (this.safetyRules.isSafeResponse(aiResponse)) {
          return aiResponse;
        }
      } catch (aiError) {
        this.logger.warn(
          `AI call failed, using deterministic RAG response: ${
            aiError instanceof Error ? aiError.message : String(aiError)
          }`,
        );
      }

      return this.getDeterministicResponse(
        ragData,
        lang,
        studentData,
        userMessage,
      );
    } catch (error) {
      console.error('Process message error:', error);
      return 'Server error, try again';
    }
  }

  private async processGeneralMessage(
    userMessage: string,
    lang: 'fr' | 'ar',
    memory: ConversationMessage[],
  ): Promise<string> {
    const result = await this.aiService.generate({
      message: userMessage,
      language: lang,
      history: memory,
      systemInstruction:
        'Tu es un assistant IA generaliste utile, precis et concis. Reponds comme ChatGPT pour les questions generales.',
      fallback:
        lang === 'ar'
          ? 'تعذر الاتصال بالمساعد الذكي حاليا. حاول مرة أخرى بعد قليل.'
          : "Je n'arrive pas a joindre l'assistant IA pour le moment. Reessaie dans quelques instants.",
    });

    return result.text;
  }

  private loadLocalData(): void {
    this.jobsData = this.loadJsonFile<DomainData[]>(
      '../../lib/data/jobs.json',
      [],
    );
    this.guideData = this.loadJsonFile<GuideProgram[]>(
      '../../data/guide.json',
      [],
    );

    this.logger.log(
      `Loaded ${this.jobsData.length} job domains from jobs.json`,
    );
    this.logger.log(`Loaded ${this.guideData.length} programs from guide.json`);
  }

  private loadJsonFile<T>(relativePath: string, fallback: T): T {
    const appRelativePath = relativePath.replace(/^(\.\.\/)+/, '');
    const candidatePaths = [
      path.join(__dirname, relativePath),
      path.join(process.cwd(), appRelativePath),
      path.join(process.cwd(), 'dist', appRelativePath),
    ];

    try {
      const filePath = candidatePaths.find((candidate) =>
        fs.existsSync(candidate),
      );

      if (!filePath) {
        throw new Error(`No local data file found for ${relativePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as T;
    } catch (error) {
      this.logger.error(`Failed to load ${relativePath}`, error);
      return fallback;
    }
  }

  private detectFieldFromKeywords(userMessage: string): string | null {
    const msg = this.normalize(userMessage);
    const tokens = this.tokenize(msg);
    const hasAny = (keywords: string[]) =>
      keywords.some((keyword) => this.matchesSearchTerm(msg, keyword, tokens));

    // IT keywords
    const itKeywords = ['dev', 'code', 'coding', 'informatique', 'info', 'developer', 'programming', 'software', 'web', 'app', 'tech', 'ai', 'ia', 'data', 'cloud', 'cyber'];
    if (hasAny(itKeywords)) return 'IT';

    // Medical keywords
    const medicalKeywords = ['med', 'medecin', 'medicine', 'medical', 'santé', 'sante', 'doctor', 'pharmacie', 'infirmier', 'nurse', 'health', 'dentaire', 'veterinaire'];
    if (hasAny(medicalKeywords)) return 'Medical';

    // Business keywords
    const businessKeywords = ['gestion', 'business', 'commerce', 'marketing', 'finance', 'comptabilite', 'accounting', 'economie', 'management', 'administration'];
    if (hasAny(businessKeywords)) return 'Business';

    // Engineering keywords
    const engineeringKeywords = ['ingenierie', 'engineering', 'genie', 'mecanique', 'electrique', 'civil', 'industriel'];
    if (hasAny(engineeringKeywords)) return 'Engineering';

    // Law keywords
    const lawKeywords = ['droit', 'law', 'legal', 'avocat', 'justice', 'juridique'];
    if (hasAny(lawKeywords)) return 'Law';

    // Languages and humanities keywords
    const humanitiesKeywords = [
      'francais',
      'français',
      'anglais',
      'traduction',
      'traducteur',
      'translation',
      'langue',
      'langues',
      'humanities',
      'lettres',
      'philosophie',
      'histoire',
      'آداب',
      'لغات',
      'ترجمة',
      'فلسفة',
      'تاريخ',
    ];
    if (hasAny(humanitiesKeywords)) return 'Humanities';

    // Arts keywords
    const artsKeywords = ['art', 'design', 'graphic', 'architecture', 'mode', 'fashion'];
    if (hasAny(artsKeywords)) return 'Arts';

    return null;
  }

  private detectQueryIntent(message: string): QueryIntent {
    const msg = this.normalize(message);

    if (
      [
        'في اي ولاية',
        'في اي ولايه',
        'في أي ولاية',
        'وين نقراها',
        'وين نقرى',
        'win naqraha',
        'win nokraha',
        'win na9raha',
        'faculte 9riba',
        'faculte qriba',
        'faculté 9riba',
        '9riba',
        'قريبة',
        'ولاية',
        'localisation',
        'location',
        'ville',
        'gouvernorat',
        'ou se trouve',
        'où se trouve',
        'where',
      ].some((term) => msg.includes(this.normalize(term)))
    ) {
      return 'location';
    }

    if (
      [
        'chance',
        'chances',
        'meilleures chances',
        'accessible',
        'admission',
        'najem',
        'najam',
        'chniya najem',
      ].some((term) => msg.includes(term))
    ) {
      return 'best_chances';
    }

    if (
      [
        'specialite',
        'specialites',
        'e5tisat',
        'ekhtisas',
        'matloub',
        'demande',
        'requis',
        'conditions',
        'skills',
        'competence',
        'competences',
        'score',
      ].some((term) => msg.includes(term))
    ) {
      return 'requirements';
    }

    if (
      [
        'fham',
        'fasser',
        'explique',
        'expliquer',
        'comprendre',
        'c quoi',
        'cest quoi',
        'شنوة',
        'اشنوة',
      ].some((term) => msg.includes(term))
    ) {
      return 'field_explanation';
    }

    if (
      ['a7sen', 'ahsen', 'meilleur', 'meilleure', 'best', 'top'].some((term) =>
        msg.includes(term),
      )
    ) {
      return 'best_choice';
    }

    if (
      ['metier', 'job', 'travail', 'carriere', 'debouche', 'avenir'].some(
        (term) => msg.includes(term),
      )
    ) {
      return 'career';
    }

    return 'general';
  }

  private filterRagData(
    message: string,
    studentData?: StudentData,
  ): FilteredRagData {
    const score = Number(studentData?.score) || 0;
    const hasScore =
      typeof studentData?.score === 'number' && Number.isFinite(studentData.score);
    const bacType = studentData?.bacType;
    const normalizedBac = this.normalizeBac(bacType);
    const intent = this.detectQueryIntent(message);

    console.log('Using score:', score, 'bacType:', bacType, 'normalized:', normalizedBac);

    // Get allowed programs based on score
    const filteredGuides = hasScore
      ? this.getFilteredGuides(score, normalizedBac)
      : [];

    // FALLBACK: If no programs match, get closest ones
    const closestPrograms = hasScore
      ? this.getClosestPrograms(score, normalizedBac)
      : [];

    // SMART FIELD DETECTION from user message (CRITICAL - recalculated every time)
    const detectedField = this.detectFieldFromKeywords(message);

    // Find field from fields.json using detection
    let field: FieldData | undefined = detectedField
      ? this.findFieldByDetectedName(detectedField)
      : undefined;

    const candidatePrograms =
      filteredGuides.length > 0 ? filteredGuides : closestPrograms;

    const fieldPrograms = field
      ? this.rankAllowedProgramsForField(
          candidatePrograms,
          field,
          message,
          studentData,
        )
      : [];
    const fieldFallbackPrograms =
      field && fieldPrograms.length === 0
        ? this.rankGuideProgramsForField(field, message, studentData)
            .filter((program) => !normalizedBac || !!program.matchingBac)
            .slice(0, 5)
        : [];

    // Final programs:
    // - if the student names a domain, prioritize programs related to that domain
    // - if the question is general, show the best accessible programs by score
    const selectedPrograms =
      field && fieldPrograms.length > 0
        ? fieldPrograms.slice(0, 5)
        : field && fieldFallbackPrograms.length > 0
          ? fieldFallbackPrograms
        : candidatePrograms.slice(0, 5);

    // SMART LABEL: difficulty
    const difficulty = selectedPrograms[0]
      ? this.calculateDifficultyForGuide(score, selectedPrograms[0])
      : 'hard';

    // JOBS from fields.json (primary source) with ranked reasons
    const jobs = field
      ? this.rankFieldJobs(field, message, studentData).slice(0, 3)
      : this.rankGeneralJobs(message, studentData).slice(0, 3);

    return {
      domain: undefined,
      field,
      difficulty,
      jobs,
      programs: selectedPrograms,
      intent,
    };
  }

  private getFilteredGuides(
    score: number,
    normalizedBac: string,
  ): RankedGuideProgram[] {
    if (!normalizedBac) return [];

    return this.guideData
      .map((guide) => {
        const matchingBac = this.findMatchingBacType(guide, normalizedBac);
        return { guide, matchingBac };
      })
      .filter(({ matchingBac }) => {
        if (!matchingBac || !matchingBac.lastScore) return false;
        return score >= matchingBac.lastScore;
      })
      .map(({ guide, matchingBac }) => ({
        ...guide,
        matchingBac: matchingBac!,
        score: matchingBac!.lastScore || 0,
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private getClosestPrograms(
    score: number,
    normalizedBac: string,
  ): RankedGuideProgram[] {
    if (!normalizedBac) return [];

    return this.guideData
      .map((guide) => {
        const bac = this.findMatchingBacType(guide, normalizedBac);
        if (!bac) return null;
        const lastScore = bac.lastScore || 0;
        return {
          guide,
          bac,
          diff: score - lastScore,
          distance: Math.abs(score - lastScore),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.diff - a.diff || a.distance - b.distance)
      .slice(0, 3)
      .map((item) => ({
        ...item.guide,
        matchingBac: item.bac,
        score: item.bac.lastScore || 0,
      }));
  }

  private calculateDifficultyForGuide(
    score: number,
    selectedGuide: RankedGuideProgram,
  ): 'safe' | 'risky' | 'hard' {
    const lastScore = selectedGuide?.matchingBac?.lastScore || 0;

    if (score > lastScore + 20) return 'safe';
    if (score >= lastScore) return 'risky';
    return 'hard';
  }


  private getAllowedGuidePrograms(
    studentData?: StudentData,
  ): RankedGuideProgram[] {
    const score = Number(studentData?.score) || 0;
    const normalizedBac = this.normalizeBac(studentData?.bacType);

    if (!normalizedBac) return [];

    // Filter guides where score >= lastScore
    const filteredGuides = this.getFilteredGuides(score, normalizedBac);

    if (filteredGuides.length > 0) {
      return filteredGuides;
    }

    // Fallback: closest programs
    return this.getClosestPrograms(score, normalizedBac);
  }

  private normalizeBac(bac?: string): string {
    return this.getBacAliasKey(bac) || bac || '';
  }

  private extractStudentDataFromMessage(message: string): Partial<StudentData> {
    const result: Partial<StudentData> = {};
    if (!message) return result;

    const msg = message.toLowerCase();

    // Look for explicit score patterns: "score 120", "score:120", "my score is 120"
    const scoreMatch = msg.match(/(?:score|sc|note|score[:\s]*is)\s*[:\s-]*?(\d{1,4})/i);
    if (scoreMatch && scoreMatch[1]) {
      const n = Number(scoreMatch[1]);
      if (Number.isFinite(n)) result.score = n;
    }

    // Also allow formats like "120/200" or standalone "120" preceded by 'score' keywords
    if (result.score === undefined) {
      const slashMatch = msg.match(/(\d{1,3})\s*\/\s*\d{1,3}/);
      if (slashMatch && slashMatch[1]) {
        const n = Number(slashMatch[1]);
        if (Number.isFinite(n)) result.score = n;
      }
    }

    // bac type: look for 'bac <type>' or 'baccalaureat <type>'
    const bacMatch = msg.match(/\b(?:bac|baccalaureat|baccalauréat)\s*[:\s-]*([\p{L}0-9-_]+)\b/iu);
    if (bacMatch && bacMatch[1]) {
      const raw = bacMatch[1].toString().trim();
      const mapped = this.getBacAliasKey(raw);
      if (mapped) result.bacType = mapped;
      else result.bacType = raw;
    }

    // Also try to infer bac type from common words if not explicit
    if (!result.bacType) {
      for (const [key, aliases] of Object.entries(this.bacTypeAliases)) {
        for (const alias of aliases) {
          const norm = this.normalize(alias);
          if (msg.includes(norm)) {
            result.bacType = key;
            break;
          }
        }
        if (result.bacType) break;
      }
    }

    return result;
  }

  private getBacAliasKey(bac?: string): string {
    const normalizedBac = this.normalize(bac || '');
    if (!normalizedBac) return '';

    for (const [key, aliases] of Object.entries(this.bacTypeAliases)) {
      if (
        aliases.some((alias) => {
          const normalizedAlias = this.normalize(alias);
          return (
            normalizedBac === normalizedAlias ||
            normalizedBac.includes(normalizedAlias) ||
            normalizedAlias.includes(normalizedBac)
          );
        })
      ) {
        return key;
      }
    }

    return normalizedBac;
  }

  private findMatchingBacType(
    guide: GuideProgram,
    studentBac?: string,
  ): GuideBacType | undefined {
    const bacKey = this.getBacAliasKey(studentBac);
    const aliases = bacKey
      ? [bacKey, ...(this.bacTypeAliases[bacKey] || [])]
      : [studentBac || ''];

    return guide.bacTypes?.find((bac) => {
      const normalizedType = this.normalize(bac.type);

      return aliases.some((alias) => {
        const normalizedAlias = this.normalize(alias);
        return (
          normalizedType === normalizedAlias ||
          normalizedType.includes(normalizedAlias) ||
          normalizedAlias.includes(normalizedType)
        );
      });
    });
  }

  private getMatchingBacType(
    guide: GuideProgram,
    studentData?: StudentData,
  ): GuideBacType | undefined {
    const normalizedBac = this.normalizeBac(studentData?.bacType);
    if (!normalizedBac) return undefined;

    return this.findMatchingBacType(guide, normalizedBac);
  }

  private findFieldFromAllowedGuides(
    allowedPrograms: RankedGuideProgram[],
  ): FieldData | undefined {
    if (!allowedPrograms.length) return undefined;

    return this.findFieldForGuide(allowedPrograms[0]);
  }

  private findFieldByDetectedName(detectedField: string): FieldData | undefined {
    const fieldAliases: Record<string, string[]> = {
      IT: ['IT'],
      Medical: ['Medical / Health'],
      Business: ['Business / Management'],
      Engineering: ['Engineering'],
      Law: ['Law'],
      Arts: ['Arts & Design'],
      Humanities: ['Languages', 'Social Sciences'],
    };
    const candidates = fieldAliases[detectedField] || [detectedField];

    const exactMatch = this.fieldsData.find((field) =>
      candidates.some(
        (candidate) => this.normalize(field.field) === this.normalize(candidate),
      ),
    );

    if (exactMatch) return exactMatch;

    return this.fieldsData.find((field) =>
      candidates.some((candidate) => {
        const fieldName = this.normalize(field.field);
        const candidateName = this.normalize(candidate);

        return fieldName.includes(candidateName);
      }),
    );
  }

  private findFieldForGuide(guide: GuideProgram): FieldData | undefined {
    const guideDomain = this.normalize(guide.domain || '');

    if (guideDomain) {
      const directField = this.fieldsData.find((field) => {
        const fieldName = this.normalize(field.field);

        return (
          fieldName.includes(guideDomain) || guideDomain.includes(fieldName)
        );
      });

      if (directField) return directField;
    }

    const guideText = this.normalize(
      [guide.name, guide.program, guide.institution, guide.formula]
        .filter(Boolean)
        .join(' '),
    );

    return this.fieldsData
      .map((field) => {
        const terms = this.getFieldSearchTerms(field);
        const guideMatches = this.getMatchedTerms(guideText, terms).length;

        return {
          field,
          score: guideMatches,
        };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.field;
  }

  private rankAllowedProgramsForField(
    allowedPrograms: RankedGuideProgram[],
    field: FieldData,
    message: string,
    studentData?: StudentData,
  ): RankedGuideProgram[] {
    const normalizedMessage = this.normalize(message);
    const messageTokens = this.tokenize(normalizedMessage);
    const fieldTerms = this.getFieldSearchTerms(field);

    return allowedPrograms
      .map((guide) => {
        const haystack = this.normalize(
          [guide.name, guide.program, guide.institution, guide.domain]
            .filter(Boolean)
            .join(' '),
        );
        const fieldMatch =
          this.getMatchedTerms(haystack, fieldTerms).length * 8;
        const messageMatch =
          messageTokens.filter((token) => haystack.includes(token)).length * 4;
        const bacScore = guide.matchingBac ? 8 : 0;

        return {
          ...guide,
          score: fieldMatch + messageMatch + bacScore,
        };
      })
      .filter((guide) => guide.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  private getGuideName(guide: GuideProgram): string {
    return guide.name || guide.program;
  }

  private detectField(
    message: string,
    studentData?: StudentData,
  ): FieldData | undefined {
    const normalizedMessage = this.normalize(
      `${message} ${studentData?.selectedFiliere || ''}`,
    );
    const messageTokens = this.tokenize(normalizedMessage);

    const fields = this.fieldsData
      .map((field) => {
        const aliasKey = this.getFieldAliasKey(field.field);
        const terms = this.getFieldSearchTerms(field);
        const matchedTerms = terms.filter((term) =>
          this.matchesSearchTerm(normalizedMessage, term, messageTokens),
        );
        const tokenOverlap = terms
          .flatMap((term) => this.tokenize(term))
          .filter((term) => messageTokens.includes(term)).length;
        const bacScore = matchedTerms.length
          ? this.scoreBacFit(aliasKey, studentData)
          : 0;
        const rankBoost = matchedTerms.length
          ? this.getFieldRankBoost(field)
          : 0;

        return {
          field,
          matchedTerms,
          score:
            matchedTerms.length * 12 + tokenOverlap * 2 + bacScore + rankBoost,
        };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);

    return fields[0]?.field;
  }

  private findDomainsForField(
    field: FieldData,
    message: string,
  ): RankedDomain[] {
    const fieldAliasKey = this.getFieldAliasKey(field.field);
    const normalizedMessage = this.normalize(message);
    const fieldText = this.normalize(this.getFieldSearchTerms(field).join(' '));

    return this.jobsData
      .map((domain) => {
        const domainAliasKey = this.getDomainAliasKey(domain.domain);
        const terms = [
          domain.domain,
          ...domain.keywords,
          ...domain.jobs.flatMap((job) => [
            job.title,
            ...job.skills,
            ...this.getJobIntentTerms(job.title),
          ]),
        ];
        const matchedTerms = this.getMatchedTerms(fieldText, terms);
        const messageMatches = this.getMatchedTerms(normalizedMessage, terms);
        const aliasScore = this.isCompatibleFieldDomain(
          fieldAliasKey,
          domainAliasKey,
        )
          ? 50
          : 0;

        return {
          domain,
          matchedTerms,
          score:
            aliasScore + matchedTerms.length * 4 + messageMatches.length * 8,
        };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private rankJobsFromField(
    field: FieldData,
    message: string,
    studentData?: StudentData,
  ): RankedJob[] {
    const jobs = (field.possible_jobs || []).map((title) => {
      const refinement = this.findJobRefinement(title);
      const job: RankedJob = {
        title,
        skills: refinement?.skills || this.getJobIntentTerms(title),
        unemployment_rate: refinement?.unemployment_rate ?? 50,
        score: this.scoreFieldJob(
          {
            title,
            skills: refinement?.skills || this.getJobIntentTerms(title),
            unemployment_rate: refinement?.unemployment_rate ?? 50,
          },
          field,
          message,
          studentData,
        ),
      };

      return job;
    });

    const rankedJobs = [...jobs].sort((a, b) => {
      const unemploymentA = a.unemployment_rate ?? 99;
      const unemploymentB = b.unemployment_rate ?? 99;

      return unemploymentA - unemploymentB || b.score - a.score;
    });

    return this.applyJobReasons(
      rankedJobs.slice(0, 3),
      message,
      field,
      studentData,
    );
  }

  private findJobRefinement(title: string, domain?: DomainData): JobData | undefined {
    const normalizedTitle = this.normalize(title);

    const searchSpaces = domain ? [domain] : this.jobsData;

    return searchSpaces
      .flatMap((d) => d.jobs)
      .find((job) => this.normalize(job.title).includes(normalizedTitle));
  }

  private rankGuideProgramsForField(
    field: FieldData,
    message: string,
    studentData?: StudentData,
  ): RankedGuideProgram[] {
    const aliasKey = this.getFieldAliasKey(field.field);
    const hints = [
      field.field,
      ...field.programs,
      ...field.possible_jobs,
      ...(aliasKey ? this.guideHints[aliasKey] || [] : []),
    ];
    const normalizedMessage = this.normalize(message);
    const normalizedBac = this.normalizeBac(studentData?.bacType);

    return this.guideData
      .map((program) => {
        const haystack = this.normalize(
          [program.program, program.institution, program.formula]
            .filter(Boolean)
            .join(' '),
        );
        const matchingBac = normalizedBac
          ? this.findMatchingBacType(program, normalizedBac)
          : undefined;
        const guideMatch = this.getMatchedTerms(haystack, hints).length * 12;
        const messageMatch =
          this.getMatchedTerms(haystack, this.tokenize(normalizedMessage))
            .length * 5;
        const bacScore = matchingBac ? 12 : 0;
        const scoreQualified =
          matchingBac && studentData?.score && matchingBac.lastScore
            ? studentData.score >= matchingBac.lastScore
              ? 10
              : -4
            : 0;
        const capacityScore = matchingBac?.capacity
          ? Math.min(matchingBac.capacity / 20, 5)
          : 0;

        return {
          ...program,
          matchingBac,
          score: guideMatch + messageMatch + bacScore + scoreQualified + capacityScore,
        };
      })
      .filter((program) => program.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private getFieldSearchTerms(field: FieldData): string[] {
    const aliasKey = this.getFieldAliasKey(field.field);
    const extraAliasKeys = aliasKey === 'gestion' ? ['commerce'] : [];

    return [
      field.field,
      ...(field.programs || []),
      ...(field.possible_jobs || []),
      ...(field.possible_jobs || []).flatMap((job) =>
        this.getJobIntentTerms(job),
      ),
      field.demand_in_tunisia || '',
      field.future_outlook || '',
      field.reason || '',
      ...(aliasKey ? this.domainAliases[aliasKey] || [] : []),
      ...extraAliasKeys.flatMap((key) => this.domainAliases[key] || []),
    ].filter(Boolean);
  }

  private matchesSearchTerm(
    normalizedText: string,
    term: string,
    textTokens: string[],
  ): boolean {
    const normalizedTerm = this.normalize(term);
    if (normalizedTerm.length < 2) return false;

    if (normalizedTerm.length <= 3) {
      return textTokens.includes(normalizedTerm);
    }

    return normalizedText.includes(normalizedTerm);
  }

  private getFieldRankBoost(field: FieldData): number {
    const ranking = this.ranking.find(
      (item) => this.normalize(item.field) === this.normalize(field.field),
    );

    return ranking ? Math.max(0, 10 - ranking.rank) : 0;
  }

  private isCompatibleFieldDomain(
    fieldAliasKey?: string,
    domainAliasKey?: string,
  ): boolean {
    if (!fieldAliasKey || !domainAliasKey) return false;
    if (fieldAliasKey === domainAliasKey) return true;

    return (
      fieldAliasKey === 'gestion' &&
      ['gestion', 'commerce'].includes(domainAliasKey)
    );
  }

  private scoreFieldJob(
    job: JobData,
    field: FieldData,
    message: string,
    studentData?: StudentData,
  ): number {
    const normalizedMessage = this.normalize(message);
    const fieldTerms = this.getFieldSearchTerms(field);
    const jobText = this.normalize(
      [job.title, ...job.skills, ...this.getJobIntentTerms(job.title)].join(
        ' ',
      ),
    );
    const fieldMatch = this.getMatchedTerms(jobText, fieldTerms).length * 8;
    const messageMatch =
      this.getMatchedTerms(jobText, this.tokenize(normalizedMessage)).length *
      10;
    const unemploymentScore =
      typeof job.unemployment_rate === 'number'
        ? Math.max(0, 100 - job.unemployment_rate * 8)
        : 10;
    const bacScore = this.scoreBacFit(
      this.getFieldAliasKey(field.field),
      studentData,
    );

    return unemploymentScore + fieldMatch + messageMatch + bacScore;
  }

  private isJobLinkedToField(job: JobData, field: FieldData): boolean {
    const possibleJobTerms = field.possible_jobs.flatMap((title) => [
      title,
      ...this.getJobIntentTerms(title),
    ]);
    const jobText = this.normalize(
      [job.title, ...job.skills, ...this.getJobIntentTerms(job.title)].join(
        ' ',
      ),
    );
    const jobTokens = this.tokenize(jobText);

    return possibleJobTerms.some((term) =>
      this.matchesSearchTerm(jobText, term, jobTokens),
    );
  }

  private uniqueJobsInOrder(jobs: RankedJob[]): RankedJob[] {
    const seen = new Set<string>();
    const uniqueJobs: RankedJob[] = [];

    for (const job of jobs) {
      const key = this.normalize(job.title);
      if (seen.has(key)) continue;

      seen.add(key);
      uniqueJobs.push(job);
    }

    return uniqueJobs;
  }

  private applyJobReasons(
    jobs: RankedJob[],
    message: string,
    field: FieldData,
    studentData?: StudentData,
  ): RankedJob[] {
    return jobs.map((job, index) => ({
      ...job,
      reason: this.getJobReasonByRank(job, message, field, studentData, index),
    }));
  }

  private getJobReasonByRank(
    job: JobData,
    message: string,
    field: FieldData,
    studentData: StudentData | undefined,
    index: number,
  ): string {
    const bacType = studentData?.bacType
      ? `Bac ${studentData.bacType}`
      : 'ton profil';
    const score = studentData?.FG ?? studentData?.bacAverage;
    const scoreHint =
      typeof score === 'number' && score >= 14 ? ' et ton bon score' : '';

    if (index === 0) {
      const skills = job.skills?.slice(0, 2).join(', ');
      return skills
        ? `tes compétences peuvent s'appuyer sur ${skills} avec ${bacType}${scoreHint}`
        : this.getJobReason(job.title, message, 'skills');
    }

    if (index === 1) {
      return `demande ${this.translateDataValue(
        field.demand_in_tunisia || 'bonne',
      )} en Tunisie, avec une perspective ${this.translateDataValue(
        field.future_outlook || 'positive',
      )}`;
    }

    return this.getJobReason(job.title, message, 'personality');
  }

  private detectDomain(message: string): RankedDomain | undefined {
    const normalizedMessage = this.normalize(message);
    const messageTokens = this.tokenize(normalizedMessage);

    const domains = this.jobsData
      .map((domain) => {
        const aliasKey = this.getDomainAliasKey(domain.domain);
        const terms = [
          ...domain.keywords,
          ...(aliasKey ? this.domainAliases[aliasKey] || [] : []),
          domain.domain,
        ];
        const matchedTerms = this.getMatchedTerms(normalizedMessage, terms);
        const tokenOverlap = terms
          .flatMap((term) => this.tokenize(this.normalize(term)))
          .filter((term) => messageTokens.includes(term)).length;

        return {
          domain,
          matchedTerms,
          score: matchedTerms.length * 8 + tokenOverlap * 2,
        };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);

    return domains[0];
  }

  private rankJobs(
    domain: DomainData,
    message: string,
    studentData?: StudentData,
  ): RankedJob[] {
    return domain.jobs
      .map((job) => ({
        ...job,
        score: this.scoreJob(job, message, studentData, domain),
        reason: this.getJobReason(job.title, message, 'skills'),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private rankFieldJobs(
    field: FieldData | undefined,
    message: string,
    studentData?: StudentData,
  ): RankedJob[] {
    if (!field?.possible_jobs?.length) return [];
    // Find the most relevant jobs domain(s) for this field
    const domains = this.findDomainsForField(field, message);
    const chosenDomain = domains && domains.length > 0 ? domains[0].domain : undefined;

    // If we have a matching domain from jobs.json, prefer jobs from that domain
    if (chosenDomain) {
      // Collect jobs from the chosen domain that are linked to the field
      const candidateJobs = chosenDomain.jobs
        .filter((job) => this.isJobLinkedToField(job, field))
        .map((job) => ({
          ...job,
          score: this.scoreJob(job, message, studentData, chosenDomain),
        } as RankedJob));

      // If we found candidate jobs in the domain, return top ones
      if (candidateJobs.length > 0) {
        const ranked = candidateJobs.sort((a, b) => b.score - a.score).slice(0, 3);
        return this.applyJobReasons(ranked, message, field, studentData);
      }

      // Fallback: match field.possible_jobs against chosen domain jobs
      const matchedFromDomain = field.possible_jobs
        .map((title) => {
          const refinement = this.findJobRefinement(title, chosenDomain);
          const job: RankedJob = {
            title,
            skills: refinement?.skills || this.getJobIntentTerms(title),
            unemployment_rate: refinement?.unemployment_rate ?? 50,
            score: this.scoreJob(
              {
                title,
                skills: refinement?.skills || this.getJobIntentTerms(title),
                unemployment_rate: refinement?.unemployment_rate ?? 50,
              },
              message,
              studentData,
              chosenDomain,
            ),
          };

          return job;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (matchedFromDomain.length > 0) {
        return this.applyJobReasons(matchedFromDomain, message, field, studentData);
      }
    }

    // Final fallback: use field.possible_jobs and global refinements
    const rankedJobs: RankedJob[] = field.possible_jobs
      .map((title) => {
        const refinement = this.findJobRefinement(title);
        const job: RankedJob = {
          title,
          skills: refinement?.skills || this.getJobIntentTerms(title),
          unemployment_rate: refinement?.unemployment_rate ?? 50,
          score: this.scoreJob(
            {
              title,
              skills: refinement?.skills || this.getJobIntentTerms(title),
              unemployment_rate: refinement?.unemployment_rate ?? 50,
            },
            message,
            studentData,
            undefined,
          ),
        };

        return job;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return this.applyJobReasons(rankedJobs, message, field, studentData);
  }

  private rankGeneralJobs(
    message: string,
    studentData?: StudentData,
  ): RankedJob[] {
    const ranked = this.fieldsData.flatMap((field) =>
      this.rankJobsFromField(field, message, studentData).map((job) => ({
        ...job,
        score: job.score + this.getFieldRankBoost(field),
        reason: `${field.field}: ${job.reason || 'option cohérente avec ton profil'}`,
      })),
    );

    return this.uniqueJobsInOrder(ranked).sort((a, b) => b.score - a.score);
  }

  private scoreJob(
    job: JobData,
    message: string,
    studentData?: StudentData,
    domain?: DomainData,
  ): number {
    const normalizedMessage = this.normalize(message);
    const aliasKey =
      (domain ? this.getDomainAliasKey(domain.domain) : undefined) ||
      (domain ? this.getFieldAliasKey(domain.domain) : undefined);
    const domainTerms = [
      domain?.domain || '',
      ...(domain?.keywords || []),
      ...(aliasKey ? this.domainAliases[aliasKey] || [] : []),
    ];
    const jobTerms = [
      job.title,
      ...job.skills,
      ...this.getJobIntentTerms(job.title),
    ];
    const keywordScore =
      this.getMatchedTerms(normalizedMessage, jobTerms).length * 18 +
      this.getMatchedTerms(normalizedMessage, domainTerms).length * 8;
    const unemploymentScore =
      typeof job.unemployment_rate === 'number'
        ? Math.max(0, 25 - job.unemployment_rate * 2)
        : 8;
    const bacScore = this.scoreBacFit(aliasKey, studentData);

    return keywordScore + unemploymentScore + bacScore;
  }

  private mergeRankedJobs(
    primaryJobs: RankedJob[],
    fallbackJobs: RankedJob[],
  ): RankedJob[] {
    const jobsByTitle = new Map<string, RankedJob>();

    for (const job of [...primaryJobs, ...fallbackJobs]) {
      const key = this.normalize(job.title);
      const current = jobsByTitle.get(key);

      if (!current || job.score > current.score) {
        jobsByTitle.set(key, job);
      }
    }

    return [...jobsByTitle.values()].sort((a, b) => b.score - a.score);
  }

  private rankGuidePrograms(
    domain: DomainData,
    message: string,
    studentData?: StudentData,
  ): RankedGuideProgram[] {
    const aliasKey = this.getDomainAliasKey(domain.domain);
    const hints = aliasKey ? this.guideHints[aliasKey] || [] : [];
    const normalizedMessage = this.normalize(message);
    const normalizedBacType = this.normalizeBac(studentData?.bacType);

    return this.guideData
      .map((program) => {
        const haystack = this.normalize(
          [program.program, program.institution, program.formula]
            .filter(Boolean)
            .join(' '),
        );
        const matchingBac = normalizedBacType
          ? this.findMatchingBacType(program, normalizedBacType)
          : undefined;
        const guideMatch = this.getMatchedTerms(haystack, hints).length * 12;
        const messageMatch =
          this.getMatchedTerms(haystack, this.tokenize(normalizedMessage))
            .length * 5;
        const formulaMatch =
          aliasKey === 'informatique' && haystack.includes('info') ? 8 : 0;
        const bacScore = matchingBac ? 12 : 0;
        const fgScore =
          matchingBac && studentData?.FG && matchingBac.lastScore
            ? studentData.FG >= matchingBac.lastScore
              ? 10
              : -4
            : 0;
        const capacityScore = matchingBac?.capacity
          ? Math.min(matchingBac.capacity / 20, 5)
          : 0;

        return {
          ...program,
          matchingBac,
          score:
            guideMatch +
            messageMatch +
            formulaMatch +
            bacScore +
            fgScore +
            capacityScore,
        };
      })
      .filter((program) => program.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private formatProgramContext(
    program: RankedGuideProgram,
    studentData?: StudentData,
  ): string {
    const lastScore = program.matchingBac?.lastScore;
    const capacity = program.matchingBac?.capacity;
    const hasScore =
      typeof studentData?.score === 'number' && Number.isFinite(studentData.score);
    const score = hasScore ? Number(studentData?.score) : 0;
    const gap =
      typeof lastScore === 'number' && hasScore
        ? `écart avec ton score: ${(score - lastScore).toFixed(2)}`
        : typeof lastScore === 'number'
          ? 'écart avec ton score: score non précisé'
        : 'dernier score non disponible';

    return [
      `- ${this.getGuideName(program)}`,
      `institution: ${program.institution}`,
      `localisation: ${this.getInstitutionLocation(program.institution)}`,
      program.formula ? `formule: ${program.formula}` : undefined,
      typeof lastScore === 'number' ? `dernier score: ${lastScore}` : undefined,
      typeof capacity === 'number' ? `capacité: ${capacity}` : undefined,
      gap,
      `niveau: ${
        hasScore
          ? this.getDifficultyLabel(this.calculateDifficultyForGuide(score, program))
          : 'à vérifier après ajout du score'
      }`,
    ]
      .filter(Boolean)
      .join('; ');
  }

  private getInstitutionLocation(institution?: string): string {
    const text = this.normalize(institution || '');
    const locations: Array<[string, string[]]> = [
      ['Tunis', ['tunis', 'تونس', 'tunisie', 'منار', 'manar']],
      ['Sousse', ['sousse', 'سوسة']],
      ['Sfax', ['sfax', 'صفاقس']],
      ['Monastir', ['monastir', 'منستير']],
      ['Nabeul', ['nabeul', 'نابل']],
      ['Bizerte', ['bizerte', 'بنزرت']],
      ['Gabes', ['gabes', 'قابس']],
      ['Gafsa', ['gafsa', 'قفصة']],
      ['Kairouan', ['kairouan', 'قيروان']],
      ['Kasserine', ['kasserine', 'قصرين']],
      ['Jendouba', ['jendouba', 'جندوبة']],
      ['Medenine', ['medenine', 'مدنين']],
      ['Mahdia', ['mahdia', 'مهدية']],
      ['Kef', ['kef', 'الكاف']],
      ['Siliana', ['siliana', 'سليانة']],
      ['Tozeur', ['tozeur', 'توزر']],
      ['Tataouine', ['tataouine', 'تطاوين']],
      ['Beja', ['beja', 'باجة']],
      ['Zaghouan', ['zaghouan', 'زغوان']],
      ['Ben Arous', ['ben arous', 'بن عروس']],
      ['Ariana', ['ariana', 'اريانة', 'أريانة']],
      ['Manouba', ['manouba', 'منوبة']],
      ['Carthage / Borj Cedria', ['carthage', 'قرطاج', 'borj cedria', 'برج السدرية']],
    ];

    const match = locations.find(([, aliases]) =>
      aliases.some((alias) => text.includes(this.normalize(alias))),
    );

    return match?.[0] || 'localisation à vérifier dans le nom de l’institution';
  }

  private getDifficultyLabel(
    difficulty?: 'safe' | 'risky' | 'hard',
  ): string {
    if (difficulty === 'safe') return 'sûr';
    if (difficulty === 'risky') return 'jouable mais à comparer';
    if (difficulty === 'hard') return 'difficile';
    return 'à vérifier';
  }

  private translateDataValue(value?: string): string {
    const normalizedValue = this.normalize(value || '');
    const translations: Record<string, string> = {
      'very high': 'très élevée',
      high: 'élevée',
      standard: 'standard',
      strong: 'forte',
      positive: 'positive',
      moderate: 'modérée',
      average: 'moyenne',
      low: 'faible',
      'low to moderate': 'faible à modéré',
      'moderate to high': 'modérée à élevée',
      'a comparer selon le programme': 'à comparer selon le programme',
      'positive si les competences suivent':
        'positive si les compétences suivent',
      'non precise': 'non précisé',
    };

    return translations[normalizedValue] || value || 'non précisé';
  }

  private translateFieldReason(reason?: string): string {
    const normalizedReason = this.normalize(reason || '');

    if (!normalizedReason) {
      return 'question générale sur les programmes';
    }

    if (
      normalizedReason.includes('strongest field') &&
      normalizedReason.includes('high demand')
    ) {
      return 'Domaine très porteur en Tunisie, avec une forte demande locale et internationale.';
    }

    if (
      normalizedReason.includes('good') &&
      normalizedReason.includes('demand')
    ) {
      return 'Domaine intéressant avec une demande à comparer selon la spécialité et l’établissement.';
    }

    if (
      normalizedReason.includes('less demanded') ||
      normalizedReason.includes('technical fields')
    ) {
      return 'Domaine utile pour les langues, la traduction et la communication, mais la demande est généralement plus limitée que dans les filières techniques.';
    }

    return reason || 'question générale sur les programmes';
  }

  private buildRagContext(
  ragData: FilteredRagData,
  userMessage: string,
  studentData?: StudentData,
): string {
  const field = ragData.field;
  const scoreText =
    typeof studentData?.score === 'number' && Number.isFinite(studentData.score)
      ? String(studentData.score)
      : 'non précisé';

  const programs = ragData.programs
    .slice(0, 5)
    .map((program) => this.formatProgramContext(program, studentData));
  const programLocations = ragData.programs
    .slice(0, 5)
    .map(
      (program) =>
        `- ${this.getGuideName(program)}: ${this.getInstitutionLocation(
          program.institution,
        )} (${program.institution})`,
    );

  const jobs = ragData.jobs
    .slice(0, 5)
    .map((job) => {
      const skills = job.skills?.slice(0, 4).join(', ') || 'compétences à développer';
      const unemployment =
        typeof job.unemployment_rate === 'number'
          ? `risque chômage estimé: ${job.unemployment_rate}%`
          : 'risque chômage non précisé';

      return `- ${job.title}: ${skills}; ${unemployment}; raison: ${
        job.reason || this.getJobReason(job.title, userMessage)
      }`;
    });

  const technicalSkills =
    field?.required_skills?.technical_skills?.slice(0, 5).join(', ') ||
    'à adapter selon la filière';
  const softSkills =
    field?.required_skills?.soft_skills?.slice(0, 5).join(', ') ||
    'communication, discipline, autonomie';
  const tools =
    field?.required_skills?.tools_and_technologies?.slice(0, 5).join(', ') ||
    'outils à choisir selon le parcours';

  return `
Données profil:
- Bac: ${studentData?.bacType || 'non précisé'}
- Score: ${scoreText}
- Question: ${userMessage}
- Type de question: ${ragData.intent || 'general'}
- Niveau du premier choix: ${this.getDifficultyLabel(ragData.difficulty)}

Domaine détecté depuis fields.json:
- Domaine: ${field?.field || 'aucun domaine précis détecté'}
- Pourquoi: ${this.translateFieldReason(field?.reason)}
- Demande en Tunisie: ${this.translateDataValue(
    field?.demand_in_tunisia || 'à comparer selon le programme',
  )}
- Perspective future: ${this.translateDataValue(
    field?.future_outlook || 'positive si les compétences suivent',
  )}
- Risque chômage: ${this.translateDataValue(
    field?.unemployment_risk || 'non précisé',
  )}
- Compétences techniques: ${technicalSkills}
- Soft skills: ${softSkills}
- Outils/technologies: ${tools}

Programmes recommandés depuis guide.json:
${programs.join('\n') || '- Aucun programme précis trouvé pour ce bac et ce score'}

Localisation des institutions:
${programLocations.join('\n') || '- Aucune localisation disponible'}

Métiers et marché depuis fields.json/jobs.json:
${jobs.join('\n') || '- Aucun métier précis trouvé, proposer une comparaison par domaines'}
`;
}

 private buildFullPrompt(
  userMessage: string,
  ragContext: string,
  lang?: 'fr' | 'ar',
  memory: ConversationMessage[] = [],
): string {
  const languageInstruction =
    lang === 'ar'
      ? 'اجب باللغة العربية أو الدارجة التونسية بأسلوب مهني وودود.'
      : 'Réponds uniquement en français clair. N’utilise pas l’anglais dans les titres, les raisons ou les conseils.';

  const conversationMemory = this.buildConversationMemory(memory);
  const safetyInstruction = this.safetyRules.getPromptRules(
    'orientation',
    lang || 'fr',
  );

  return `
Tu es un conseiller tunisien expert en orientation universitaire. Ton objectif est de donner une réponse complète, personnalisée et utile à partir du score, du bac, de la question de l'étudiant, et des données locales.

${safetyInstruction}

DONNÉES RAG (extraites de fields.json, guide.json et jobs.json):
${ragContext}

HISTORIQUE RECENT (5 derniers messages maximum):
${conversationMemory || 'Aucun historique recent.'}

QUESTION DE L'ÉTUDIANT:
${userMessage}

CONSIGNES:
1. ${languageInstruction}
2. Analyse d'abord le profil: bac, score, objectif ou question.
3. Recommande uniquement les programmes fournis dans le contexte. Pour chaque programme, explique le niveau: sûr, jouable/risqué, ou difficile.
4. Utilise jobs.json et fields.json pour expliquer les métiers, la demande en Tunisie, les compétences et les perspectives.
5. Ajoute ta propre expertise IA seulement pour enrichir les conseils, les compétences à apprendre et la feuille de route. N'invente pas de noms de programmes absents du contexte.
6. Réponds directement à la question et varie la structure selon le type de question:
- best_chances: classe les filières avec admission, dernier score, écart et risque.
- location: réponds surtout sur la ville/gouvernorat des institutions, la proximité et les alternatives proches.
- field_explanation: explique le domaine, ses spécialités, ce qu'on étudie et pour quel profil.
- requirements: détaille les spécialités, conditions, compétences et niveau demandé.
- best_choice: donne une recommandation tranchée avec alternatives.
- career: parle surtout métiers, marché et roadmap.
7. Si un domaine précis est détecté, les programmes conseillés doivent appartenir à ce domaine autant que possible.

Structure demandée:
1. Analyse du profil
2. Programmes conseillés
3. Débouchés et compétences
4. Conseil personnalisé et prochaines étapes
`;
}

  private findFieldForDomain(domain?: DomainData): FieldData | undefined {
    const aliasKey = domain ? this.getDomainAliasKey(domain.domain) : undefined;
    const fieldNameByAlias: Record<string, string> = {
      informatique: 'IT',
      ingenierie: 'Engineering',
      sante: 'Medical / Health',
      gestion: 'Business / Management',
      commerce: 'Business / Management',
      energie: 'Science',
      droit: 'Law',
      arts: 'Arts & Design',
      education: 'Social Sciences',
    };
    const expectedField = aliasKey ? fieldNameByAlias[aliasKey] : undefined;

    return this.fieldsData.find((field) => {
      const fieldName = field.field.toLowerCase();
      const domainName = domain?.domain?.toLowerCase() || '';

      return (
        fieldName.includes(domainName) ||
        fieldName === expectedField?.toLowerCase() ||
        fieldName.includes(expectedField?.toLowerCase() || '')
      );
    });
  }

  private getFieldAliasKey(fieldName: string): string | undefined {
    const normalizedField = this.normalize(fieldName);

    if (normalizedField.includes('it')) return 'informatique';
    if (normalizedField.includes('engineering')) return 'ingenierie';
    if (
      normalizedField.includes('medical') ||
      normalizedField.includes('health')
    )
      return 'sante';
    if (
      normalizedField.includes('business') ||
      normalizedField.includes('management')
    )
      return 'gestion';
    if (normalizedField.includes('law')) return 'droit';
    if (
      normalizedField.includes('languages') ||
      normalizedField.includes('humanities')
    )
      return 'languages';
    if (normalizedField.includes('arts') || normalizedField.includes('design'))
      return 'arts';
    if (normalizedField.includes('science')) return 'energie';
    if (normalizedField.includes('social')) return 'education';

    return undefined;
  }

  private scoreBacFit(
    aliasKey: string | undefined,
    studentData?: StudentData,
  ): number {
    const bacType = this.normalize(studentData?.bacType || '');
    if (!aliasKey || !bacType) return 0;

    const preferredBacByDomain: Record<string, string[]> = {
      informatique: ['info', 'math', 'tech'],
      ingenierie: ['math', 'tech'],
      sante: ['svt', 'math'],
      gestion: ['eco', 'math'],
      commerce: ['eco', 'lettres'],
      droit: ['lettres', 'eco'],
      education: ['lettres', 'svt'],
      arts: ['lettres'],
      languages: ['lettres'],
    };

    return preferredBacByDomain[aliasKey]?.some((bac) => bacType.includes(bac))
      ? 6
      : 0;
  }

  private getPersonalizationHint(
    message: string,
    field: FieldData | undefined,
    studentData?: StudentData,
  ): string {
    const text = this.normalize(`${message} ${field?.field || ''}`);
    const bacType = this.normalize(studentData?.bacType || '');
    const score = studentData?.FG ?? studentData?.bacAverage;
    const hints: string[] = [];

    if (bacType.includes('math')) {
      hints.push('Bac Math supports logic, analysis, and technical careers.');
    }

    if (typeof score === 'number' && score >= 14) {
      hints.push('High score can support stronger and more selective paths.');
    }

    if (
      ['dev', 'coding', 'code', 'programming', 'developer', 'software'].some(
        (term) => text.includes(term),
      )
    ) {
      hints.push(
        'For dev, focus on logic, coding practice, small projects, and problem solving.',
      );
      return hints.join(' ');
    }

    if (
      ['medecine', 'medicine', 'medical', 'health', 'sante'].some((term) =>
        text.includes(term),
      )
    ) {
      hints.push(
        'For medicine or health, focus on patience, strong science basics, discipline, and long studies.',
      );
      return hints.join(' ');
    }

    if (
      ['business', 'gestion', 'management', 'commerce', 'marketing'].some(
        (term) => text.includes(term),
      )
    ) {
      hints.push(
        'For business, focus on communication, analysis, organization, and decision making.',
      );
      return hints.join(' ');
    }

    hints.push(
      'Match the choice with the student interests, strengths, and job demand.',
    );
    return hints.join(' ');
  }

  private getJobReason(
    jobTitle: string,
    message: string,
    reasonType: 'skills' | 'demand' | 'personality' = 'skills',
  ): string {
    const text = this.normalize(`${jobTitle} ${message}`);

    if (reasonType === 'demand') {
      return 'option solide grâce à la demande locale et aux perspectives positives';
    }

    if (reasonType === 'personality') {
      if (
        ['dev', 'developer', 'developpeur', 'software', 'web', 'mobile'].some(
          (term) => text.includes(term),
        )
      ) {
        return 'convient à un profil qui aime la logique, la pratique et la résolution de problèmes';
      }

      if (
        ['business', 'gestion', 'manager', 'finance', 'marketing'].some(
          (term) => text.includes(term),
        )
      ) {
        return 'convient à un profil orienté communication, analyse et prise de décision';
      }

      if (
        ['medical', 'health', 'doctor', 'nurse', 'pharma'].some((term) =>
          text.includes(term),
        )
      ) {
        return 'convient à un profil patient, discipliné et prêt pour des études longues';
      }

      return 'correspond au profil et aux intérêts détectés dans la question';
    }

    if (
      ['dev', 'developer', 'developpeur', 'software', 'web', 'mobile'].some(
        (term) => text.includes(term),
      )
    ) {
      return 'bon choix si tu veux coder et construire des projets réels';
    }

    if (
      ['data', 'analyst', 'science', 'ai', 'ia'].some((term) =>
        text.includes(term),
      )
    ) {
      return 'bon choix pour l’analyse, la logique et le travail sur les données';
    }

    if (
      ['support', 'system', 'systeme', 'admin', 'reseau'].some((term) =>
        text.includes(term),
      )
    ) {
      return 'bon choix pour le dépannage technique, les réseaux et l’infrastructure';
    }

    if (
      ['business', 'gestion', 'manager', 'finance', 'marketing'].some((term) =>
        text.includes(term),
      )
    ) {
      return 'bon choix pour la communication, l’organisation et l’analyse';
    }

    if (
      ['medical', 'health', 'doctor', 'nurse', 'pharma'].some((term) =>
        text.includes(term),
      )
    ) {
      return 'bon choix si tu aimes les sciences, la rigueur et l’aide aux autres';
    }

    return 'bon choix selon le domaine détecté et la demande locale';
  }

  private buildStudentProfile(studentData?: StudentData): string {
    if (!studentData) return 'No student profile provided';

    return (
      [
        studentData.name ? `name=${studentData.name}` : undefined,
        studentData.bacType ? `bacType=${studentData.bacType}` : undefined,
        studentData.bacAverage
          ? `bacAverage=${studentData.bacAverage}`
          : undefined,
        studentData.FG ? `FG=${studentData.FG}` : undefined,
        studentData.selectedFiliere
          ? `selectedFiliere=${studentData.selectedFiliere}`
          : undefined,
      ]
        .filter(Boolean)
        .join(', ') || 'No student profile provided'
    );
  }

  private buildEnrichedUser(
    userMessage: string,
    studentData?: StudentData,
  ): string {
    return `User message: ${userMessage}
Student: Bac ${studentData?.bacType || 'unknown'}, Score ${
      studentData?.FG ?? studentData?.bacAverage ?? 'unknown'
    }`;
  }

  private getRecentConversationMemory(
    conversationHistory: ConversationMessage[] = [],
  ): ConversationMessage[] {
    return conversationHistory
      .filter(
        (item) =>
          item?.content && (item.role === 'user' || item.role === 'assistant'),
      )
      .slice(-5)
      .map((item) => ({
        role: item.role,
        content: item.content.trim(),
      }));
  }

  private buildConversationMemory(
    conversationHistory: ConversationMessage[],
  ): string {
    return this.getRecentConversationMemory(conversationHistory)
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');
  }

  private getDeterministicResponse(
    ragData: FilteredRagData,
    lang: 'fr' | 'ar',
    studentData?: StudentData,
    userMessage = '',
  ): string {
    if (lang === 'ar') {
      return this.getArabicDeterministicResponse(ragData, studentData);
    }

    const hasScore =
      typeof studentData?.score === 'number' && Number.isFinite(studentData.score);
    const score = hasScore ? Number(studentData?.score) : 0;
    const scoreLabel = hasScore ? String(score) : 'non précisé';
    const bac = studentData?.bacType || 'non précisé';
    const field = ragData.field;
    const fieldName = field?.field || 'orientation générale';
    const programs = ragData.programs.slice(0, 5);
    const jobs = ragData.jobs.slice(0, 4);
    const programLines = programs.length
      ? programs.map((program, index) => {
          const lastScore = program.matchingBac?.lastScore;
          const capacity = program.matchingBac?.capacity;
          const difficulty = this.calculateDifficultyForGuide(score, program);
          const scorePart =
            typeof lastScore === 'number' && hasScore
              ? `dernier score ${lastScore}, écart ${(score - lastScore).toFixed(2)}`
              : typeof lastScore === 'number'
                ? `dernier score ${lastScore}`
              : 'dernier score non disponible';
          const capacityPart =
            typeof capacity === 'number' ? `, capacité ${capacity}` : '';
          const difficultyPart = hasScore
            ? `Niveau: ${this.getDifficultyLabel(difficulty)}.`
            : 'Niveau: à vérifier après ajout du score.';

          return `${index + 1}. ${this.getGuideName(program)} - ${program.institution}. ${scorePart}${capacityPart}. ${difficultyPart}`;
        })
      : [
          'Aucun programme précis n’a été trouvé dans guide.json pour ce bac et ce score. Vérifie le type de bac envoyé par le frontend et la qualité des données guide.json.',
        ];
    const locationLines = programs.length
      ? programs.map(
          (program, index) =>
            `${index + 1}. ${this.getGuideName(program)} - ${this.getInstitutionLocation(
              program.institution,
            )}. Institution: ${program.institution}.`,
        )
      : ['Je n’ai pas trouvé de programme précis à localiser pour cette question.'];

    const jobLines = jobs.length
      ? jobs.map((job, index) => {
          const skills =
            job.skills?.slice(0, 4).join(', ') || 'compétences à construire progressivement';
          return `${index + 1}. ${job.title} - ${job.reason || this.getJobReason(job.title, userMessage)}. Compétences utiles: ${skills}.`;
        })
      : [
          'Compare les domaines avec la demande locale, le dernier score d’accès et tes préférences réelles avant de choisir.',
        ];

    const technicalSkills =
      field?.required_skills?.technical_skills?.slice(0, 4).join(', ') ||
      'méthode de travail, logique, recherche et autonomie';
    const softSkills =
      field?.required_skills?.soft_skills?.slice(0, 4).join(', ') ||
      'communication, discipline, organisation';
    const demand = this.translateDataValue(
      field?.demand_in_tunisia || 'à comparer selon la filière',
    );
    const outlook = this.translateDataValue(
      field?.future_outlook ||
        'positif si tu développes les bonnes compétences',
    );
    const fieldReason =
      this.translateFieldReason(field?.reason) ||
      'ta question est générale, donc la priorité est de comparer les programmes accessibles plutôt que de forcer un seul domaine.';

    if (ragData.intent === 'location') {
      return `Localisation des filières
Voici où se trouvent les institutions les plus liées à ta question. Je te mets la ville/gouvernorat détecté depuis le nom de l’établissement.

${locationLines.join('\n')}

À retenir
- Si tu veux une faculté proche, donne-moi ta ville ou ta région.
- Si tu veux le meilleur choix malgré la distance, je compare plutôt le dernier score, la capacité et la qualité du domaine.
- Score actuel: ${scoreLabel}, Bac: ${bac}.`;
    }

    if (ragData.intent === 'best_chances') {
      return `Tes meilleures chances
Avec ${scoreLabel} en Bac ${bac}, tes meilleures chances sont les filières dont le dernier score est inférieur ou très proche de ton score. Je les classe par proximité et intérêt, pas seulement par prestige.

${programLines.join('\n')}

Lecture rapide
- Si l’écart est positif et large: choix plutôt sûr.
- Si l’écart est entre 0 et 5 points: choix jouable, mais il faut prévoir une alternative.
- Si l’écart est négatif: choix difficile, à garder seulement si tu as un plan B.

Conseil
Mets au moins 2 choix sûrs, 2 choix jouables et 1 choix ambitieux. Si tu veux, donne-moi le domaine que tu préfères, par exemple dev, médecine, ingénierie ou gestion, et je filtre les chances seulement dans ce domaine.`;
    }

    if (ragData.intent === 'field_explanation' || ragData.intent === 'requirements') {
      const specialities =
        field?.programs?.slice(0, 6).join('\n- ') ||
        programs.map((program) => this.getGuideName(program)).join('\n- ') ||
        'Les spécialités exactes dépendent des programmes disponibles.';
      const requiredTools =
        field?.required_skills?.tools_and_technologies?.slice(0, 4).join(', ') ||
        'outils selon la spécialité';

      return `Comprendre ${fieldName}
${fieldReason}

Spécialités possibles
- ${specialities}

Ce qui est demandé
- Niveau académique: score ${scoreLabel}, Bac ${bac}. Pour l’admission, il faut comparer avec le dernier score de chaque programme.
- Compétences techniques: ${technicalSkills}
- Compétences personnelles: ${softSkills}
- Outils utiles: ${requiredTools}

Programmes liés à ce domaine
${programLines.join('\n')}

Après les études
${jobLines.join('\n')}

Conclusion
Si tu me dis “je veux dev”, “je veux médecine”, “je veux gestion”, etc., je te donne directement les meilleurs programmes de ce domaine avec le niveau de risque.`;
    }

    if (ragData.intent === 'best_choice') {
      const firstProgram = programs[0];
      const firstProgramName = firstProgram
        ? this.getGuideName(firstProgram)
        : 'le programme le plus proche de ton score';

      return `Le meilleur choix pour toi
Si je dois choisir une piste principale avec ton profil Bac ${bac} et score ${scoreLabel}, je commencerais par: ${firstProgramName}.

Pourquoi
- Le score est compatible ou proche de ton score.
- Le domaine détecté est ${fieldName}.
- La demande en Tunisie est ${demand} et la perspective est ${outlook}.

Alternatives à garder
${programLines.join('\n')}

Roadmap
1. Choisis le programme le plus cohérent avec ton objectif.
2. Renforce ces compétences: ${technicalSkills}.
3. Vise ensuite ces débouchés: ${jobs.map((job) => job.title).join(', ') || 'à préciser selon ton domaine'}.`;
    }

    if (ragData.intent === 'career') {
      return `Débouchés pour ${fieldName}
Demande en Tunisie: ${demand}. Perspective: ${outlook}.

Métiers possibles
${jobLines.join('\n')}

Compétences à construire
- Techniques: ${technicalSkills}
- Personnelles: ${softSkills}

Programmes qui peuvent mener à ces métiers
${programLines.join('\n')}

Conseil
Ne choisis pas seulement selon le nom du métier. Compare aussi la durée des études, le dernier score, la capacité et les compétences que tu es prêt à travailler pendant 3 à 5 ans.`;
    }

    if (field) {
      return `Orientation vers ${fieldName}
Tu as exprimé un intérêt pour ${fieldName}. Avec un score ${scoreLabel} et un Bac ${bac}, je filtre donc les programmes vers ce domaine au lieu de te donner les filières générales les plus proches du score.

Programmes les plus cohérents
${programLines.join('\n')}

Pourquoi ce choix peut marcher
- Demande en Tunisie: ${demand}
- Perspective: ${outlook}
- Profil adapté si tu acceptes de travailler: ${technicalSkills}

Métiers possibles
${jobLines.join('\n')}

Prochaine étape
Si ton objectif est dev, commence par Python ou JavaScript, fais 2 petits projets, puis compare les filières informatique selon dernier score, capacité et proximité géographique.`;
    }

    return `Analyse du profil
Avec un score ${scoreLabel} et un Bac ${bac}, je vais raisonner en deux niveaux: d’abord les programmes réellement accessibles dans guide.json, puis les débouchés et compétences à partir de fields.json et jobs.json. Domaine détecté: ${fieldName}. ${fieldReason}

Programmes conseillés
${programLines.join('\n')}

Débouchés et marché
Demande en Tunisie: ${demand}. Perspective: ${outlook}.
${jobLines.join('\n')}

Compétences à renforcer
- Techniques: ${technicalSkills}
- Personnelles: ${softSkills}

Conseil personnalisé
Choisis d’abord 2 ou 3 programmes dont le dernier score est inférieur ou proche de ton score, puis compare l’institution, la capacité et le métier cible. Si tu hésites, donne-moi le domaine qui t’intéresse le plus, par exemple informatique, médecine, gestion, droit ou ingénierie, et je te ferai un classement plus précis.`;
  }

  private getArabicDeterministicResponse(
    ragData: FilteredRagData,
    studentData?: StudentData,
  ): string {
    const hasScore =
      typeof studentData?.score === 'number' && Number.isFinite(studentData.score);
    const score = hasScore ? Number(studentData?.score) : 0;
    const scoreText = hasScore ? `${score}` : 'ما عطيتنيش السكور';
    const name = studentData?.name?.trim();
    const greeting = name ? `${name}،` : 'صديقي،';
    const bac = studentData?.bacType || 'موش محدد';
    const fieldName = ragData.field?.field || 'المجال اللي سألت عليه';
    const programs = ragData.programs.slice(0, 3);
    const jobs = ragData.jobs.slice(0, 3);
    const programLines =
      programs
        .map((program, index) => {
          const lastScore = program.matchingBac?.lastScore;
          const scorePart =
            typeof lastScore === 'number' && hasScore
              ? `آخر score ${lastScore}، الفرق ${(score - lastScore).toFixed(2)}`
              : typeof lastScore === 'number'
                ? `آخر score ${lastScore}`
                : 'آخر score موش واضح';

          return `${index + 1}. ${this.getGuideName(program)} - ${program.institution} - ${scorePart}`;
        })
        .join('\n') || 'ما لقيتش فيليات واضحة حسب المعطيات الحالية.';
    const jobLines =
      jobs
        .map(
          (job, index) =>
            `${index + 1}. ${job.title}: تنجم تكون مناسبة إذا تحب ${
              index === 0
                ? 'التطبيق والمشاريع'
                : index === 1
                  ? 'مجال فيه طلب في السوق'
                  : 'تطوير مهاراتك تدريجياً'
            }`,
        )
        .join('\n') || 'كان تحددلي المجال أكثر، نعطيك آفاق مهنية أدق.';

    if (ragData.intent === 'location') {
      return `${greeting} بالنسبة للبلاصة، هاذم أهم الاختيارات اللي لقيتهم:

${programs
  .map(
    (program, index) =>
      `${index + 1}. ${this.getGuideName(program)}: ${this.getInstitutionLocation(
        program.institution,
      )} - ${program.institution}`,
  )
  .join('\n') || 'ما لقيتش مؤسسة واضحة باش نحددلك الولاية.'}

كان تحب الأقرب ليك بالضبط، قلي إنت من أي ولاية.`;
    }

    return `${greeting} نعطيك إجابة مبنية على الداتا اللي عندي.
الباك: ${bac}
السكور: ${scoreText}
المجال: ${fieldName}

الفيلات/الاختيارات الممكنة:
${programLines}

الآفاق المهنية:
${jobLines}

نصيحتي: كان تحب فرص قبول دقيقة، ابعثلي السكور. أما كان تحب تفهم المجال ولا المهن، نجم نعاونك حتى بلا score.`;
  }

  private isValidStructuredResponse(
    response: string,
    ragData: FilteredRagData,
  ): boolean {
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 5) return false;
    if (!/^1\.\s+.+\s+[-—]\s+.+/.test(lines[0] || '')) return false;
    if (!/^2\.\s+.+\s+[-—]\s+.+/.test(lines[1] || '')) return false;
    if (!/^3\.\s+.+\s+[-—]\s+.+/.test(lines[2] || '')) return false;
    if (!/^Advice\s*:/i.test(lines[3] || '')) return false;

    const responseText = this.normalize(response);

    return ragData.jobs
      .slice(0, 3)
      .every((job) => responseText.includes(this.normalize(job.title)));
  }

  private getClarificationResponse(lang: 'fr' | 'ar'): string {
    if (lang === 'fr') {
      return 'Precise ton domaine: informatique, gestion, sante, droit, marketing, ingenierie...';
    }

    return 'وضحلي المجال: إعلامية، تصرف، صحة، قانون، تسويق، هندسة...';
  }

  private getNoAllowedProgramsResponse(
    lang: 'fr' | 'ar',
    studentData?: StudentData,
  ): string {
    const score = studentData?.score ?? 'inconnu';

    if (lang === 'ar') {
      return `Scorek ma ywaselch le hata filière tawa. 7awel t7assen score wala baddel domaine.`;
    }

    return `Ton score n'accede a aucune filiere actuellement. Essaie d'ameliorer ton score ou change de domaine.`;
  }

  private getFallbackResponse(
    studentData?: StudentData,
    lang?: 'fr' | 'ar',
  ): string {
    const filiere = studentData?.selectedFiliere ?? 'la filiere selectionnee';

    if (lang === 'ar') {
      return `الخدمة موش متاحة توا.
بالنسبة لـ ${filiere}، ركز على الأساسيات وعاود جرب بعد شوية.`;
    }

    return `Service IA temporairement indisponible.
Pour ${filiere}, continue avec les fondamentaux et reessaie dans quelques instants.`;
  }

  private getJobIntentTerms(jobTitle: string): string[] {
    const normalizedTitle = this.normalize(jobTitle);

    if (
      normalizedTitle.includes('developpeur') ||
      normalizedTitle.includes('developer') ||
      normalizedTitle.includes('software') ||
      normalizedTitle.includes('web')
    ) {
      return [
        'dev',
        'developpement',
        'developpeur',
        'developer',
        'coding',
        'code',
        'software',
        'full stack',
        'frontend',
        'backend',
        'web',
        'mobile',
        'javascript',
        'react',
        'node',
        'برمجة',
      ];
    }

    if (normalizedTitle.includes('data')) {
      return [
        'data',
        'ai',
        'ia',
        'machine learning',
        'python',
        'statistics',
        'analyse',
        'analyst',
        'ذكاء',
        'بيانات',
      ];
    }

    if (normalizedTitle.includes('support')) {
      return [
        'support',
        'helpdesk',
        'technical support',
        'troubleshooting',
        'hardware',
        'software',
        'network',
      ];
    }

    if (normalizedTitle.includes('cyber')) {
      return [
        'cyber',
        'cybersecurite',
        'security',
        'securite',
        'hacking',
        'network security',
        'linux',
        'حماية',
        'امن',
      ];
    }

    if (
      normalizedTitle.includes('systeme') ||
      normalizedTitle.includes('systems') ||
      normalizedTitle.includes('administrator')
    ) {
      return [
        'systeme',
        'sysadmin',
        'administration',
        'linux',
        'windows server',
        'networking',
        'devops',
        'cloud',
        'reseau',
        'نظم',
        'شبكات',
      ];
    }

    if (
      normalizedTitle.includes('engineer') ||
      normalizedTitle.includes('ingenieur') ||
      normalizedTitle.includes('civil') ||
      normalizedTitle.includes('mechanical') ||
      normalizedTitle.includes('mecanique') ||
      normalizedTitle.includes('electrical') ||
      normalizedTitle.includes('electrique') ||
      normalizedTitle.includes('industrial') ||
      normalizedTitle.includes('production') ||
      normalizedTitle.includes('logistics')
    ) {
      return [
        'engineer',
        'ingenieur',
        'ingenierie',
        'civil',
        'genie civil',
        'mechanical',
        'mecanique',
        'electrical',
        'electrique',
        'industrial',
        'production',
        'logistics',
        'logistique',
      ];
    }

    if (
      normalizedTitle.includes('account') ||
      normalizedTitle.includes('comptable') ||
      normalizedTitle.includes('finance') ||
      normalizedTitle.includes('gestion') ||
      normalizedTitle.includes('audit') ||
      normalizedTitle.includes('sales') ||
      normalizedTitle.includes('commercial') ||
      normalizedTitle.includes('business') ||
      normalizedTitle.includes('administrative') ||
      normalizedTitle.includes('rh')
    ) {
      return [
        'accountant',
        'comptable',
        'accounting',
        'finance',
        'financial analyst',
        'gestion',
        'audit',
        'sales',
        'vente',
        'commercial',
        'business',
        'business developer',
        'administrative officer',
        'rh',
      ];
    }

    if (
      normalizedTitle.includes('doctor') ||
      normalizedTitle.includes('medecin') ||
      normalizedTitle.includes('nurse') ||
      normalizedTitle.includes('infirmier') ||
      normalizedTitle.includes('pharmac') ||
      normalizedTitle.includes('radiology') ||
      normalizedTitle.includes('laboratoire') ||
      normalizedTitle.includes('midwife')
    ) {
      return [
        'doctor',
        'medecin',
        'medical',
        'health',
        'nurse',
        'infirmier',
        'pharmacist',
        'pharmacien',
        'pharmacie',
        'radiology',
        'laboratory technician',
        'technicien laboratoire',
        'midwife',
      ];
    }

    if (
      normalizedTitle.includes('teacher') ||
      normalizedTitle.includes('enseignant') ||
      normalizedTitle.includes('formateur') ||
      normalizedTitle.includes('translator') ||
      normalizedTitle.includes('interpreter') ||
      normalizedTitle.includes('journalist') ||
      normalizedTitle.includes('research')
    ) {
      return [
        'teacher',
        'enseignant',
        'education',
        'formation',
        'translator',
        'interpreter',
        'languages',
        'journalist',
        'researcher',
        'research assistant',
      ];
    }

    if (
      normalizedTitle.includes('law') ||
      normalizedTitle.includes('lawyer') ||
      normalizedTitle.includes('legal') ||
      normalizedTitle.includes('avocat') ||
      normalizedTitle.includes('juriste') ||
      normalizedTitle.includes('notaire') ||
      normalizedTitle.includes('compliance')
    ) {
      return [
        'law',
        'lawyer',
        'legal',
        'legal advisor',
        'avocat',
        'juriste',
        'notaire',
        'compliance officer',
        'public officer',
      ];
    }

    if (
      normalizedTitle.includes('design') ||
      normalizedTitle.includes('artist') ||
      normalizedTitle.includes('graphique') ||
      normalizedTitle.includes('video') ||
      normalizedTitle.includes('interior') ||
      normalizedTitle.includes('ux') ||
      normalizedTitle.includes('ui')
    ) {
      return [
        'design',
        'designer',
        'graphic designer',
        'graphique',
        'artist',
        'video editor',
        'interior designer',
        'ux',
        'ui',
      ];
    }

    return [];
  }

  private getDomainAliasKey(domainName: string): string | undefined {
    const normalizedDomain = this.normalize(domainName);

    if (normalizedDomain.includes('informatique')) return 'informatique';
    if (
      normalizedDomain.includes('gestion') ||
      normalizedDomain.includes('comptabilite')
    )
      return 'gestion';
    if (
      normalizedDomain.includes('ingenierie') ||
      normalizedDomain.includes('mecanique')
    )
      return 'ingenierie';
    if (
      normalizedDomain.includes('commerce') ||
      normalizedDomain.includes('marketing')
    )
      return 'commerce';
    if (
      normalizedDomain.includes('sante') ||
      normalizedDomain.includes('pharmaceutique')
    )
      return 'sante';
    if (
      normalizedDomain.includes('education') ||
      normalizedDomain.includes('formation')
    )
      return 'education';
    if (
      normalizedDomain.includes('tourisme') ||
      normalizedDomain.includes('hotel')
    )
      return 'tourisme';
    if (
      normalizedDomain.includes('droit') ||
      normalizedDomain.includes('administration')
    )
      return 'droit';
    if (
      normalizedDomain.includes('energie') ||
      normalizedDomain.includes('environnement')
    )
      return 'energie';
    if (
      normalizedDomain.includes('logistique') ||
      normalizedDomain.includes('transport')
    )
      return 'logistique';
    if (
      normalizedDomain.includes('arts') ||
      normalizedDomain.includes('design')
    )
      return 'arts';

    return undefined;
  }

  private getMatchedTerms(text: string, terms: string[]): string[] {
    const normalizedText = this.normalize(text);
    const matched = new Set<string>();

    for (const term of terms) {
      const normalizedTerm = this.normalize(term);

      if (normalizedTerm.length < 2) continue;
      if (normalizedText.includes(normalizedTerm)) {
        matched.add(term);
      }
    }

    return [...matched];
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
      .replace(/[’']/g, ' ')
      .toLowerCase()
      .trim();
  }

  private limitLines(text: string, maxLines: number): string {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, maxLines)
      .join('\n');
  }
}
