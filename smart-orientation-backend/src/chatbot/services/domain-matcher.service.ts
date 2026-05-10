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

    // Replace & with 'and' for better matching
    normalized = normalized.replace(/\s*&\s*/g, ' and ');

    // Remove emojis (Unicode emoji ranges)
    normalized = normalized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/gu, '');

    // Remove special characters but keep alphanumeric, spaces, and accented chars for now
    normalized = normalized.replace(/[^\w\s\u00C0-\u017F]/g, ' ');

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

  /**
   * Normalize string for strict matching
   * - lowercase
   * - remove accents
   * - remove special chars
   * - trim spaces
   */
  private normalizeString(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ')    // Remove special chars, keep alphanumeric and spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * STRICT domain matching with priority:
   * 1. Exact field match (case-insensitive)
   * 2. Exact alias match (normalized)
   * 3. Normalized exact field comparison
   * 4. Keyword fallback (only if no exact matches)
   * 
   * Returns exact match or null - NO fuzzy/partial matching
   */
  public findDomainStrict(query: string): Domain | null {
    if (!query || query.trim().length === 0) {
      return null;
    }

    const normalizedQuery = this.normalizeString(query);

    // Priority 1: Exact field match (case-insensitive)
    for (const domain of this.domainsData.domains) {
      if (domain.field.toLowerCase() === query.toLowerCase()) {
        return domain;
      }
    }

    // Priority 2: Exact alias match (normalized)
    for (const domain of this.domainsData.domains) {
      const aliases = this.normalizedAliasesCache.get(domain.field) || [];
      for (const alias of aliases) {
        if (alias.toLowerCase() === query.toLowerCase()) {
          return domain;
        }
      }
      // Also check normalized version
      for (const alias of aliases) {
        if (this.normalizeString(alias) === normalizedQuery) {
          return domain;
        }
      }
    }

    // Priority 3: Normalized exact field comparison
    for (const domain of this.domainsData.domains) {
      if (this.normalizeString(domain.field) === normalizedQuery) {
        return domain;
      }
    }

    // Priority 4: Keyword fallback (only if exact matches failed)
    // Use only for very short queries (1-2 words) that might be keywords
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length <= 2) {
      for (const domain of this.domainsData.domains) {
        const keywords = this.normalizedKeywordsCache.get(domain.field) || [];
        for (const keyword of keywords) {
          const normalizedKeyword = this.normalizeString(keyword);
          if (normalizedKeyword === normalizedQuery) {
            return domain;
          }
        }
      }
    }

    return null;
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

  /**
   * Find domain using fuzzy matching with multiple fallback strategies
   * 1. Exact field match (normalized)
   * 2. Alias contains query or query contains alias
   * 3. Keyword contains query or query contains keyword
   * 4. Fuzzy string similarity
   * Returns the best matching domain or null
   */
  public findDomainFuzzy(query: string): Domain | null {
    if (!query || query.trim().length === 0) {
      return null;
    }

    const normalizedQuery = this.normalizeText(query);
    
    // Strategy 1: Exact field match (normalized)
    const exactMatch = this.getDomainByField(query);
    if (exactMatch) {
      return exactMatch;
    }

    let bestMatch: Domain | null = null;
    let bestScore = 0;

    for (const domain of this.domainsData.domains) {
      const normalizedField = this.normalizeText(domain.field);
      
      // Strategy 2: Field contains query or query contains field
      if (normalizedField.includes(normalizedQuery) || normalizedQuery.includes(normalizedField)) {
        const score = 100 + (normalizedField === normalizedQuery ? 50 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = domain;
        }
      }

      // Strategy 3: Check aliases (partial matching)
      const aliases = this.normalizedAliasesCache.get(domain.field) || [];
      for (const alias of aliases) {
        // Exact alias match
        if (alias === normalizedQuery) {
          return domain; // Return immediately on exact alias match
        }
        // Alias contains query or query contains alias
        if (alias.includes(normalizedQuery) || normalizedQuery.includes(alias)) {
          const score = 80 + Math.min(alias.length, normalizedQuery.length) / Math.max(alias.length, normalizedQuery.length) * 20;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = domain;
          }
        }
      }

      // Strategy 4: Check keywords (partial matching)
      const keywords = this.normalizedKeywordsCache.get(domain.field) || [];
      for (const keyword of keywords) {
        if (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)) {
          const score = 60 + Math.min(keyword.length, normalizedQuery.length) / Math.max(keyword.length, normalizedQuery.length) * 20;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = domain;
          }
        }
      }

      // Strategy 5: Calculate string similarity for fuzzy matching
      const similarity = this.calculateSimilarity(normalizedQuery, normalizedField);
      if (similarity > 0.6) { // Threshold for fuzzy match
        const score = similarity * 70;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = domain;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns a value between 0 and 1 (1 = exact match)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 && len2 === 0) return 1;
    if (len1 === 0 || len2 === 0) return 0;
    if (str1 === str2) return 1;

    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return 1 - distance / maxLen;
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
