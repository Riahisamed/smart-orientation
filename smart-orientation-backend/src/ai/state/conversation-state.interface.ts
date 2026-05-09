import { ConversationStage } from '../conversation/conversation-stage';

/**
 * Difficulty preference level
 */
export type DifficultyPreference = 'easy' | 'medium' | 'challenge' | null;

/**
 * User response style preference
 */
export type PreferredStyle = 'direct' | 'detailed' | 'fast';

/**
 * Full conversation state interface
 * Tracks ALL user preferences, history and conversation context
 */
export interface ConversationState {
  likedDomains: string[];
  rejectedDomains: string[];

  likedCareers: string[];
  rejectedCareers: string[];

  difficultyPreference: DifficultyPreference;

  shownPrograms: string[];
  shownJobs: string[];

  askedQuestions: string[];

  conversationStage: ConversationStage;

  lastIntent: string | null;

  userGoals: string[];

  preferredStyle: PreferredStyle;

  messageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default empty state factory
 */
export function createDefaultConversationState(): ConversationState {
  return {
    likedDomains: [],
    rejectedDomains: [],
    likedCareers: [],
    rejectedCareers: [],
    difficultyPreference: null,
    shownPrograms: [],
    shownJobs: [],
    askedQuestions: [],
    conversationStage: ConversationStage.EXPLORATION,
    lastIntent: null,
    userGoals: [],
    preferredStyle: 'detailed',
    messageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}