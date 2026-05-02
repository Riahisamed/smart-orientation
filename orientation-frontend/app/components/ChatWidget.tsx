'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Select } from '@/lib/components/ui/select';
import { Label } from '@/lib/components/ui/label';
import { ChatMessage, BacType, ProgramClassification } from '@/lib/types/ai';

const BAC_TYPES: BacType[] = ['MATH', 'SVT', 'ECO', 'TECH', 'INFO', 'LETTRES', 'SPORT'];

type SuggestionIntent = 'orientation' | 'requirements' | 'career' | 'location' | 'comparison' | 'general';

type SuggestionStudentData = {
  score?: number;
  bacType?: string;
  language?: 'fr' | 'ar';
};

const normalizeText = (value = '') =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeBacType = (bacType?: string) => {
  const normalized = normalizeText(bacType);

  if (['info', 'informatique'].includes(normalized)) return 'INFO';
  if (['math', 'maths', 'mathematiques'].includes(normalized)) return 'MATH';
  if (['svt', 'svt scientifique', 'scientifique', 'science', 'sciences'].includes(normalized)) return 'SVT';
  if (['eco', 'economie', 'gestion'].includes(normalized)) return 'ECO';
  if (['lettres', 'letters', 'lettre', 'adab'].includes(normalized)) return 'LETTERS';
  if (['tech', 'technique', 'technologie', 'technicien'].includes(normalized)) return 'TECHNIQUE';
  if (['sport', 'sprot', 'eps'].includes(normalized)) return 'SPORT';

  return (normalized.toUpperCase() as string) || 'MATH';
};

// Structured mapping of bac -> domain keywords (scalable and language-aware)
const BAC_DOMAINS: Record<string, string[]> = {
  INFO: ['informatique', 'programmation', 'réseaux'],
  MATH: ['ingénierie', 'mathématiques', 'data science'],
  SCIENCE: ['biologie', 'chimie', 'recherche'],
  SVT: ['médecine', 'pharmacie', 'biologie'],
  ECO: ['gestion', 'commerce', 'finance'],
  LETTERS: ['langues', 'communication', 'enseignement'],
  TECHNIQUE: ['industriel', 'mécanique', 'électrique'],
  SPORT: ['sport', 'kinésithérapie', 'éducation physique'],
};

const detectSuggestionIntent = (message: string): SuggestionIntent => {
  const text = normalizeText(message);

  if (!text) return 'orientation';
  if (/\b(win|ou|where|ville|fac|faculte|universite|na9ra|naqra|nokra)\b/.test(text)) return 'location';
  if (/\b(job|metier|travail|carriere|debouche|avenir|salaire|khedma|5edma)\b/.test(text)) return 'career';
  if (/\b(score|condition|conditions|admission|requis|moyenne|capacite)\b/.test(text)) return 'requirements';
  if (/\b(compare|comparaison|difference|vs|entre|meilleur entre|a7sen bin)\b/.test(text)) return 'comparison';
  if (/\b(chnoua|chniya|c quoi|cest quoi|what is|quest ce que)\b/.test(text)) return 'general';

  return 'orientation';
};

type SuggestionTopic = {
  id: string;
  fr: string;
  ar: string;
  aliases: string[];
  careerFr: string;
  careerAr: string;
  easyFr: string;
  easyAr: string;
};

