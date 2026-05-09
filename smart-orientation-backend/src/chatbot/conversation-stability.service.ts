import { Injectable, Logger } from '@nestjs/common';
import { ConversationMemory, FollowUpQuestion, MemoryService } from './memory.service';

/**
 * ✅ CONVERSATION STABILITY LAYER
 * 
 * Main goal: Make conversations natural, intelligent, progressive and non-repetitive
 * Implements all 10 requirements from the specification
 */

@Injectable()
export class ConversationStabilityService {
  private readonly logger = new Logger(ConversationStabilityService.name);

    // Response intro variations for natural language
    private readonly responseIntros = {
      ar: [
        'تمام يا صديقي ✨',
        'ممتاز، فهمت تمام 👍',
        'واش باهي، طالعة معك 👇',
        'حسناً، بناء على ما قلت لي...',
        'فهمت، انشوف لك الحل الأنسب',
        'يا والله عينيك على اللي يجاوبك تمام',
        'لا تشيل هم، هذي الخيارات اللي تناسبك',
        'باهي حاجة، شوف هاذي النقاط المهمة',
        'تمام، انا قولتك رايي بصراحة',
        'واش واضح، هاذي الافضل لك حاليا'
      ],
    fr: [
      'Avec ton score...',
      'L\'option la plus proche pour toi...',
      'Dans ton cas...',
      'Le meilleur choix actuellement...',
      'Basé sur ce que tu as dit...',
      'Ce qui te convient le mieux...',
      'Selon tes préférences...',
      'La recommandation est...',
      'Ce que je te conseille...',
      'Vu ce que tu as...'
    ]
  };

  // Last used intro index per user
  private lastIntroIndex: Record<string, number> = {};

  constructor(private readonly memoryService: MemoryService) {}

  /**
   * 🔒 PREVENT QUESTION LOOPS
   * Never repeat the same follow-up question, always generate new one
   */
  getUniqueFollowUpQuestion(memory: ConversationMemory, language: 'fr' | 'ar' = 'ar'): FollowUpQuestion {
    const originalQuestion = this.memoryService.generateFollowUp(memory, language);
    
    // If question was already asked, find alternative
    if (this.memoryService.wasQuestionAsked(memory, originalQuestion.text)) {
      this.logger.debug('[STABILITY] Question already asked, generating alternative');
      
      // Generate next level question instead
      return this.generateRefinementQuestion(memory, language);
    }

    return originalQuestion;
  }

  // Dynamic follow-up question pools by domain and level
    private readonly followUpPools = {
      ar: {
        'IT': {
          level1: ['تحب اكثر البرمجة ولا البيانات ؟ 😊', 'أنت تميل للويب ولا للأمن السيبراني ؟', 'برمجة ولا عمل في الـ AI ؟'],
          level2: ['تحب تعمل على واجهات ولا خلفية المواقع ؟', 'تطبيقات موبايل ولا مواقع ويب ؟', 'اذكاء اصطناعي ولا تحليل بيانات ؟'],
          level3: ['تفضل عمل سهل ولا متحدي قليلا ؟', 'شركة ناشئة ولا شركة كبيرة وثابتة ؟', 'عمل عن بعد ولا تحب تيجي للمكتب ؟']
        },
        'Sport': {
          level1: ['تحب التدريب ولا العلاج الطبيعي ؟', 'تدريب رياضي ولا إدارة فرق ؟', 'أداء عالي ولا تربية بدنية ؟'],
          level2: ['عمل في نادي ولا مركز طبي ؟', 'رياضة فردية ولا جماعية ؟', 'تلعب ولا تحب تدرب الناس ؟'],
          level3: ['جدول خفيف ولا مكثف ؟', 'عمل خاص ولا عمومي ؟']
        },
        'Medical / Health': {
          level1: ['طب ولا مجال باراميدي ؟', 'صيدلة ولا تمريض ؟', 'عمل في مختبرات ولا رعاية مباشرة ؟'],
          level2: ['عمل خاص ولا قطاع عمومي ؟', 'عيادة خاصة ولا مستشفى عام ؟', 'بحث علمي ولا عمل مباشر مع مرضى ؟'],
          level3: ['أقسام طوارئ ولا عمل عادي ؟', 'دراسات بسيطة ولا متعمقة ؟']
        },
        'Business': {
          level1: ['مالية ولا تسويق وبيع ؟', 'محاسبة ولا إدارة مشاريع ؟', 'بنوك ولا تجارة ؟'],
          level2: ['مشاريع صغيرة ولا شركات كبيرة ؟', 'عمل مكتبي ولا خارجي في الميدان ؟'],
          level3: ['عمل مستقر ولا فيه قليلا من المخاطرة ؟']
        },
        default: {
          level1: ['شنو المجال اللي يعجبك اكثر يا صديقي ؟ 😊', 'تحب نتكلمو اكثر على اي حاجة ؟'],
          level2: ['بالضبط شنو تفضل ؟', 'اي اتجاه تحب تمشي فيه اكتر ؟'],
          level3: ['تفضل شي سهل ولا تريد تحدي قليل ؟', 'شي ثابت ومستقر ولا شي متطور دائما ؟']
        }
    },
    fr: {
      'IT': {
        level1: ['dev ou data ?', 'web ou cyber ?', 'programmation ou sécurité ?'],
        level2: ['frontend ou backend ?', 'web ou mobile ?', 'IA ou analytics ?', 'cloud ou sécurité ?'],
        level3: ['facile ou challenge ?', 'startup ou grande entreprise ?', 'remote ou présentiel ?']
      },
      'Sport': {
        level1: ['coaching ou kiné ?', 'entrainement ou gestion ?', 'performance ou éducation ?'],
        level2: ['club ou centre médical ?', 'individuel ou collectif ?', 'joueur ou entraineur ?'],
        level3: ['léger ou intensif ?', 'privé ou public ?']
      },
      'Medical / Health': {
        level1: ['médecine ou paramédical ?', 'pharmacie ou infirmerie ?', 'laboratoire ou soins ?'],
        level2: ['privé ou public ?', 'clinique ou hôpital ?', 'recherche ou pratique ?'],
        level3: ['urgence ou routine ?', 'facile ou approfondi ?']
      },
      'Business': {
        level1: ['finance ou marketing ?', 'comptabilité ou management ?', 'banque ou commerce ?'],
        level2: ['startup ou grande entreprise ?', 'bureau ou terrain ?'],
        level3: ['stable ou risqué ?']
      },
      default: {
        level1: ['Quel domaine t\'intéresse le plus ?', 'Tu veux approfondir quoi ?'],
        level2: ['Quelle spécialité exactement ?', 'Quelle direction préfères tu ?'],
        level3: ['facile ou challenge ?', 'stable ou évolutif ?']
      }
    }
  };

