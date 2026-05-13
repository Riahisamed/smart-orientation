import { Injectable } from '@nestjs/common';
import { FieldData, JobData, RankedProgram } from './rag.service';

export type QueryIntent =
  | 'field_explanation'
  | 'requirements'
  | 'best_choice'
  | 'best_chances'
  | 'career'
  | 'location'
  | 'general';

export type StudentData = {
  name?: string;
  score?: number;
  bacType?: string;
  selectedFiliere?: string;
};

export type FilteredRagData = {
  domain?: { name: string; score: number; matchedTerms: string[] };
  field?: FieldData;
  jobs: {
    title: string;
    reason?: string;
    skills: string[];
    unemployment_rate?: number;
  }[];
  programs: RankedProgram[];
  intent?: QueryIntent;
};

@Injectable()
export class ResponseBuilderService {
  // ===== RANDOMIZATION UTILITIES =====
  private getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getProgramDisplayName(program: RankedProgram): string {
    return this.normalize(this.getGuideName(program));
  }

  private preparePrograms(
    programs: RankedProgram[],
    limit = 3,
  ): RankedProgram[] {
    const seen = new Set<string>();
    const deduplicated = programs.filter((program) => {
      const key = this.getProgramDisplayName(program);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return this.shuffleArray(deduplicated).slice(0, limit);
  }

  // ===== FRENCH INTROS =====
  private getFrenchIntros(context: {
    hasScore: boolean;
    score: number;
    bac: string;
    fieldName: string;
    intent?: QueryIntent;
  }): string[] {
    const { hasScore, score, bac, fieldName, intent } = context;
    const scoreLabel = hasScore ? String(score) : 'non précisé';

    const generalIntros = [
      `D'après ton profil (Bac ${bac}, score ${scoreLabel}), voici ce que je peux te dire.`,
      `En regardant tes données (Bac ${bac}, score ${scoreLabel}), j'ai analysé les options.`,
      `Pour ton cas précis (Bac ${bac}, score ${scoreLabel}), voici mon analyse.`,
      `Analysons ensemble ta situation: Bac ${bac}, score ${scoreLabel}.`,
      `À partir de ton profil (Bac ${bac}, score ${scoreLabel}), voici ce qui ressort.`,
    ];

    const fieldIntros =
      fieldName !== 'orientation générale'
        ? [
            `Tu t'intéresses à ${fieldName}. Avec ton profil (Bac ${bac}, score ${scoreLabel}), voici ce que je constate.`,
            `Concernant ${fieldName} et ton profil (Bac ${bac}, score ${scoreLabel}), voici mon analyse.`,
            `Pour ${fieldName} avec tes données (Bac ${bac}, score ${scoreLabel}), voici ce que ça donne.`,
            `Dans le domaine ${fieldName}, avec Bac ${bac} et score ${scoreLabel}, voici ce qui se dessine.`,
          ]
        : [];

    const scoreIntros = hasScore
      ? [
          `Avec ${score} points en Bac ${bac}, tu as des options intéressantes.`,
          `Ton score de ${score} en Bac ${bac} ouvre plusieurs pistes.`,
          `Côté admission avec ${score} en Bac ${bac}, voici la tendance.`,
        ]
      : [
          `Sans score précisé pour ton Bac ${bac}, je te donne une vue générale.`,
          `Pour Bac ${bac} (score non précisé), voici les orientations possibles.`,
        ];

    const intentIntros: Record<string, string[]> = {
      location: [
        `Pour la localisation avec ton Bac ${bac}, voici où trouver les programmes.`,
        `Concernant l'emplacement géographique (Bac ${bac}), voici les options.`,
      ],
      best_chances: [
        `Pour maximiser tes chances d'admission avec ${scoreLabel} en Bac ${bac}, voici les filières à cibler.`,
        `Côté admission réaliste avec ${scoreLabel} en Bac ${bac}, voici ce qui est accessible.`,
      ],
      career: [
        `Sur les débouchés dans ${fieldName} avec ton Bac ${bac}, voici ce qui t'attend.`,
        `Pour les métiers après ${fieldName} (Bac ${bac}), voici les perspectives.`,
      ],
    };

    const allIntros = [
      ...generalIntros,
      ...fieldIntros,
      ...scoreIntros,
      ...(intent && intentIntros[intent] ? intentIntros[intent] : []),
    ];

    return allIntros.length > 0 ? allIntros : generalIntros;
  }

  // ===== FRENCH ADVICE CLOSINGS =====
  private getFrenchAdviceClosings(context: {
    fieldName: string;
    intent?: QueryIntent;
    hasPrograms: boolean;
  }): string[] {
    const { fieldName, intent, hasPrograms } = context;

    const generalClosings = [
      `N'hésite pas à me donner plus de détails sur ce qui t'intéresse vraiment.`,
      `Si tu veux approfondir un domaine en particulier, dis-moi lequel.`,
      `Dis-moi ce qui te passionne, je peux affiner les recommandations.`,
      `Tu peux me préciser tes préférences pour un conseil plus ciblé.`,
      `Dis-moi ce qui te fait envie, je t'aiderai à y arriver.`,
    ];

    const programClosings = hasPrograms
      ? [
          `Compare bien les programmes, leurs scores d'admission et les débouchés avant de choisir.`,
          `Prends le temps de vérifier les dernières dates d'inscription et les délais.`,
          `Contacte directement les établissements pour confirmer les informations.`,
          `Pense à demander l'avis d'étudiants déjà inscrits dans ces filières.`,
        ]
      : [
          `Explore différents domaines pour trouver ce qui te correspond vraiment.`,
          `N'hésite pas à considérer des parcours qui sortent des sentiers battus.`,
        ];

    const fieldClosings =
      fieldName !== 'orientation générale'
        ? [
            `Dans ${fieldName}, l'important est de rester curieux et de pratiquer régulièrement.`,
            `Pour réussir en ${fieldName}, construis ton réseau et cherche des stages tôt.`,
          ]
        : [];

    const intentClosings: Record<string, string[]> = {
      best_chances: [
        `Mets plusieurs choix dans l'ordre de préférence avec des options sûres en backup.`,
        `Garde toujours un plan B solide, même pour tes premiers choix.`,
      ],
      location: [
        `Pense aussi au coût de la vie et au transport quand tu choisis ta ville.`,
        `La proximité géographique compte, mais n'oublie pas la qualité de la formation.`,
      ],
      career: [
        `Le marché évolue vite, reste à jour sur les compétences demandées.`,
        `N'oublie pas que les compétences douces comptent autant que les techniques.`,
      ],
    };

    return [
      ...generalClosings,
      ...programClosings,
      ...fieldClosings,
      ...(intent && intentClosings[intent] ? intentClosings[intent] : []),
    ];
  }

  // ===== FRENCH SECTION HEADERS =====
  private getFrenchSectionHeaders(): Record<string, string[]> {
    return {
      programs: [
        'Programmes recommandés',
        'Filières à considérer',
        'Options qui correspondent',
        'Ce qui est accessible',
        'Les pistes possibles',
        'Où postuler',
        'Formations identifiées',
      ],
      jobs: [
        'Métiers et débouchés',
        'Après les études',
        'Perspectives professionnelles',
        'À quoi ça mène',
        'Carrières possibles',
        'Le marché du travail',
      ],
      skills: [
        'Compétences à développer',
        "Ce qu'il faut maîtriser",
        'Capacités importantes',
        'Savoir-faire nécessaires',
        'Points forts à cultiver',
        'Préparation recommandée',
      ],
      analysis: [
        'Analyse de ta situation',
        'Ce que dit ton profil',
        'Bilan personnalisé',
        'Mon diagnostic',
        'En résumé',
        "Vue d'ensemble",
      ],
      advice: [
        'Mon conseil',
        'Ce que je te conseille',
        'Ma recommandation',
        'La prochaine étape',
        'Pour avancer',
        'Action à prendre',
      ],
      market: [
        'Demande en Tunisie',
        'Le marché local',
        'Opportunités en Tunisie',
        'Contexte économique',
        'Tendances actuelles',
      ],
    };
  }

  // ===== ARABIC INTROS =====
  private getArabicIntros(context: {
    hasScore: boolean;
    score: number;
    bac: string;
    fieldName: string;
    name?: string;
  }): string[] {
    const { hasScore, score, bac, fieldName, name } = context;
    const greeting = name
      ? `${name}،`
      : ['صديقي،', 'عزيزي،', 'يا طالب،'][this.getRandomInt(0, 2)];
    const scoreText = hasScore ? `${score}` : 'ما عطيتنيش السكور';

    const intros = [
      `${greeting} نعطيك إجابة مبنية على الداتا اللي عندي.`,
      `${greeting} حكيتي على ${fieldName}. باش نعاونك، هاك معطياتك:`,
      `${greeting} حسب الباك ${bac} والسكور ${scoreText}، هاك اللي لقيته:`,
      `${greeting} تحب تعرف على ${fieldName}؟ هاك اللي نجم نقولك:`,
      `${greeting} نحليلك الوضعية متاعك (باك ${bac}، سكور ${scoreText}):`,
      `${greeting} من غير ماطول عليك، هاك النتيجة:`,
      `${greeting} بالنسبة للمشكل متاعك، فماش حلول متعددة:`,
      `${greeting} خلينا نشوف وضعيتك:`,
      `${greeting} حسب المعطيات متاعك:`,
      `${greeting} نعطيك تحليل دقيق:`,
      `${greeting} بناءً على السكور متاعك:`,
    ];

    return intros;
  }

  // ===== ARABIC ADVICE CLOSINGS =====
  private getArabicAdviceClosings(): string[] {
    return [
      'إذا تحب نصيحة أدق، ابعثلي تفاصيل أكثر على المجال اللي يهمك.',
      'كان تحب تفهم أكثر، قوللي واش تحب تمشي في أي اتجاه.',
      'ما تترددش تسألني كان عندك سؤال آخر.',
      'نصيحتي: خذ وقتك وقارن مليح قبل ما تختار.',
      'تنجم تتواصل مع الكليات باش تتأكد من المعلومات.',
    ];
  }

  // ===== EMPLOYMENT SECTION HEADERS =====
  private getEmploymentHeaders(lang: 'fr' | 'ar'): Record<string, string[]> {
    if (lang === 'ar') {
      return {
        careerProspects: [
          'الآفاق المهنية:',
          'المهن المتاحة:',
          'واش تنجم تخدم:',
          'الوظائف:',
        ],
        demandLevel: ['نسبة الطلب:', 'الطلب في السوق:', 'فرص الشغل:'],
        unemploymentRisk: [
          'مخاطر البطالة:',
          'نسبة البطالة:',
          'الخطر متاع البطالة:',
        ],
        unemploymentRate: [
          'نسبة البطالة التقريبية:',
          'معدل البطالة:',
          'نسبة البطالة المتوقعة:',
        ],
        futureOutlook: [
          'المستقبل المهني:',
          'الأفاق المستقبلية:',
          'تطور المجال:',
        ],
      };
    }
    return {
      careerProspects: [
        'Débouchés professionnels:',
        'Métiers possibles:',
        'Carrières:',
      ],
      demandLevel: [
        'Demande sur le marché:',
        'Niveau de demande:',
        'Opportunités:',
      ],
      unemploymentRisk: [
        'Risque de chômage:',
        'Niveau de risque:',
        "Sécurité d'emploi:",
      ],
      unemploymentRate: [
        'Taux de chômage estimé:',
        'Chômage moyen:',
        'Taux approximatif:',
      ],
      futureOutlook: [
        'Perspectives futures:',
        'Avenir du secteur:',
        'Évolution:',
      ],
    };
  }

  // ===== TRANSLATION HELPERS =====
  private normalize(value?: string): string {
    return (value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private translateToArabicCategory(
    value: string,
    type: 'demand' | 'risk',
  ): string {
    const normalized = this.normalize(value);
    if (type === 'demand') {
      if (
        normalized.includes('high') ||
        normalized.includes('eleve') ||
        normalized.includes('très')
      )
        return 'مرتفع';
      if (normalized.includes('moderate') || normalized.includes('moyen'))
        return 'متوسط';
      if (normalized.includes('low') || normalized.includes('faible'))
        return 'منخفض';
      return value;
    }
    if (normalized.includes('low') || normalized.includes('faible'))
      return 'منخفضة';
    if (normalized.includes('moderate') || normalized.includes('moyen'))
      return 'متوسطة';
    if (normalized.includes('high') || normalized.includes('eleve'))
      return 'مرتفعة';
    return value;
  }

  private translateToArabicOutlook(outlook: string): string {
    const normalized = this.normalize(outlook);
    if (normalized.includes('strong') || normalized.includes('positive'))
      return 'مبشر';
    if (normalized.includes('moderate')) return 'متوسط';
    if (normalized.includes('weak') || normalized.includes('negative'))
      return 'ضعيف';
    return outlook;
  }

  private translateDemandToFrench(demand: string): string {
    const normalized = this.normalize(demand);
    if (normalized.includes('very high')) return 'Très élevée';
    if (normalized.includes('high') || normalized.includes('eleve'))
      return 'Élevée';
    if (normalized.includes('moderate') || normalized.includes('moyen'))
      return 'Modérée';
    if (normalized.includes('low') || normalized.includes('faible'))
      return 'Faible';
    return demand;
  }

  private translateRiskToFrench(risk: string): string {
    const normalized = this.normalize(risk);
    if (normalized.includes('low') || normalized.includes('faible'))
      return 'Faible';
    if (normalized.includes('moderate') || normalized.includes('moyen'))
      return 'Modéré';
    if (normalized.includes('high') || normalized.includes('eleve'))
      return 'Élevé';
    return risk;
  }

  // ===== EMPLOYMENT SECTION BUILDER =====
  private buildEmploymentSection(
    ragData: FilteredRagData,
    lang: 'fr' | 'ar',
  ): string {
    const headers = this.getEmploymentHeaders(lang);
    const jobs = ragData.jobs.slice(0, 3);
    const demand =
      ragData.field?.demand_in_tunisia ||
      (lang === 'ar' ? 'غير محدد' : 'Non précisé');
    const unemploymentRisk =
      ragData.field?.unemployment_risk ||
      (lang === 'ar' ? 'غير محدد' : 'Non précisé');
    const outlook =
      ragData.field?.future_outlook ||
      (lang === 'ar' ? 'غير محدد' : 'Non précisé');

    const rates = jobs
      .map((j) => j.unemployment_rate)
      .filter((r): r is number => typeof r === 'number' && Number.isFinite(r));
    const avgRate =
      rates.length > 0
        ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) /
          10
        : null;

    if (lang === 'ar') {
      const demandAr = this.translateToArabicCategory(demand, 'demand');
      const riskAr = this.translateToArabicCategory(unemploymentRisk, 'risk');

      const jobLines = jobs.length
        ? jobs.map((job, i) => `${i + 1}. ${job.title}`).join('\n')
        : 'معلومات غير متوفرة';

      return `${this.getRandomElement(headers.careerProspects)}
${jobLines}

${this.getRandomElement(headers.demandLevel)} ${demandAr}
${this.getRandomElement(headers.unemploymentRisk)} ${riskAr}
${avgRate !== null ? `${this.getRandomElement(headers.unemploymentRate)} ${avgRate}%` : ''}
${this.getRandomElement(headers.futureOutlook)} ${this.translateToArabicOutlook(outlook)}`;
    }

    const demandFr = this.translateDemandToFrench(demand);
    const riskFr = this.translateRiskToFrench(unemploymentRisk);

    const jobLines = jobs.length
      ? jobs
          .map(
            (job, i) =>
              `${i + 1}. ${job.title} (${job.skills.slice(0, 3).join(', ')})`,
          )
          .join('\n')
      : 'Informations non disponibles';

    return `${this.getRandomElement(headers.careerProspects)}
${jobLines}

${this.getRandomElement(headers.demandLevel)} ${demandFr}
${this.getRandomElement(headers.unemploymentRisk)} ${riskFr}
${avgRate !== null ? `${this.getRandomElement(headers.unemploymentRate)} ${avgRate}%` : ''}
${this.getRandomElement(headers.futureOutlook)} ${outlook}`;
  }

  // ===== PROGRAM/JOB FORMATTING HELPERS =====
  private getGuideName(program: RankedProgram): string {
    return program.name || program.program;
  }

  private getInstitutionLocation(institution: string): string {
    const locationMap: Record<string, string> = {
      INSAT: 'Tunis - Ariana',
      ENIT: 'Tunis - El Manar',
      ENSI: 'Manouba',
      ISG: 'Tunis',
      'ISG Tunis': 'Tunis',
      IHEC: 'Carthage',
      ISCAE: 'Manouba',
      FST: 'Tunis - El Manar',
      FSM: 'Monastir',
      FSB: 'Bizerte',
      FSS: 'Sfax',
      FSK: 'Kairouan',
      UMA: 'Monastir',
      UDL: 'Sousse',
      UC: 'Carthage',
      UIB: 'Sfax',
      ISET: 'Tunis',
      ISSAT: 'Sousse',
    };
    return locationMap[institution] || 'Tunisie';
  }

  private calculateDifficultyForGuide(
    score: number,
    program: RankedProgram,
  ): 'safe' | 'risky' | 'hard' {
    const lastScore = program.matchingBac?.lastScore;
    if (typeof lastScore !== 'number' || !Number.isFinite(lastScore))
      return 'hard';
    if (score >= lastScore + 10) return 'safe';
    if (score >= lastScore - 5) return 'risky';
    return 'hard';
  }

  private getDifficultyLabel(difficulty: 'safe' | 'risky' | 'hard'): string {
    const labels: Record<string, string> = {
      safe: 'Accessible',
      risky: 'Incertain',
      hard: 'Difficile',
    };
    return labels[difficulty] || 'Non évalué';
  }

  private getJobReason(jobTitle: string, userMessage: string): string {
    const normalizedTitle = this.normalize(jobTitle);
    const normalizedMessage = this.normalize(userMessage);

    if (
      normalizedTitle.includes('developpeur') ||
      normalizedTitle.includes('software') ||
      normalizedTitle.includes('data')
    ) {
      return 'technique et créative';
    }
    if (
      normalizedTitle.includes('comptable') ||
      normalizedTitle.includes('finance')
    ) {
      return 'stable avec progression';
    }
    if (
      normalizedTitle.includes('marketing') ||
      normalizedTitle.includes('commercial')
    ) {
      return 'dynamique et évolutive';
    }
    if (
      normalizedTitle.includes('rh') ||
      normalizedTitle.includes('ressources')
    ) {
      return 'relationnelle et stratégique';
    }
    if (
      normalizedMessage.includes('teletravail') ||
      normalizedMessage.includes('remote')
    ) {
      return 'compatible avec le télétravail';
    }
    return 'avec bonnes perspectives';
  }

  // ===== MAIN RESPONSE BUILDERS =====
  buildFrenchResponse(
    ragData: FilteredRagData,
    studentData?: StudentData,
    userMessage = '',
  ): string {
    const hasScore =
      typeof studentData?.score === 'number' &&
      Number.isFinite(studentData.score);
    const score = hasScore ? Number(studentData?.score) : 0;
    const scoreLabel = hasScore ? String(score) : 'non précisé';
    const bac = studentData?.bacType || 'non précisé';
    const field = ragData.field;
    const fieldName = field?.field || 'orientation générale';
    const programs = this.preparePrograms(ragData.programs, 3);
    const jobs = ragData.jobs.slice(0, 4);

    const intros = this.getFrenchIntros({
      hasScore,
      score,
      bac,
      fieldName,
      intent: ragData.intent,
    });
    const intro = this.getRandomElement(intros);

    const headers = this.getFrenchSectionHeaders();
    const adviceClosings = this.getFrenchAdviceClosings({
      fieldName,
      intent: ragData.intent,
      hasPrograms: programs.length > 0,
    });

    const programLines = programs.length
      ? programs.map((program, index) => {
          const lastScore = program.matchingBac?.lastScore;
          const capacity = program.matchingBac?.capacity;
          const difficulty = this.calculateDifficultyForGuide(score, program);

          const variations = [
            `${index + 1}. ${this.getGuideName(program)} (${program.institution}) — Dernier score: ${lastScore || 'N/A'} | Capacité: ${capacity || 'N/A'} | Niveau: ${this.getDifficultyLabel(difficulty)}`,
            `${index + 1}. ${this.getGuideName(program)} — ${program.institution}. Score d'entrée: ${lastScore || 'non dispo'}, Places: ${capacity || '?'}. Risque: ${this.getDifficultyLabel(difficulty)}.`,
            `${index + 1}. ${this.getGuideName(program)} @ ${program.institution} → Score ${lastScore || 'N/A'} | ${capacity || '?'} places | ${this.getDifficultyLabel(difficulty)}`,
          ];
          return this.getRandomElement(variations);
        })
      : ['Aucun programme précis trouvé pour ce bac et ce score.'];

    const jobLines = jobs.length
      ? jobs.map((job, index) => {
          const skills =
            job.skills?.slice(0, 4).join(', ') || 'compétences à construire';
          const variations = [
            `${index + 1}. ${job.title} — ${job.reason || this.getJobReason(job.title, userMessage)} (Skills: ${skills})`,
            `${index + 1}. ${job.title}: ${job.reason || this.getJobReason(job.title, userMessage)}. Utile: ${skills}.`,
            `${index + 1}. ${job.title} → ${job.reason || this.getJobReason(job.title, userMessage)} | ${skills}`,
          ];
          return this.getRandomElement(variations);
        })
      : ['Compare les domaines selon la demande locale avant de décider.'];

    const locationLines = programs.length
      ? programs.map((program, index) => {
          const variations = [
            `${index + 1}. ${this.getGuideName(program)} — ${this.getInstitutionLocation(program.institution)} (${program.institution})`,
            `${index + 1}. ${this.getGuideName(program)} se trouve à ${this.getInstitutionLocation(program.institution)}`,
          ];
          return this.getRandomElement(variations);
        })
      : ["Je n'ai pas trouvé de programmes à localiser."];

    const technicalSkills =
      'méthode de travail, logique, recherche et autonomie';
    const softSkills = 'communication, discipline, organisation';
    const tools = 'outils selon la spécialité';
    const demand = this.translateDataValue(
      field?.demand_in_tunisia || 'à comparer selon la filière',
    );
    const outlook = this.translateDataValue(
      field?.future_outlook ||
        'positif si tu développes les bonnes compétences',
    );
    const fieldReason =
      'Ta question est générale, donc je compare les programmes accessibles.';

    const shuffledProgramHeaders = this.shuffleArray(headers.programs).slice(
      0,
      2,
    );
    const shuffledJobHeaders = this.shuffleArray(headers.jobs).slice(0, 2);
    const employmentSection = this.buildEmploymentSection(ragData, 'fr');

    return this.buildFrenchTemplate(
      ragData.intent,
      intro,
      programLines,
      jobLines,
      locationLines,
      employmentSection,
      shuffledProgramHeaders,
      shuffledJobHeaders,
      headers,
      adviceClosings,
      {
        scoreLabel,
        bac,
        fieldName,
        fieldReason,
        technicalSkills,
        softSkills,
        tools,
        demand,
        outlook,
      },
    );
  }

  private buildFrenchTemplate(
    intent: QueryIntent | undefined,
    intro: string,
    programLines: string[],
    jobLines: string[],
    locationLines: string[],
    employmentSection: string,
    shuffledProgramHeaders: string[],
    shuffledJobHeaders: string[],
    headers: Record<string, string[]>,
    adviceClosings: string[],
    context: {
      scoreLabel: string;
      bac: string;
      fieldName: string;
      fieldReason: string;
      technicalSkills: string;
      softSkills: string;
      tools: string;
      demand: string;
      outlook: string;
    },
  ): string {
    const {
      scoreLabel,
      bac,
      fieldName,
      fieldReason,
      technicalSkills,
      softSkills,
      tools,
      demand,
      outlook,
    } = context;

    // Location response
    if (intent === 'location') {
      const locationTemplates = [
        `${intro}

${this.getRandomElement(headers.programs)}
${locationLines.join('\n')}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
        `${intro}

${this.getRandomElement(['Voici où se trouvent les institutions:', 'Les emplacements identifiés:', 'Localisation des formations:'])}
${locationLines.join('\n')}

${this.getRandomElement(['💡 À noter:', 'Points importants:', 'À retenir:'])}
- Score actuel: ${scoreLabel}
- Bac: ${bac}
- ${this.getRandomElement(['Dis-moi ta ville pour des suggestions proches.', 'Précise ta région pour affiner les résultats.'])}`,
      ];
      return this.getRandomElement(locationTemplates);
    }

    // Best chances response
    if (intent === 'best_chances') {
      const chancesTemplates = [
        `${intro}

${this.getRandomElement(shuffledProgramHeaders)}
Programmes:
${programLines.join('\n')}

${this.getRandomElement(headers.analysis)}
${this.getRandomElement([
  'Écart positif large = choix sûr. Écart 0-5 = jouable avec alternative. Écart négatif = difficile.',
  'Si tu dépasses le score de +10 points: admission probable. Entre 0 et +5: possible mais risqué. En dessous: difficile sans plan B.',
])}

${this.getRandomElement(headers.advice)}
${this.getRandomElement([
  'Combine 2 choix sûrs, 2 jouables et 1 ambitieux. Précise ton domaine favori pour affiner.',
  'Diversifie tes choix avec des options réalistes. Dis-moi ce qui te passionne!',
])}`,
        `${this.getRandomElement(headers.advice)} ${this.getRandomElement(['Commence par analyser tes chances réalistes.', "Regarde d'abord ce qui est accessible."])}

${programLines.join('\n')}

${intro}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
      ];
      return this.getRandomElement(chancesTemplates);
    }

    // Field explanation/requirements
    if (intent === 'field_explanation' || intent === 'requirements') {
      const explanationTemplates = [
        `${intro}

${this.getRandomElement(headers.analysis)}
${fieldReason}

${this.getRandomElement(['Spécialités dans ce domaine:', 'Ce que tu peux étudier:', 'Les parcours disponibles:'])}
- ${programLines.slice(0, 6).join('\n- ')}

${this.getRandomElement(['Ce qui est demandé:', 'Prérequis:', 'Niveau requis:'])}
- Score: ${scoreLabel} (Bac ${bac})
- Techniques: ${technicalSkills}
- Personnelles: ${softSkills}
- Outils: ${tools}

${this.getRandomElement(shuffledProgramHeaders)}
Programmes:
${programLines.join('\n')}

${this.getRandomElement(shuffledJobHeaders)}
${jobLines.join('\n')}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
        `${this.getRandomElement(headers.analysis)} ${fieldName}
${fieldReason}

${intro}

${this.getRandomElement(['Les formations identifiées:', 'Où étudier ça:', 'Programmes correspondants:'])}
${programLines.join('\n')}

${this.getRandomElement(['Après le diplôme:', 'Les débouchés:', 'Ton futur métier:'])}
${jobLines.join('\n')}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
      ];
      return this.getRandomElement(explanationTemplates);
    }

    // Best choice
    if (intent === 'best_choice') {
      const firstProgram =
        programLines[0] || 'un programme proche de ton score';
      const choiceTemplates = [
        `${intro}

${this.getRandomElement(['Ma recommandation principale:', 'Je te conseille de commencer par:', 'La piste la plus cohérente:'])} ${firstProgram}

${this.getRandomElement(['Pourquoi ce choix:', 'Les raisons:', 'Ce qui justifie cette orientation:'])}
- Score compatible avec ${scoreLabel} (Bac ${bac})
- Domaine: ${fieldName}

${this.getRandomElement(shuffledProgramHeaders)}
${programLines.join('\n')}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
      ];
      return this.getRandomElement(choiceTemplates);
    }

    // Career
    if (intent === 'career') {
      const careerTemplates = [
        `${intro}

${this.getRandomElement(headers.analysis)} ${fieldName}

${this.getRandomElement(headers.skills)}
Tech: ${technicalSkills}
Soft: ${softSkills}

${this.getRandomElement(shuffledProgramHeaders)}
${programLines.join('\n')}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(['Ne choisis pas que sur le nom du métier. Compare aussi durée, score, compétences.', 'Regarde au-delà du titre: formation, compétences, évolution.'])}`,
        `${this.getRandomElement(['Avenir professionnel dans', 'Débouchés pour', 'Carrières en'])} ${fieldName}

${this.getRandomElement(headers.market)} ${demand}

${this.getRandomElement(shuffledJobHeaders)}
${jobLines.join('\n')}

${intro}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
      ];
      return this.getRandomElement(careerTemplates);
    }

    // Field-specific
    if (fieldName !== 'orientation générale') {
      const fieldTemplates = [
        `${intro}

${this.getRandomElement(['Orientation ciblée vers', 'Spécialisation:', 'Domaine identifié:'])} ${fieldName}
${fieldReason}

${this.getRandomElement(shuffledProgramHeaders)}
${programLines.join('\n')}

${this.getRandomElement(['Pourquoi ce domaine:', 'Les atouts:', 'Ce qui plaide pour cette voie:'])}
- Demande: ${demand}
- Perspectives: ${outlook}
- Profil adapté si tu maîtrises: ${technicalSkills}

${this.getRandomElement(shuffledJobHeaders)}
${jobLines.join('\n')}

${this.getRandomElement(headers.advice)}
${this.getRandomElement(["Si dev t'intéresse: commence Python/JS, fais 2 projets, puis compare les filières.", "Pour avancer: identifie 3 formations, vérifie leurs scores d'entrée, contacte les étudiants."])}`,
        `${this.getRandomElement(['Tu vises', 'Intérêt détecté pour', 'Orientation vers'])} ${fieldName}. ${intro}

${this.getRandomElement(shuffledProgramHeaders)}
${programLines.join('\n')}

${this.getRandomElement(['Marché tunisien:', 'Contexte économique:'])} ${demand}, tendance ${outlook.toLowerCase()}.

${this.getRandomElement(shuffledJobHeaders)}
${jobLines.join('\n')}

${this.getRandomElement(adviceClosings)}`,
      ];
      return this.getRandomElement(fieldTemplates);
    }

    // General/default response
    const generalTemplates = [
      `${intro}

${this.getRandomElement(headers.analysis)}
${fieldReason}

${this.getRandomElement(shuffledProgramHeaders)}
${programLines.join('\n')}

${employmentSection}

${this.getRandomElement(headers.skills)}
Tech: ${technicalSkills}
Soft: ${softSkills}

Pour avancer - ${this.getRandomElement(headers.advice)}
${this.getRandomElement(['Cible 2-3 programmes avec scores proches des tiens. Compare institutions et débouchés.', 'Privilégie les filières accessibles avec bon potentiel professionnel.'])} ${this.getRandomElement(['Précise ton domaine favori pour affiner!', "Dis-moi ce qui t'attire vraiment!"])}`,
      `Analyse de profil - ${this.getRandomElement(headers.analysis)} Bac ${bac}, score ${scoreLabel}
${fieldReason}

${this.getRandomElement(shuffledProgramHeaders)}
${programLines.join('\n')}

${employmentSection}

${intro}

Pour avancer - ${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
      `${this.getRandomElement(['Voici mon analyse', 'Mon diagnostic', 'Ce que je retiens'])} pour ton profil (${scoreLabel}, Bac ${bac}):

${this.getRandomElement(shuffledProgramHeaders)}
Programmes:
${programLines.join('\n')}

${employmentSection}

${this.getRandomElement(['Compétences à développer:', 'Savoir-faire essentiels:'])}
${technicalSkills}

Pour avancer - ${this.getRandomElement(headers.advice)}
${this.getRandomElement(adviceClosings)}`,
    ];

    return this.getRandomElement(generalTemplates);
  }

  buildArabicResponse(
    ragData: FilteredRagData,
    studentData?: StudentData,
  ): string {
    const hasScore =
      typeof studentData?.score === 'number' &&
      Number.isFinite(studentData.score);
    const score = hasScore ? Number(studentData?.score) : 0;
    const scoreText = hasScore ? `${score}` : 'ما عطيتنيش السكور';
    const name = studentData?.name?.trim();
    const bac = studentData?.bacType || 'موش محدد';
    const fieldName = ragData.field?.field || 'المجال اللي سألت عليه';
    const programs = this.preparePrograms(ragData.programs, 3);
    const jobs = ragData.jobs.slice(0, 3);

    const intros = this.getArabicIntros({
      hasScore,
      score,
      bac,
      fieldName,
      name,
    });
    const intro = this.getRandomElement(intros);
    const closings = this.getArabicAdviceClosings();

    const programVariations = programs.map((program) => {
      const lastScore = program.matchingBac?.lastScore;
      const difficulty = this.calculateDifficultyForGuide(score, program);
      const scorePart =
        typeof lastScore === 'number' && hasScore
          ? `آخر score ${lastScore}، الفرق ${(score - lastScore).toFixed(2)}`
          : typeof lastScore === 'number'
            ? `آخر score ${lastScore}`
            : 'آخر score موش واضح';
      const difficultyAr =
        difficulty === 'safe'
          ? 'مضمون'
          : difficulty === 'risky'
            ? 'ممكن'
            : 'صعب';

      return [
        `${this.getGuideName(program)} - ${program.institution} - ${scorePart}`,
        `${this.getGuideName(program)} (${program.institution}) → Score: ${lastScore || 'N/A'} | ${difficultyAr}`,
        `${this.getGuideName(program)} @ ${program.institution} — ${scorePart}`,
      ];
    });

    const programLines = programs.length
      ? programs
          .map(
            (_, index) =>
              `${index + 1}. ${this.getRandomElement(programVariations[index])}`,
          )
          .join('\n')
      : this.getRandomElement([
          'ما لقيتش فيليات واضحة حسب المعطيات الحالية.',
          'ما فماش برامج واضحة بالداتا المتاحة.',
          'المعلومات غير كافية باش نحددلك اختيارات.',
        ]);

    const jobReasonsAr = [
      ['التطبيق والمشاريع', 'العمل العملي', 'المشاريع العملية'],
      ['مجال فيه طلب في السوق', 'السوق يطلبو', 'فرص شغل متاحة'],
      ['تطوير مهاراتك تدريجياً', 'التعلم المستمر', 'تقوية الكفاءات'],
    ];

    const jobLines = jobs.length
      ? jobs
          .map((job, index) => {
            const reasonList = jobReasonsAr[index % 3];
            return this.getRandomElement([
              `${index + 1}. ${job.title}: مناسب إذا تحب ${this.getRandomElement(reasonList)}`,
              `${index + 1}. ${job.title} → ${this.getRandomElement(reasonList)}`,
              `${index + 1}. ${job.title} (يناسب ${this.getRandomElement(reasonList)})`,
            ]);
          })
          .join('\n')
      : this.getRandomElement([
          'كان تحددلي المجال أكثر، نعطيك آفاق مهنية أدق.',
          'وضحلي شنوة تحب بالضبط، نجم نعاونك أكثر.',
          'أعطيني تفاصيل أكثر على المجال باش نفهملك.',
        ]);

    const headersAr = {
      programs: [
        'الفيلات/الاختيارات:',
        'البرامج المتاحة:',
        'الخيارات الممكنة:',
        'فيلات تو نجم تلحقها:',
      ],
      jobs: [
        'الآفاق المهنية:',
        'المهن الممكنة:',
        'واش تنجم تخدم:',
        'الوظائف المتاحة:',
      ],
      advice: ['نصيحتي:', 'الخطوة الجاية:', 'شنوة تعمل:'],
      location: ['المواقع الجغرافية:', 'وين تلقى البرامج:', 'البلاصات:'],
    };

    // Location intent
    if (ragData.intent === 'location') {
      const locationTemplates = [
        `${intro}\n\n${this.getRandomElement(headersAr.location)}\n${programs.map((program, index) => `${index + 1}. ${this.getGuideName(program)}: ${this.getInstitutionLocation(program.institution)} - ${program.institution}`).join('\n') || 'ما لقيتش مؤسسة واضحة.'}\n\n${this.getRandomElement(closings)}`,
        `${intro}\n\nهاذم أهم الاختيارات اللي لقيتهم بالنسبة للبلاصة:\n${programs.map((program, index) => `${index + 1}. ${this.getGuideName(program)} موجودة في ${this.getInstitutionLocation(program.institution)}`).join('\n') || 'ما عنديش معلومات كافية على المواقع.'}\n\n${this.getRandomElement(['قلي إنت من أي ولاية كان تحب الأقرب ليك.', 'وضحلي وين ساكن باش نحطلك الخيارات القريبة.'])}`,
      ];
      return this.getRandomElement(locationTemplates);
    }

    const employmentSectionAr = this.buildEmploymentSection(ragData, 'ar');

    const generalTemplates = [
      `${intro}\n\nالباك: ${bac}\nالسكور: ${scoreText}\nالمجال: ${fieldName}\n\n${this.getRandomElement(headersAr.programs)}\n${programLines}\n\n${employmentSectionAr}\n\n${this.getRandomElement(headersAr.advice)} ${this.getRandomElement(closings)}`,
      `${intro}\n\nحسب المعطيات (باك ${bac}، سكور ${scoreText}):\n\n${this.getRandomElement(headersAr.programs)}\n${programLines}\n\n${employmentSectionAr}\n\n${this.getRandomElement(closings)}`,
      `${intro}\n\n${this.getRandomElement(headersAr.programs)}\n${programLines}\n\nالباك: ${bac} | السكور: ${scoreText}\n\n${employmentSectionAr}\n\n${this.getRandomElement(['نصيحتي:', 'الملاحظة:'])} ${this.getRandomElement(closings)}`,
    ];

    return this.getRandomElement(generalTemplates);
  }

  private translateDataValue(value: string): string {
    return value || 'Non précisé';
  }

  private translateFieldReason(reason?: string): string {
    return reason || '';
  }
}
