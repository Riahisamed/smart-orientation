import { Injectable } from '@nestjs/common';

export type DetectedLanguage = 'ar' | 'fr' | 'mixed' | 'unknown';

export type OrientationIntent =
  | 'orientation'
  | 'requirements'
  | 'career'
  | 'location'
  | 'comparison'
  | 'general';

export type ExtractedKeyword = {
  value: string;
  category:
    | 'field'
    | 'bac'
    | 'score'
    | 'location'
    | 'career'
    | 'comparison'
    | 'requirement'
    | 'orientation';
};

type IntentScore = Record<OrientationIntent, number>;

@Injectable()
export class IntentDetectorService {
  private readonly arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

  private readonly latinPattern = /[a-zA-Z]/;

  private readonly keywordGroups: Record<
    ExtractedKeyword['category'],
    Record<string, string[]>
  > = {
    field: {
      informatique: [
        'info',
        'informatique',
        'computer science',
        'cs',
        'it',
        'dev',
        'developpement',
        'programmation',
        'programming',
        'software',
        'web',
        'mobile',
        'data',
        'ai',
        'ia',
        'intelligence artificielle',
        'ذكاء اصطناعي',
        'إعلامية',
        'اعلامية',
        'برمجة',
        'معلوماتية',
      ],
      medecine: [
        'medecine',
        'medecin',
        'medical',
        'medicine',
        'doctor',
        'sante',
        'pharmacie',
        'dentaire',
        'infirmier',
        'med',
        'طب',
        'طبيب',
        'صحة',
        'صيدلة',
        'تمريض',
      ],
      ingenierie: [
        'ingenieur',
        'ingenierie',
        'genie',
        'mecanique',
        'electrique',
        'civil',
        'industriel',
        'هندسة',
        'مهندس',
        'ميكانيك',
        'كهرباء',
      ],
      gestion: [
        'gestion',
        'business',
        'management',
        'finance',
        'comptabilite',
        'economie',
        'commerce',
        'marketing',
        'تصرف',
        'إدارة',
        'ادارة',
        'اقتصاد',
        'تجارة',
        'محاسبة',
      ],
      droit: ['droit', 'law', 'juridique', 'avocat', 'قانون', 'حقوق', 'محاماة'],
      langues: [
        'langue',
        'langues',
        'francais',
        'anglais',
        'traduction',
        'lettres',
        'آداب',
        'اداب',
        'لغات',
        'ترجمة',
      ],
      design: [
        'design',
        'art',
        'architecture',
        'graphique',
        'ux',
        'ui',
        'تصميم',
        'فنون',
        'معمار',
      ],
    },
    bac: {
      math: ['math', 'maths', 'mathematiques', 'رياضيات'],
      sciences: ['science', 'sciences', 'svt', 'علوم', 'تجريبية'],
      technique: ['tech', 'technique', 'تقنية', 'تكنولوجية'],
      economie: ['eco', 'economie', 'gestion', 'اقتصاد', 'تصرف'],
      informatique: ['bac info', 'informatique', 'اعلامية', 'إعلامية'],
      lettres: ['lettres', 'lettre', 'adab', 'آداب', 'اداب'],
      sport: ['sport', 'رياضة'],
    },
    score: {
      score: ['score', 'scor', '120', 'points', 'moyenne', 'fg', 'معدل', 'نقاط'],
    },
    location: {
      location: [
        'win',
        'ou',
        'where',
        'na9ra',
        'naqra',
        'nokhra',
        'nokra',
        'fac',
        'faculte',
        'institut',
        'universite',
        'ville',
        'gouvernorat',
        'localisation',
        'proche',
        'qrib',
        '9rib',
        'وين',
        'أين',
        'اين',
        'أدرس',
        'ادرس',
        'نقرأ',
        'نقرا',
        'كلية',
        'جامعة',
        'مدينة',
        'ولاية',
      ],
    },
    career: {
      career: [
        'job',
        'jobs',
        'metier',
        'metiers',
        'travail',
        'carriere',
        'debouche',
        'debouches',
        'avenir',
        'salaire',
        'khedma',
        '5edma',
        'خدمة',
        'عمل',
        'مهنة',
        'آفاق',
        'افاق',
        'مستقبل',
      ],
    },
    comparison: {
      comparison: [
        'compare',
        'comparer',
        'comparaison',
        'difference',
        'different',
        'vs',
        'versus',
        'entre',
        'meilleur entre',
        'a7sen bin',
        'خير بين',
        'أفضل بين',
        'افضل بين',
        'مقارنة',
        'فرق',
      ],
    },
    requirement: {
      requirement: [
        'condition',
        'conditions',
        'requis',
        'requirement',
        'requirements',
        'admission',
        'dernier score',
        'last score',
        'score minimum',
        'moyenne',
        'capacite',
        'bac requis',
        'شنوة لازم',
        'ما المطلوب',
        'شروط',
        'مطلوب',
        'قبول',
      ],
    },
    orientation: {
      orientation: [
        'orientation',
        'orienter',
        'conseil',
        'conseille',
        'choisir',
        'choix',
        'filiere',
        'specialite',
        'specialite',
        'domaine',
        'nheb',
        'ne7eb',
        'nhib',
        'najam',
        'najem',
        'chnowa najem',
        'chniya najem',
        'a7sen',
        'ahsen',
        'meilleur',
        'meilleure',
        'top',
        'sahla',
        'facile',
        'توجيه',
        'اختصاص',
        'شعبة',
        'مجال',
        'نحب',
        'أريد',
        'اريد',
        'أختار',
        'اختار',
        'أفضل',
        'افضل',
        'سهل',
      ],
    },
  };

