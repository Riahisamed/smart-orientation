/**
 * Conversation evolution stages
 * Define the natural flow progression of the orientation dialog
 */
export enum ConversationStage {
  EXPLORATION = 'exploration',
  DOMAIN_SELECTION = 'domain_selection',
  CAREER_DISCOVERY = 'career_discovery',
  RECOMMENDATION = 'recommendation',
  COMPARISON = 'comparison',
  ROADMAP = 'roadmap',
  FINAL_DECISION = 'final_decision',
}

/**
 * Stage transition rules
 * Defines allowed next stages from current position
 */
export const STAGE_TRANSITIONS: Record<ConversationStage, ConversationStage[]> = {
  [ConversationStage.EXPLORATION]: [
    ConversationStage.DOMAIN_SELECTION,
    ConversationStage.EXPLORATION,
  ],
  [ConversationStage.DOMAIN_SELECTION]: [
    ConversationStage.CAREER_DISCOVERY,
    ConversationStage.DOMAIN_SELECTION,
    ConversationStage.RECOMMENDATION,
  ],
  [ConversationStage.CAREER_DISCOVERY]: [
    ConversationStage.RECOMMENDATION,
    ConversationStage.CAREER_DISCOVERY,
    ConversationStage.COMPARISON,
  ],
  [ConversationStage.RECOMMENDATION]: [
    ConversationStage.COMPARISON,
    ConversationStage.ROADMAP,
    ConversationStage.FINAL_DECISION,
    ConversationStage.RECOMMENDATION,
  ],
  [ConversationStage.COMPARISON]: [
    ConversationStage.RECOMMENDATION,
    ConversationStage.ROADMAP,
    ConversationStage.FINAL_DECISION,
  ],
  [ConversationStage.ROADMAP]: [
    ConversationStage.FINAL_DECISION,
    ConversationStage.RECOMMENDATION,
  ],
  [ConversationStage.FINAL_DECISION]: [
    ConversationStage.FINAL_DECISION,
    ConversationStage.RECOMMENDATION,
  ],
};

/**
 * Check if transition between stages is allowed
 */
export function isStageTransitionAllowed(
  currentStage: ConversationStage,
  targetStage: ConversationStage
): boolean {
  return STAGE_TRANSITIONS[currentStage].includes(targetStage);
}

/**
 * Get natural next stage based on current progress
 */
export function getNextNaturalStage(currentStage: ConversationStage): ConversationStage {
  const ordered: ConversationStage[] = [
    ConversationStage.EXPLORATION,
    ConversationStage.DOMAIN_SELECTION,
    ConversationStage.CAREER_DISCOVERY,
    ConversationStage.RECOMMENDATION,
    ConversationStage.COMPARISON,
    ConversationStage.ROADMAP,
    ConversationStage.FINAL_DECISION,
  ];

  const currentIndex = ordered.indexOf(currentStage);
  return ordered[Math.min(currentIndex + 1, ordered.length - 1)];
}