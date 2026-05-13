import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type EnhancementProfile = {
  bacType?: string;
  score?: number;
  bacAverage?: number;
  FG?: number;
  interest?: string;
  language?: 'fr' | 'ar';
};

// ============================================================
// 🚀 SIMPLE IN-MEMORY CACHE for Gemma enhancement responses
// Prevents regenerating identical rewrites repeatedly.
// LRU-like: keeps last 64 entries, evicts oldest when full.
// ============================================================
class EnhancementCache {
  private cache = new Map<string, { result: string; timestamp: number }>();
  private readonly maxSize = 64;

  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    entry.timestamp = Date.now();
    return entry.result;
  }

  set(key: string, result: string): void {
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | undefined;
      let oldestTs = Infinity;
      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTs) {
          oldestTs = v.timestamp;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================
// 🔒 REQUEST DEDUPLICATION
// Prevents duplicate Ollama generate calls for same input text
// within a short time window (2 seconds).
// Also guards against React StrictMode double-rendering.
// ============================================================
class DedupGuard {
  private inflight = new Map<string, Promise<string | undefined>>();

  dedup<T>(key: string, fn: () => Promise<T>, ttlMs = 2000): Promise<T> {
    const existing = this.inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = fn().finally(() => {
      setTimeout(() => {
        if (this.inflight.get(key) === promise) this.inflight.delete(key);
      }, ttlMs);
    });
    this.inflight.set(key, promise as Promise<string | undefined>);
    return promise;
  }
}

@Injectable()
export class GemmaEnhancerService {
  private readonly logger = new Logger(GemmaEnhancerService.name);
  private readonly ollamaBase = (
    process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
  ).replace(/\/$/, '');
  private readonly generateUrl = `${this.ollamaBase}/api/generate`;
  private readonly tagsUrl = `${this.ollamaBase}/api/tags`;

  // ⚡ LIGHT ENHANCER MODEL (gemma2:2b by default — fast & small)
  private readonly enhancerModel =
    process.env.GEMMA_ENHANCER_MODEL || process.env.OLLAMA_MODEL || 'gemma2:2b';

  // 🏋️ HEAVY MODEL for optional advanced tasks
  private readonly heavyModel =
    process.env.GEMMA_HEAVY_MODEL || this.enhancerModel;

  // 🚫 SKIP enhancement for long deterministic responses — return directly
  private readonly skipLongResponseThreshold = 250;

  // ⏱️ Shorter timeout — don't wait forever for a small rewrite
  private readonly requestTimeoutMs = Math.max(
    5000,
    parseInt(process.env.GEMMA_REQUEST_TIMEOUT_MS || '15000', 10) || 15000,
  );

  private readonly pingTimeoutMs = Math.min(
    3000,
    Math.max(
      500,
      parseInt(process.env.GEMMA_PING_TIMEOUT_MS || '1500', 10) || 1500,
    ),
  );

  private readonly enhancementEnabled =
    process.env.GEMMA_ENHANCE_ENABLED !== 'false' &&
    process.env.GEMMA_ENHANCEMENT_ENABLED !== 'false';

  // 🗃️ Response cache
  private readonly cache = new EnhancementCache();

  // 🔒 Dedup guard
  private readonly dedupGuard = new DedupGuard();

  // ============================================================
  // VALIDATION
  // ============================================================

  private isInvalidEnhancedResponse(
    enhanced: string,
    originalSegment: string,
  ): boolean {
    const text = (enhanced ?? '').trim();
    if (!text) return true;

    const originalTrimmed = (originalSegment ?? '').trim();
    const minLen = Math.max(
      6,
      Math.min(64, Math.floor(originalTrimmed.length * 0.12)),
    );
    if (text.length < minLen) return true;

    const lowered = text.toLowerCase();

    const forbiddenPhrases = [
      "here's a breakdown",
      'here is a breakdown',
      'let me explain',
      "let's break it down",
      'here are a few ways',
      'here are some ways',
      'ways to rewrite',
      'rewrite the sentence',
      'rewrite this',
      'keeping the meaning similar',
      'keeping the meaning natural',
      'maintaining a short',
      'in natural tunisian arabic',
      'tunisian arabic/french',
      'tunisian arabic or french',
      'while keeping the meaning',
      'paraphrase the following',
      'you could say',
      'for example:',
    ];

    for (const phrase of forbiddenPhrases) {
      if (lowered.includes(phrase)) return true;
    }

    if (/^here\s+(are|is)\b/i.test(text)) return true;
    if (/^\s{0,3}#{1,6}\s+\S/m.test(text)) return true;
    if ((text.match(/\n\s*[-=]{3,}\s*\n/g) || []).length >= 1) return true;

    return false;
  }

  // ============================================================
  // GENERATION SIZE — REDUCED: num_predict = 20 (max 24)
  // ============================================================

  private numPredictForSegment(_segmentLen: number): number {
    // Force small generation: max 24 tokens
    return Math.min(24, Math.max(16, 20));
  }

  // ============================================================
  // OLLAMA PING (KEEP WARM)
  // ============================================================

  private async ollamaReachable(): Promise<boolean> {
    try {
      await axios.get(this.tagsUrl, { timeout: this.pingTimeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // SHORTENED PROMPT
  // ============================================================

  private async runGenerate(segment: string): Promise<string | undefined> {
    // Ultra-short prompt:
    const prompt = `Rewrite naturally in Tunisian Arabic/French.
Keep same meaning.
Be concise.

Response:
${segment}`;

    return this.callOllama(this.enhancerModel, prompt, this.numPredictForSegment(segment.length));
  }

  // ============================================================
  // CENTRALIZED OLLAMA CALL (with dedup & cache)
  // ============================================================

  private async callOllama(
    model: string,
    prompt: string,
    numPredict: number,
  ): Promise<string | undefined> {
    const cacheKey = `${model}:${prompt}:${numPredict}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('Gemma: cache hit');
      return cached;
    }

    // Deduplicate in-flight requests
    return this.dedupGuard.dedup(cacheKey, async () => {
      try {
        const response = await axios.post(
          this.generateUrl,
          {
            model,
            prompt,
            stream: false,
            keep_alive: '10m',
            options: {
              num_predict: numPredict,
              temperature: 0.25,
              num_ctx: 512, // Reduced context window for speed
            },
          },
          { timeout: this.requestTimeoutMs },
        );

        const result = response.data?.response?.trim();

        // Store in cache if valid
        if (result && result.length > 0) {
          this.cache.set(cacheKey, result);
        }

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Gemma: Ollama call failed: ${message}`);
        return undefined;
      }
    });
  }

  // ============================================================
  // SUPPLEMENT GENERATION (also uses light model, short prompts)
  // ============================================================

  private async runPrompt(
    prompt: string,
    numPredict = 20,
  ): Promise<string | undefined> {
    return this.callOllama(this.enhancerModel, prompt, numPredict);
  }

  // ============================================================
  // DETERMINISTIC SKIP CONDITIONS
  // ============================================================

  /**
   * Gemma must not rewrite RAG lists, comparisons, or error lines — it corrupts layout and facts.
   */
  private isStructuredDeterministicReply(s: string): boolean {
    return (
      /❌/.test(s) ||
      /🛡️|⚖️/.test(s) ||
      /💼\s*\*\*/.test(s) ||
      /✅\s*\*\*Compatibilit/i.test(s) ||
      /\*\*[12]️⃣/.test(s) ||
      /\n---\n/.test(s) ||
      // Also skip: score tables, roadmap lists, program lists
      /(?:Dernier|Compatibilit|programme\(s\)|Perspectives|Demande|Ch[oô]mage|سكور|مقارنة|برنامج)/.test(s)
    );
  }

  /**
   * Skip enhancement for long responses (> 250 chars) — return deterministic directly.
   */
  private isLongResponse(text: string): boolean {
    return text.length > this.skipLongResponseThreshold;
  }

  isOpenQuestion(message?: string): boolean {
    const normalized = (message || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized.trim()) return false;

    const openPatterns = [
      /\b(conseil|conseille|avis|aide|help|motivation|rassure|peur|n5af|khayef|chomage|future|avenir|opportunite|opportunites)\b/,
      /\b(comparer|compare|comparaison|difference|meilleur|khir|wala|ou bien| vs )\b/,
      /\b(nheb|na7eb|je veux|je prefere|prefere).*\b(remote|freelance|future|avenir|domaine)\b/,
      /\b(informatique|gestion|business|langues|lettres|droit|sport|medecine)\b.*\b(wala|ou|vs)\b/,
    ];

    const deterministicPatterns = [
      /\b(score|moyenne|note|eligib|admission|chance|chances|compatible|compatibilite|calcul|calcule|roadmap|parcours|etapes|skills|competences|salaire|programmes?|filieres?|metiers?|jobs?)\b/,
    ];

    const isOpen = openPatterns.some((pattern) => pattern.test(normalized));
    const isDeterministicOnly =
      deterministicPatterns.some((pattern) => pattern.test(normalized)) &&
      !/\b(conseil|avis|future|avenir|peur|n5af|chomage|comparer|compare|wala|ou bien|motivation)\b/.test(
        normalized,
      );

    return isOpen && !isDeterministicOnly;
  }

  private normalize(message?: string): string {
    return (message || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private isComparisonQuestion(message?: string): boolean {
    const normalized = this.normalize(message);
    return /\b(comparer|compare|comparaison|difference|different|versus| vs |wala|ou bien| ou |khir|meilleur entre)\b/.test(
      normalized,
    );
  }

  private isExplanationQuestion(message?: string): boolean {
    const normalized = this.normalize(message);
    return /\b(pourquoi|why|3lech|alech|alach|علاش|علاه|reason|explique|explain)\b/.test(
      normalized,
    );
  }

  private hasEmotionalSignal(message?: string): boolean {
    const normalized = this.normalize(message);
    return /\b(n5af|nkhaf|peur|khayef|stress|stresse|daye3|daya3|perdu|confus|ma3rftech|ma na3rafch|motivation|motivi|excite|farhan|rtaht|mbambi|chomage)\b/.test(
      normalized,
    );
  }

  private isRoadmapOrHardCalculation(message?: string): boolean {
    const normalized = this.normalize(message);
    return /\b(roadmap|parcours|etapes|calcul|calcule|eligib|admission|compatible|compatibilite)\b/.test(
      normalized,
    );
  }

  private looksLikeRecommendation(text: string): boolean {
    return /Dernier score|Compatibilit|programme\(s\)|Aucun programme|Perspectives|Demande|Ch[oô]mage|آخر score|التوافق/i.test(
      text,
    );
  }

  private profileLine(profile?: EnhancementProfile): string {
    if (!profile) return 'Profile: unknown';
    return (
      [
        profile.bacType ? `bac=${profile.bacType}` : undefined,
        typeof profile.score === 'number'
          ? `score=${profile.score}`
          : undefined,
        typeof profile.FG === 'number' ? `FG=${profile.FG}` : undefined,
        profile.interest ? `interest=${profile.interest}` : undefined,
      ]
        .filter(Boolean)
        .join(', ') || 'Profile: unknown'
    );
  }

  private inferSoftSignals(message?: string): string {
    const normalized = this.normalize(message);
    const signals = [
      /\b(remote|teletravail|distance|online|men dar|mil dar)\b/.test(normalized)
        ? 'remote'
        : undefined,
      /\b(freelance|independant|startup|projet prive|wahdi)\b/.test(normalized)
        ? 'freelance/entrepreneurship'
        : undefined,
      /\b(creative|creatif|creation|design|art|contenu|ecriture)\b/.test(normalized)
        ? 'creative'
        : undefined,
      /\b(analyse|analytical|logique|data|math|problem)\b/.test(normalized)
        ? 'analytical'
        : undefined,
      /\b(stable|stabilite|securite|chomage|n5af|peur)\b/.test(normalized)
        ? 'stability'
        : undefined,
      /\b(communication|journalisme|parler|public|client|social)\b/.test(normalized)
        ? 'communication'
        : undefined,
    ].filter(Boolean);

    return signals.length ? signals.join(', ') : 'none';
  }

  private buildSupplementPrompt(
    kind: 'comparison' | 'explanation' | 'emotion' | 'summary',
    original: string,
    userMessage?: string,
    profile?: EnhancementProfile,
  ): string {
    const context = original.slice(0, 1400);
    const profileText = this.profileLine(profile);
    const signals = this.inferSoftSignals(userMessage);

    if (kind === 'comparison') {
      return `Add a short AI comparison note.
Deterministic answer stays unchanged.
Do not invent scores, programs, or eligibility.
Cover pros/cons, personality fit, future, remote/freelance, work style.
Under 120 words. Light Tunisian Arabic + French.

User: ${userMessage || ''}
${profileText}
Soft signals: ${signals}
Deterministic answer:
${context}`;
    }

    if (kind === 'explanation') {
      return `Explain briefly why this recommendation fits.
Do not invent scores or programs.
Use only the deterministic answer and profile.
Keep it warm, realistic, under 120 words.

User: ${userMessage || ''}
${profileText}
Soft signals: ${signals}
Recommendation:
${context}`;
    }

    if (kind === 'emotion') {
      return `Write a short supportive orientation note.
Be realistic and motivating, not dramatic.
Do not change recommendations or invent facts.
Under 70 words. Light Tunisian Arabic + French.

User: ${userMessage || ''}
${profileText}
Answer:
${context}`;
    }

    return `Write a short personalized summary after this deterministic recommendation.
Use helper signals only. Do not invent scores or programs.
Concise bullets, under 80 words.

User: ${userMessage || ''}
${profileText}
Soft signals: ${signals}
Recommendation:
${context}`;
  }

  private async generateSupplement(
    original: string,
    userMessage?: string,
    profile?: EnhancementProfile,
  ): Promise<string | undefined> {
    if (original.length > 1400) return undefined;
    if (this.isRoadmapOrHardCalculation(userMessage)) return undefined;

    let kind: 'comparison' | 'explanation' | 'emotion' | 'summary' | undefined;
    if (this.isComparisonQuestion(userMessage)) kind = 'comparison';
    else if (this.isExplanationQuestion(userMessage)) kind = 'explanation';
    else if (this.hasEmotionalSignal(userMessage)) kind = 'emotion';
    else if (this.looksLikeRecommendation(original)) kind = 'summary';

    if (!kind) return undefined;

    const prompt = this.buildSupplementPrompt(kind, original, userMessage, profile);
    const supplement = await this.runPrompt(prompt, kind === 'summary' ? 20 : 24);
    const cleaned = supplement?.trim();

    if (!cleaned || cleaned.length < 12) return undefined;
    if (cleaned.length > 900) return undefined;
    if (/programme invent|score invent/i.test(cleaned)) return undefined;

    const title =
      kind === 'comparison'
        ? '💡 Comparaison AI'
        : kind === 'explanation'
          ? '💡 Pourquoi'
          : kind === 'emotion'
            ? '💡 Note'
            : '💡 Résumé personnalisé';

    return `${title}\n${cleaned}`;
  }

  // ============================================================
  // 🎯 MAIN ENHANCE METHOD — heavily optimized
  // ============================================================

  async enhanceResponse(
    text: string,
    userMessage?: string,
    profile?: EnhancementProfile,
  ): Promise<string> {
    const original = text?.trim();
    if (!original) return text;

    if (!this.enhancementEnabled) {
      return text;
    }

    // 🚫 Skip if response is long (> 250 chars) — return deterministic directly
    // This is critical for speed: most RAG/list/results are long
    if (this.isLongResponse(original)) {
      this.logger.log(`Gemma: skipped (response length ${original.length} > ${this.skipLongResponseThreshold})`);
      return text;
    }

    if (!(await this.ollamaReachable())) {
      this.logger.log(`Gemma: skipped (Ollama not reachable at ${this.ollamaBase})`);
      return text;
    }

    // 🚫 Skip structured deterministic replies (score tables, lists, comparisons)
    if (this.isStructuredDeterministicReply(original)) {
      this.logger.log('Gemma: skipped (structured deterministic reply)');
      return text;
    }

    // ✅ Only enhance short responses that are open questions
    if (
      this.isOpenQuestion(userMessage) &&
      original.length <= 250 &&
      !this.isStructuredDeterministicReply(original)
    ) {
      if (!original) return text;

      try {
        const cacheKey = `rewrite:${original}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.logger.log('Gemma: cache hit (rewrite)');
          return cached;
        }

        const enhanced = await this.runGenerate(original);
        if (!enhanced || this.isInvalidEnhancedResponse(enhanced, original)) {
          this.logger.debug('Gemma: model output empty or rejected validation, plain reply');
          return text;
        }

        this.cache.set(cacheKey, enhanced);
        this.logger.log(`Gemma: reply polished (${original.length} chars)`);
        return enhanced;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Gemma enhancement failed: ${message}`);
        return text;
      }
    }

    // For structured/non-open responses, try a short supplement
    try {
      const cacheKey = `supplement:${original}:${userMessage || ''}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return `${text}\n\n${cached}`;

      const supplement = await this.generateSupplement(original, userMessage, profile);
      if (supplement) {
        this.cache.set(cacheKey, supplement);
        return `${text}\n\n${supplement}`;
      }
      return text;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Gemma supplement failed: ${message}`);
      return text;
    }
  }
}