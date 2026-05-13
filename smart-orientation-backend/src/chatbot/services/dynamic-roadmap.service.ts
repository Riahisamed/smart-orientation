import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DomainMatcherService, Domain } from './domain-matcher.service';
import { BAC_DOMAINS, BacType } from './bac-domain-mapping';

export interface PersonalizedDomainSuggestion {
  domain: string; // domain field (used as identifier by UI)
  field: string;
  relevanceScore: number;
  reason: string;
  icon: string;
  color: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  demand: string;
}

export interface RoadmapSelectorConfig {
  title: string;
  subtitle: string;
  suggestions: PersonalizedDomainSuggestion[];
  maxSuggestions: number;
  showScores: boolean;
  personalized: boolean;
}

export interface RoadmapPhase {
  title: string;
  duration: string;
  skills: string[];
  projects: string[];
  resources: string[];
  milestones: string[];
}

export interface SpecificRoadmap {
  domain: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  phases: RoadmapPhase[];
  totalDuration: string;
  prerequisites: string[];
  certifications: string[];
  careerPaths: string[];
}

@Injectable()
export class DynamicRoadmapService {
  private readonly logger = new Logger(DynamicRoadmapService.name);
  private readonly domainsData: { domains: Domain[] };

  constructor(private readonly domainMatcher: DomainMatcherService) {
    this.domainsData = this.loadDomainsData();
  }

  private loadDomainsData(): { domains: Domain[] } {
    try {
      const filePath = path.join(process.cwd(), 'data', 'domains.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      return { domains: parsed.domains || [] };
    } catch (error) {
      this.logger.error('Failed to load domains.json', error);
      return { domains: [] };
    }
  }

  public shouldShowRoadmapSelector(
    message: string,
    detectedDomain?: string,
  ): boolean {
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

      // Arabic / MSA
      'مسار',
      'طريق',
      'مراحل',
      'تطور',
      'كيف أصبح',
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

      // English / general
      'career',
      'carrière',
      'path',
      'skills',
      'skill',
      'begin',
      'start',
      'emploi',
      'travail',
      'métier',
      'job',
      'وظيفة',
      'عمل',
      'مهنة',
      'compétences',
      'aptitudes',
      'مهارات',
    ];

    const normalizedMessage = message.toLowerCase();
    const hasRoadmapKeyword = roadmapKeywords.some((keyword) =>
      normalizedMessage.includes(keyword.toLowerCase()),
    );

    const isAskingForGuidance =
      !detectedDomain &&
      (normalizedMessage.includes('شنو') ||
        normalizedMessage.includes('كيف') ||
        normalizedMessage.includes('منين') ||
        normalizedMessage.includes('comment') ||
        normalizedMessage.includes('quoi') ||
        normalizedMessage.includes('what') ||
        normalizedMessage.includes('how'));

    return (hasRoadmapKeyword || isAskingForGuidance) && !detectedDomain;
  }

  public generatePersonalizedRoadmapSelector(
    message: string,
    bacType?: string,
    _studentScore?: number,
    detectedInterest?: string,
  ): RoadmapSelectorConfig {
    const language = this.detectLanguage(message);
    const bac = this.normalizeBacType(bacType);
    const suggestions = this.generateDomainSuggestions(bac, detectedInterest);

    return {
      title:
        language === 'ar'
          ? 'اختر مجالك المخصص'
          : 'Choisissez votre domaine personnalisé',
      subtitle:
        language === 'ar'
          ? 'بناءً على Bac type و اهتماماتك'
          : 'Basé sur votre Bac type et vos intérêts',
      suggestions: suggestions, // Return ALL compatible domains, no limit
      maxSuggestions: suggestions.length,
      showScores: true,
      personalized: true,
    };
  }

  public generateSpecificRoadmap(
    domainField: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  ): SpecificRoadmap {
    // Try exact field match first
    let domain = this.domainMatcher.getDomainByField(domainField);

    // If exact match fails, try fuzzy matching
    if (!domain) {
      domain = this.domainMatcher.findDomainFuzzy(domainField);
    }

    if (!domain) {
      throw new Error(`Domain ${domainField} not found`);
    }

    return this.createDomainSpecificRoadmap(domain, level);
  }

