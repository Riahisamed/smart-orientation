import { Injectable } from '@nestjs/common';
import { ConversationState } from '../state/conversation-state.interface';
import { ConversationStage } from './conversation-stage';
import { ConversationStateService } from '../state/conversation-state.service';
import { normalizeText } from '../intents/intent.utils';

/**
 * Contextual question bank categorized by domain
 */
const QUESTION_BANK: Record<string, string[]> = {
  tech: [
    "تحب frontend ولا backend؟",
    "تحب design ولا logique أكثر؟",
    "نشغلك برامج ولا بيانات؟",
    "تحب تنشئ مواقع ولا تطبيقات موبايل؟",
    "cyber ولا ai أقرب ليك؟",
  ],
  web: [
    "frontend ولا backend؟",
    "تحب design ولا logique؟",
    "React ولا Angular؟",
    "تحب تخدم freelance ولا شركة؟",
  ],
  engineering: [
    "تحب مدني ولا ميكانيك؟",
    "محلول ولا تصميم؟",
    "باطن ولا سطح؟",
    "نشغال ميدان ولا مكتب؟",
  ],
  health: [
    "تحب مباشرة مع مريض ولا مختبر؟",
    "طب ولا تمريض؟",
    "كمال الجسم ولا علاج؟",
  ],
  business: [
    "تسويق ولا محاسبة؟",
    "بنك ولا شركة؟",
    "مالية ولا إدارة؟",
  ],
  general: [
    "تحب حاجة فيها إبداع ولا منطق؟",
    "تخدم وحدك ولا مع فريق؟",
    "تكمل master ولا تخدم مباشرة؟",
    "remote ولا مكتب؟",
  ]
};

@Injectable()
export class FollowupEngine {

  constructor(
    private readonly stateService: ConversationStateService,
  ) {}

  /**
   * Generate intelligent dynamic follow-up question
   */
  generateFollowUp(state: ConversationState): string | null {

    // No follow-up for roadmap stage
    if (state.conversationStage === ConversationStage.ROADMAP) {
      return null;
    }

    // Skip follow-up if final decision
    if (state.conversationStage === ConversationStage.FINAL_DECISION) {
      return null;
    }

    // Get available questions
    const availableQuestions = this.getAvailableQuestions(state);

    // Filter already asked questions
    const unusedQuestions = availableQuestions.filter(q =>
      !this.stateService.wasQuestionAsked(state, q)
    );

    if (unusedQuestions.length === 0) {
      return null;
    }

    // Pick random question from unused pool for natural variation
    const selectedQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];

    return selectedQuestion;
  }

  /**
   * Get relevant questions based on current user state
   */
  private getAvailableQuestions(state: ConversationState): string[] {
    let questions: string[] = [];

    // Add domain specific questions
    for (const domain of state.likedDomains) {
      const domainLower = normalizeText(domain);

      for (const [key, qs] of Object.entries(QUESTION_BANK)) {
        if (domainLower.includes(key) || key.includes(domainLower)) {
          questions = [...questions, ...qs];
        }
      }
    }

    // Add difficulty specific questions
    if (state.difficultyPreference === null) {
      questions.push("تحب حاجة سهلة شوية ولا تحدي؟");
    }

    // Add goal specific questions
    if (!state.userGoals.includes('freelance') && !state.userGoals.includes('company')) {
      questions.push("تحب تخدم وحدك ولا في شركة؟");
    }

    // Always add general questions as fallback
    questions = [...questions, ...QUESTION_BANK.general];

    // Remove duplicates
    return [...new Set(questions)];
  }

  /**
   * Check if we have enough information to enter final decision mode
   */
  isReadyForDecision(state: ConversationState): boolean {
    return (
      state.likedDomains.length >= 1 &&
      state.difficultyPreference !== null &&
      state.shownPrograms.length >= 2 &&
      state.messageCount >= 4
    );
  }

  /**
   * Generate final decision confirmation message
   */
  generateDecisionMessage(state: ConversationState): string {
    const topDomain = state.likedDomains[0] || 'هذا المجال';

    const messages = [
      `بصراحة، ${topDomain} أكثر حاجة تناسبك حسب اللي قلتو.`,
      `في حالتك، ${topDomain} يبدو الخيار الأنسب حالياً.`,
      `لو كنت بلاصتك، نختار ${topDomain} مباشرة.`,
      `بعد ما تكلمنا، ${topDomain} هو الأقرب لما تحب.`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}