  /**
   * 🌳 DYNAMIC CONTEXT-AWARE FOLLOW-UP TREE
   * Progressive level system, never repeats, never loops
   */
  generateRefinementQuestion(memory: ConversationMemory, language: 'fr' | 'ar' = 'ar'): FollowUpQuestion {
    const { interest, preferredTrack, difficulty, rejectedTracks, askedQuestions } = memory;

    // Calculate current follow-up progression level
    let level = 1;
    if (interest && preferredTrack) level = 3;
    else if (interest) level = 2;

    const levelKey = `level${level}` as 'level1' | 'level2' | 'level3';
    
    // Get question pool for current domain and level
    const pools = this.followUpPools[language];
    const domainPool = (interest && pools[interest as keyof typeof pools]) || pools.default;
    const questions = domainPool[levelKey] || domainPool.level1;

    // Filter out: already asked questions + rejected domains
    const validQuestions = questions.filter(q => {
      if (this.memoryService.wasQuestionAsked(memory, q)) return false;
      
      // Skip if contains rejected domain
      return !rejectedTracks.some(rejected => 
        q.toLowerCase().includes(rejected.toLowerCase())
      );
    });

    // If we have valid questions left, pick random one
    if (validQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * validQuestions.length);
      return {
        text: validQuestions[randomIndex],
        category: level === 1 ? 'field_selection' : level === 2 ? 'track_refinement' : 'difficulty_check',
        priority: 100 - (level * 20)
      };
    }

    // If pool exhausted, move to next level
    if (level < 3) {
      const nextLevelKey = `level${level + 1}` as 'level2' | 'level3';
      const nextQuestions = domainPool[nextLevelKey] || [];
      const nextValid = nextQuestions.filter(q => !this.memoryService.wasQuestionAsked(memory, q));
      
      if (nextValid.length > 0) {
        const randomIndex = Math.floor(Math.random() * nextValid.length);
        return {
          text: nextValid[randomIndex],
          category: 'confirmation',
          priority: 50
        };
      }
    }

