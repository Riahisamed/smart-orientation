import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IntentDetectorService } from './intent-detector.service';

export type AdmissionLevel = 'safe' | 'possible' | 'hard';

export type RagQuery = {
  message?: string;
  bacType?: string;
  score?: number;
  limit?: number;
};

export type GuideBacType = {
  type: string;
  capacity?: number;
  lastScore?: number | null;
};

export type GuideProgram = {
  code: string;
  name?: string;
  program: string;
  institution: string;
  domain?: string;
  formula?: string;
  bacTypes?: GuideBacType[];
};

export type FieldData = {
  field: string;
  programs: string[];
  possible_jobs: string[];
  required_skills?: {
    technical_skills?: string[];
    soft_skills?: string[];
    tools_and_technologies?: string[];
  };
  demand_in_tunisia?: string;
  future_outlook?: string;
  unemployment_risk?: string;
  recommended?: boolean;
  reason?: string;
};

export type JobData = {
  title: string;
  skills: string[];
  unemployment_rate?: number;
};

export type JobDomainData = {
  domain: string;
  keywords: string[];
  jobs: JobData[];
};

export type RankedProgram = GuideProgram & {
  matchingBac?: GuideBacType;
  admissionLevel: AdmissionLevel;
  admissionGap?: number;
  rankScore: number;
  matchedKeywords: string[];
};

export type RagResult = {
  bacType?: string;
  score?: number;
  field?: FieldData;
  jobs: JobData[];
  programs: RankedProgram[];
};

export type RagMergedResult = RagResult & {
  skills?: FieldData['required_skills'];
  demand?: string;
  unemployment?: string;
  outlook?: string;
};

