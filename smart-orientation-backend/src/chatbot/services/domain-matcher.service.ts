import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Domain {
  field: string;
  aliases: string[];
  keywords: string[];
  education: string[];
  demand_in_tunisia: string;
  future_outlook: string;
  unemployment_risk: string;
  tools: string[];
  skills: string[];
  roadmap: {
    beginner: {
      duration: string;
      skills: string[];
      projects: string[];
      certifications: string[];
    };
    intermediate: {
      duration: string;
      skills: string[];
      projects: string[];
      certifications: string[];
    };
    advanced: {
      duration: string;
      skills: string[];
      projects: string[];
      certifications: string[];
    };
  };
}

export interface DomainsData {
  domains: Domain[];
  matching_priority: string[];
  normalization_rules: {
    remove_accents: boolean;
    lowercase: boolean;
    trim_spaces: boolean;
    arabic_normalization: {
      [key: string]: string;
    };
  };
}

export interface MatchResult {
  domain: Domain;
  score: number;
  matchedTerms: string[];
  matchType: 'alias' | 'keyword' | 'education' | 'field' | 'semantic';
}

@Injectable()
export class DomainMatcherService {
  private readonly logger = new Logger(DomainMatcherService.name);
  private readonly domainsData: DomainsData;
  private readonly normalizedAliasesCache = new Map<string, string[]>();
  private readonly normalizedKeywordsCache = new Map<string, string[]>();

  constructor() {
    this.domainsData = this.loadDomainsData();
    this.buildCaches();
    this.logger.log(`Loaded ${this.domainsData.domains.length} domains for matching`);
  }

  private loadDomainsData(): DomainsData {
    try {
      const filePath = path.join(process.cwd(), 'data', 'domains.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to load domains.json', error);
      return {
        domains: [],
        matching_priority: ['aliases', 'keywords', 'education', 'field'],
        normalization_rules: {
          remove_accents: true,
          lowercase: true,
          trim_spaces: true,
          arabic_normalization: {
            'أإآ': 'ا',
            'ة': 'ه',
            'ى': 'ي'
          }
        }
      };
    }
  }

  private buildCaches(): void {
    for (const domain of this.domainsData.domains) {
      this.normalizedAliasesCache.set(domain.field, this.normalizeArray(domain.aliases));
      this.normalizedKeywordsCache.set(domain.field, this.normalizeArray(domain.keywords));
    }
  }

