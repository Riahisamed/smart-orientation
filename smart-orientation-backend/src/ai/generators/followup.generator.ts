import { Injectable } from '@nestjs/common';
import { ConversationState } from '../state/conversation-state.interface';
import { normalizeText } from '../intents/intent.utils';

/**
 * Contextual question bank organized by domain interest
 */
const FOLLOWUP_QUESTIONS: Record<string, string[]> = {
  web: [
    'frontend ولا backend؟',
    'تحب design ولا logique أكثر؟',
    'تحب freelance ولا شركة؟',
    'React ولا Angular؟',
    'mobile ولا desktop؟',
  ],
  tech: [
    'dev ولا réseaux؟',
    'cyber ولا data؟',
    'ai ولا développement؟',
    'موبايل ولا ويب؟',
    'برامج ولا بيانات؟',
  ],
  engineering: [
    'مدني ولا ميكانيك؟',
    'كهرباء ولا إلكترونيك؟',
    'ميدان ولا مكتب؟',
    'تصميم ولا محلول؟',
  ],
  health: [
    'مباشرة مع المرضى ولا مختبر؟',
    'طب ولا تمريض؟',
    'علاج طبيعي ولا صيدلة؟',
    'مستشفى ولا عيادة خاصة؟',
  ],
  business: [
    'تسويق ولا محاسبة؟',
    'بنك ولا شركة خاصة؟',
    'مالية ولا إدارة؟',
    'تجارة داخلي ولا خارجي؟',
  ],
  sport: ['تدريب ولا كينو؟', 'مدرب ولا مؤهل بدني؟', 'نادي ولا مؤسسة؟'],
  general: [
    'تحب حاجة فيها إبداع ولا منطق؟',
    'تخدم وحدك ولا مع فريق؟',
    'تكمل master ولا تخدم مباشرة؟',
    'remote ولا مكتب؟',
    'ثابت ولا متغير؟',
  ],
};

@Injectable()
export class FollowupGenerator {
  /**
   * Generate intelligent follow-up question based on current conversation state
   * Never returns same question twice
   */
  generate(state: ConversationState): string | null {
    // No follow up for roadmap or final decision stages
    if (
      state.conversationStage === 'roadmap' ||
      state.conversationStage === 'final_decision'
    ) {
      return null;
    }

    // Get available questions pool based on liked domains
    const availableQuestions = this.getAvailableQuestions(state);

    // Filter out already asked questions
    const unusedQuestions = availableQuestions.filter(
      (question) => !this.wasQuestionAsked(state, question),
    );

    if (unusedQuestions.length === 0) {
      return null;
    }

    // Pick random question from unused pool for natural variation
    const selectedQuestion =
      unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];

    return selectedQuestion;
  }

  /**
   * Get relevant questions pool based on current user state
   */
  private getAvailableQuestions(state: ConversationState): string[] {
    let questions: string[] = [];

    // Add domain specific questions
    for (const domain of state.likedDomains) {
      const domainLower = normalizeText(domain);

      for (const [key, qs] of Object.entries(FOLLOWUP_QUESTIONS)) {
        if (domainLower.includes(key) || key.includes(domainLower)) {
          questions = [...questions, ...qs];
        }
      }
    }

    // Add difficulty question only if not already known
    if (state.difficultyPreference === null) {
      questions.push('تحب حاجة سهلة شوية ولا تحدي؟');
    }

    // Add work style question only if not already known
    if (
      !state.userGoals.includes('freelance') &&
      !state.userGoals.includes('company')
    ) {
      questions.push('تحب تخدم وحدك ولا في شركة؟');
    }

    // Always add general questions as fallback
    questions = [...questions, ...FOLLOWUP_QUESTIONS.general];

    // Remove duplicates
    return [...new Set(questions)];
  }

  /**
   * Check if question was already asked in this conversation
   */
  private wasQuestionAsked(
    state: ConversationState,
    question: string,
  ): boolean {
    const normalizedQuestion = normalizeText(question).slice(0, 25);

    return state.askedQuestions.some((asked) => {
      const normalizedAsked = normalizeText(asked).slice(0, 25);
      return (
        normalizedAsked.includes(normalizedQuestion) ||
        normalizedQuestion.includes(normalizedAsked)
      );
    });
  }
}
