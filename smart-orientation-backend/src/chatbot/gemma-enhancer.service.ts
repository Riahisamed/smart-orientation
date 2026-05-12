import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GemmaEnhancerService {
  private readonly logger = new Logger(GemmaEnhancerService.name);
  private readonly url = 'http://localhost:11434/api/generate';
  private readonly model = 'gemma2:2b';

  private isInvalidEnhancedResponse(enhanced: string, original: string): boolean {
    const text = (enhanced ?? '').trim();
    if (!text) return true;

    const originalTrimmed = (original ?? '').trim();

    // Too short/empty => keep deterministic
    const minLen = Math.max(12, Math.floor(originalTrimmed.length * 0.6));
    if (text.length < minLen) return true;

    const lowered = text.toLowerCase();

    const forbiddenPhrases: string[] = [
      "here's a breakdown",
      'here is a breakdown',
      'analysis',
      'explanation',
      'step',
      'let me explain',
      "let's break it down",
    ];

    for (const phrase of forbiddenPhrases) {
      if (lowered.includes(phrase)) return true;
    }

    // Markdown headings (reject)
    if (/^\s{0,3}#{1,6}\s+\S/m.test(text)) return true;

    // Bullet points / list formatting (reject if it looks like it added structure)
    const bulletLikeLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => /^\s*(?:[-*•]|\d+\.|\u2022)\s+/.test(l));
    if (bulletLikeLines.length >= 2) return true;

    // Excessive separators (model tries to structure)
    if ((text.match(/\n\s*[-=]{3,}\s*\n/g) || []).length >= 1) return true;

    return false;
  }

  async enhanceResponse(text: string): Promise<string> {
    const original = text?.trim();
    if (!original) return text;

    const prompt = [
      'Rewrite this orientation response naturally in Tunisian Arabic/French.',
      '',
      'Rules:',
      '* Keep EXACT same meaning',
      '* Keep it short',
      '* Sound warm and conversational',
      '* No analysis',
      '* No headings',
      '* No bullet points',
      '* No explanations',
      '* No "Here\'s a breakdown"',
      '* No AI-style formatting',
      '',
      'Response:',
      original,
      '',
    ].join('\n');

    try {
      const response = await axios.post(
        this.url,
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            num_predict: 40,
          },
        },
        { timeout: 30000 },
      );

      const enhanced = response.data?.response?.trim();
      if (this.isInvalidEnhancedResponse(enhanced, original)) {
        return original;
      }

      return enhanced;
    } catch (error) {
      this.logger.warn(
        `Gemma enhancement failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return original;
    }
  }
}

