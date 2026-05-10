/**
 * Types for AI Orientation System
 */

export interface Program {
  id?: number;
  code?: string;
  name?: string;
  program?: string;
  institution?: string;
  lastYearScore?: number;
  lastScore?: number;
  bacType?: string;
}

export interface StudentInput {
  score: number;
  bac: string;
  language?: 'fr' | 'ar';
}

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  accessible?: Program[];
  difficult?: Program[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  programs?: {
    safe: Program[];
    possible: Program[];
    hard: Program[];
  };
}

export interface ChatRequest {
  message: string;
  score: number;
  bac: string;
  language: 'fr' | 'ar';
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  programs?: {
    safe: Program[];
    possible: Program[];
    hard: Program[];
  };
}

export type Language = 'fr' | 'ar';
export type BacType = 'MATH' | 'SVT' | 'ECO' | 'TECH' | 'INFO' | 'LETTRES' | 'SPORT';

export interface ProgramClassification {
  safe: Program[];
  possible: Program[];
  hard: Program[];
}

export interface DomainSuggestion {
  domain: string;
  field: string;
  icon?: string;
  color?: string;
  description?: string;
  relevanceScore: number;
  difficulty?: string;
  demand?: string;
}

export interface RoadmapSelectorData {
  title?: string;
  subtitle?: string;
  suggestions: DomainSuggestion[];
  cards?: DomainSuggestion[];
  maxSuggestions?: number;
  personalized?: boolean;
}