type FieldsJsonData = {
  fields?: FieldData[];
};

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly guideData: GuideProgram[];
  private readonly fieldsData: FieldData[];
  private readonly jobsData: JobDomainData[];

  private readonly bacAliases: Record<string, string[]> = {
    math: ['math', 'maths', 'mathematique', 'mathematiques'],
    sciences: ['science', 'sciences', 'svt', 'experimental'],
    technique: ['tech', 'technique', 'technologique'],
    economie: ['eco', 'economie', 'gestion'],
    informatique: ['info', 'informatique', 'bac info'],
    lettres: ['lettres', 'lettre', 'adab', 'litteraire'],
    sport: ['sport', 'sportif'],
  };

  private readonly fieldAliases: Record<string, string[]> = {
    IT: [
      'informatique',
      'info',
      'it',
      'dev',
      'programmation',
      'web',
      'mobile',
      'data',
      'ai',
      'ia',
      'cyber',
      'cloud',
    ],
    'Medical / Health': [
      'medecine',
      'medecin',
      'medical',
      'sante',
      'pharmacie',
      'infirmier',
      'biologie',
    ],
    Engineering: [
      'ingenieur',
      'ingenierie',
      'genie',
      'mecanique',
      'electrique',
      'civil',
      'production',
    ],
    'Business / Management': [
      'gestion',
      'business',
      'commerce',
      'marketing',
      'finance',
      'comptabilite',
      'economie',
    ],
    Law: ['droit', 'law', 'juridique', 'avocat', 'justice'],
    'Arts & Design': ['art', 'design', 'graphique', 'architecture', 'ux', 'ui'],
    Languages: ['langue', 'langues', 'francais', 'anglais', 'traduction', 'lettres'],
  };

  // map normalized bac keys to likely fields in fields.json
  private readonly bacToFields: Record<string, string[]> = {
    informatique: ['IT'],
    math: ['Engineering', 'Science'],
    sciences: ['Medical / Health', 'Science', 'Engineering'],
    technique: ['Engineering', 'Arts & Design'],
    economie: ['Business / Management'],
    lettres: ['Languages', 'Arts & Design'],
    sport: ['Medical / Health', 'Education & Formation'],
  };

  constructor(private readonly intentDetector: IntentDetectorService) {
    this.guideData = this.loadJsonFile<GuideProgram[]>('prisma/guide.json', []);
    this.fieldsData = this.loadJsonFile<FieldsJsonData>('lib/data/fields.json', {
      fields: [],
    }).fields || [];
    this.jobsData = this.loadJsonFile<JobDomainData[]>('lib/data/jobs.json', []);

    this.logger.log(`Loaded ${this.guideData.length} guide programs`);
    this.logger.log(`Loaded ${this.fieldsData.length} fields`);
    this.logger.log(`Loaded ${this.jobsData.length} job domains`);
  }

  getRecommendations(query: RagQuery): RagMergedResult {
    const limit = this.normalizeLimit(query.limit);
    const field = this.detectField(query.message || '', query.bacType);
    const jobs = this.findJobs(field, query.message || '').slice(0, 3);
    const candidates = this.filterProgramsByBacType(query.bacType);
    const rankedPrograms = this.rankPrograms(candidates, {
      ...query,
      field,
    }).slice(0, limit);

    const skills = field?.required_skills;
    const demand = field?.demand_in_tunisia;
    const unemployment = field?.unemployment_risk;
    const outlook = field?.future_outlook;

    return {
      bacType: query.bacType,
      score: query.score,
      field,
      jobs,
      programs: rankedPrograms,
      skills,
      demand,
      unemployment,
      outlook,
    };
  }

  filterProgramsByBacType(bacType?: string): RankedProgram[] {
    const normalizedBac = this.normalizeBac(bacType);

    return this.guideData.flatMap((program) => {
      const bacMatches = this.findMatchingBacTypes(program, normalizedBac);

      return bacMatches.map((matchingBac) =>
        this.toRankedProgram(program, matchingBac),
      );
    });
  }

  classifyAdmission(score: number | undefined, lastScore?: number | null): AdmissionLevel {
    if (typeof score !== 'number' || !Number.isFinite(score)) return 'hard';
    if (typeof lastScore !== 'number' || !Number.isFinite(lastScore)) return 'hard';
    if (score >= lastScore + 10) return 'safe';
    if (score >= lastScore) return 'possible';
    return 'hard';
  }

  rankPrograms(
    programs: RankedProgram[],
    query: RagQuery & { field?: FieldData },
  ): RankedProgram[] {
    const score = query.score;
    const message = this.normalize(query.message || '');
    const messageTokens = this.tokenize(message);
    const fieldTerms = this.getFieldTerms(query.field);

    return programs
      .map((program) => {
        const lastScore = program.matchingBac?.lastScore;
        const admissionLevel = this.classifyAdmission(score, lastScore);
        const admissionGap =
          typeof score === 'number' && typeof lastScore === 'number'
            ? Number((score - lastScore).toFixed(2))
            : undefined;
        const haystack = this.normalize(
          [
            program.name,
            program.program,
            program.institution,
            program.domain,
            program.formula,
          ]
            .filter(Boolean)
            .join(' '),
        );
        const matchedKeywords = this.getMatchedTerms(haystack, [
          ...messageTokens,
          ...fieldTerms,
        ]);
        const fieldScore = matchedKeywords.length * 12;
        const admissionScore = this.getAdmissionRankScore(admissionLevel, admissionGap);
        const capacityScore = program.matchingBac?.capacity
          ? Math.min(program.matchingBac.capacity, 100) / 10
          : 0;
        const lastScoreScore =
          typeof lastScore === 'number' ? Math.min(lastScore / 10, 20) : 0;

        return {
          ...program,
          admissionLevel,
          admissionGap,
          matchedKeywords,
          rankScore: fieldScore + admissionScore + capacityScore + lastScoreScore,
        };
      })
      .sort((a, b) => {
        const levelDiff =
          this.getAdmissionSortWeight(b.admissionLevel) -
          this.getAdmissionSortWeight(a.admissionLevel);
        if (levelDiff !== 0) return levelDiff;

        return b.rankScore - a.rankScore;
      });
  }

  private loadJsonFile<T>(relativePath: string, fallback: T): T {
    const candidates = [
      path.join(process.cwd(), relativePath),
      path.join(process.cwd(), 'dist', relativePath),
      path.join(__dirname, '..', '..', relativePath),
    ];

    try {
      const filePath = candidates.find((candidate) => fs.existsSync(candidate));
      if (!filePath) throw new Error(`File not found: ${relativePath}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch (error) {
      this.logger.warn(
        `Could not load ${relativePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return fallback;
    }
  }

  private findMatchingBacTypes(
    program: GuideProgram,
    normalizedBac: string,
  ): GuideBacType[] {
    const bacTypes = program.bacTypes || [];
    if (!normalizedBac) return bacTypes.filter((bac) => this.hasLastScore(bac));

    const aliases = this.getBacAliases(normalizedBac);
    const matches = bacTypes.filter((bac) => {
      const normalizedType = this.normalize(bac.type);

      return aliases.some(
        (alias) =>
          normalizedType === alias ||
          normalizedType.includes(alias) ||
          alias.includes(normalizedType),
      );
    });

    return matches.filter((bac) => this.hasLastScore(bac));
  }

  private toRankedProgram(
    program: GuideProgram,
    matchingBac?: GuideBacType,
  ): RankedProgram {
    return {
      ...program,
      matchingBac,
      admissionLevel: 'hard',
      rankScore: 0,
      matchedKeywords: [],
    };
  }

  private detectField(message: string, bacType?: string): FieldData | undefined {
    const normalizedMessage = this.normalize(message);
    const extractedFields = this.intentDetector
      .extractKeywords(message)
      .filter((keyword) => keyword.category === 'field')
      .map((keyword) => keyword.value);

    const normalizedBac = this.normalizeBac(bacType);
    const bacPreferredFields = this.bacToFields[normalizedBac] || [];

    const candidates = this.fieldsData.map((field) => {
      const aliases = this.getFieldTerms(field);
      const extractedMatch = extractedFields.some((value) =>
        aliases.includes(this.normalize(value)),
      );
      const textMatches = this.getMatchedTerms(normalizedMessage, aliases).length;

      // demand and unemployment scoring
      const demandScore = this.scoreDemand(field.demand_in_tunisia);
      const unemploymentScore = this.scoreUnemployment(field.unemployment_risk);

      // bac match boost
      const bacMatch = bacPreferredFields.includes(field.field) ? 6 : 0;

      const score = textMatches + (extractedMatch ? 3 : 0) + demandScore + unemploymentScore + bacMatch;

      return {
        field,
        score,
      };
    });

    // Prefer fields with higher combined score (message relevance + demand + low unemployment + bac match)
    const best = candidates
      .sort((a, b) => b.score - a.score)
      .filter((c) => c.score > 0);

    return best[0]?.field;
  }

  private scoreDemand(demand?: string): number {
    if (!demand) return 0;
    const d = this.normalize(demand);
    if (d.includes('very') || d.includes('very high') || d.includes('très') || d.includes('elev')) return 8;
    if (d.includes('high') || d.includes('haut') || d.includes('eleve')) return 6;
    if (d.includes('moderate') || d.includes('moyen') || d.includes('moder')) return 3;
    if (d.includes('low') || d.includes('faible') || d.includes('weak')) return 0;
    return 0;
  }

  private scoreUnemployment(unemployment?: string): number {
    if (!unemployment) return 0;
    const u = this.normalize(unemployment);
    if (u.includes('low') || u.includes('faible') || u.includes('bas')) return 6;
    if (u.includes('moderate') || u.includes('moyen') || u.includes('mod')) return 3;
    if (u.includes('high') || u.includes('haut') || u.includes('elev') || u.includes('eleve')) return 0;
    return 0;
  }

  private findJobs(field: FieldData | undefined, message: string): JobData[] {
    const fieldTerms = this.getFieldTerms(field);
    const messageTerms = this.tokenize(this.normalize(message));

    return this.jobsData
      .flatMap((domain) =>
        domain.jobs.map((job) => {
          const text = this.normalize(
            [domain.domain, ...domain.keywords, job.title, ...job.skills].join(' '),
          );
          const score =
            this.getMatchedTerms(text, fieldTerms).length * 10 +
            this.getMatchedTerms(text, messageTerms).length * 4 +
            (typeof job.unemployment_rate === 'number'
              ? Math.max(0, 20 - job.unemployment_rate)
              : 0);

          return { job, score };
        }),
      )
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.job);
  }

  private getFieldTerms(field?: FieldData): string[] {
    if (!field) return [];

    const aliases = this.fieldAliases[field.field] || [];

    return [
      field.field,
      ...aliases,
      ...(field.programs || []),
      ...(field.possible_jobs || []),
      field.demand_in_tunisia || '',
      field.future_outlook || '',
      field.reason || '',
    ]
      .map((term) => this.normalize(term))
      .filter(Boolean);
  }

  private getMatchedTerms(text: string, terms: string[]): string[] {
    const tokens = this.tokenize(text);
    const matched = new Set<string>();

    for (const term of terms) {
      const normalizedTerm = this.normalize(term);
      if (normalizedTerm.length < 2) continue;

      if (normalizedTerm.length <= 3 && tokens.includes(normalizedTerm)) {
        matched.add(normalizedTerm);
      } else if (normalizedTerm.length > 3 && text.includes(normalizedTerm)) {
        matched.add(normalizedTerm);
      }
    }

    return [...matched];
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || !Number.isFinite(limit)) return 5;
    return Math.min(5, Math.max(3, Math.floor(limit)));
  }

  private normalizeBac(bacType?: string): string {
    const normalized = this.normalize(bacType || '');
    if (!normalized) return '';

    for (const [key, aliases] of Object.entries(this.bacAliases)) {
      if (
        aliases.some((alias) => {
          const normalizedAlias = this.normalize(alias);
          return (
            normalized === normalizedAlias ||
            normalized.includes(normalizedAlias) ||
            normalizedAlias.includes(normalized)
          );
        })
      ) {
        return key;
      }
    }

    return normalized;
  }

  private getBacAliases(normalizedBac: string): string[] {
    return [
      normalizedBac,
      ...(this.bacAliases[normalizedBac] || []),
    ].map((alias) => this.normalize(alias));
  }

  private getAdmissionRankScore(
    level: AdmissionLevel,
    admissionGap?: number,
  ): number {
    const base = {
      safe: 60,
      possible: 40,
      hard: 10,
    }[level];

    return base + Math.max(-20, Math.min(admissionGap || 0, 20));
  }

  private getAdmissionSortWeight(level: AdmissionLevel): number {
    return {
      safe: 3,
      possible: 2,
      hard: 1,
    }[level];
  }

  private hasLastScore(bac: GuideBacType): boolean {
    return typeof bac.lastScore === 'number' && Number.isFinite(bac.lastScore);
  }

  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(/[^a-z0-9\u0600-\u06FF]+/i)
      .filter((token) => token.length > 1);
  }

  private normalize(value?: string): string {
    return (value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’'`´]/g, ' ')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
}
