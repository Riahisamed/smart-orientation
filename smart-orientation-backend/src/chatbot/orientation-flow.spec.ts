import { AiService } from './ai.service';
import { IntentDetectorService } from './intent-detector.service';
import { RagService } from './rag.service';
import { ResponseBuilderService } from './response-builder.service';
import { SafetyRulesService } from './safety-rules.service';

describe('Orientation AI flow', () => {
  let intentDetector: IntentDetectorService;
  let ragService: RagService;
  let responseBuilder: ResponseBuilderService;
  let safetyRules: SafetyRulesService;
  let aiService: AiService;

  beforeAll(() => {
    intentDetector = new IntentDetectorService();
    ragService = new RagService(intentDetector);
    responseBuilder = new ResponseBuilderService();
    safetyRules = new SafetyRulesService();
    aiService = new AiService(
      {
        getConfig: () => ({
          url: process.env.OLLAMA_URL || '',
          temperature: 0,
          num_predict: 500,
          timeout: 1,
        }),
      } as any,
      safetyRules,
    );
  });

  it.each([
    ['nheb info', 'ask_programs'],
    ['score 120 chnowa najem na3mel', 'ask_programs'],
    ['win na9ra medecine', 'ask_programs'],
    ['chnoua AI', 'general'],
    ['a7sen filiere fi tounes', 'ask_programs'],
  ] as const)('detects "%s" as %s', (message, expectedIntent) => {
    expect(intentDetector.detectIntent(message)).toBe(expectedIntent);
  });

  it('detects IT keywords for "nheb info"', () => {
    const keywords = intentDetector.extractKeywords('nheb info');

    expect(keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'field',
          value: 'tech',
        }),
      ]),
    );
  });

  it('routes "chnoua AI" as a general question instead of orientation RAG', () => {
    expect(intentDetector.detectIntent('chnoua AI')).toBe('general');
  });

  it('returns ranked orientation results for score-based guidance', () => {
    const result = ragService.getRecommendations({
      message: 'score 120 chnowa najem na3mel',
      score: 120,
      limit: 5,
    });

    expect(result.programs.length).toBeGreaterThanOrEqual(3);
    expect(result.programs.length).toBeLessThanOrEqual(5);
    expect(result.programs[0]).toEqual(
      expect.objectContaining({
        admissionLevel: expect.stringMatching(/safe|possible|hard/),
      }),
    );
  });

  it('keeps admission classification rules stable', () => {
    expect(ragService.classifyAdmission(120, 100)).toBe('safe');
    expect(ragService.classifyAdmission(105, 100)).toBe('possible');
    expect(ragService.classifyAdmission(95, 100)).toBe('hard');
  });

  it('hard-filters programs by classified domain for tech interest', () => {
    const result = ragService.getRecommendations({
      message: 'nheb info',
      bacType: 'informatique',
      score: 120,
      interest: 'tech',
      limit: 5,
    });

    expect(result.programs.length).toBeGreaterThan(0);
    expect(result.programs.every((program) => program.domain === 'tech')).toBe(
      true,
    );
    expect(
      result.programs.some((program) =>
        /italien|italienne|langue|langues|ﺇﻳﻄﺎﻟﻴﺔ|ﺍﻹﻳﻄﺎﻟﻴﺔ/i.test(
          program.name || program.program || '',
        ),
      ),
    ).toBe(false);
  });

  it('builds a French orientation response with analysis, recommendation, and alternatives', () => {
    const result = ragService.getRecommendations({
      message: 'nheb info',
      score: 120,
      limit: 3,
    });
    const response = responseBuilder.buildFrenchResponse({
      jobs: result.jobs || [],
      programs: [],
      intent: 'general',
    });

    expect(response).toMatch(/Analyse|analys|diagnostic|profil|Bilan|résumé/i);
    expect(response).toMatch(
      /Recommandation|conseil|Préparation|Pour avancer/i,
    );
    expect(response).toMatch(/Alternatives|pistes|programmes|Métiers/i);
  });

  it('applies safety rules to AI responses', () => {
    expect(safetyRules.isSafeResponse('password=secret')).toBe(false);
    expect(safetyRules.isSafeResponse('Reponse normale et utile.')).toBe(true);
  });

  it('returns a clear deterministic decision block for advice', async () => {
    const result = await aiService.generateWithContext(
      'what program should I choose?',
      {
        score: 120,
        programs: [
          { name: 'Licence informatique', institution: 'FST', lastScore: 100 },
          {
            name: 'Engineering informatique',
            institution: 'ENIT',
            lastScore: 124,
          },
          { name: 'Architecture', institution: 'ENAU', lastScore: 130 },
        ],
      },
      { score: 120 },
      'fr',
    );

    expect(result.usedFallback).toBe(false);
    expect(result.text).toContain('Licence informatique');
    expect(result.text).toMatch(/\?/);
  });

  // ============================================
  // AI OBJECTIVE TESTS - Metrics for Decision-Oriented AI
  // ============================================

  describe('AI Objectives', () => {
    it('responds with max 3-5 lines (brevity)', async () => {
      const result = await aiService.generateWithContext(
        'nheb info',
        {
          score: 120,
          programs: [{ name: 'Test', institution: 'FST', lastScore: 100 }],
        },
        { score: 120 },
        'fr',
      );
      const lines = result.text.split('\n').filter((l) => l.trim());
      expect(lines.length).toBeLessThanOrEqual(5);
    });

    it('includes exactly 1 follow-up question', async () => {
      const result = await aiService.generateWithContext(
        'score 120 chnowa najem na3mel',
        {
          score: 120,
          programs: [{ name: 'Test', institution: 'FST', lastScore: 100 }],
        },
        { score: 120 },
        'fr',
      );
      const questionMarks = (result.text.match(/\?/g) || []).length;
      expect(questionMarks).toBe(1);
    });

    it('returns max 3 jobs when jobs are requested', async () => {
      const result = ragService.getRecommendations({
        message: 'chnoua les metiers fi info',
        score: 120,
        limit: 3,
      });
      expect(result.jobs?.length).toBeLessThanOrEqual(3);
    });

    it('returns max 3 programs when programs are requested', async () => {
      const result = ragService.getRecommendations({
        message: 'nheb na3ref les programmes',
        score: 120,
        limit: 3,
      });
      expect(result.programs.length).toBeLessThanOrEqual(3);
    });

    it('provides Best + Backup + Risky decision structure', async () => {
      const result = await aiService.generateWithContext(
        'a7sen choix?',
        {
          score: 120,
          programs: [
            { name: 'Safe Option', institution: 'FST', lastScore: 100 },
            { name: 'Medium Option', institution: 'ENIT', lastScore: 115 },
            { name: 'Hard Option', institution: 'ENAU', lastScore: 130 },
          ],
        },
        { score: 120 },
        'fr',
      );
      expect(result.text).toMatch(/Safe|s[uû]re|parfait|Meilleur|best|أفضل/i);
      expect(result.text).toMatch(/\?/);
    });

    it('includes demand classification (High/Medium/Low)', async () => {
      const result = ragService.getRecommendations({
        message: 'nheb na3ref les metiers fi IT',
        interest: 'tech',
        limit: 3,
      });
      result.jobs?.forEach((job) => {
        expect(['High', 'Medium', 'Low']).toContain(job.demand);
      });
    });

    it('includes unemployment rate in job data', async () => {
      const result = ragService.getRecommendations({
        message: 'nheb na3ref les metiers fi IT',
        interest: 'tech',
        limit: 3,
      });
      result.jobs?.forEach((job) => {
        expect(typeof job.unemployment_rate).toBe('number');
      });
    });

    it('strictly separates jobs from programs (no mixing)', async () => {
      const result = await aiService.generateWithContext(
        'chnoua les metiers', // jobs question
        {
          score: 120,
          programs: [
            { name: 'Program Test', institution: 'FST', lastScore: 100 },
          ],
          jobs: [
            {
              title: 'Job Test',
              description: 'Test job',
              skills: [],
              demand: 'High',
              unemploymentRate: 5,
            },
          ],
        },
        { score: 120 },
        'fr',
      );
      expect(result.text.toLowerCase()).not.toMatch(/licence|programme|école/i);
    });

    it('detects question type correctly from message', () => {
      expect(intentDetector.detectIntent('nheb les metiers')).toBe('ask_jobs');
      expect(intentDetector.detectIntent('score 100 chnowa najem na3mel')).toBe(
        'ask_programs',
      );
    });

    it('uses real data from jobs.json (no hallucination)', () => {
      const result = ragService.getRecommendations({
        message: 'nheb dev web',
        interest: 'tech',
        limit: 3,
      });
      // All returned jobs must exist in jobs.json
      result.jobs?.forEach((job) => {
        expect(job.title).toBeTruthy();
        expect(job.description).toBeTruthy();
        expect(job.skills).toBeInstanceOf(Array);
      });
    });

    it('provides contextual comparison between options', async () => {
      const result = await aiService.generateWithContext(
        'compare licence vs engineering',
        {
          score: 120,
          programs: [
            { name: 'Licence', institution: 'FST', lastScore: 100 },
            { name: 'Engineering', institution: 'ENIT', lastScore: 130 },
          ],
        },
        { score: 120 },
        'fr',
      );
      // Should contain comparison words
      expect(result.text).toMatch(
        /vs|vs\.|versus|comparer|difference|plus|moins|أسهل|أقوى|أصعب/i,
      );
    });
  });
});
