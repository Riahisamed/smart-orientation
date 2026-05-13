import { Injectable } from '@nestjs/common';
import { ConversationState } from '../state/conversation-state.interface';
import { ToneVariationService } from './tone-variation.service';

@Injectable()
export class ResponseHumanizer {
  constructor(private readonly toneVariation: ToneVariationService) {}

  /**
   * Main humanization function
   * Applies all naturalization layers
   */
  humanizeResponse(response: string, state: ConversationState): string {
    // First apply tone and phrase variation
    let result = this.toneVariation.applyVariation(response, state);

    // Add contextual intro if appropriate
    if (Math.random() > 0.4 && this.shouldAddIntro(state)) {
      const intro = this.toneVariation.getIntro();
      result = `${intro}\n${result}`;
    }

    // Add natural conclusion for final decision stage
    if (state.conversationStage === 'final_decision' && Math.random() > 0.5) {
      const conclusion = this.toneVariation.getIntro();
      result = `${result}\n\n${conclusion}`;
    }

    // Final cleanup
    result = this.cleanupFinalResult(result);

    return result.trim();
  }

  /**
   * Determine if we should add an intro to this response
   */
  private shouldAddIntro(state: ConversationState): boolean {
    // Avoid intro on short responses
    if (state.messageCount < 3) return true;

    // Avoid intro right after roadmap
    if (state.conversationStage === 'roadmap') return false;

    return Math.random() > 0.5;
  }

  /**
   * Final cleanup before returning response
   */
  private cleanupFinalResult(text: string): string {
    let result = text;

    // Remove double empty lines
    result = result.replace(/\n\s*\n/g, '\n\n');

    // Remove trailing newlines
    result = result.trim();

    // Ensure response does not end with question if it's the main answer
    const lines = result.split('\n');
    if (lines.length > 3) {
      const lastLine = lines[lines.length - 1];
      if (lastLine.includes('?') || lastLine.includes('؟')) {
        // Keep the question but add an empty line before
        lines[lines.length - 1] = `\n${lastLine}`;
        result = lines.join('\n');
      }
    }

    return result;
  }

  /**
   * Humanize follow up question
   */
  humanizeFollowUp(followUp: string, state: ConversationState): string {
    if (!followUp) return followUp;

    // Vary start of follow up question
    const starter = this.toneVariation.getTransition();

    if (Math.random() > 0.6) {
      return `${starter} ${followUp.toLowerCase()}`;
    }

    return followUp;
  }

  /**
   * Reset humanizer state for new conversation
   */
  reset(): void {
    this.toneVariation.reset();
  }
}