  private normalizeBacType(bacType?: string): BacType | undefined {
    const n = (bacType || '').trim().toUpperCase();
    const mapping: Record<string, BacType> = {
      MATH: 'MATH',
      MATHEMATIQUES: 'MATH',
      MATHEMATIQUE: 'MATH',
      INFO: 'INFO',
      INFORMATIQUE: 'INFO',
      SVT: 'SVT',
      SCIENCES: 'SVT',
      ECO: 'ECO',
      ECONOMIE: 'ECO',
      ECONOMIQUES: 'ECO',
      LETTRES: 'LETTRES',
      LITTERAIRE: 'LETTRES',
      LITTERATURE: 'LETTRES',
      SPORT: 'SPORT',
      SPORTIF: 'SPORT',
      TECH: 'TECH',
      TECHNIQUE: 'TECH',
      TECHNOLOGIE: 'TECH',
    };
    const result = mapping[n];
    if (bacType && !result) {
      this.logger.warn(
        `[RoadmapFilter] Unknown BAC type: "${bacType}" (normalized: "${n}")`,
      );
    }
    return result;
  }

  private generateDomainSuggestions(
    bacType?: BacType,
    detectedInterest?: string,
  ): PersonalizedDomainSuggestion[] {
    const allDomains = this.domainsData.domains || [];
    const suggestions: PersonalizedDomainSuggestion[] = [];
    let rejectedCount = 0;

    const interestMatch = detectedInterest
      ? this.domainMatcher.matchDomain(detectedInterest)
      : null;

    for (const domain of allDomains) {
      const relevanceScore = this.calculateBacDomainScore(
        domain,
        bacType,
        interestMatch?.domain.field,
      );

      if (relevanceScore <= 0) {
        rejectedCount++;
        continue;
      }

      suggestions.push(this.createDomainSuggestion(domain, relevanceScore));
    }

    // Log filtering results
    this.logger.debug(
      `[RoadmapFilter] BAC=${bacType}: ${suggestions.length}/${allDomains.length} domains allowed (${rejectedCount} rejected)`,
    );

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateBacDomainScore(
    domain: Domain,
    bacType?: BacType,
    interestDomainField?: string,
  ): number {
    const bacRule = bacType ? BAC_DOMAINS[bacType] : undefined;
    if (!bacRule) return domain.field ? 0.2 : 0;

    // STRICT WHITELIST CHECK: Domain MUST be in the allowed list for this BAC type
    // This ensures students ONLY see compatible domains
    const isAllowed = bacRule.allowedDomains.includes(domain.field);

    if (!isAllowed) {
      return 0; // Domain not compatible with this BAC type
    }

    // Domain is allowed - calculate relevance score for ranking
    let score = 0.5; // Base score for being in whitelist

    // Boost score if interest matches
    if (interestDomainField && interestDomainField === domain.field) {
      score += 0.4;
    }

    // Boost based on demand
    if (domain.demand_in_tunisia) {
      const d = domain.demand_in_tunisia.toLowerCase();
      if (d.includes('very high')) score += 0.1;
      else if (d.includes('high')) score += 0.06;
    }

    return Math.min(score, 1);
  }

  private createDomainSuggestion(
    domain: Domain,
    relevanceScore: number,
  ): PersonalizedDomainSuggestion {
    return {
      domain: domain.field,
      field: domain.field,
      relevanceScore,
      reason: this.generateSuggestionReason(relevanceScore),
      // domains.json may not include icon/color; derived mapping keeps UI stable
      icon: this.getDomainIcon(domain.field),
      color: this.getDomainColor(domain.field),
      description: this.getDomainDescription(domain.field),
      difficulty: this.getDomainDifficulty(domain),
      demand: domain.demand_in_tunisia,
    };
  }

  private generateSuggestionReason(score: number): string {
    if (score > 0.8)
      return 'Excellent match! High demand and great future prospects';
    if (score > 0.6) return 'Good compatibility with your profile';
    if (score > 0.4) return 'Potential option, consider your interests';
    return 'Alternative path if interested';
  }

  private getDomainIcon(domainField: string): string {
    const icons: Record<string, string> = {
      IT: '💻',
      'AI & Machine Learning': '🤖',
      Cybersecurity: '🛡️',
      'Frontend Development': '🎨',
      'Backend Development': '🧠',
      'Business / Management': '💼',
      'Médecine / Santé': '🏥',
      'Droit / Avocat': '⚖️',
      'Traduction / Langues': '📚',
      'Journalisme / Médias': '🗞️',
      'Coaching / Sport': '⚽',
    };
    return icons[domainField] || '📖';
  }

  private getDomainColor(domainField: string): string {
    const colors: Record<string, string> = {
      IT: '#3B82F6',
      Cybersecurity: '#3B82F6',
      'Frontend Development': '#F97316',
      'Backend Development': '#10B981',
      'AI & Machine Learning': '#8B5CF6',
      'Business / Management': '#F59E0B',
      'Médecine / Santé': '#10B981',
      'Droit / Avocat': '#6366F1',
      'Traduction / Langues': '#EC4899',
      'Journalisme / Médias': '#14B8A6',
      'Coaching / Sport': '#84CC16',
    };
    return colors[domainField] || '#6B7280';
  }

  private getDomainDescription(domainField: string): string {
    const descriptions: Record<string, string> = {
      IT: 'Software development, cybersecurity, data science',
      'AI & Machine Learning':
        'Build intelligent systems with ML and deep learning.',
      Cybersecurity:
        'Protecting systems, detecting threats, and securing networks.',
      'Frontend Development':
        'Build modern user interfaces and web experiences.',
      'Backend Development':
        'Create APIs, databases, and scalable server-side systems.',
      'Business / Management':
        'Finance, marketing, strategy, and entrepreneurship.',
      'Médecine / Santé':
        'Clinical practice, diagnosis, and medical specialization.',
      'Droit / Avocat': 'Legal research, advocacy, and professional practice.',
      'Traduction / Langues':
        'Translation, interpreting, linguistics, and multilingual content.',
      'Journalisme / Médias':
        'Content creation, reporting, broadcasting, and media production.',
      'Coaching / Sport':
        'Training programs, sports nutrition, and performance coaching.',
    };
    return descriptions[domainField] || 'Professional development and growth';
  }

  private getDomainDifficulty(domain: Domain): 'easy' | 'medium' | 'hard' {
    const risk = domain.unemployment_risk;
    if (!risk) return 'medium';
    if (risk === 'Low') return 'easy';
    if (risk === 'Moderate') return 'medium';
    return 'hard';
  }

  private createDomainSpecificRoadmap(
    domain: Domain,
    level: 'beginner' | 'intermediate' | 'advanced',
  ): SpecificRoadmap {
    const roadmapRoot = domain.roadmap as any;
    const roadmapLevel =
      (roadmapRoot && roadmapRoot[level]) || roadmapRoot?.[level];

    const phases: RoadmapPhase[] = (roadmapLevel?.phases || []).map(
      (p: any) => ({
        title: p.title,
        duration: p.duration,
        skills: p.skills || [],
        projects: p.projects || [],
        resources: p.resources || [],
        milestones: p.milestones || [],
      }),
    );

    return {
      domain: domain.field,
      level,
      phases,
      totalDuration:
        roadmapLevel?.duration || this.calculateTotalDuration(phases),
      prerequisites: domain.skills || [],
      certifications: roadmapLevel?.certifications || [],
      careerPaths: roadmapLevel?.career_paths || [],
    };
  }

  private calculateTotalDuration(phases: RoadmapPhase[]): string {
    const totalMonths = phases.reduce((total, phase) => {
      const match = (phase.duration || '').match(/(\d+)\s*-\s*(\d+)/);
      if (match) return total + parseInt(match[2], 10);

      const single = (phase.duration || '').match(/(\d+)/);
      if (single) return total + parseInt(single[1], 10);

      return total;
    }, 0);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years > 0 && months > 0) return `${years}-${years + 1} years`;
    if (years > 0) return `${years} years`;
    return `${months} months`;
  }

  private detectLanguage(message: string): 'fr' | 'ar' {
    const arabicChars = (message.match(/[\u0600-\u06FF]/g) || []).length;
    const frenchChars = (message.match(/[a-zA-Zàâäéèêëïîôöùûüÿç]/g) || [])
      .length;
    const totalChars = message.replace(/\s/g, '').length;

    if (totalChars === 0) return 'fr';

    const arabicRatio = arabicChars / totalChars;
    const frenchRatio = frenchChars / totalChars;

    if (arabicRatio > 0.7) return 'ar';
    if (frenchRatio > 0.7) return 'fr';
    return 'fr';
  }
}
