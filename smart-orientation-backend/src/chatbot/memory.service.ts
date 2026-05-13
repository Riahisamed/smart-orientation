import { Injectable, Logger } from '@nestjs/common';

/**
 * 🧠 CONVERSATIONAL MEMORY SYSTEM
 *
 * Tracks user preferences, avoids repetition, refines recommendations over time.
 * Makes AI behave like a human advisor that remembers and learns.
 */

export type DifficultyPreference = 'easy' | 'medium' | 'challenge' | null;

export type MemoryEntry = {
  timestamp: number;
  message: string;
  extractedData: Partial<ConversationMemory>;
};

export type ConversationMemory = {
  // 🧠 CORE CONVERSATION STATE ENGINE
  domain: string | null;
  subInterest: string | null;
  difficulty: DifficultyPreference;

  // Filtering memory
  rejectedTopics: string[];
  rejectedDomains: string[];
  rejectedTracks: string[];

  // History tracking
  lastQuestionType: string | null;
  alreadyAskedQuestions: string[];
  discussedPrograms: string[];
  discussedJobs: string[];

  // Conversation evolution
  conversationStage:
    | 'intro'
    | 'domain'
    | 'subinterest'
    | 'options'
    | 'decision';
  conversationTurn: number;
  lastSuggestionType: string | null;

  // Legacy fields for backward compatibility
  interest: string | null;
  preferredTrack: string | null;
  preferredJobs: string[];
  preferredFields: string[];
  askedQuestions: string[];
  lastMessages: string[];
  refinementLevel: 'none' | 'field' | 'track' | 'job' | 'decision';

  // Helper signals only; deterministic filters remain authoritative.
  wantsRemote: boolean;
  creativeInterest: boolean;
  fearsUnemployment: boolean;
  prefersFreelance: boolean;
  likesCommunication: boolean;
  analyticalInterest: boolean;
  prefersStability: boolean;
  prefersFlexibility: boolean;
  entrepreneurshipInterest: boolean;
  feelsConfused: boolean;
  feelsStressed: boolean;
  feelsMotivated: boolean;
  feelsExcited: boolean;
};

export type ExtractedIntent = {
  interest?: string;
  difficulty?: DifficultyPreference;
  preferredTrack?: string;
  rejectedTrack?: string;
  preferredJob?: string;
  preferredField?: string;
  isAffirmative?: boolean;
  isNegative?: boolean;
  wantsRemote?: boolean;
  creativeInterest?: boolean;
  fearsUnemployment?: boolean;
  prefersFreelance?: boolean;
  likesCommunication?: boolean;
  analyticalInterest?: boolean;
  prefersStability?: boolean;
  prefersFlexibility?: boolean;
  entrepreneurshipInterest?: boolean;
  feelsConfused?: boolean;
  feelsStressed?: boolean;
  feelsMotivated?: boolean;
  feelsExcited?: boolean;
};

