import { Injectable } from '@nestjs/common';

export type AdvisorIntent =
  | 'ask_programs'    // أي تخصص, شنوّا نقرا, أي fac
  | 'ask_jobs'        // شنوّا خدمة, فرص العمل, job carrière
  | 'ask_skills'      // شنوّا skills, لازم نتعلم, compétences
  | 'ask_comparison'  // ولا, vs, مقارنة, خير بين
  | 'ask_roadmap'     // كيفاش نبدأ, roadmap, تعلم
  | 'ask_salary'      // قداش نخلص, salaire, نجم نخلص
  | 'rejection'       // ما نحبش X
  | 'greeting'        // سلام, bonjour
  | 'general';

@Injectable()
export class IntentDetectorService {

  detectIntent(message: string): AdvisorIntent {
    const normalized = message.toLowerCase().trim();
    if (!normalized) return 'general';

    // ============================================================
    // 1. REJECTION — ما نحبش X
    // ============================================================
    if (/ما نحبش|مانحبش|manhebch|ma nhebch|ma n7ebch|موش|مش/i.test(normalized)) {
      return 'rejection';
    }

    // ============================================================
    // 2. GREETING
    // ============================================================
    if (/^(salut|bonjour|hello|hi|hey|صباح|مساء|سلام|بienvenue|اهلا|bienvenue)/i.test(normalized)) {
      return 'greeting';
    }

    // ============================================================
    // 3. COMPARISON (highest priority after greeting/rejection)
    //    طب أو صيدلة, web ولا data, cyber vs dev, مقارنة
    // ============================================================
    if (this.isComparison(normalized)) {
      return 'ask_comparison';
    }

    // ============================================================
    // 4. SALARY QUESTIONS
    //    قداش نجم نخلص, salaire cyber, freelance web salaire
    // ============================================================
    if (this.hasAnyWord(normalized, [
      'salaire', 'salary', 'pay', 'paid', 'remuneration', 'rémunération',
      'نخلص', 'ناخذ', 'قداش', 'فلوس', 'أجور', 'اجور', 'راتب', 'مرتب',
      'combien', 'how much',
    ])) {
      return 'ask_salary';
    }

    // ============================================================
    // 5. JOB / CAREER QUESTIONS (BEFORE skills)
    //    carrière, débouchés, métiers, opportunités, travail
    //    شنوّا خدمة cyber, فرص العمل في الصحة
    // ============================================================
    if (this.isJobQuestion(normalized)) {
      return 'ask_jobs';
    }

    // ============================================================
    // 6. SKILLS QUESTIONS
    //    skills, لازم نتعلم, frontend, backend, technologies
    // ============================================================
    if (this.isSkillsQuestion(normalized)) {
      return 'ask_skills';
    }

    // ============================================================
    // 7. ROADMAP QUESTIONS
    //    كيفاش نبدأ, roadmap cyber, تعلم web step by step
    // ============================================================
    if (this.isRoadmapQuestion(normalized)) {
      return 'ask_roadmap';
    }

    // ============================================================
    // 8. PROGRAM QUESTIONS (default orientation)
    //    أي تخصص إعلامية, شنوّا نقرا في santé, أي fac مع معدلي
    // ============================================================
    if (this.isProgramQuestion(normalized)) {
      return 'ask_programs';
    }

    if (/\b(score|moyenne|fg)\b.*\b(chnowa|najem|faire|choisir|orientation|programme|filiere)\b/i.test(normalized)) {
      return 'ask_programs';
    }

    // ============================================================
    // 9. DEFAULT — general
    // ============================================================
    return 'general';
  }

  // ============================================================
  // DETECTION HELPERS
  // ============================================================

  private hasAnyWord(text: string, words: string[]): boolean {
    return words.some(w => text.includes(w));
  }

  /**
   * Detect comparison: ولا / ou / أو / vs / مقارنة / خير
   */
  private isComparison(text: string): boolean {
    // Direct comparison words
    const comparisonWords = [
      'مقارنة', 'قارن', 'فرق', 'différence', 'difference',
      'comparer', 'comparaison', 'compar', 'comparison',
      'vs', 'versus',
    ];
    if (comparisonWords.some(w => text.includes(w))) return true;

    // ولا / ou / أو / wala pattern: "X ولا Y", "X ou Y", "X أو Y"
    const twoItemSeparator = /(.+\s+(ولا|ou|أو|او|wala|walou|or|vs)\s+.+)/i;
    if (twoItemSeparator.test(text)) return true;

    // خير بين / أفضل بين
    if (/(خير\s+بين|أفضل\s+بين|افضل\s+بين|a7sen\s+bin|ahsen\s+bin|meilleur\s+entre)/i.test(text)) return true;

    return false;
  }

