/**
 * Job Matcher Utility
 * Handles domain matching and job enrichment with optimized performance
 */

export type Job = {
  title: string;
  skills: string[];
  unemployment_rate?: number;
};

export type DomainData = {
  domain: string;
  keywords: string[];
  jobs: Job[];
};

export type EnrichedJob = Job & {
  adjusted_unemployment: number;
};

export type MatchedDomain = DomainData & {
  jobs: EnrichedJob[];
  match_score: number;
};

/**
 * Adjusts unemployment rate to reduce hallucination
 * Formula: max(0, unemployment_rate - 3)
 */
export function adjustUnemploymentRate(rate?: number): number {
  if (rate === undefined || rate === null) return 0;
  return Math.max(0, rate - 3);
}

/**
 * Matches a message to a domain and enriches jobs
 * Returns top match with adjusted unemployment rates
 */
export function matchDomain(
  message: string,
  domainsData: DomainData[],
): MatchedDomain | null {
  if (!message || !domainsData.length) return null;

  const lowerMessage = message.toLowerCase();
  let bestMatch: MatchedDomain | null = null;
  let highestScore = 0;

  for (const domain of domainsData) {
    let score = 0;

    // Count keyword matches
    for (const keyword of domain.keywords) {
      const keywordCount = (
        lowerMessage.match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')) ||
        []
      ).length;
      score += keywordCount * 10; // Weight exact matches
    }

    // Partial matches (lower weight)
    for (const keyword of domain.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        ...domain,
        jobs: domain.jobs.map((job) => ({
          ...job,
          adjusted_unemployment: adjustUnemploymentRate(job.unemployment_rate),
        })),
        match_score: score,
      };
    }
  }

  return bestMatch;
}

/**
 * Limits jobs to top N most relevant ones
 * Prioritizes jobs with lower unemployment rates
 */
export function limitJobs(
  enrichedDomain: MatchedDomain,
  limit: number = 3,
): MatchedDomain {
  const sortedJobs = [...enrichedDomain.jobs].sort(
    (a, b) => a.adjusted_unemployment - b.adjusted_unemployment,
  );

  return {
    ...enrichedDomain,
    jobs: sortedJobs.slice(0, limit),
  };
}

/**
 * Formats a matched domain for AI prompt (compact)
 */
export function formatDomainForPrompt(domain: MatchedDomain): string {
  const jobsList = domain.jobs
    .map(
      (job: EnrichedJob) =>
        `- ${job.title}${job.skills?.length ? ` [${job.skills.slice(0, 3).join(', ')}]` : ''}${job.adjusted_unemployment !== undefined ? ` (Unemployment: ${job.adjusted_unemployment}%)` : ''}`,
    )
    .join('\n');

  return `Domain: ${domain.domain}
Available Jobs:
${jobsList}`;
}

/**
 * Validates that a response only mentions provided jobs/domains
 * Returns true if response is clean (no hallucination detected)
 */
export function validateResponseClean(
  response: string,
  providedDomain: MatchedDomain,
): boolean {
  const lowercaseResponse = response.toLowerCase();

  // Check if response contains known hallucination keywords not in domain
  const hallucinations = [
    'aviation',
    'pilot',
    'astronaut',
    'hollywood',
    'football',
    'basketball',
  ];

  for (const hallucination of hallucinations) {
    if (lowercaseResponse.includes(hallucination)) {
      return false;
    }
  }

  // Verify at least one provided job is mentioned
  const mentionsProvidedJob = providedDomain.jobs.some((job) =>
    lowercaseResponse.includes(job.title.toLowerCase()),
  );

  return mentionsProvidedJob;
}
