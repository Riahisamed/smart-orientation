import { Injectable, Logger } from '@nestjs/common';
import { Intent, IntentResult, IntentPattern } from './intent.types';
import { normalizeText, countMatches, extractEntities } from './intent.utils';

@Injectable()
export class IntentClassifier {
  private readonly logger = new Logger(IntentClassifier.name);

  /**
   * Intent patterns with weighted keywords
   * Higher weight = higher confidence
   */
  private readonly patterns: IntentPattern[] = [
    {
      intent: Intent.ASK_JOBS,
      keywords: [
        'job', 'jobs', 'metier', 'metiers', 'travail', 'emploi', 'carriere', 'khedma', '5edma',
        'مihna', 'خدمة', 'وظيفة', 'مهنة', 'debouche', 'خدمات'
      ],
      weight: 1.3,
    },
    {
      intent: Intent.ASK_SALARY,
      keywords: [
        'salaire', 'salaire', 'salaire', 'salary', 'pay', 'قداش نخلص', 'barcha felous',
        'راتب', 'مرتب', 'دخل', 'كم تاخد'
      ],
      weight: 1.5,
    },
    {
      intent: Intent.ASK_SKILLS,
      keywords: [
        'skills', 'skill', 'competence', 'competences', 'شنيا skills', 'chnowa net3alem',
        'شنوة نتعلم', 'شنو نعمل', 'مهارات', 'كفاءات', 'شنو لازم نعرف'
      ],
      weight: 1.3,
    },
    {
      intent: Intent.ASK_ROADMAP,
      keywords: [
        'roadmap', 'learning path', 'comment reussir', 'kifech nanjah', 'كيفاش ننجح',
        'منين نبدأ', 'كيفاش نبدأ', 'شنو نعمل بعد', 'chnowa na3mel baad', 'شنو الخطوات'
      ],
      weight: 1.4,
    },
    {
      intent: Intent.ASK_COMPARISON,
      keywords: [
        'compare', 'comparer', 'difference', 'فرق', 'ولا', 'خير بين', 'chneya khir',
        'مقارنة', 'اي واحد احسن', 'ou bien', 'versus', ' vs '
      ],
      weight: 1.2,
    },
    {
      intent: Intent.ASK_RECOMMENDATION,
      keywords: [
        'conseil', 'recommend', 'orientation', 'تنصحني', 'tnasa7ni', 'شنعمل',
        'نختار ايه', 'واش تنصحني', 'شنو افضل', 'نصيحة'
      ],
      weight: 1.0,
    },
    {
      intent: Intent.ASK_EASY_OPTION,
      keywords: [
        'easy', 'facile', 'ashel', 'sahla', 'نحب حاجة سهلة', 'خيار امن',
        'safe', 'بدون مجهود', 'مش صعب', 'khafe'
      ],
      weight: 1.6,
    },
    {
      intent: Intent.ASK_CHALLENGE_OPTION,
      keywords: [
        'challenge', 'aqwa', 'ambitieux', 'نحب تحدي', 'احسن واحد', 'اقوى واحد',
        'مش سهلة', 'صعب شوية', 'طموح', 'fort', 'difficile'
      ],
      weight: 1.6,
    },
    {
      intent: Intent.REJECT_DOMAIN,
      keywords: [
        'ma nabghich', 'ma n7ebch', 'je n aime pas', 'pas de', '7abech',
        'ما نحبش', 'مش معجبني', 'مش عاجبني', 'نكرهه'
      ],
      weight: 1.8,
    },
    {
      intent: Intent.SWITCH_DOMAIN,
      keywords: [
        'نحب', 'je veux', 'je prefere', 'بدلت رايي', 'الان نحب',
        'i want', 'prefer', 'خلينا', 'في الحقيقة نحب', 'ana better'
      ],
      weight: 1.2,
      negativeKeywords: ['مش', 'لا', 'non', 'pas'],
    },
    {
      intent: Intent.ASK_BEST_CHOICE,
      keywords: [
        'best', 'meilleur', 'احسن واحد', 'خيار افضل', 'واش اختر',
        'tnajem tgolili', 'شنو هو الافضل', 'give decision', 'الاختيار الاحسن'
      ],
      weight: 1.4,
    },
  ];

  /**
   * Classify user message into intent with confidence scoring
   */
  classify(message: string): IntentResult {
    const normalized = normalizeText(message);
    const scores: Record<Intent, number> = {} as Record<Intent, number>;

    // Calculate score for each intent
    for (const pattern of this.patterns) {
      const matchCount = countMatches(normalized, pattern.keywords);

      if (pattern.negativeKeywords) {
        const negativeMatch = countMatches(normalized, pattern.negativeKeywords);
        if (negativeMatch > 0) continue;
      }

      if (matchCount > 0) {
        scores[pattern.intent] = (scores[pattern.intent] || 0) + matchCount * pattern.weight;
      }
    }

    // Find best intent
    let bestIntent = Intent.UNKNOWN;
    let bestScore = 0;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as Intent;
      }
    }

    // Calculate confidence level 0-1
    const confidence = Math.min(bestScore / 3, 1);

    // Extract entities
    const entities = extractEntities(message);

    const result: IntentResult = {
      intent: bestIntent,
      confidence,
      entities,
      rawMessage: message,
    };

    this.logger.debug(`Classified intent: ${bestIntent} (confidence: ${confidence.toFixed(2)})`);

    return result;
  }
}