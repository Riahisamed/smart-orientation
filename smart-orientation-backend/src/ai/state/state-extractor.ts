import { Injectable } from '@nestjs/common';
import {
  ConversationState,
  DifficultyPreference,
} from './conversation-state.interface';
import { normalizeText, hasAnyKeyword } from '../intents/intent.utils';

/**
 * Extract state mutations from user message
 * Automatically detects preferences, rejections and interests
 */
@Injectable()
export class StateExtractor {
  /**
   * Detect difficulty preference from message
   */
  detectDifficultyPreference(message: string): DifficultyPreference {
    const normalized = normalizeText(message);

    if (
      hasAnyKeyword(normalized, [
        'easy',
        'facile',
        'ashel',
        'sahla',
        'khafe',
        'امان',
        'مش صعب',
        'سهلة',
      ])
    ) {
      return 'easy';
    }

    if (
      hasAnyKeyword(normalized, [
        'challenge',
        'aqwa',
        'ambitieux',
        'طموح',
        'قوي',
        'تحدي',
        'صعب',
        'fort',
        'difficile',
      ])
    ) {
      return 'challenge';
    }

    if (
      hasAnyKeyword(normalized, ['medium', 'normal', 'وسط', 'معتدل', 'moyen'])
    ) {
      return 'medium';
    }

    return null;
  }

  /**
   * Check if message contains rejection pattern
   */
  isRejectionMessage(message: string): boolean {
    const normalized = normalizeText(message);
    return hasAnyKeyword(normalized, [
      'ma nabghich',
      'ma n7ebch',
      'na7ebch',
      'je n aime pas',
      'je veux pas',
      'pas de',
      '7abech',
      'ما نحبش',
      'مش معجبني',
      'مش عاجبني',
      'نكرهه',
      'لا يحب',
      'مش عاجب',
    ]);
  }

  /**
   * Check if message contains like/interest pattern
   */
  isLikeMessage(message: string): boolean {
    const normalized = normalizeText(message);
    return (
      hasAnyKeyword(normalized, [
        'نحب',
        'je veux',
        'je prefere',
        'i want',
        'prefer',
        'احب',
        'معجبني',
        'عاجبني',
        'بدلت رايي',
        'الان نحب',
        'better',
        'mieux',
        'احسن',
      ]) && !this.isRejectionMessage(message)
    );
  }

  /**
   * Extract all state changes from message
   */
  extractStateChanges(
    message: string,
    currentState: ConversationState,
  ): Partial<ConversationState> {
    const changes: Partial<ConversationState> = {};
    const normalized = normalizeText(message);

    // Detect difficulty
    const difficulty = this.detectDifficultyPreference(message);
    if (difficulty) {
      changes.difficultyPreference = difficulty;
    }

    // Update message count
    changes.messageCount = currentState.messageCount + 1;
    changes.updatedAt = new Date();

    return changes;
  }

  /**
   * Apply changes to existing state and return new state
   */
  applyStateChanges(
    currentState: ConversationState,
    changes: Partial<ConversationState>,
  ): ConversationState {
    return {
      ...currentState,
      ...changes,
      updatedAt: new Date(),
    };
  }
}