  /**
   * Detect job/career questions:
   * carrière, débouchés, métiers, opportunités, travail
   * شنوّا خدمة, job, métier, فرص العمل
   */
  private isJobQuestion(text: string): boolean {
    // PART 3: Career terms MUST trigger ask_jobs
    // These are checked BEFORE skills to prevent "carrière en technologie" → ask_skills
    const careerKeywords = [
      // French career terms
      'carrière', 'carriere',
      'débouchés', 'debouches', 'débouché', 'debouche',
      'métiers', 'metiers', 'métier', 'metier',
      'opportunités', 'opportunites', 'opportunité', 'opportunite',
      'travail',
      // Arabic career terms
      'خدمة', 'يخدم', 'خدم', 'مهنة', 'مهني', 'شغلة', 'شغل', 'وظيفة', 'وظف',
      'فرص العمل', 'فرص', 'آفاق', 'افاق', 'مستقبل مهني', 'سوق العمل',
      // French
      'job', 'emploi', 'avenir professionnel',
      'profession',
      // English
      'career', 'occupation', 'work as',
    ];
    if (careerKeywords.some(w => text.includes(w))) return true;

    // Pattern: شنوّا + خدمة/يخدم + job title
    if (/شنو[ّاا]?\s+(خدمة|يخدم|خدم)/i.test(text)) return true;

    // "tell me about" + job title
    if (/\b(tell\s+me\s+about|parle[-\s]?moi\s+(du|de\s+la|des?)|décris|décrire|describe)\s+/i.test(text)) return true;

    // "c'est quoi le métier de" / "c'est quoi le travail de"
    if (/(c[']est\s+quoi|c[']est\s+comment|qu[']est-ce\s+que)\s+(le\s+)?(m[ée]tier|travail|job|profession)/i.test(text)) return true;

    // Specific job title mention: "data scientist chnowa yaamel", "cybersecurity شنو"
    if (/(data\s+scientist|cyber|cybersécurité|développeur|developpeur|web\s+developer|fullstack|data\s+analyst|data\s+engineer|devops)\s*(c[']est|هو|hiya|شنو|شنوا|اشنو)/i.test(text)) return true;

    return false;
  }

  /**
   * Detect skills questions: skills, لازم نتعلم, frontend, backend, technologies, stack, compétences
   */
  private isSkillsQuestion(text: string): boolean {
    const skillsKeywords = [
      // Arabic
      'مهارات', 'المهارات', 'skill', 'skills',
      'لازم نتعلم', 'لازم نتعلم', 'lazem n\'tallem', 'lazem nt3alem',
      'necessary', 'obligatoire', 'مطلوب', 'المطلوب', 'اللازم',
      'تقنيات', 'أدوات', 'ادوات', 'تكنولوجيات',
      // French
      'compétence', 'compétence', 'competence', 'compétences', 'competences',
      'technologie', 'technologies', 'stack', 'stack technique',
      'tool', 'tools', 'outil', 'outils',
      'savoir', 'connaissance', 'connaissances',
      'prérequis', 'prerequis', 'pré-requis',
      // English
      'skill required', 'skill needed', 'required skill',
      'what to learn', 'what should i learn', 'what do i need',
      // Specific tech skills
      'frontend', 'front-end', 'backend', 'back-end',
      'fullstack', 'full-stack',
    ];
    if (skillsKeywords.some(w => text.includes(w))) return true;

    // "شنوّا لازم" pattern
    if (/شنو[ّاا]?\s+لازم/i.test(text)) return true;

    // "lazem" + something like frontend/backend/web
    if (/lazem\s+(n[^ ]+|frontend|backend|web|data)/i.test(text)) return true;

    return false;
  }

  /**
   * Detect roadmap questions: كيفاش نبدأ, تعلم, roadmap, step by step
   */
  private isRoadmapQuestion(text: string): boolean {
    const roadmapKeywords = [
      // Arabic
      'كيفاش', 'كيفاه', 'كيف', 'منين نبدأ', 'منين نبدا',
      'نبدأ', 'نبدا', 'ابدأ', 'ابدا', 'بديت',
      'تعلم', 'نتعلم', 'n\'apprends', 'تتعلم', 'يتعلم', 'تعليم',
      'خطة', 'خطوات', 'خطوة', 'مراحل', 'مسار',
      // French
      'roadmap', 'plan', 'étape', 'etape', 'étapes', 'etapes',
      'apprendre', 'formation', 'cursus', 'parcours',
      'comment commencer', 'par où', 'par ou',
      'step by step', 'step', 'steps',
      'guide', 'tutorial', 'tuto',
      // English
      'how to', 'how to start', 'learning path', 'path',
    ];
    return roadmapKeywords.some(w => text.includes(w));
  }

  /**
   * Detect program/university questions: أي تخصص, شنوّا نقرا, أي fac, برنامج
   */
  private isProgramQuestion(text: string): boolean {
    // Direct program keywords (check first)
    const directProgramKeywords = [
      'تخصص', 'filière', 'filiere', 'fac', 'مدرسة', 'école', 'ecole',
      'جامعة', 'université', 'universite',
      'orientation', 'توجيه',
      'programme', 'برنامج', 'برامج',
      'نقرا', 'ندير', 'نعمل', 'نختار',
      'informatique', 'إعلامية', 'اعلامية',
      'santé', 'sante', 'صحة',
      'ingénieur', 'ingenieur', 'مهندس',
    ];
    if (directProgramKeywords.some(w => text.includes(w))) return true;

    // Arabic choosing patterns
    if (/شنو[ّاا]?\s+(نقرا|ندير|نعمل|نختار|نحط|نعيش|programme|filiere|faculté|université)/i.test(text)) return true;
    if (/شني?\s+(نقرا|ندير|نعمل|نختار)/i.test(text)) return true;
    if (/شنو[ّاا]?\s+(الجامعة|البرنامج|التخصص|الفيلار|المجال|lprogramme|filiere|specialite|fac)/i.test(text)) return true;

    // "أي" + keyword: أي تخصص, أي fac, أي جامعة
    if (/أي\s+(تخصص|fac|fili[èe]re|universit[ée]|programme|مدرسة|جامعة)/i.test(text)) return true;
    if (/اي\s+(تخصص|fac|fili[èe]re|universit[ée]|programme|مدرسة|جامعة)/i.test(text)) return true;

    // "نحب X" — interest in a field
    if (/نحب\s+(informatique|sport|طب|صحة|تجارة|فن|رياضة|تكنولوجيا|انفورماتيك|معلومية|اعلامية)/i.test(text)) return true;
    if (/nheb\s+(info|informatique|informatia|sport|tech|it|medecine|commerce|art)/i.test(text)) return true;
    if (/حاب\s+(informatique|sport|طب|صحة|فن|تجارة)/i.test(text)) return true;

    // "تنصحني", "شنو تنصحني", "nansahni"
    if (/(شنو|شنوا)?\s*(تنصحني|nansahni|ansahni|نصحني)/i.test(text)) return true;

    // French choosing patterns
    if (/(que\s+)?(choisir|programme|fili[èe]re|quel\s+domaine|quel\s+programme)/i.test(text)) return true;
    if (/je\s+(veux|voudrais|cherche)\s+(choisir|faire|un\s+programme|une\s+fili[èe]re)/i.test(text)) return true;
    if (/j[']aime\s+(l[']informatique|le\s+sport|la\s+sant[ée]|les\s+affaires)/i.test(text)) return true;

    // Direct field mention as interest (positive, no question words)
    const domainTerms = [
      'info', 'informatique', 'informatia', 'it', 'tech',
      'sport', 'santé', 'sante', 'medecine', 'médecine',
      'business', 'commerce', 'gestion', 'finance',
      'art', 'design', 'architecture',
      'برمجة', 'رياضة', 'طب', 'صحة', 'تجارة', 'فن',
    ];
    if (domainTerms.some(t => text.includes(t))) {
      // Make sure it's not a job/rejection/roadmap/skills question
      if (!this.isJobQuestion(text) && !this.isRoadmapQuestion(text) && !this.isSkillsQuestion(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract keywords with categories from a message
   */
  extractKeywords(message: string): { category: string; value: string }[] {
    const normalized = message.toLowerCase().trim();
    const results: { category: string; value: string }[] = [];

    const domainMap: Record<string, string[]> = {
      tech: ['info', 'informatique', 'informatia', 'dev', 'développement', 'programmation',
        'software', 'réseau', 'reseau', 'cyber', 'data', 'ia', 'ai', 'it', 'tech',
        'coding', 'برمجة', 'تكنولوجيا', 'ديف', 'اعلامية', 'معلوماتية', 'web', 'mobile'],
      sport: ['sport', 'kiné', 'kine', 'football', 'basket', 'tennis', 'رياضة', 'سبور', 'تدريب',
        'coaching', 'fitness', 'eps'],
      health: ['médecine', 'medecine', 'santé', 'sante', 'pharmacie', 'infirmier', 'dentaire',
        'طب', 'صحة', 'تمريض', 'صيدلة', 'علاج'],
      business: ['business', 'gestion', 'commerce', 'finance', 'marketing', 'économie', 'economie',
        'comptabilité', 'comptabilite', 'تجارة', 'أعمال', 'محاسبة', 'ادارة', 'إدارة'],
      art: ['art', 'design', 'architecture', 'graphisme', 'mode', 'cinéma', 'musique',
        'فن', 'تصميم', 'عمارة', 'فنون'],
      engineering: ['ingénieur', 'ingenieur', 'génie', 'genie', 'mécanique', 'mecanique',
        'électrique', 'electrique', 'civil', 'production', 'هندسة', 'مهندس', 'مدني', 'ميكانيك'],
      media: ['média', 'media', 'audiovisuel', 'journalisme', 'communication', 'cinéma', 'cinema',
        'إعلام', 'صحافة', 'اتصال', 'إذاعة', 'تلفزة'],
      science: ['science', 'physique', 'chimie', 'biologie', 'recherche', 'laboratoire',
        'علوم', 'كيمياء', 'فيزياء', 'أحياء', 'مختبر'],
      law: ['droit', 'law', 'juridique', 'avocat', 'justice', 'قانون', 'عدالة', 'محامي', 'قضاء'],
      economy: ['économie', 'economie', 'banque', 'finance', 'investissement', 'بورصة', 'بنوك', 'اقتصاد'],
      education: ['éducation', 'education', 'enseignement', 'professeur', 'formation', 'pédagogie',
        'تربية', 'تعليم', 'أستاذ', 'مدرس', 'تكوين'],
    };

    for (const [domain, keywords] of Object.entries(domainMap)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          results.push({ category: 'field', value: domain });
          break;
        }
      }
    }

    return results;
  }

  /**
   * Detect domain from message
   */
  detectDomain(message: string): string | null {
    const normalized = message.toLowerCase().trim();
    if (!normalized) return null;

    const domainMap: Record<string, string[]> = {
      tech: ['info', 'informatique', 'informatia', 'dev', 'développement', 'programmation',
        'software', 'réseau', 'reseau', 'cyber', 'data', 'ia', 'ai', 'it', 'tech',
        'coding', 'برمجة', 'تكنولوجيا', 'ديف', 'اعلامية', 'معلوماتية', 'web', 'mobile'],
      sport: ['sport', 'kiné', 'kine', 'football', 'basket', 'tennis', 'رياضة', 'سبور', 'تدريب'],
      health: ['médecine', 'medecine', 'santé', 'sante', 'pharmacie', 'infirmier', 'dentaire',
        'طب', 'صحة', 'تمريض', 'صيدلة', 'علاج'],
      business: ['business', 'gestion', 'commerce', 'finance', 'marketing', 'économie', 'economie',
        'comptabilité', 'comptabilite', 'تجارة', 'أعمال', 'محاسبة', 'ادارة', 'إدارة'],
      art: ['art', 'design', 'architecture', 'graphisme', 'mode', 'cinéma', 'musique',
        'فن', 'تصميم', 'عمارة', 'فنون'],
    };

    for (const [domain, keywords] of Object.entries(domainMap)) {
      if (keywords.some(k => normalized.includes(k))) {
        return domain;
      }
    }
    return null;
  }
}