  normalizeText(message: string): string {
    return (message || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’'`´]/g, ' ')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  detectLanguage(message: string): DetectedLanguage {
    const normalized = this.normalizeText(message);
    const hasArabic = this.arabicPattern.test(normalized);
    const hasLatin = this.latinPattern.test(normalized);

    if (hasArabic && hasLatin) return 'mixed';
    if (hasArabic) return 'ar';
    if (hasLatin) return 'fr';

    return 'unknown';
  }

  extractKeywords(message: string): ExtractedKeyword[] {
    const normalized = this.normalizeText(message);
    const keywords = new Map<string, ExtractedKeyword>();

    for (const [category, groups] of Object.entries(this.keywordGroups) as [
      ExtractedKeyword['category'],
      Record<string, string[]>,
    ][]) {
      for (const [value, aliases] of Object.entries(groups)) {
        if (aliases.some((alias) => this.hasTerm(normalized, alias))) {
          keywords.set(`${category}:${value}`, { value, category });
        }
      }
    }

    if (/\b\d{2,3}(?:[.,]\d+)?\b/.test(normalized)) {
      keywords.set('score:numeric-score', {
        value: 'numeric-score',
        category: 'score',
      });
    }

    return [...keywords.values()];
  }

  detectIntent(message: string): OrientationIntent {
    const normalized = this.normalizeText(message);
    const keywords = this.extractKeywords(normalized);
    const scores = this.createEmptyScores();

    for (const keyword of keywords) {
      if (keyword.category === 'field') scores.orientation += 1;
      if (keyword.category === 'score') scores.requirements += 1;
      if (keyword.category === 'location') scores.location += 3;
      if (keyword.category === 'career') scores.career += 3;
      if (keyword.category === 'comparison') scores.comparison += 3;
      if (keyword.category === 'requirement') scores.requirements += 3;
      if (keyword.category === 'orientation') scores.orientation += 3;
    }

    if (this.hasQuestionAboutDefinition(normalized)) {
      scores.general += 4;
      scores.orientation -= 1;
    }

    if (this.hasOrientationPattern(normalized)) {
      scores.orientation += 3;
    }

    if (this.hasScoreChoicePattern(normalized)) {
      scores.orientation += 3;
      scores.requirements += 1;
    }

    if (this.hasLocationStudyPattern(normalized)) {
      scores.location += 3;
    }

    const best = this.getBestIntent(scores);
    return scores[best] > 0 ? best : 'general';
  }

  private hasTerm(text: string, rawTerm: string): boolean {
    const term = this.normalizeText(rawTerm);
    if (!term) return false;

    if (/^[a-z0-9]+$/i.test(term)) {
      return new RegExp(`(^|\\s)${this.escapeRegExp(term)}($|\\s)`).test(text);
    }

    return text.includes(term);
  }

  private hasQuestionAboutDefinition(text: string): boolean {
    return [
      'chnoua',
      'chniya',
      'c quoi',
      'cest quoi',
      'c est quoi',
      'what is',
      'quest ce que',
      'qu est ce que',
      'ما هو',
      'ماهي',
      'ما هي',
      'شنوة',
      'اشنو',
    ].some((term) => this.hasTerm(text, term));
  }

  private hasOrientationPattern(text: string): boolean {
    const wantsAdvice = ['nheb', 'ne7eb', 'nhib', 'je veux', 'اريد', 'أريد', 'نحب'].some(
      (term) => this.hasTerm(text, term),
    );
    const hasStudyOrField = [
      'filiere',
      'specialite',
      'domaine',
      'info',
      'medecine',
      'gestion',
      'اختصاص',
      'شعبة',
      'مجال',
    ].some((term) => this.hasTerm(text, term));

    return wantsAdvice && hasStudyOrField;
  }

  private hasScoreChoicePattern(text: string): boolean {
    const hasScore = /\b\d{2,3}(?:[.,]\d+)?\b/.test(text) || this.hasTerm(text, 'score');
    const asksOptions = [
      'chnowa najem',
      'chniya najem',
      'najem na3mel',
      'najam naamel',
      'que puis je faire',
      'quoi faire',
      'شنوة نجم',
      'ماذا يمكن',
    ].some((term) => this.hasTerm(text, term));

    return hasScore && asksOptions;
  }

  private hasLocationStudyPattern(text: string): boolean {
    const asksWhere = ['win', 'ou', 'where', 'وين', 'اين', 'أين'].some((term) =>
      this.hasTerm(text, term),
    );
    const studies = ['na9ra', 'naqra', 'nokra', 'etudier', 'fac', 'universite', 'نقرا', 'نقرأ', 'ادرس'].some(
      (term) => this.hasTerm(text, term),
    );

    return asksWhere && studies;
  }

  private createEmptyScores(): IntentScore {
    return {
      orientation: 0,
      requirements: 0,
      career: 0,
      location: 0,
      comparison: 0,
      general: 0,
    };
  }

  private getBestIntent(scores: IntentScore): OrientationIntent {
    const priority: OrientationIntent[] = [
      'location',
      'comparison',
      'career',
      'requirements',
      'orientation',
      'general',
    ];

    return priority.reduce((best, intent) => {
      if (scores[intent] > scores[best]) return intent;
      return best;
    }, 'general');
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
