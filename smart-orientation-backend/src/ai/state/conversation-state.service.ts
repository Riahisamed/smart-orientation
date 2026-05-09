import { Injectable } from '@nestjs/common';
import { ConversationState, createDefaultConversationState } from './conversation-state.interface';
import { StateExtractor } from './state-extractor';
import { normalizeText } from '../intents/intent.utils';

@Injectable()
export class ConversationStateService {

  constructor(
    private readonly stateExtractor: StateExtractor,
  ) {}

  /**
   * Create new empty conversation state
   */
  createNewState(): ConversationState {
    return createDefaultConversationState();
  }

  /**
   * Process message and update conversation state
   */
  processMessage(message: string, currentState: ConversationState): ConversationState {
    const changes = this.stateExtractor.extractStateChanges(message, currentState);
    return this.stateExtractor.applyStateChanges(currentState, changes);
  }

  /**
   * Add program to shown list (anti-repetition)
   */
  addShownProgram(state: ConversationState, programId: string): ConversationState {
    if (!state.shownPrograms.includes(programId)) {
      return {
        ...state,
        shownPrograms: [...state.shownPrograms, programId],
        updatedAt: new Date(),
      };
    }
    return state;
  }

  /**
   * Add job to shown list (anti-repetition)
   */
  addShownJob(state: ConversationState, jobId: string): ConversationState {
    if (!state.shownJobs.includes(jobId)) {
      return {
        ...state,
        shownJobs: [...state.shownJobs, jobId],
        updatedAt: new Date(),
      };
    }
    return state;
  }

  /**
   * Add asked question to memory (anti-repetition)
   */
  addAskedQuestion(state: ConversationState, question: string): ConversationState {
    const normalizedQuestion = normalizeText(question).slice(0, 25);

    if (!this.wasQuestionAsked(state, question)) {
      return {
        ...state,
        askedQuestions: [...state.askedQuestions, normalizedQuestion],
        updatedAt: new Date(),
      };
    }
    return state;
  }

  /**
   * Check if question was already asked in this conversation
   */
  wasQuestionAsked(state: ConversationState, question: string): boolean {
    const normalizedQuestion = normalizeText(question).slice(0, 25);
    return state.askedQuestions.some(asked =>
      normalizeText(asked).slice(0, 25).includes(normalizedQuestion) ||
      normalizedQuestion.includes(normalizeText(asked).slice(0, 25))
    );
  }

  /**
   * Add domain to liked domains
   */
  addLikedDomain(state: ConversationState, domain: string): ConversationState {
    if (!state.likedDomains.includes(domain)) {
      return {
        ...state,
        likedDomains: [...state.likedDomains, domain],
        updatedAt: new Date(),
      };
    }
    return state;
  }

  /**
   * Add domain to rejected domains
   */
  addRejectedDomain(state: ConversationState, domain: string): ConversationState {
    if (!state.rejectedDomains.includes(domain)) {
      return {
        ...state,
        rejectedDomains: [...state.rejectedDomains, domain],
        updatedAt: new Date(),
      };
    }
    return state;
  }

  /**
   * Add user goal
   */
  addUserGoal(state: ConversationState, goal: string): ConversationState {
    if (!state.userGoals.includes(goal)) {
      return {
        ...state,
        userGoals: [...state.userGoals, goal],
        updatedAt: new Date(),
      };
    }
    return state;
  }

  /**
   * Check if domain is allowed (not rejected)
   */
  isDomainAllowed(state: ConversationState, domain: string): boolean {
    return !state.rejectedDomains.some(rejected =>
      normalizeText(domain).includes(normalizeText(rejected))
    );
  }

  /**
   * Filter list of programs to exclude already shown ones
   */
  filterNewPrograms<T extends { id: string }>(state: ConversationState, programs: T[]): T[] {
    return programs.filter(program => !state.shownPrograms.includes(program.id));
  }

  /**
   * Filter list of jobs to exclude already shown ones
   */
  filterNewJobs<T extends { id: string }>(state: ConversationState, jobs: T[]): T[] {
    return jobs.filter(job => !state.shownJobs.includes(job.id));
  }

  /**
   * Reset conversation state
   */
  resetState(state: ConversationState): ConversationState {
    return this.createNewState();
  }
}