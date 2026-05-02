import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OllamaConfigService } from '../common/services/ollama-config.service';
import { SafetyRulesService } from './safety-rules.service';

export type AiLanguage = 'fr' | 'ar';

export type AiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AiGenerateInput = {
  message: string;
  language?: AiLanguage;
  systemInstruction?: string;
  context?: string;
  history?: AiMessage[];
  fallback?: string;
};

export type AiGenerateResult = {
  text: string;
  usedFallback: boolean;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model = 'gemma';

  constructor(
    private readonly ollamaConfig: OllamaConfigService,
    private readonly safetyRules: SafetyRulesService,
  ) {}

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const prompt = this.buildPrompt(input);
    const config = this.ollamaConfig.getConfig();

    try {
      const response = await axios.post(
        config.url || 'http://localhost:11434/api/generate',
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: config.temperature,
            num_predict: Math.max(config.num_predict, 500),
            top_p: 0.9,
          },
        },
        { timeout: config.timeout },
      );

      const text = response.data?.response?.trim();
      if (this.safetyRules.isSafeResponse(text)) {
        return {
          text: text!,
          usedFallback: false,
        };
      }

      this.logger.warn('Ollama returned an empty or unsafe response');
    } catch (error) {
      this.logger.warn(
        `Ollama generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      text: this.getFallback(input),
      usedFallback: true,
    };
  }

  buildPrompt(input: AiGenerateInput): string {
    const language = input.language || 'fr';
    const languageInstruction =
      language === 'ar'
        ? 'Reponds uniquement en arabe standard moderne. N utilise pas le dialecte.'
        : 'Reponds uniquement en francais clair.';
    const safetyInstruction = this.safetyRules.getPromptRules(
      'general',
      language,
    );
    const systemInstruction =
      input.systemInstruction ||
      'Tu es un assistant IA utile, rigoureux et concis pour des etudiants en Tunisie.';
    const context = input.context?.trim()
      ? `\nCONTEXTE:\n${input.context.trim()}\n`
      : '';
    const history = this.formatHistory(input.history || []);

    return [
      systemInstruction,
      languageInstruction,
      safetyInstruction,
      context,
      history ? `HISTORIQUE:\n${history}` : '',
      `QUESTION:\n${input.message.trim()}`,
      'REPONSE:',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private formatHistory(history: AiMessage[]): string {
    return history
      .filter(
        (item) =>
          item?.content &&
          ['user', 'assistant', 'system'].includes(item.role),
      )
      .slice(-5)
      .map((item) => `${item.role}: ${item.content.trim()}`)
      .join('\n');
  }

  private getFallback(input: AiGenerateInput): string {
    if (input.fallback?.trim()) return input.fallback.trim();

    if (input.language === 'ar') {
      return 'تعذر الاتصال بالمساعد الذكي حاليا. حاول مرة أخرى بعد قليل.';
    }

    return "Je n'arrive pas a joindre le service IA pour le moment. Reessaie dans quelques instants.";
  }
}
