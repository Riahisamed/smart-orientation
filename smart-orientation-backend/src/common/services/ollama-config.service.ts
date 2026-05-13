import { Injectable } from '@nestjs/common';

export interface OllamaConfig {
  url: string;
  model: string;
  temperature: number;
  num_predict: number;
  timeout: number;
}

/**
 * Ollama Configuration Service
 * Centralizes Ollama settings with sensible defaults for accuracy
 */
@Injectable()
export class OllamaConfigService {
  private config: OllamaConfig = {
    url: process.env.OLLAMA_URL || '',
    model: process.env.OLLAMA_MODEL || 'gemma2:2b',
    // Balanced temperature for varied but accurate responses (avoid repetition while maintaining quality)
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.5'),
    // Limit response length to reduce irrelevant content
    num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT || '300', 10),
    // Timeout to prevent hanging requests
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10),
  };

  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  getUrl(): string {
    return this.config.url;
  }

  getModel(): string {
    return this.config.model;
  }

  getRequestBody(prompt: string): object {
    return {
      model: this.config.model,
      prompt,
      stream: false,
      temperature: this.config.temperature,
      num_predict: this.config.num_predict,
    };
  }

  getTimeout(): number {
    return this.config.timeout;
  }
}
