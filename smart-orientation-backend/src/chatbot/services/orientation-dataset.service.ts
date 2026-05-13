import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type DatasetMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type RawDatasetConversation = {
  conversation_id?: string | number;
  messages?: DatasetMessage[];
  category?: string;
  language?: string;
};

export type DatasetCategory =
  | 'orientation'
  | 'salaries'
  | 'ai'
  | 'cybersecurity'
  | 'abroad'
  | 'careers'
  | 'confusion'
  | 'emotional'
  | 'programming';

export type DatasetConversation = {
  id: string;
  messages: DatasetMessage[];
  category: DatasetCategory;
  language?: string;
  text: string;
  userText: string;
  assistantText: string;
  keywords: string[];
};

export type DatasetMatch = {
  conversation: DatasetConversation;
  score: number;
  matchedKeywords: string[];
};

const CATEGORIES: DatasetCategory[] = [
  'orientation',
  'salaries',
  'ai',
  'cybersecurity',
  'abroad',
  'careers',
  'confusion',
  'emotional',
  'programming',
];

const CATEGORY_KEYWORDS: Record<DatasetCategory, string[]> = {
  orientation: [
    'orientation',
    'orienter',
    'bac',
    'score',
    'moyenne',
    'filiere',
    'fac',
    'universite',
    'prepa',
    'insat',
    'iset',
    'ecole',
    'choix',
    'domaine',
    'mosta9bel',
    '9raya',
    'na9ra',
    'chneya',
    'chnowa',
    'tawjih',
  ],
  salaries: [
    'salaire',
    'salaires',
    'salary',
    'flous',
    'argent',
    'payee',
    'payes',
    'tnd',
    'dt',
    'dinars',
    'junior',
    'senior',
    'kadeh',
    'قداش',
  ],
  ai: [
    'ai',
    'ia',
    'intelligence artificielle',
    'machine learning',
    'ml',
    'deep learning',
    'data science',
    'data scientist',
    'chatbot',
    'openai',
  ],
  cybersecurity: [
    'cyber',
    'cybersecurity',
    'cybersecurite',
    'securite',
    'security',
    'pentest',
    'hacking',
    'hacker',
    'reseau',
    'network',
    'soc',
  ],
  abroad: [
    'abroad',
    'etranger',
    'europe',
    'france',
    'allemagne',
    'canada',
    'lbarra',
    'barra',
    'visa',
    'master abroad',
    'bourse',
    'scholarship',
  ],
  careers: [
    'career',
    'carriere',
    'metier',
    'job',
    'jobs',
    'khedma',
    'travail',
    'debouche',
    'marche',
    'freelance',
    'stage',
    'recrutement',
  ],
  confusion: [
    'confus',
    'confusion',
    'hayer',
    '7ayer',
    'perdu',
    'ma naarech',
    'mana3refch',
    'hesitant',
    'khayef',
    'peur',
    'stress',
  ],
  emotional: [
    'deprime',
    'fatigue',
    'stress',
    'anxieux',
    'nheb nabtel',
    'kraht',
    'maadech',
    'khayef',
    'sad',
    'triste',
    'pression',
  ],
  programming: [
    'programmation',
    'programming',
    'code',
    'coding',
    'dev',
    'developpeur',
    'python',
    'javascript',
    'java',
    'web',
    'frontend',
    'backend',
    'html',
    'css',
    'react',
    'node',
  ],
};

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'pour',
  'avec',
  'dans',
  'mais',
  'donc',
  'est',
  'une',
  'des',
  'les',
  'sur',
  'lel',
  'mta3',
  'wala',
  'ama',
  'ken',
  'ena',
  'enti',
  'brabi',
  'salem',
  'aslema',
  'bonjour',
  'salut',
]);

@Injectable()
export class OrientationDatasetService implements OnModuleInit {
  private readonly logger = new Logger(OrientationDatasetService.name);
  private conversations: DatasetConversation[] = [];
  private categoryIndex = new Map<DatasetCategory, DatasetConversation[]>();

  onModuleInit(): void {
    this.loadDataset();
  }

  getTotalConversations(): number {
    return this.conversations.length;
  }