export type FollowUpQuestion = {
  text: string;
  category:
    | 'field_selection'
    | 'track_refinement'
    | 'difficulty_check'
    | 'job_preference'
    | 'confirmation'
    | 'decision';
  priority: number; // Higher = ask first
};

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  // Field detection patterns with multilingual support
  private readonly fieldPatterns: Record<string, RegExp[]> = {
    IT: [
      /\b(informatique|informatia|dev|développement|programmation|web|mobile|data|cyber|cybersécurité|réseau|système|cloud|tech|digital|software|logiciel|database|IA|intelligence artificielle|machine learning)\b/i,
      /\b(برمجة|اعلامية|معلوماتية|شبكات|أمن معلومات|تطوير|ويب|ديف)\b/i,
    ],
    Sport: [
      /\b(sport|sports|activité physique|éducation physique|entraînement|coaching|kinésithérapie|performance|athlétisme|fitness)\b/i,
      /\b(رياضة|تربية بدنية|تدريب|مدرب|علاج طبيعي|أداء رياضي)\b/i,
    ],
    'Medical / Health': [
      /\b(médical|health|santé|médecine|pharmacie|infirmier|infirmière|biologie|biologiste|laboratoire|clinique|hôpital|soins|paramédical)\b/i,
      /\b(طب|صحة|صيدلة|تمريض|بيولوجيا|مختبر|مستشفى)\b/i,
    ],
    Business: [
      /\b(business|gestion|management|comptabilité|finance|audit|ressources humaines|RH|marketing|commerce|économie|administration)\b/i,
      /\b(أعمال|إدارة|محاسبة|مالية|تصرف|تجارة|تسويق)\b/i,
    ],
    Engineering: [
      /\b(engineering|ingénierie|ingénieur|génie|mécanique|civil|électrique|électronique|industriel|production|énergie|automatisme)\b/i,
      /\b(هندسة|مهندس|مدني|ميكانيك|كهرباء|إلكترونيك|صناعة)\b/i,
    ],
    Art: [
      /\b(art|design|graphisme|architecture|création|mode|fashion|multimédia|audiovisuel|cinéma|musique|beaux-arts|illustration)\b/i,
      /\b(فن|تصميم|عمارة|أزياء|موسيقى|سينما|جرافيك)\b/i,
    ],
    Science: [
      /\b(science|recherche|laboratoire|chimie|physique|biologie|mathématiques|environnement|agronomie|géologie)\b/i,
      /\b(علوم|كيمياء|فيزياء|أحياء|رياضيات|بحث علمي)\b/i,
    ],
    Education: [
      /\b(éducation|enseignement|formation|pédagogie|professeur|enseignant|maître|éducateur|école|université)\b/i,
      /\b(تربية|تعليم|أستاذ|مدرس|تكوين)\b/i,
    ],
    Law: [
      /\b(law|droit|justice|avocat|notaire|juriste|légal|magistrat|juge|tribunal|réglementation|compliance|contentieux)\b/i,
      /\b(قانون|عدالة|محامي|قاضي|محكمة|قضاء)\b/i,
    ],
  };

  // Track refinement patterns
  private readonly trackPatterns: Record<string, Record<string, RegExp[]>> = {
    IT: {
      web: [
        /\b(web|frontend|backend|fullstack|javascript|react|angular|vue|html|css)\b/i,
        /\b(ويب|واجهة|مواقع)\b/i,
      ],
      data: [
        /\b(data|données|analyse|science|machine learning|AI|IA|big data|statistics)\b/i,
        /\b(بيانات|تحليل|ذكاء اصطناعي)\b/i,
      ],
      cyber: [
        /\b(cyber|sécurité|security|hacking|protection|réseau|network|pentest)\b/i,
        /\b(أمن|حماية|شبكات|اختراق)\b/i,
      ],
      mobile: [
        /\b(mobile|android|ios|swift|kotlin|react native|flutter|app)\b/i,
        /\b(موبايل|تطبيقات)\b/i,
      ],
      devops: [
        /\b(devops|cloud|aws|azure|docker|kubernetes|infrastructure|ci\/cd)\b/i,
        /\b(سحابة|بنية تحتية)\b/i,
      ],
    },
    Sport: {
      coaching: [
        /\b(coach|entraîneur|fitness|personal trainer|gym)\b/i,
        /\b(مدرب|تدريب شخصي|جيم)\b/i,
      ],
      kine: [
        /\b(kiné|kinésithérapie|physiothérapie|rééducation|réhabilitation)\b/i,
        /\b(علاج طبيعي|تأهيل)\b/i,
      ],
      performance: [
        /\b(performance|préparateur|athlète|compétition|high level)\b/i,
        /\b(أداء|رياضي محترف)\b/i,
      ],
      management: [
        /\b(gestion sportive|manager|directeur|club|organisation)\b/i,
        /\b(إدارة رياضية|نادي)\b/i,
      ],
    },
    'Medical / Health': {
      pharmacy: [
        /\b(pharmacie|pharmacien|médicament|officine)\b/i,
        /\b(صيدلية|صيدلي|دواء)\b/i,
      ],
      nursing: [
        /\b(infirmier|soignant|patient|hôpital|clinique)\b/i,
        /\b(تمريض|ممرض|مستشفى)\b/i,
      ],
      lab: [
        /\b(laboratoire|biologie|analyse|technicien|test)\b/i,
        /\b(مختبر|تحاليل)\b/i,
      ],
      medicine: [
        /\b(médecin|docteur|spécialiste|diagnostic|traitement)\b/i,
        /\b(طبيب|دكتور|اختصاصي)\b/i,
      ],
    },
  };

  // Difficulty patterns
  private readonly difficultyPatterns = {
    easy: [
      /\b(simple|facile|easy|pas difficile|sahla|سهلة|بسيط|خفيف|accessible)\b/i,
    ],
    challenge: [
      /\b(difficile|hard|challenge|exigeant|complexe|ambitieux|صعبة|تحدي|صعب|قوي|متقدم)\b/i,
    ],
  };

  // Rejection patterns
  private readonly rejectionPatterns = [
    /\b(non|no|ma|لا|ما|ma nahib|ma nheb|pas|not|dislike|na7ebch|نحبش)\b/i,
  ];

  // Affirmation patterns
  private readonly affirmationPatterns = [
    /\b(yes|oui|aam|نعم|nheb|نحب|حاب|interested|yes please|ok|d'accord|موافق)\b/i,
  ];

  // Follow-up question chains by field and refinement level
  private readonly followUpChains: Record<string, Record<string, string[]>> = {
    IT: {
      field: [
        'dev ولا réseaux؟',
        'web ولا data؟',
        'programmation ولا sécurité؟',
      ],
      track: [
        'frontend ولا backend؟',
        'mobile ولا web؟',
        'cloud ولا on-premise؟',
      ],
      difficulty: [
        'حاجة سهلة ولا تحدي؟',
        'تنجم تتعلم fast ولا تحب deep learning؟',
      ],
    },
    Sport: {
      field: ['coaching ولا kiné؟', 'performance ولا management؟'],
      track: ['équipe sportive ولا clinique؟', 'individuel ولا collectif؟'],
      difficulty: ['entraînement intensif ولا light؟'],
    },
    'Medical / Health': {
      field: ['médecine ولا paramédical؟', 'pharmacie ولا infirmier؟'],
      track: ['hôpital ولا clinique privée؟', 'recherche ولا pratique؟'],
      difficulty: ['études longues ولا rapide؟'],
    },
    Business: {
      field: ['finance ولا marketing؟', 'comptabilité ولا management؟'],
      track: ['entreprise ولا cabinet؟', 'startup ولا grande boite؟'],
      difficulty: ['stable ولا risk؟'],
    },
    Engineering: {
      field: ['mécanique ولا électrique؟', 'civil ولا industriel؟'],
      track: ['conception ولا production؟', 'bureau ولا chantier؟'],
      difficulty: ['technique pur ولا management؟'],
    },
    default: {
      field: ['شنو المجال اللي يهمك أكثر؟', 'تحب نتعمق في شنو بالضبط؟'],
      track: ['تحب تتخصص في شنو؟', 'أي direction بالضبط؟'],
      difficulty: ['تفضل حاجة سهلة ولا challenge؟'],
    },
  };

  /**
   * Initialize empty memory
   */
  initializeMemory(): ConversationMemory {
    return {
      // New state engine
      domain: null,
      subInterest: null,
      difficulty: null,
      rejectedTopics: [],
      rejectedDomains: [],
      lastQuestionType: null,
      alreadyAskedQuestions: [],
      discussedPrograms: [],
      discussedJobs: [],
      conversationStage: 'intro',
      conversationTurn: 0,
      lastSuggestionType: null,

      // Legacy compatibility
      interest: null,
      preferredTrack: null,
      rejectedTracks: [],
      preferredJobs: [],
      preferredFields: [],
      askedQuestions: [],
      lastMessages: [],
      refinementLevel: 'none',
      wantsRemote: false,
      creativeInterest: false,
      fearsUnemployment: false,
      prefersFreelance: false,
      likesCommunication: false,
      analyticalInterest: false,
      prefersStability: false,
      prefersFlexibility: false,
      entrepreneurshipInterest: false,
      feelsConfused: false,
      feelsStressed: false,
      feelsMotivated: false,
      feelsExcited: false,
    };
  }

  /**
   * 🧠 AUTO-EXTRACT MEMORY from user message
   * This is the core intelligence - understanding what user wants
   */
  extractFromMessage(
    message: string,
    currentMemory: ConversationMemory,
  ): ExtractedIntent {
    const extracted: ExtractedIntent = {};
    const normalized = message.toLowerCase();

    // 1. Detect interest (field)
    for (const [field, patterns] of Object.entries(this.fieldPatterns)) {
      if (patterns.some((p) => p.test(normalized))) {
        extracted.interest = field;
        this.logger.log(`[MEMORY] Detected interest: ${field}`);
        break;
      }
    }

    // 2. Detect difficulty preference
    if (this.difficultyPatterns.easy.some((p) => p.test(normalized))) {
      extracted.difficulty = 'easy';
      this.logger.log('[MEMORY] Detected difficulty: easy');
    } else if (
      this.difficultyPatterns.challenge.some((p) => p.test(normalized))
    ) {
      extracted.difficulty = 'challenge';
      this.logger.log('[MEMORY] Detected difficulty: challenge');
    }

    // 3. Detect track refinement (if interest is known)
    const interest = extracted.interest || currentMemory.interest;
    if (interest && this.trackPatterns[interest]) {
      for (const [track, patterns] of Object.entries(
        this.trackPatterns[interest],
      )) {
        if (patterns.some((p) => p.test(normalized))) {
          extracted.preferredTrack = track;
          this.logger.log(`[MEMORY] Detected track: ${track}`);
          break;
        }
      }
    }

    // 4. Detect rejection
    if (this.rejectionPatterns.some((p) => p.test(normalized))) {
      // Check what is being rejected
      for (const [field, patterns] of Object.entries(this.fieldPatterns)) {
        if (patterns.some((p) => p.test(normalized))) {
          extracted.rejectedTrack = field;
          this.logger.log(`[MEMORY] Detected rejection: ${field}`);
          break;
        }
      }

      // Check track rejection
      if (interest && this.trackPatterns[interest]) {
        for (const [track, patterns] of Object.entries(
          this.trackPatterns[interest],
        )) {
          if (patterns.some((p) => p.test(normalized))) {
            extracted.rejectedTrack = track;
            this.logger.log(`[MEMORY] Detected track rejection: ${track}`);
            break;
          }
        }
      }
    }

    // 5. Detect affirmation/interest in specific job
    if (this.affirmationPatterns.some((p) => p.test(normalized))) {
      extracted.isAffirmative = true;
    }

    const semanticSignals: Array<[keyof ExtractedIntent, RegExp[]]> = [
      [
        'wantsRemote',
        [
          /\b(remote|a distance|distance|teletravail|t[eé]l[eé]travail|online|en ligne|men dar|mil dar)\b/i,
        ],
      ],
      [
        'creativeInterest',
        [
          /\b(creatif|creative|creation|design|art|graphique|contenu|content|ecriture|writing|nheb nokhleq|n7eb nokhleq)\b/i,
        ],
      ],
      [
        'fearsUnemployment',
        [
          /\b(chomage|ch[oô]mage|batala|bitala|n5af|nkhaf|peur|khayef|sans travail|ma nal9ach khedma)\b/i,
        ],
      ],
      [
        'prefersFreelance',
        [
          /\b(freelance|independant|ind[eé]pendant|startup|projet prive|projet priv[eé]|nkhdem wa7di|wahdi)\b/i,
        ],
      ],
      [
        'likesCommunication',
        [
          /\b(communication|communiquer|parler|presentation|journalisme|media|relation|public|client|social)\b/i,
        ],
      ],
      [
        'analyticalInterest',
        [
          /\b(analyse|analytical|logique|data|math|statistique|problem solving|raisonnement)\b/i,
        ],
      ],
      [
        'prefersStability',
        [
          /\b(stable|stabilite|stabilit[eé]|securite|s[eé]curit[eé]|risque faible|chomage)\b/i,
        ],
      ],
      [
        'prefersFlexibility',
        [
          /\b(flexible|flexibilite|liberte|libert[eé]|remote|freelance|horaire)\b/i,
        ],
      ],
      [
        'entrepreneurshipInterest',
        [
          /\b(entrepreneur|startup|business prive|projet prive|projet priv[eé]|ma boite|societe)\b/i,
        ],
      ],
      [
        'feelsConfused',
        [
          /\b(daye3|daya3|perdu|confus|ma3rftech|ma na3rafch|je sais pas|hesitant|h[eé]sitant)\b/i,
        ],
      ],
      [
        'feelsStressed',
        [/\b(stress|stresse|stress[eé]|pression|mbambi|panique|nervous)\b/i],
      ],
      [
        'feelsMotivated',
        [
          /\b(motive|motiv[eé]|nhareth|n7areth|determined|ambitieux|bch nekhdem)\b/i,
        ],
      ],
      [
        'feelsExcited',
        [/\b(excited|enthousiaste|farhan|rtaht|content|happy|hamdullah)\b/i],
      ],
    ];

    for (const [key, patterns] of semanticSignals) {
      if (patterns.some((pattern) => pattern.test(normalized))) {
        (extracted as any)[key] = true;
      }
    }

    return extracted;
  }

  /**
   * 📝 UPDATE MEMORY with extracted data
   */
  updateMemory(
    currentMemory: ConversationMemory,
    extracted: ExtractedIntent,
    message: string,
  ): ConversationMemory {
    const updated = { ...currentMemory };

    // Update conversation tracking
    updated.conversationTurn++;
    updated.lastMessages = [...updated.lastMessages, message].slice(-5);

    // Update interest (ONLY if explicitly stated, not overriding)
    if (extracted.interest) {
      updated.interest = extracted.interest;
      updated.refinementLevel = 'field';

      // Track in preferred fields
      if (!updated.preferredFields.includes(extracted.interest)) {
        updated.preferredFields.push(extracted.interest);
      }
    }

    // Update difficulty
    if (extracted.difficulty) {
      updated.difficulty = extracted.difficulty;
    }

    // Update preferred track
    if (extracted.preferredTrack) {
      updated.preferredTrack = extracted.preferredTrack;
      updated.refinementLevel = 'track';
    }

    if (extracted.wantsRemote) updated.wantsRemote = true;
    if (extracted.creativeInterest) updated.creativeInterest = true;
    if (extracted.fearsUnemployment) updated.fearsUnemployment = true;
    if (extracted.prefersFreelance) updated.prefersFreelance = true;
    if (extracted.likesCommunication) updated.likesCommunication = true;
    if (extracted.analyticalInterest) updated.analyticalInterest = true;
    if (extracted.prefersStability) updated.prefersStability = true;
    if (extracted.prefersFlexibility) updated.prefersFlexibility = true;
    if (extracted.entrepreneurshipInterest)
      updated.entrepreneurshipInterest = true;
    if (extracted.feelsConfused) updated.feelsConfused = true;
    if (extracted.feelsStressed) updated.feelsStressed = true;
    if (extracted.feelsMotivated) updated.feelsMotivated = true;
    if (extracted.feelsExcited) updated.feelsExcited = true;

    // Handle rejection
    if (extracted.rejectedTrack) {
      if (!updated.rejectedTopics.includes(extracted.rejectedTrack)) {
        updated.rejectedTopics.push(extracted.rejectedTrack);
        this.logger.log(
          `[MEMORY] Added to rejected tracks: ${extracted.rejectedTrack}`,
        );
      }
    }

    // Update refinement level based on state
    if (updated.preferredTrack && updated.difficulty) {
      updated.refinementLevel = 'job';
    } else if (updated.preferredTrack) {
      updated.refinementLevel = 'track';
    } else if (updated.interest) {
      updated.refinementLevel = 'field';
    }

    this.logger.log(
      `[MEMORY] Updated - interest: ${updated.interest}, track: ${updated.preferredTrack}, difficulty: ${updated.difficulty}, refinement: ${updated.refinementLevel}`,
    );

    return updated;
  }

  /**
   * ❌ TRACK ASKED QUESTION (to avoid repetition)
   */
  trackQuestion(
    memory: ConversationMemory,
    question: string,
  ): ConversationMemory {
    const normalizedQuestion = question.toLowerCase().trim();

    if (!memory.askedQuestions.includes(normalizedQuestion)) {
      memory.askedQuestions.push(normalizedQuestion);
      this.logger.log(
        `[MEMORY] Tracked new question: ${question.substring(0, 50)}...`,
      );
    }

    return memory;
  }

  /**
   * 🔍 CHECK IF QUESTION WAS ALREADY ASKED
   */
  wasQuestionAsked(memory: ConversationMemory, question: string): boolean {
    const normalizedQuestion = question.toLowerCase().trim();
    return memory.askedQuestions.some(
      (q) =>
        q.toLowerCase().includes(normalizedQuestion) ||
        normalizedQuestion.includes(q.toLowerCase()),
    );
  }

  /**
   * 🎯 GENERATE DYNAMIC FOLLOW-UP QUESTION
   * Based on memory state - avoids repetition
   */
  generateFollowUp(
    memory: ConversationMemory,
    language: 'fr' | 'ar' = 'fr',
  ): FollowUpQuestion {
    const {
      interest,
      preferredTrack,
      difficulty,
      refinementLevel,
      rejectedTracks,
      askedQuestions,
    } = memory;

    // Determine which chain to use
    const chains =
      (interest && this.followUpChains[interest]) ||
      this.followUpChains['default'];

    // Determine which level to ask about
    let targetLevel: string;
    let category: FollowUpQuestion['category'];

    if (!interest) {
      targetLevel = 'field';
      category = 'field_selection';
    } else if (!preferredTrack && refinementLevel !== 'track') {
      targetLevel = 'field'; // Ask about track within field
      category = 'track_refinement';
    } else if (!difficulty) {
      targetLevel = 'difficulty';
      category = 'difficulty_check';
    } else {
      targetLevel = 'track';
      category = 'confirmation';
    }

    // Get questions for this level
    const questions = chains[targetLevel] ||
      this.followUpChains['default'][targetLevel] || ['شنو تحب تعرف أكثر؟'];

    // Find first question NOT already asked
    const askedList = askedQuestions.map((q) => q.toLowerCase());

    for (const question of questions) {
      const normalizedQ = question.toLowerCase();
      // Check if similar question was asked
      let wasAsked = false;
      for (const asked of askedList) {
        if (
          asked.includes(normalizedQ.substring(0, 10)) ||
          normalizedQ.includes(asked.substring(0, 10))
        ) {
          wasAsked = true;
          break;
        }
      }

      if (!wasAsked) {
        return {
          text: `👉 ${question}`,
          category,
          priority: this.getQuestionPriority(category),
        };
      }
    }

    // All questions asked - generate generic follow-up
    return {
      text:
        language === 'ar'
          ? '👉 تحب نبدأ نختار البرنامج الأفضل؟'
          : '👉 Prêt à choisir le meilleur programme ?',
      category: 'decision',
      priority: 10,
    };
  }

  private getQuestionPriority(category: FollowUpQuestion['category']): number {
    const priorities: Record<FollowUpQuestion['category'], number> = {
      field_selection: 100,
      track_refinement: 80,
      difficulty_check: 60,
      job_preference: 40,
      confirmation: 20,
      decision: 10,
    };
    return priorities[category] || 50;
  }

  /**
   * 🎭 GET MEMORY SUMMARY for AI prompt
   */
  getMemorySummary(memory: ConversationMemory): string {
    const parts: string[] = [];

    if (memory.interest) {
      parts.push(`Domaine: ${memory.interest}`);
    }
    if (memory.preferredTrack) {
      parts.push(`Spécialité: ${memory.preferredTrack}`);
    }
    if (memory.difficulty) {
      parts.push(
        `Préférence: ${memory.difficulty === 'easy' ? 'facile' : 'challenge'}`,
      );
    }
    if (memory.rejectedTracks.length > 0) {
      parts.push(`À éviter: ${memory.rejectedTracks.join(', ')}`);
    }
    if (memory.preferredFields.length > 0) {
      parts.push(`Intérêts: ${memory.preferredFields.join(', ')}`);
    }
    const signals = [
      memory.wantsRemote ? 'remote' : undefined,
      memory.creativeInterest ? 'creatif' : undefined,
      memory.fearsUnemployment ? 'peur chomage' : undefined,
      memory.prefersFreelance ? 'freelance' : undefined,
      memory.likesCommunication ? 'communication' : undefined,
      memory.analyticalInterest ? 'analytique' : undefined,
      memory.prefersStability ? 'stabilite' : undefined,
      memory.prefersFlexibility ? 'flexibilite' : undefined,
      memory.entrepreneurshipInterest ? 'entrepreneuriat' : undefined,
      memory.feelsConfused ? 'confusion' : undefined,
      memory.feelsStressed ? 'stress' : undefined,
      memory.feelsMotivated ? 'motivation' : undefined,
      memory.feelsExcited ? 'enthousiasme' : undefined,
    ].filter(Boolean);
    if (signals.length > 0) {
      parts.push(`Signaux: ${signals.slice(0, 3).join(', ')}`);
    }

    return parts.join(' | ') || 'Nouveau utilisateur - aucune préférence';
  }

  /**
   * 🧹 CLEAR MEMORY (for new conversation)
   */
  clearMemory(): ConversationMemory {
    return this.initializeMemory();
  }

  /**
   * 💾 SERIALIZE memory for storage
   */
  serialize(memory: ConversationMemory): string {
    return JSON.stringify(memory);
  }

  /**
   * 📂 DESERIALIZE memory from storage
   */
  deserialize(data: string): ConversationMemory {
    try {
      return JSON.parse(data) as ConversationMemory;
    } catch {
      return this.initializeMemory();
    }
  }
}
