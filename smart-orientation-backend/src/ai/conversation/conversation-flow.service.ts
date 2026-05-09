import { Injectable } from '@nestjs/common';
import { ConversationState } from '../state/conversation-state.interface';
import { ConversationStage, getNextNaturalStage, isStageTransitionAllowed } from './conversation-stage';
import { FollowupEngine } from './followup-engine';
import { IntentResult } from '../intents/intent.types';

@Injectable()
export class ConversationFlowService {

  constructor(
    private readonly followupEngine: FollowupEngine,
  ) {}

  /**
   * Process message and evolve conversation state
   * Handles natural flow progression and stage transitions
   */
  processConversationFlow(
    state: ConversationState,
    intentResult: IntentResult,
  ): {
    updatedState: ConversationState;
    followUp: string | null;
    shouldGiveDecision: boolean;
  } {

    let updatedState = { ...state };

    // Calculate and update conversation stage
    updatedState.conversationStage = this.calculateCurrentStage(updatedState);

    // Check if ready for final decision
    const shouldGiveDecision = this.followupEngine.isReadyForDecision(updatedState);

    if (shouldGiveDecision) {
      updatedState.conversationStage = ConversationStage.FINAL_DECISION;
    }

    // Generate appropriate follow-up
    const followUp = this.followupEngine.generateFollowUp(updatedState);

    // Update timestamp
    updatedState.updatedAt = new Date();

    return {
      updatedState,
      followUp,
      shouldGiveDecision,
    };
  }

  /**
   * Calculate appropriate current stage based on user progress
   */
  private calculateCurrentStage(state: ConversationState): ConversationStage {
    let stage = state.conversationStage;

    // Auto evolution logic based on collected data
    if (stage === ConversationStage.EXPLORATION && state.likedDomains.length > 0) {
      stage = ConversationStage.DOMAIN_SELECTION;
    }

    if (stage === ConversationStage.DOMAIN_SELECTION && state.likedCareers.length > 0) {
      stage = ConversationStage.CAREER_DISCOVERY;
    }

    if (stage === ConversationStage.CAREER_DISCOVERY && state.shownPrograms.length >= 1) {
      stage = ConversationStage.RECOMMENDATION;
    }

    if (stage === ConversationStage.RECOMMENDATION && state.messageCount >= 6) {
      stage = ConversationStage.ROADMAP;
    }

    // Validate transition is allowed
    if (!isStageTransitionAllowed(state.conversationStage, stage)) {
      return getNextNaturalStage(state.conversationStage);
    }

    return stage;
  }

  /**
   * Check if domain should be suggested
   * Returns false if already rejected
   */
  shouldSuggestDomain(state: ConversationState, domain: string): boolean {
    return !state.rejectedDomains.some(rejected =>
      domain.toLowerCase().includes(rejected.toLowerCase()) ||
      rejected.toLowerCase().includes(domain.toLowerCase())
    );
  }

  /**
   * Reset conversation flow back to exploration
   */
  resetFlow(state: ConversationState): ConversationState {
    return {
      ...state,
      conversationStage: ConversationStage.EXPLORATION,
      updatedAt: new Date(),
    };
  }
}