const TOPICS: SuggestionTopic[] = [
  {
    id: 'it',
    fr: 'informatique',
    ar: 'الإعلامية',
    aliases: ['info', 'informatique', 'it', 'dev', 'programmation', 'programming', 'ai', 'ia', 'data', 'cyber'],
    careerFr: 'programmation',
    careerAr: 'البرمجة',
    easyFr: 'IT accessibles',
    easyAr: 'IT السهلة',
  },
  {
    id: 'medical',
    fr: 'medecine',
    ar: 'الطب',
    aliases: ['medecine', 'medecin', 'medicine', 'medical', 'sante', 'pharmacie', 'biologie', 'infirmier'],
    careerFr: 'sante',
    careerAr: 'الصحة',
    easyFr: 'sante accessibles',
    easyAr: 'الصحة المناسبة',
  },
  {
    id: 'engineering',
    fr: 'ingenierie',
    ar: 'الهندسة',
    aliases: ['ingenieur', 'ingenierie', 'genie', 'mecanique', 'electrique', 'civil', 'technique'],
    careerFr: 'ingenierie',
    careerAr: 'الهندسة',
    easyFr: 'ingenierie accessibles',
    easyAr: 'الهندسة المناسبة',
  },
  {
    id: 'business',
    fr: 'gestion',
    ar: 'التصرف',
    aliases: ['gestion', 'business', 'finance', 'marketing', 'commerce', 'comptabilite', 'economie'],
    careerFr: 'gestion',
    careerAr: 'التصرف',
    easyFr: 'gestion accessibles',
    easyAr: 'التصرف المناسب',
  },
  {
    id: 'law',
    fr: 'droit',
    ar: 'القانون',
    aliases: ['droit', 'law', 'juridique', 'avocat'],
    careerFr: 'droit',
    careerAr: 'القانون',
    easyFr: 'droit accessibles',
    easyAr: 'القانون المناسب',
  },
  {
    id: 'languages',
    fr: 'langues',
    ar: 'اللغات',
    aliases: ['langue', 'langues', 'francais', 'anglais', 'traduction', 'lettres', 'communication'],
    careerFr: 'langues',
    careerAr: 'اللغات',
    easyFr: 'langues accessibles',
    easyAr: 'اللغات المناسبة',
  },
  {
    id: 'design',
    fr: 'design',
    ar: 'التصميم',
    aliases: ['design', 'art', 'architecture', 'graphique', 'ux', 'ui'],
    careerFr: 'design',
    careerAr: 'التصميم',
    easyFr: 'design accessibles',
    easyAr: 'التصميم المناسب',
  },
];

// Create a mapping from BAC_DOMAINS keywords to our internal TOPICS ids.
const mapDomainKeywordsToTopicIds = (keywords: string[]) => {
  const ids: string[] = [];
  for (const k of keywords) {
    const key = normalizeText(k);
    const found = TOPICS.find((t) =>
      t.aliases.some((a) => normalizeText(a) === key) || normalizeText(t.fr) === key || normalizeText(t.id) === key,
    );
    if (found && !ids.includes(found.id)) ids.push(found.id);
  }
  return ids;
};

const BAC_TOPIC_IDS: Record<string, string[]> = Object.fromEntries(
  Object.entries(BAC_DOMAINS).map(([bac, keywords]) => [bac, mapDomainKeywordsToTopicIds(keywords)]),
) as Record<string, string[]>;

let suggestionRotation = 0;

const topicById = (id?: string) => TOPICS.find((topic) => topic.id === id) || TOPICS[0];

const detectTopicFromMessage = (message: string) => {
  const text = normalizeText(message);
  if (!text) return undefined;

  return TOPICS.find((topic) =>
    topic.aliases.some((alias) => new RegExp(`(^|\\s)${alias}($|\\s)`).test(text) || text.includes(alias)),
  );
};

const getScoreTone = (score?: number) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'unknown';
  if (score < 100) return 'careful';
  if (score < 140) return 'balanced';
  return 'ambitious';
};

const rotateSuggestions = (items: string[], seed: string) => {
  const unique = Array.from(new Set(items.filter(Boolean)));
  if (unique.length <= 4) return unique.slice(0, 4);

  suggestionRotation = (suggestionRotation + 1) % 997;
  const seedValue = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  const start = (seedValue + suggestionRotation + Math.floor(Date.now() / 30000)) % unique.length;
  return [...unique.slice(start), ...unique.slice(0, start)].slice(0, 4);
};

