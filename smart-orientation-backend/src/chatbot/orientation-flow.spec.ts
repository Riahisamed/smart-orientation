import { IntentDetectorService } from './intent-detector.service';
import { RagService } from './rag.service';
import { ResponseBuilderService } from './response-builder.service';
import { SafetyRulesService } from './safety-rules.service';

describe('Orientation AI flow', () => {
  let intentDetector: IntentDetectorService;
  let ragService: RagService;
  let responseBuilder: ResponseBuilderService;
  let safetyRules: SafetyRulesService;

  beforeAll(() => {
    intentDetector = new IntentDetectorService();
    ragService = new RagService(intentDetector);
    responseBuilder = new ResponseBuilderService();
    safetyRules = new SafetyRulesService();
  });

  it.each([
    ['nheb info', 'orientation'],
    ['score 120 chnowa najem na3mel', 'orientation'],
    ['win na9ra medecine', 'location'],
    ['chnoua AI', 'general'],
    ['a7sen filiere fi tounes', 'orientation'],
  ] as const)('detects "%s" as %s', (message, expectedIntent) => {
    expect(intentDetector.detectIntent(message)).toBe(expectedIntent);
  });

  it('detects IT keywords for "nheb info"', () => {
    const keywords = intentDetector.extractKeywords('nheb info');

    expect(keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'field',
          value: 'informatique',
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

  it('builds a French orientation response with analysis, recommendation, and alternatives', () => {
    const result = ragService.getRecommendations({
      message: 'nheb info',
      score: 120,
      limit: 3,
    });
    const response = responseBuilder.buildResponse({
      ragResult: result,
      language: 'fr',
    });

    expect(response).toContain('Analyse');
    expect(response).toContain('Recommandation');
    expect(response).toContain('Alternatives');
  });

  it('applies safety rules to AI responses', () => {
    expect(safetyRules.isSafeResponse('password=secret')).toBe(false);
    expect(safetyRules.isSafeResponse('Reponse normale et utile.')).toBe(true);
  });
});
