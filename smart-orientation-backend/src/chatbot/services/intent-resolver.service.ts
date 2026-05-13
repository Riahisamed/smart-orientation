import { Injectable, Logger } from '@nestjs/common';
import { DomainMatcherService, MatchResult } from './domain-matcher.service';

export type IntentType =
  | 'domain_inquiry'
  | 'career_inquiry'
  | 'roadmap_inquiry'
  | 'comparison'
  | 'program_search'
  | 'general_question'
  | 'follow_up_needed'
  | 'direct_answer';

export interface IntentResult {
  type: IntentType;
  confidence: number;
  domain?: string;
  entities: {
    domains?: string[];
    level?: 'beginner' | 'intermediate' | 'advanced';
    comparison?: { domain1: string; domain2: string };
    specific_terms?: string[];
    showRoadmapSelector?: boolean;
  };
  responseStrategy:
    | 'direct'
    | 'clarification'
    | 'comparison'
    | 'roadmap'
    | 'career'
    | 'roadmap_selector';
  language: 'fr' | 'ar' | 'mixed';
}

@Injectable()
export class IntentResolverService {
  private readonly logger = new Logger(IntentResolverService.name);

  constructor(private readonly domainMatcher: DomainMatcherService) {}

  public resolveIntent(message: string): IntentResult {
    if (!message || message.trim().length === 0) {
      return this.createDefaultIntent();
    }

    const language = this.detectLanguage(message);
    const normalizedMessage = message.toLowerCase().trim();

    // Check for comparison intent first (highest priority)
    const comparisonIntent = this.checkComparisonIntent(
      normalizedMessage,
      language,
    );
    if (comparisonIntent) {
      return comparisonIntent;
    }

    // Check for roadmap intent
    const roadmapIntent = this.checkRoadmapIntent(normalizedMessage, language);
    if (roadmapIntent) {
      return roadmapIntent;
    }

    // Check for career intent
    const careerIntent = this.checkCareerIntent(normalizedMessage, language);
    if (careerIntent) {
      return careerIntent;
    }

    // Check for direct domain inquiries
    const domainIntent = this.checkDomainIntent(normalizedMessage, language);
    if (domainIntent) {
      return domainIntent;
    }

    // Check for program search intent
    const programIntent = this.checkProgramSearchIntent(
      normalizedMessage,
      language,
    );
    if (programIntent) {
      return programIntent;
    }

    // Default to general question
    return {
      type: 'general_question',
      confidence: 0.3,
      entities: {},
      responseStrategy: 'clarification',
      language,
    };
  }

  private createDefaultIntent(): IntentResult {
    return {
      type: 'general_question',
      confidence: 0.1,
      entities: {},
      responseStrategy: 'clarification',
      language: 'fr',
    };
  }

  private detectLanguage(message: string): 'fr' | 'ar' | 'mixed' {
    const arabicChars = (message.match(/[\u0600-\u06FF]/g) || []).length;
    const frenchChars = (message.match(/[a-zA-Zàâäéèêëïîôöùûüÿç]/g) || [])
      .length;
    const totalChars = message.replace(/\s/g, '').length;

    if (totalChars === 0) return 'fr';

    const arabicRatio = arabicChars / totalChars;
    const frenchRatio = frenchChars / totalChars;

    if (arabicRatio > 0.7) return 'ar';
    if (frenchRatio > 0.7) return 'fr';
    return 'mixed';
  }

  private checkComparisonIntent(
    message: string,
    language: 'fr' | 'ar' | 'mixed',
  ): IntentResult | null {
    const comparisonPatterns = [
      /(.+?)\s+vs\s+(.+)/i,
      /(.+?)\s+versus\s+(.+)/i,
      /(.+?)\s+ou\s+(.+)/i,
      /(.+?)\s+أو\s+(.+)/,
      /(.+?)\s+contra\s+(.+)/i,
      /(.+?)\s+contre\s+(.+)/i,
      /compare\s+(.+?)\s+et\s+(.+)/i,
      /قارن\s+(.+?)\s+و\s+(.+)/,
    ];

    for (const pattern of comparisonPatterns) {
      const match = message.match(pattern);
      if (match) {
        const domain1Match = this.domainMatcher.quickMatch(match[1]);
        const domain2Match = this.domainMatcher.quickMatch(match[2]);

        if (domain1Match && domain2Match) {
          return {
            type: 'comparison',
            confidence: 0.9,
            entities: {
              domains: [domain1Match.field, domain2Match.field],
              comparison: {
                domain1: domain1Match.field,
                domain2: domain2Match.field,
              },
            },
            domain: domain1Match.field,
            responseStrategy: 'comparison',
            language: language,
          };
        }
      }
    }

    return null;
  }