const shuffle = <T,>(arr: T[]) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function generateSuggestions(
  studentData: SuggestionStudentData,
  lastMessage = '',
  intent?: SuggestionIntent,
): string[] {
  const language = studentData.language || 'fr';
  const isArabic = language === 'ar';
  const bac = normalizeBacType(studentData.bacType);
  const score = typeof studentData.score === 'number' && Number.isFinite(studentData.score)
    ? studentData.score
    : undefined;
  const resolvedIntent = intent || detectSuggestionIntent(lastMessage);
  const messageTopic = detectTopicFromMessage(lastMessage);
  // Build prioritized topics list: start from bacType domains, allow user override via messageTopic
  const bacTopicIds = BAC_TOPIC_IDS[bac] || BAC_TOPIC_IDS.MATH || [];
  const bacTopics = bacTopicIds.map(topicById).filter(Boolean);

  const userMentionedTopic = messageTopic;

  // Allow IT only if bac is INFO or user explicitly mentions IT
  const allowedIt = bac === 'INFO' || (userMentionedTopic && userMentionedTopic.id === 'it');

  // Compose final prioritized topic list
  const finalTopics: any[] = [];
  if (userMentionedTopic) finalTopics.push(userMentionedTopic);
  for (const t of bacTopics) {
    if (!finalTopics.find((ft) => ft.id === t.id)) finalTopics.push(t);
  }

  // Filter out IT when not allowed to avoid IT bias
  const filteredTopics = finalTopics.filter((t) => (t.id === 'it' ? allowedIt : true));

  // fallback: if nothing matches, choose first non-it topics from TOPICS
  const fallbackTopics = TOPICS.filter((t) => t.id !== 'it');
  const topics = filteredTopics.length > 0 ? filteredTopics : fallbackTopics.slice(0, 3);

  const primary = topics[0] || topicById(bacTopicIds[0]);
  const secondary = topics[1] || topics[0] || topicById(bacTopicIds[1]);
  const scoreText = score ? `${score}` : isArabic ? 'مجموعي' : 'mon score';
  const scoreTone = getScoreTone(score);
  const field = isArabic ? primary?.ar : primary?.fr;
  const secondField = isArabic ? secondary?.ar : secondary?.fr;
  const career = isArabic ? primary?.careerAr : primary?.careerFr;
  const easyField = isArabic ? primary?.easyAr : primary?.easyFr;

  const intentSuggestions: Record<SuggestionIntent, string[]> = {
    orientation: isArabic
      ? [`رتب لي أفضل اختيارات ${field}`, `ما الاختيار الأذكى لبكالوريا ${bac}؟`]
      : [`Classe mes meilleurs choix en ${field}`, `Le choix le plus malin pour Bac ${bac} ?`],
    requirements: isArabic
      ? [`ما آخر مجموع مطلوب في ${field}؟`, `هل مجموع ${scoreText} كاف للقبول؟`]
      : [`Quel dernier score pour ${field} ?`, `${scoreText} suffit pour etre admis ?`],
    career: isArabic
      ? [`ما المهارات المطلوبة في ${career}؟`, `كيف أبني مسارا مهنيا في ${field}؟`]
      : [`Quelles competences pour ${career} ?`, `Comment construire un parcours en ${field} ?`],
    location: isArabic
      ? [`أين أدرس ${field} في تونس؟`, `ما المؤسسات الأقرب في ${field}؟`]
      : [`Ou etudier ${field} en Tunisie ?`, `Quelles institutions proches en ${field} ?`],
    comparison: isArabic
      ? [`أي اختيار أكثر أمانا: ${field} أم ${secondField}؟`, `قارن الآفاق والقبول`]
      : [`Quel choix est plus sur: ${field} ou ${secondField} ?`, `Compare admission et debouches`],
    general: isArabic
      ? [`اشرح لي ${field} ببساطة`, `هل هذا المجال مناسب لشخصيتي؟`]
      : [`Explique ${field} simplement`, `Ce domaine colle a mon profil ?`],
  };

  const scoreAware = isArabic
    ? {
        careful: [`ما الاختيارات الآمنة لمجموع ${scoreText}؟`, `هل توجد بدائل أسهل من ${field}؟`],
        balanced: [`ما الاختيارات الممكنة لمجموع ${scoreText}؟`, `كيف أوازن بين الأمان والطموح؟`],
        ambitious: [`ما الاختيارات القوية التي أستطيع استهدافها؟`, `هل أضع ${field} كاختيار أول؟`],
        unknown: [`ما المعلومات التي تحتاجها لتوجيهي؟`, `كيف أختار حسب نوع البكالوريا؟`],
      }
    : {
        careful: [`Quels choix surs avec ${scoreText} ?`, `Des alternatives plus faciles que ${field} ?`],
        balanced: [`Quels choix jouables avec ${scoreText} ?`, `Comment equilibrer securite et ambition ?`],
        ambitious: [`Quels choix ambitieux viser ?`, `${field} en premier choix ?`],
        unknown: [`Quelles infos te donner pour m orienter ?`, `Comment choisir selon mon bac ?`],
      };

  // Build concise, personalized suggestions (3-4) following priority: bac -> user intent -> score
  const suggestionsOut: string[] = [];

  // 1) Intent-focused personalized prompt (primary domain)
  if (resolvedIntent && field) {
    if (isArabic) suggestionsOut.push(`هل ${field} مناسبة لمعدلك ${scoreText}؟`);
    else suggestionsOut.push(`${field} me convient avec ${scoreText} ?`);
  }

  // 2) User override mention — only if different from primary
  if (userMentionedTopic && userMentionedTopic.id !== primary.id) {
    const t = userMentionedTopic;
    suggestionsOut.push(isArabic ? `ماذا عن ${t.ar} لمجل ${scoreText}؟` : `What about ${t.fr} with ${scoreText} ?`);
  }

  // 3) Score-aware recommendations (limit 2)
  const toneSamples = scoreAware[scoreTone as keyof typeof scoreAware] || [];
  suggestionsOut.push(...toneSamples.slice(0, 2));

  // 4) Comparison: only if primary and secondary domains are meaningfully different
  const normPrimary = normalizeText(field || '');
  const normSecond = normalizeText(secondField || '');
  if (field && secondField && normPrimary && normSecond && normPrimary !== normSecond) {
    suggestionsOut.push(isArabic ? `قارن ${field} و${secondField}` : `Compare ${field} and ${secondField}`);
  }

  // 5) Post-process: clean, validate, dedupe, and limit
  const cleaned = suggestionsOut
    .map((s) => (s || '').trim())
    .filter((s) => s.length > 3)
    .filter((s) => !/^\s*$/.test(s));

  // remove suggestions that are trivial repeats like "medecine medecine"
  const meaningful = cleaned.filter((s) => {
    const words = s.split(/\s+/).map((w) => normalizeText(w.replace(/[^\p{L}\p{N}]+/gu, ''))).filter(Boolean);
    const uniqueWords = new Set(words);
    return uniqueWords.size > 1 || words.join(' ').length > 8;
  });

  // deduplicate normalized strings while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of meaningful) {
    const key = normalizeText(s);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }

  // shuffle a bit for variety, then rotate using existing mechanism
  const shuffled = rotateSuggestions(shuffle(unique), `${lastMessage}-${bac}-${scoreText}-${resolvedIntent}-${language}`);

  // final cap to 4 (UI expects 3-4)
  return shuffled.slice(0, 4);
}