  findRelevantConversations(message: string, limit = 2): DatasetMatch[] {
    const query = this.normalize(message);
    if (!query) return [];

    const queryTokens = this.tokenize(query);
    const detectedCategories = this.detectCategories(message);
    const candidates = this.getCandidates(detectedCategories);

    return candidates
      .map((conversation) =>
        this.scoreConversation(
          conversation,
          query,
          queryTokens,
          detectedCategories,
        ),
      )
      .filter((match) => match.score >= 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  detectCategories(message: string): DatasetCategory[] {
    const normalized = this.normalize(message);
    if (!normalized) return [];

    return CATEGORIES.filter((category) =>
      CATEGORY_KEYWORDS[category].some((keyword) =>
        normalized.includes(this.normalize(keyword)),
      ),
    );
  }

  getBestAssistantExample(match: DatasetMatch): string | null {
    const assistantMessages = match.conversation.messages
      .filter((m) => m.role === 'assistant' && m.content.trim())
      .map((m) => m.content.trim());

    if (assistantMessages.length === 0) return null;
    return this.compactText(assistantMessages[0], 320);
  }

  private loadDataset(): void {
    const filePath = path.join(
      process.cwd(),
      'data',
      'final_clean_dataset.json',
    );
    let duplicatesRemoved = 0;
    let invalidRemoved = 0;

    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Dataset file not found: ${filePath}`);
        this.initializeIndexes([]);
        return;
      }

      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const items: RawDatasetConversation[] = Array.isArray(raw)
        ? raw
        : raw?.conversations || [];
      const seen = new Set<string>();
      const cleaned: DatasetConversation[] = [];

      for (const item of items) {
        const normalized = this.normalizeConversation(item);
        if (!normalized) {
          invalidRemoved += 1;
          continue;
        }

        const signature = this.createSignature(normalized.messages);
        if (seen.has(signature)) {
          duplicatesRemoved += 1;
          continue;
        }

        seen.add(signature);
        cleaned.push(normalized);
      }

      this.conversations = cleaned;
      this.initializeIndexes(cleaned);

      this.logger.log(
        `Dataset loaded successfully: ${cleaned.length} conversations`,
      );
      this.logger.log(`duplicates removed: ${duplicatesRemoved}`);
      this.logger.log(`invalid entries removed: ${invalidRemoved}`);
      this.logger.log('cache initialized');
      this.logger.log(
        `categories indexed: ${Array.from(this.categoryIndex.keys()).join(', ') || 'none'}`,
      );
    } catch (error) {
      this.logger.error(
        `Dataset loading failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.conversations = [];
      this.initializeIndexes([]);
    }
  }

  private normalizeConversation(
    item: RawDatasetConversation,
  ): DatasetConversation | null {
    if (!item || !Array.isArray(item.messages)) return null;

    const messages = item.messages
      .filter(
        (message) =>
          (message?.role === 'user' || message?.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }));

    const hasUser = messages.some((m) => m.role === 'user');
    const hasAssistant = messages.some((m) => m.role === 'assistant');
    if (!hasUser || !hasAssistant) return null;

    const rawCategory = this.normalize(String(item.category || 'orientation'));
    const category = CATEGORIES.includes(rawCategory as DatasetCategory)
      ? (rawCategory as DatasetCategory)
      : this.inferCategory(messages.map((m) => m.content).join(' '));

    const text = messages.map((m) => m.content).join(' ');
    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');
    const assistantText = messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join(' ');

    return {
      id: String(
        item.conversation_id || this.createSignature(messages).slice(0, 16),
      ),
      messages,
      category,
      language: item.language,
      text,
      userText,
      assistantText,
      keywords: this.extractKeywords(
        `${text} ${CATEGORY_KEYWORDS[category].join(' ')}`,
      ),
    };
  }

  private initializeIndexes(conversations: DatasetConversation[]): void {
    this.categoryIndex = new Map(CATEGORIES.map((category) => [category, []]));

    for (const conversation of conversations) {
      this.categoryIndex.get(conversation.category)?.push(conversation);
    }
  }

  private getCandidates(categories: DatasetCategory[]): DatasetConversation[] {
    if (categories.length === 0) return this.conversations;

    const selected = new Map<string, DatasetConversation>();
    for (const category of categories) {
      for (const conversation of this.categoryIndex.get(category) || []) {
        selected.set(conversation.id, conversation);
      }
    }

    return selected.size > 0
      ? Array.from(selected.values())
      : this.conversations;
  }

  private scoreConversation(
    conversation: DatasetConversation,
    query: string,
    queryTokens: string[],
    categories: DatasetCategory[],
  ): DatasetMatch {
    const text = this.normalize(conversation.text);
    const userText = this.normalize(conversation.userText);
    const matchedKeywords = conversation.keywords.filter((keyword) =>
      query.includes(keyword),
    );
    const querySet = new Set(queryTokens);
    const overlap = conversation.keywords.filter((keyword) =>
      querySet.has(keyword),
    );

    let score = 0;
    score += overlap.length * 4;
    score += matchedKeywords.length * 2;

    for (const token of queryTokens) {
      if (userText.includes(token)) score += 3;
      else if (text.includes(token)) score += 1;
    }

    if (categories.includes(conversation.category)) score += 10;
    if (conversation.userText && userText.includes(query.slice(0, 80)))
      score += 12;

    return {
      conversation,
      score,
      matchedKeywords: Array.from(
        new Set([...overlap, ...matchedKeywords]),
      ).slice(0, 8),
    };
  }

  private inferCategory(text: string): DatasetCategory {
    const detected = this.detectCategories(text);
    return detected[0] || 'orientation';
  }

  private createSignature(messages: DatasetMessage[]): string {
    return this.normalize(
      messages.map((message) => `${message.role}:${message.content}`).join('|'),
    );
  }

  private extractKeywords(text: string): string[] {
    return Array.from(new Set(this.tokenize(this.normalize(text)))).slice(
      0,
      80,
    );
  }

  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  }

  private normalize(text: string): string {
    return String(text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private compactText(text: string, maxLength: number): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 3).trim()}...`;
  }
}