  private checkRoadmapIntent(
    message: string,
    language: 'fr' | 'ar' | 'mixed',
  ): IntentResult | null {
    const roadmapKeywords = [
      // French
      'roadmap',
      'parcours',
      'chemin',
      'étapes',
      'progression',
      'comment devenir',
      'comment apprendre',
      'formation',
      'apprendre',
      'débuter',
      'commencer',
      // Standard Arabic
      'مسار',
      'طريق',
      'مراحل',
      'تطور',
      'كيف أصبح',
      'road map',
      'learning path',
      'تدريب',
      'تعلم',
      'تكوين',
      'بداية',
      'كيف أبدأ',
      'ماذا أتعلم',
      // Tunisian Arabic (Darija)
      'شنو نتعلم',
      'شنوّا نتعلم',
      'شنوة نتعلم',
      'كيفاش نبدأ',
      'كيفاش نبدا',
      'كيفاش نتعلم',
      'كيف نبدأ',
      'منين نبدأ',
      'منين نبدا',
      'كيفاش نولي',
      'شنيا لازم نتعلم',
      'شنو لازمني',
      'كيفاش نخدم',
      'شنو نعمل',
      'كيف نتعلم',
      // Keywords
      'skills',
      'compétences',
      'skill',
      'aptitudes',
      'مهارات',
      'path',
      'voie',
      'begin',
      'start',
      'débuter',
    ];

    const levelKeywords = {
      beginner: [
        'débutant',
        'basique',
        'initiation',
        'مبتدئ',
        'أساسي',
        'تمهيدي',
      ],
      intermediate: ['intermédiaire', 'moyen', 'avancé', 'متوسط', 'متقدم'],
      advanced: ['avancé', 'expert', 'professionnel', 'خبير', 'محترف', 'متقدم'],
    };

    const hasRoadmapKeyword = roadmapKeywords.some((keyword) =>
      message.includes(keyword),
    );

    if (!hasRoadmapKeyword) return null;

    let detectedLevel: 'beginner' | 'intermediate' | 'advanced' | undefined;

    for (const [level, keywords] of Object.entries(levelKeywords)) {
      if (keywords.some((keyword) => message.includes(keyword))) {
        detectedLevel = level as 'beginner' | 'intermediate' | 'advanced';
        break;
      }
    }

    // Try to match domain
    const domainMatch = this.domainMatcher.matchDomain(message);

    return {
      type: 'roadmap_inquiry',
      confidence: 0.85,
      entities: {
        domains: domainMatch ? [domainMatch.domain.field] : undefined,
        level: detectedLevel,
        specific_terms: domainMatch ? domainMatch.matchedTerms : [],
      },
      domain: domainMatch?.domain.field,
      responseStrategy: 'roadmap',
      language: language,
    };
  }

  private checkCareerIntent(
    message: string,
    language: 'fr' | 'ar' | 'mixed',
  ): IntentResult | null {
    const careerKeywords = [
      // French
      'métier',
      'job',
      'carrière',
      'emploi',
      'travail',
      'profession',
      'opportunité',
      'salarié',
      'revenu',
      'salaire',
      'recrutement',
      'poste',
      'fonction',
      'avenir',
      'travailler',
      'gagner',
      'revenu',
      'future',
      // Standard Arabic
      'وظيفة',
      'عمل',
      'مهنة',
      'وظائف',
      'فرص عمل',
      'راتب',
      'توظيف',
      'منصب',
      'مستقبل',
      'مهني',
      'وظيفي',
      'خطة مهنية',
      // Tunisian Arabic (Darija)
      'شنو نولي',
      'شنو نخدم',
      'شنو نشد',
      'كيفاش نخدم',
      'كيفاش نشد خدمة',
      'شنو احسن شغل',
      'شنو احسن خدمة',
      'شنوة نولي',
      'شنوّا نخدم',
      'فلوس',
      'دراهم',
      'خرجة',
      'شغل',
      'خدمة',
      'تخدم',
      'تشغل',
      // English
      'career',
      'profession',
      'occupation',
    ];

    const hasCareerKeyword = careerKeywords.some((keyword) =>
      message.includes(keyword),
    );

    if (!hasCareerKeyword) return null;

    const domainMatch = this.domainMatcher.matchDomain(message);

    return {
      type: 'career_inquiry',
      confidence: 0.8,
      entities: {
        domains: domainMatch ? [domainMatch.domain.field] : undefined,
        specific_terms: domainMatch ? domainMatch.matchedTerms : [],
      },
      domain: domainMatch?.domain.field,
      responseStrategy: 'career',
      language: language,
    };
  }