interface MessageWithPrograms extends ChatMessage {
  programs?: ProgramClassification;
}

interface ChatWidgetProps {
  onClose?: () => void;
  hideHeader?: boolean;
}

export default function ChatWidget({ onClose, hideHeader = false }: ChatWidgetProps) {
  const [messages, setMessages] = useState<MessageWithPrograms[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [score, setScore] = useState<string>('');
  const [bac, setBac] = useState<BacType>('MATH');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [t, setT] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user')?.content || '';
  const suggestionContext = chatStarted ? lastUserMessage : inputMessage;
  const suggestionIntent = detectSuggestionIntent(suggestionContext);

  useEffect(() => {
    const result = generateSuggestions(
      {
        score: parseFloat(score),
        bacType: bac,
        language,
      },
      suggestionContext,
      suggestionIntent,
    );

    setSuggestions(result);
  }, [bac, language, score, suggestionContext, suggestionIntent, suggestionRefreshKey]);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as MessageWithPrograms[];
        const normalized = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(normalized);
        setChatStarted(true);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !score || isLoading) return;

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0) {
      alert('Please enter a valid score');
      return;
    }

    setChatStarted(true);

    const userMessage: MessageWithPrograms = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSuggestionRefreshKey((prev) => prev + 1);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message:', inputMessage);

      const res = await fetch('http://localhost:3001/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          studentData: {
            score: numScore,
            bacType: bac,
            language,
          },
        }),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (res.ok && data.reply) {
        const assistantMessage: MessageWithPrograms = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: MessageWithPrograms = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Network error:', error);
      const errorMessage: MessageWithPrograms = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    setChatStarted(false);
  };

  const renderProgramCategory = (
    title: string,
    programs: any[],
    icon: string,
    color: string,
  ) => {
    if (!programs || programs.length === 0) return null;

    return (
      <div key={title} className={`mt-4 p-3 rounded-lg border-l-4 ${color}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold">{title}</h4>
          <span className="text-xs bg-gray-300 dark:bg-gray-700 rounded-full px-2 py-1">
            {programs.length}
          </span>
        </div>
        <ul className="space-y-1 text-sm">
          {programs.map((prog: any, idx: number) => (
            <li key={idx} className="pl-4 border-l border-gray-300 dark:border-gray-600">
              <div className="font-medium">{prog.program}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {prog.institution} • Score: {prog.lastScore || 'N/A'}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const isArabic = language === 'ar';

  useEffect(() => {
    // fetch i18n strings from backend; suggestions are generated locally
    const lang = language || 'fr';

    (async () => {
      try {
        const r = await fetch(`http://localhost:3001/chatbot/i18n/${lang}`);
        const json = await r.json();
        setT(json);
      } catch (e) {
        setT(null);
      }
    })();
  }, [language]);

  const containerClasses = hideHeader
    ? 'h-full bg-white dark:bg-gray-900 p-3'
    : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4';

  const wrapperClasses = hideHeader ? 'h-full flex flex-col gap-4' : 'max-w-4xl mx-auto space-y-4';

  const messageWrapperClasses = hideHeader
    ? 'flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'
    : 'space-y-4 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700';

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        {!hideHeader ? (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🎓 AI Orientation Assistant</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Get intelligent recommendations for your university path
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back</Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <span>🤖</span>
              <span>AI Assistant</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              X
            </button>
          </div>
        )}

        {!chatStarted && (
          <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Start Your Orientation Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Tell us about yourself to get personalized recommendations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="score" className="font-semibold">
                    Your Score
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    placeholder="e.g., 150.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="bac" className="font-semibold">
                    Bac Type
                  </Label>
                  <Select value={bac} onChange={(e) => setBac(e.target.value as BacType)}>
                    {BAC_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language" className="font-semibold">
                    Language
                  </Label>
                  <Select value={language} onChange={(e) => setLanguage(e.target.value as 'fr' | 'ar')}>
                    <option value="fr">Français 🇫🇷</option>
                    <option value="ar">العربية 🇹🇳</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {chatStarted && (
          <div className="flex gap-2 items-end bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Score: {score} • Bac: {bac} • {language === 'ar' ? '🇹🇳' : '🇫🇷'}
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear Chat
            </Button>
          </div>
        )}

        <div className={messageWrapperClasses}>
          {!chatStarted ? (
            <div className="mx-auto max-w-3xl py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t?.empty_intro || '💬 No messages yet. Fill in your details and ask a question to get started!'}
              </p>
              <div className="space-y-3" dir={isArabic ? 'rtl' : 'ltr'}>
                {suggestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputMessage(q);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-start text-base font-semibold leading-relaxed text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:hover:border-indigo-500 dark:hover:bg-gray-600"
                  >
                    <span className="shrink-0 text-lg" aria-hidden="true">
                      📌
                    </span>
                    <span className="flex-1">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                    {msg.programs && msg.role === 'assistant' && (
                      <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
                        {renderProgramCategory(
                          language === 'ar' ? '🟢 البرامج الآمنة' : '🟢 Safe Programs',
                          msg.programs.safe,
                          '✅',
                          'border-green-400 bg-green-50 dark:bg-green-900/20',
                        )}
                        {renderProgramCategory(
                          language === 'ar' ? '🟡 البرامج الممكنة' : '🟡 Possible Programs',
                          msg.programs.possible,
                          '⚠️',
                          'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
                        )}
                        {renderProgramCategory(
                          language === 'ar' ? '🔴 البرامج الصعبة' : '🔴 Difficult Programs',
                          msg.programs.hard,
                          '❌',
                          'border-red-400 bg-red-50 dark:bg-red-900/20',
                        )}
                      </div>
                    )}

                    <div className="text-xs mt-2 opacity-70">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          {!chatStarted && score && (
            <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
              ✅ Ready to start! Ask me anything about your university path.
            </div>
          )}
          {chatStarted && !score && (
            <div className="text-xs text-red-600 dark:text-red-400">
              ⚠️ Please fill in your score above before sending a message
            </div>
          )}
          {chatStarted && !isLoading && (
            <div className="flex flex-wrap gap-2" dir={isArabic ? 'rtl' : 'ltr'}>
              {suggestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputMessage(q);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:hover:border-indigo-500 dark:hover:bg-gray-600"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isArabic
                  ? 'اسأل أي سؤال عن مسارك الجامعي...'
                  : 'Ask any question about your university path...'
              }
              disabled={isLoading || !score}
              dir={isArabic ? 'rtl' : 'ltr'}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || !score}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? '⏳' : '📤'} {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Be specific about what you want to know - career paths, program difficulty, or admission chances.
          </p>
        </form>
      </div>
    </div>
  );
}
