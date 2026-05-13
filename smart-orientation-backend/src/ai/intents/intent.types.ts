/**
 * Standard supported intents for orientation chatbot
 * Classifies every user message into one semantic category
 */
export enum Intent {
  ASK_RECOMMENDATION = 'ask_recommendation',
  ASK_JOBS = 'ask_jobs',
  ASK_SALARY = 'ask_salary',
  ASK_SKILLS = 'ask_skills',
  ASK_ROADMAP = 'ask_roadmap',
  ASK_COMPARISON = 'ask_comparison',
  ASK_BEST_CHOICE = 'ask_best_choice',
  ASK_EASY_OPTION = 'ask_easy_option',
  ASK_CHALLENGE_OPTION = 'ask_challenge_option',
  REJECT_DOMAIN = 'reject_domain',
  SWITCH_DOMAIN = 'switch_domain',
  UNKNOWN = 'unknown',
}

/**
 * Extracted entities from user message
 */
export interface IntentEntities {
  domain?: string;
  career?: string;
  score?: number;
  bacType?: string;
}

/**
 * Intent classification result with confidence
 */
export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities: IntentEntities;
  rawMessage: string;
}

/**
 * Pattern definition for intent matching
 */
export interface IntentPattern {
  intent: Intent;
  keywords: string[];
  negativeKeywords?: string[];
  weight: number;
}

/**
 * Domain mapping for entity extraction
 */
export interface DomainMapping {
  domain: string;
  aliases: string[];
}