  private checkDomainIntent(
    message: string,
    language: 'fr' | 'ar' | 'mixed',
  ): IntentResult | null {
    // Direct domain inquiries like "cyber", "frontend", "informatique"
    const domainMatch = this.domainMatcher.matchDomain(message);

    if (domainMatch && domainMatch.score > 50) {
      return {
        type: 'domain_inquiry',
        confidence: 0.75,
        entities: {
          domains: [domainMatch.domain.field],
          specific_terms: domainMatch.matchedTerms,
        },
        domain: domainMatch.domain.field,
        responseStrategy: 'direct',
        language: language,
      };
    }

    // Check for questions about specific fields
    const inquiryPatterns = [
      /qu'est\s+ce\s+que\s+(.+)/i,
      /c'est\s+quoi\s+(.+)/i,
      /(.+)\s+c'est\s+quoi/i,
      /شنوّا\s+(.+)/,
      /ما\s+هو\s+(.+)/,
      /عن\s+(.+)/,
    ];

    for (const pattern of inquiryPatterns) {
      const match = message.match(pattern);
      if (match) {
        const domainMatch = this.domainMatcher.quickMatch(match[1]);
        if (domainMatch) {
          return {
            type: 'domain_inquiry',
            confidence: 0.75,
            entities: {
              domains: [domainMatch.field],
              specific_terms: [match[1]],
            },
            domain: domainMatch.field,
            responseStrategy: 'direct',
            language: language,
          };
        }
      }
    }

    return null;
  }

  private checkProgramSearchIntent(
    message: string,
    language: 'fr' | 'ar' | 'mixed',
  ): IntentResult | null {
    const programKeywords = [
      'formation',
      'programme',
      'étude',
      'cours',
      'diplôme',
      'certification',
      'université',
      'école',
      'institut',
      'bac',
      'orientation',
      'inscription',
      'تخصص',
      'برنامج',
      'دراسة',
      'مسار',
      'شهادة',
      'جامعة',
      'مدرسة',
      'معهد',
    ];

    const hasProgramKeyword = programKeywords.some((keyword) =>
      message.includes(keyword),
    );

    if (!hasProgramKeyword) return null;

    const domainMatch = this.domainMatcher.matchDomain(message);

    return {
      type: 'program_search',
      confidence: 0.7,
      entities: {
        domains: domainMatch ? [domainMatch.domain.field] : undefined,
        specific_terms: domainMatch ? domainMatch.matchedTerms : [],
      },
      domain: domainMatch?.domain.field,
      responseStrategy: 'direct',
      language: language,
    };
  }

  // Helper method to determine if follow-up is needed
  public needsFollowUp(intent: IntentResult, message: string): boolean {
    if (intent.type === 'general_question') return true;
    if (intent.confidence < 0.6) return true;
    if (intent.type === 'domain_inquiry' && !intent.domain) return true;

    // Very short messages might need clarification
    if (message.trim().length < 3) return true;

    return false;
  }

  // Generate follow-up question based on intent
  public generateFollowUpQuestion(intent: IntentResult): string {
    const language = intent.language;

    if (language === 'ar') {
      if (intent.type === 'general_question') {
        return 'هل يمكنك أن تكون أكثر تحديدًا؟ ما هو المجال الذي يهمك؟';
      }
      return 'هل تحتاج إلى معلومات عن برامج الدراسة أم عن فرص العمل؟';
    } else {
      if (intent.type === 'general_question') {
        return 'Pouvez-vous être plus précis ? Quel domaine vous intéresse ?';
      }
      return "Souhaitez-vous des informations sur les programmes d'études ou sur les opportunités de carrière ?";
    }
  }

  // Extract specific entities for better response generation
  public extractEntities(message: string): {
    domains: string[];
    skills: string[];
    tools: string[];
    level?: 'beginner' | 'intermediate' | 'advanced';
    institutions: string[];
  } {
    const entities = {
      domains: [] as string[],
      skills: [] as string[],
      tools: [] as string[],
      institutions: [] as string[],
    };

    // Extract domains using domain matcher
    const domainMatches = this.domainMatcher.matchMultipleDomains(message, 5);
    entities.domains = domainMatches.map((match) => match.domain.field);

    // Extract common skills
    const skillKeywords = [
      'programmation',
      'javascript',
      'python',
      'java',
      'web',
      'mobile',
      'design',
      'communication',
      'management',
      'analyse',
      'recherche',
      'برمجة',
      'تصميم',
      'تواصل',
      'إدارة',
      'تحليل',
      'بحث',
    ];

    for (const skill of skillKeywords) {
      if (message.toLowerCase().includes(skill)) {
        entities.skills.push(skill);
      }
    }

    // Extract common tools
    const toolKeywords = [
      'excel',
      'word',
      'photoshop',
      'autocad',
      'matlab',
      'git',
      'docker',
      'aws',
      'react',
      'node',
      'figma',
    ];

    for (const tool of toolKeywords) {
      if (message.toLowerCase().includes(tool)) {
        entities.tools.push(tool);
      }
    }

    return entities;
  }
}