  private normalizeText(text: string): string {
    const rules = this.domainsData.normalization_rules;
    let normalized = text;

    if (rules.lowercase) {
      normalized = normalized.toLowerCase();
    }

    if (rules.remove_accents) {
      normalized = normalized
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    // Arabic normalization
    for (const [from, to] of Object.entries(rules.arabic_normalization)) {
      normalized = normalized.replace(new RegExp(from, 'g'), to);
    }

    if (rules.trim_spaces) {
      normalized = normalized.replace(/\s+/g, ' ').trim();
    }

    return normalized;
  }

  private normalizeArray(arr: string[]): string[] {
    return arr.map(item => this.normalizeText(item));
  }

  private calculateMatchScore(
    normalizedInput: string,
    terms: string[],
    matchType: 'alias' | 'keyword' | 'education' | 'field'
  ): { score: number; matchedTerms: string[] } {
    const matchedTerms: string[] = [];
    let score = 0;

    for (const term of terms) {
      if (normalizedInput.includes(term)) {
        matchedTerms.push(term);
        // Higher score for exact matches
        if (normalizedInput === term) {
          score += 100;
        } else if (normalizedInput.includes(term)) {
          score += 50;
        }
      }
    }

    // Apply weight based on match type priority
    const priorityIndex = this.domainsData.matching_priority.indexOf(matchType);
    const weight = (this.domainsData.matching_priority.length - priorityIndex) / this.domainsData.matching_priority.length;
    score *= weight;

    return { score, matchedTerms };
  }

  private semanticMatch(normalizedInput: string, domain: Domain): { score: number; matchedTerms: string[] } {
    // Semantic matching using fuzzy logic and domain-specific patterns
    const semanticPatterns: { [key: string]: RegExp[] } = {
      'IT': [
        /\b(dev|develop|code|program|web|app|software|data|cyber|tech|digital)\b/i,
        /\b(برمج|تطوير|ويب|موقع|تطبيق|برنامج|بيانات|سيبر|تقني|رقمي)\b/i
      ],
      'Engineering': [
        /\b(engineer|ingenieur|genie|mechanic|electric|civil|industrial|energy|robot)\b/i,
        /\b(هندسة|مهندس|ميكانيك|كهرباء|مدني|صناعي|طاقة|روبوت|آلي)\b/i
      ],
      'Medical / Health': [
        /\b(medical|health|medecine|doctor|nurse|pharmacy|hospital|clinic|patient)\b/i,
        /\b(طب|صحة|طبيب|ممرض|صيدلي|مستشفى|عيادة|مريض|علاج)\b/i
      ],
      'Business / Management': [
        /\b(business|management|finance|marketing|economy|commerce|account|audit)\b/i,
        /\b(أعمال|إدارة|مالية|تسويق|اقتصاد|تجارة|محاسبة|مراجعة)\b/i
      ],
      'Science': [
        /\b(science|research|lab|chemistry|physics|biology|math|environment|study)\b/i,
        /\b(علم|بحث|مختبر|كيمياء|فيزياء|أحياء|رياضيات|بيئة|دراسة)\b/i
      ],
      'Languages': [
        /\b(language|translation|literature|linguistics|communication|writing|journalism)\b/i,
        /\b(لغة|ترجمة|أدب|لغويات|تواصل|كتابة|صحافة|تحرير)\b/i
      ],
      'Law': [
        /\b(law|legal|justice|court|lawyer|judge|tribunal|regulation|compliance)\b/i,
        /\b(قانون|قضائي|عدالة|محكمة|محامي|قاضي|جهة|تنظيم|التزام)\b/i
      ],
      'Arts & Design': [
        /\b(art|design|creative|graphic|visual|music|cinema|fashion|architecture)\b/i,
        /\b(فن|تصميم|إبداع|جرافيك|بصري|موسيقى|سينما|أزياء|عمارة)\b/i
      ],
      'Social Sciences': [
        /\b(social|sociology|psychology|anthropology|politics|community|society|culture)\b/i,
        /\b(اجتماع|علم نفس|أنثروبولوجيا|سياسة|مجتمع|ثقافة|سكان|تنمية)\b/i
      ]
    };

    const patterns = semanticPatterns[domain.field] || [];
    let score = 0;
    const matchedTerms: string[] = [];

    for (const pattern of patterns) {
      if (pattern.test(normalizedInput)) {
        score += 25; // Lower score for semantic matches
        matchedTerms.push(pattern.source);
      }
    }

    return { score, matchedTerms };
  }

  public matchDomain(input: string): MatchResult | null {
    if (!input || input.trim().length === 0) {
      return null;
    }

    const normalizedInput = this.normalizeText(input);
    let bestMatch: MatchResult | null = null;

    for (const domain of this.domainsData.domains) {
      let totalScore = 0;
      const allMatchedTerms: string[] = [];
      let bestMatchType: 'alias' | 'keyword' | 'education' | 'field' | 'semantic' = 'semantic';

      // Check aliases (highest priority)
      const aliasMatches = this.calculateMatchScore(
        normalizedInput,
        this.normalizedAliasesCache.get(domain.field) || [],
        'alias'
      );
      if (aliasMatches.score > 0) {
        totalScore += aliasMatches.score;
        allMatchedTerms.push(...aliasMatches.matchedTerms);
        bestMatchType = 'alias';
      }

      // Check keywords
      const keywordMatches = this.calculateMatchScore(
        normalizedInput,
        this.normalizedKeywordsCache.get(domain.field) || [],
        'keyword'
      );
      if (keywordMatches.score > 0) {
        totalScore += keywordMatches.score;
        allMatchedTerms.push(...keywordMatches.matchedTerms);
        if (bestMatchType === 'semantic') bestMatchType = 'keyword';
      }

      // Check education programs
      const educationMatches = this.calculateMatchScore(
        normalizedInput,
        this.normalizeArray(domain.education),
        'education'
      );
      if (educationMatches.score > 0) {
        totalScore += educationMatches.score;
        allMatchedTerms.push(...educationMatches.matchedTerms);
        if (bestMatchType === 'semantic') bestMatchType = 'education';
      }

      // Check field name
      const fieldMatches = this.calculateMatchScore(
        normalizedInput,
        [this.normalizeText(domain.field)],
        'field'
      );
      if (fieldMatches.score > 0) {
        totalScore += fieldMatches.score;
        allMatchedTerms.push(...fieldMatches.matchedTerms);
        if (bestMatchType === 'semantic') bestMatchType = 'field';
      }

      // Semantic matching as fallback
      if (totalScore === 0) {
        const semanticMatches = this.semanticMatch(normalizedInput, domain);
        totalScore += semanticMatches.score;
        allMatchedTerms.push(...semanticMatches.matchedTerms);
      }

      if (totalScore > 0) {
        const currentMatch: MatchResult = {
          domain,
          score: totalScore,
          matchedTerms: [...new Set(allMatchedTerms)], // Remove duplicates
          matchType: bestMatchType
        };

        if (!bestMatch || currentMatch.score > bestMatch.score) {
          bestMatch = currentMatch;
        }
      }
    }

    return bestMatch;
  }

  public matchMultipleDomains(input: string, maxResults: number = 3): MatchResult[] {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const normalizedInput = this.normalizeText(input);
    const matches: MatchResult[] = [];

    for (const domain of this.domainsData.domains) {
      const match = this.matchDomain(input);
      if (match && match.domain.field === domain.field) {
        matches.push(match);
      }
    }

    // Sort by score (descending) and return top results
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  public getDomainByField(fieldName: string): Domain | null {
    return this.domainsData.domains.find(domain => 
      this.normalizeText(domain.field) === this.normalizeText(fieldName)
    ) || null;
  }

  public getAllDomains(): Domain[] {
    return this.domainsData.domains;
  }

  public getDomainRoadmap(fieldName: string, level: 'beginner' | 'intermediate' | 'advanced'): any {
    const domain = this.getDomainByField(fieldName);
    if (!domain) return null;
    
    return domain.roadmap[level];
  }

  public compareDomains(domain1: string, domain2: string): {
    domain1: Domain | null;
    domain2: Domain | null;
    comparison: {
      demand: string;
      outlook: string;
      risk: string;
      tools: string[];
      skills: string[];
    };
  } {
    const d1 = this.getDomainByField(domain1);
    const d2 = this.getDomainByField(domain2);

    if (!d1 && !d2) {
      return {
        domain1: null,
        domain2: null,
        comparison: {
          demand: 'Unknown',
          outlook: 'Unknown',
          risk: 'Unknown',
          tools: [],
          skills: []
        }
      };
    }

    const comparison = {
      demand: this.compareField(d1?.demand_in_tunisia, d2?.demand_in_tunisia),
      outlook: this.compareField(d1?.future_outlook, d2?.future_outlook),
      risk: this.compareField(d1?.unemployment_risk, d2?.unemployment_risk),
      tools: [...new Set([...(d1?.tools || []), ...(d2?.tools || [])])],
      skills: [...new Set([...(d1?.skills || []), ...(d2?.skills || [])])]
    };

    return { domain1: d1, domain2: d2, comparison };
  }

  private compareField(field1?: string, field2?: string): string {
    if (!field1 && !field2) return 'Unknown';
    if (!field1) return field2 || 'Unknown';
    if (!field2) return field1;
    
    return `${field1} vs ${field2}`;
  }

  // Helper method for direct queries like "cyber", "frontend", etc.
  public quickMatch(query: string): Domain | null {
    const match = this.matchDomain(query);
    return match?.domain || null;
  }

  // Method to handle comparison queries like "génie civil vs mécanique"
  public parseComparisonQuery(query: string): { domain1: string; domain2: string } | null {
    const normalizedQuery = this.normalizeText(query);
    
    // Look for comparison patterns
    const comparisonPatterns = [
      /(.+?)\s+vs\s+(.+)/i,
      /(.+?)\s+versus\s+(.+)/i,
      /(.+?)\s+ou\s+(.+)/i,
      /(.+?)\s+أو\s+(.+)/,
      /(.+?)\s+contra\s+(.+)/i
    ];

    for (const pattern of comparisonPatterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        const domain1 = this.quickMatch(match[1])?.field;
        const domain2 = this.quickMatch(match[2])?.field;
        
        if (domain1 && domain2) {
          return { domain1, domain2 };
        }
      }
    }

    return null;
  }
}
