import { Injectable, Logger } from '@nestjs/common';
import { BAC_DOMAINS, BacType } from './bac-domain-mapping';

export interface StudentProfile {
  bacType?: string;
  score?: number;
  interest?: string;
  language?: 'fr' | 'ar';
}

/**
 * Profile-based filtering service.
 * All recommendations (jobs, programs, roadmaps, careers) must pass through this filter.
 */
@Injectable()
export class ProfileFilterService {
  private readonly logger = new Logger(ProfileFilterService.name);

  /**
   * Get the list of allowed domain fields for a given BAC type.
   * Returns empty array if no BAC type or unknown BAC type.
   */
  getAllowedDomainsForBac(bacType?: string): string[] {
    const normalizedBac = this.normalizeBacType(bacType);
    if (!normalizedBac) {
      return [];
    }

    const bacRule = BAC_DOMAINS[normalizedBac];
    if (!bacRule) {
      this.logger.warn(`No BAC rule found for: ${bacType}`);
      return [];
    }

    return bacRule.allowedDomains;
  }

  /**
   * Check if a domain is compatible with the student's BAC type.
   */
  isDomainAllowed(domainField: string, bacType?: string): boolean {
    // OPEN exploration (no BAC provided) => allow
    if (!bacType) return true;

    const allowedDomains = this.getAllowedDomainsForBac(bacType);
    if (!allowedDomains.length) return true;

    // STRICT comparison only (NO substring / fuzzy match).
    // This prevents blocking normal orientation questions due to overmatching.
    return allowedDomains.includes(domainField);
  }

  /**
   * Filter a list of domains/items by BAC compatibility.
   */
  filterByBacType<T extends { field?: string; domain?: string }>(
    items: T[],
    bacType?: string,
  ): T[] {
    if (!bacType) {
      return items; // No filtering if no BAC type
    }

    const allowedDomains = this.getAllowedDomainsForBac(bacType);
    if (allowedDomains.length === 0) {
      return items; // No filtering if no rules defined
    }

    return items.filter((item) => {
      const itemDomain = item.field || item.domain;
      if (!itemDomain) {
        return false;
      }
      return this.isDomainAllowed(itemDomain, bacType);
    });
  }

  /**
   * Filter jobs by domain and BAC type.
   */
  filterJobsByProfile(
    jobs: any[],
    domainField: string,
    profile: StudentProfile,
  ): any[] {
    // First check if domain is allowed for this BAC
    if (
      profile.bacType &&
      !this.isDomainAllowed(domainField, profile.bacType)
    ) {
      this.logger.debug(
        `Domain ${domainField} not allowed for BAC ${profile.bacType}`,
      );
      return [];
    }

    // If score is provided, we could filter by difficulty/entry requirements
    // For now, return all jobs for the allowed domain
    return jobs;
  }

  /**
   * Filter guide programs by domain and BAC type.
   */
  filterProgramsByProfile(
    programs: any[],
    domainField: string,
    profile: StudentProfile,
  ): any[] {
    // First check if domain is allowed for this BAC
    if (
      profile.bacType &&
      !this.isDomainAllowed(domainField, profile.bacType)
    ) {
      this.logger.debug(
        `Domain ${domainField} not allowed for BAC ${profile.bacType}`,
      );
      return [];
    }

    // Filter programs by score if available
    if (profile.score && profile.score > 0) {
      return programs.filter((program) => {
        // Check if program has score requirements
        const minScore = program.minScore || program.min_score || 0;
        const maxScore = program.maxScore || program.max_score || 999;
        return profile.score! >= minScore && profile.score! <= maxScore;
      });
    }

    return programs;
  }

  /**
   * Get recommended domains based on BAC type and interest.
   * Returns domains in priority order.
   */
  getRecommendedDomainsForProfile(profile: StudentProfile): string[] {
    const allowedDomains = this.getAllowedDomainsForBac(profile.bacType);

    if (!profile.interest) {
      return allowedDomains;
    }

    // Prioritize domains matching the interest
    const normalizedInterest = this.normalizeString(profile.interest);

    return allowedDomains.sort((a, b) => {
      const normalizedA = this.normalizeString(a);
      const normalizedB = this.normalizeString(b);

      const aMatchesInterest =
        normalizedA.includes(normalizedInterest) ||
        normalizedInterest.includes(normalizedA);
      const bMatchesInterest =
        normalizedB.includes(normalizedInterest) ||
        normalizedInterest.includes(normalizedB);

      if (aMatchesInterest && !bMatchesInterest) return -1;
      if (bMatchesInterest && !aMatchesInterest) return 1;
      return 0;
    });
  }

  /**
   * Validate that a student's profile is complete enough for recommendations.
   */
  validateProfile(profile: StudentProfile): {
    valid: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!profile.bacType) {
      missing.push('bacType');
    }

    // Score is optional but recommended
    // Interest is optional but recommended

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Build a profile string for logging/debugging.
   */
  buildProfileDescription(profile: StudentProfile): string {
    const parts: string[] = [];
    if (profile.bacType) parts.push(`BAC: ${profile.bacType}`);
    if (profile.score) parts.push(`Score: ${profile.score}`);
    if (profile.interest) parts.push(`Interest: ${profile.interest}`);
    if (profile.language) parts.push(`Lang: ${profile.language}`);
    return parts.join(' | ') || 'No profile';
  }

  private normalizeBacType(bacType?: string): BacType | undefined {
    if (!bacType) return undefined;
    const normalized = bacType.trim().toUpperCase();
    const validTypes: BacType[] = [
      'MATH',
      'INFO',
      'SVT',
      'ECO',
      'LETTRES',
      'SPORT',
      'TECH',
    ];
    return validTypes.find((t) => t === normalized);
  }

  private normalizeString(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  }
}
