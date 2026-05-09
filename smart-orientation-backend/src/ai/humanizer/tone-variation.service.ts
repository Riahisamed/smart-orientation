import { Injectable } from '@nestjs/common';
import { ConversationState } from '../state/conversation-state.interface';
import { PhraseRotation } from './sentence-rotation';

@Injectable()
export class ToneVariationService {

  private readonly phraseRotation = new PhraseRotation();

  /**
   * Apply tone variation to response based on context
   */
  applyVariation(text: string, state: ConversationState): string {
    let result = text;

    // Randomize punctuation slightly
    result = this.randomizePunctuation(result);

    // Add natural pauses
    if (Math.random() > 0.5) {
      result = this.addNaturalPause(result);
    }

    // Vary sentence order for multi line responses
    if (result.includes('\n')) {
      result = this.varySentenceOrder(result);
    }

    // Remove robotic patterns
    result = this.removeRoboticPatterns(result);

    return result;
  }

  /**
   * Add natural random punctuation variation
   */
  private randomizePunctuation(text: string): string {
    // Remove unnecessary dots at end of lines
    let result = text.replace(/\.$/gm, '');

    // Randomly add commas for natural flow
    if (Math.random() > 0.6 && result.length > 30) {
      const words = result.split(' ');
      if (words.length > 6) {
        const position = 3 + Math.floor(Math.random() * 4);
        words[position] = words[position] + ',';
        result = words.join(' ');
      }
    }

    return result;
  }

  /**
   * Add natural conversational pauses
   */
  private addNaturalPause(text: string): string {
    const lines = text.split('\n');

    if (lines.length > 1) {
      return lines.map(line => {
        if (Math.random() > 0.7 && line.length > 15) {
          return `${line}...`;
        }
        return line;
      }).join('\n');
    }

    return text;
  }

  /**
   * Randomly change sentence order for natural variation
   */
  private varySentenceOrder(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());

    if (lines.length <= 2) return text;

    // Shuffle middle lines, keep first and last fixed
    const first = lines[0];
    const last = lines[lines.length - 1];
    const middle = lines.slice(1, -1);

    if (middle.length <= 1) return text;

    // Randomly swap middle lines
    for (let i = middle.length - 1; i > 0; i--) {
      if (Math.random() > 0.6) {
        const j = Math.floor(Math.random() * i);
        [middle[i], middle[j]] = [middle[j], middle[i]];
      }
    }

    return [first, ...middle, last].join('\n');
  }

  /**
   * Remove common robotic patterns from text
   */
  private removeRoboticPatterns(text: string): string {
    let result = text;

    // Remove bullet point markers that feel robotic
    result = result.replace(/^✅ /gm, '');
    result = result.replace(/^⚡ /gm, '');
    result = result.replace(/^🚀 /gm, '');

    // Remove static labels
    result = result.replace(/Best: /gi, '');
    result = result.replace(/Backup: /gi, '');
    result = result.replace(/Risky: /gi, '');

    // Remove unnecessary capitalization
    result = result.replace(/\bSAFE\b/g, 'safe');
    result = result.replace(/\bRISKY\b/g, 'risky');

    return result;
  }

  /**
   * Get dynamic intro phrase
   */
  getIntro(): string {
    return this.phraseRotation.getIntro();
  }

  /**
   * Get dynamic transition phrase
   */
  getTransition(): string {
    return this.phraseRotation.getTransition();
  }

  /**
   * Reset all rotation memory for new conversation
   */
  reset(): void {
    this.phraseRotation.reset();
  }
}