    // Final fallback: decision question
    return {
      text: language === 'ar' 
        ? '✅ تمام يا صديقي، جبنا لك كل المعلومات. تحب نبدأ نختار معا البرنامج الأنسب لك دلوقتي ؟ 😊' 
        : 'Prêt à choisir le programme le plus adapté maintenant ?',
      category: 'decision',
      priority: 10
    };
  }

  /**
   * 🎭 RESPONSE VARIATION
   * Get non-repetitive natural intro
   */
  getNaturalIntro(userId: string, language: 'fr' | 'ar' = 'ar'): string {
    const intros = this.responseIntros[language];
    const lastIndex = this.lastIntroIndex[userId] || -1;
    
    // Pick next intro, never repeat the same one consecutively
    let nextIndex = (lastIndex + 1) % intros.length;
    
    // If we looped, shuffle order a bit
    if (nextIndex === 0) {
      nextIndex = Math.floor(Math.random() * Math.floor(intros.length / 2));
    }

    this.lastIntroIndex[userId] = nextIndex;
    return intros[nextIndex];
  }

  /**
   * 🎯 STRICT MODE FOCUS
   * Filter response to only include what user asked
   */
  filterResponseByIntent(response: any, intentType: 'jobs' | 'programs' | 'advice'): any {
    const filtered = { ...response };
    
    // Remove all sections except what was requested
    if (intentType !== 'jobs') filtered.jobs = undefined;
    if (intentType !== 'programs') filtered.programs = undefined;
    if (intentType !== 'advice') filtered.advice = undefined;

    return filtered;
  }

  /**
   * ⚖️ DECISION IMPROVEMENT
   * Classify options based on user preference
   */
  prioritizeByDifficulty(options: any[], difficulty: 'easy' | 'medium' | 'challenge'): any[] {
    const classified = options.map(opt => ({
      ...opt,
      matchLevel: this.calculateMatchLevel(opt, difficulty)
    }));

    // Sort by best match first
    return classified.sort((a, b) => b.matchLevel - a.matchLevel);
  }

  private calculateMatchLevel(option: any, difficulty: string): number {
    if (!option.difficulty) return 50;

    if (difficulty === 'easy' && option.difficulty === 'easy') return 100;
    if (difficulty === 'easy' && option.difficulty === 'medium') return 70;
    if (difficulty === 'easy' && option.difficulty === 'challenge') return 30;

    if (difficulty === 'medium' && option.difficulty === 'medium') return 100;
    if (difficulty === 'medium') return 70;

    if (difficulty === 'challenge' && option.difficulty === 'challenge') return 100;
    if (difficulty === 'challenge' && option.difficulty === 'medium') return 70;
    if (difficulty === 'challenge' && option.difficulty === 'easy') return 30;

    return 50;
  }

  /**
   * 🔗 CONTEXT CONTINUITY
   * Check if conversation has existing context
   */
  hasActiveContext(memory: ConversationMemory): boolean {
    return !!(memory.interest || memory.preferredTrack || memory.difficulty || memory.preferredFields.length > 0);
  }

  /**
   * ✨ RESPONSE CLEANUP
   * Remove robotic formatting and repetition
   */
  cleanResponse(text: string): string {
    // Remove duplicate lines
    const lines = text.split('\n');
    const uniqueLines = [...new Set(lines)];
    
    // Remove bullet point repetition
    let cleaned = uniqueLines.join('\n');
    
    // Remove robotic markers
    cleaned = cleaned.replace(/➡️|👉|✅|❌/g, '');
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * 🎯 PRIORITY SYSTEM
   * Determine what should come first in response
   */
  getResponseOrder(memory: ConversationMemory): ('answer' | 'guidance' | 'question')[] {
    // Priority order: 1. answer question 2. guide decision 3. ask new question
    return ['answer', 'guidance', 'question'];
  }

  /**
   * 🧑‍🏫 HUMAN ADVISOR MODE
   * Prepare final response with all stability layers applied
   */
  prepareStableResponse(
    userId: string,
    memory: ConversationMemory,
    rawResponse: string,
    intentType: 'jobs' | 'programs' | 'advice',
    language: 'fr' | 'ar' = 'ar'
  ): {
    response: string;
    followUp: FollowUpQuestion;
    updatedMemory: ConversationMemory;
  } {
    // 1. Get natural non-repetitive intro
    const intro = this.getNaturalIntro(userId, language);
    
    // 2. Clean response from robotic formatting
    let cleanedResponse = this.cleanResponse(rawResponse);
    
    // 3. Add natural intro
    cleanedResponse = `${intro}\n\n${cleanedResponse}`;
    
    // 4. Get unique follow-up question (no loops)
    const followUp = this.getUniqueFollowUpQuestion(memory, language);
    
    // 5. Track this question in memory
    const updatedMemory = this.memoryService.trackQuestion(memory, followUp.text);

    this.logger.log(`[STABILITY] Stable response generated for user ${userId}, follow-up: ${followUp.text.substring(0, 60)}...`);

    return {
      response: cleanedResponse,
      followUp,
      updatedMemory
    };
  }

  /**
   * 🧹 Reset user intro tracking
   */
  resetUserState(userId: string): void {
    delete this.lastIntroIndex[userId];
  }
}