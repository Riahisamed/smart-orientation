'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Select } from '@/lib/components/ui/select';
import { Label } from '@/lib/components/ui/label';
import { ChatMessage, BacType, ProgramClassification } from '@/lib/types/ai';
import { API_BASE_URL } from '@/lib/api/config';

const BAC_TYPES: BacType[] = ['MATH', 'SVT', 'ECO', 'TECH', 'INFO', 'LETTRES', 'SPORT'];

type SuggestionIntent = 'orientation' | 'requirements' | 'career' | 'location' | 'comparison' | 'general';

type SuggestionStudentData = {
  score?: number;
  bacType?: string;
  language?: 'fr' | 'ar';
  interest?: string;
};

const INTEREST_OPTIONS = [
  { id: 'tech', label: 'Tech', icon: '💻', arLabel: 'تكنولوجيا' },
  { id: 'health', label: 'Santé', icon: '🏥', arLabel: 'صحة' },
  { id: 'business', label: 'Business', icon: '💼', arLabel: 'أعمال' },
  { id: 'sport', label: 'Sport', icon: '⚽', arLabel: 'رياضة' },
  { id: 'art', label: 'Art', icon: '🎨', arLabel: 'فن' },
] as const;

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
  LETTRES: ['langues', 'communication', 'enseignement'],
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
  _intent?: SuggestionIntent,
): string[] {
  const language = studentData.language || 'fr';
  const isArabic = language === 'ar';
  const bac = studentData.bacType || 'MATH';
  const score = studentData.score;

  // SMART interest-based suggestion database
  const SMART_SUGGESTIONS: Record<string, Record<string, { fr: string[]; ar: string[] }>> = {
    // PRIMARY: Interest-based suggestions
    sport: {
      default: {
        fr: ['Quelles sont les meilleures filières sport ?', 'Est-ce que kiné est adapté pour moi ?', 'Quelles opportunités de travail en sport ?'],
        ar: ['ما هي أفضل تخصصات الرياضة؟', 'هل kiné مناسبة لي؟', 'ما فرص العمل في sport؟'],
      },
    },
    tech: {
      default: {
        fr: ['Comment entrer en informatique ?', "Quelle est la filière IT la plus accessible ?", 'Est-ce que programmation me convient ?'],
        ar: ['كيفاش ندخل informatique؟', 'شنوّا أسهل تخصص IT؟', 'هل programmation مناسبة لي؟'],
      },
    },
    health: {
      default: {
        fr: ['Quelle filière santé avec mon score ?', 'Médecine ou pharmacie ?', 'Quels débouchés en santé ?'],
        ar: ['أي تخصص صحة مع مجموعي؟', 'طب أو صيدلة؟', 'ما فرص العمل في الصحة؟'],
      },
    },
    business: {
      default: {
        fr: ['Quelle école de commerce choisir ?', 'Gestion ou finance ?', 'Carrière en business ?'],
        ar: ['أي مدرسة تجارة نختار؟', 'تصرف أو مالية؟', 'مسار مهني في الأعمال؟'],
      },
    },
    art: {
      default: {
        fr: ['Quelles études artistiques ?', 'Design ou architecture ?', 'Carrière dans les arts ?'],
        ar: ['أي دراسات فنية؟', 'تصميم أو عمارة؟', 'مهنة في الفنون؟'],
      },
    },
    // SECONDARY: BacType-based suggestions (when no interest)
    SVT: {
      default: {
        fr: ['Quelle filière médicale avec mon score ?', 'Médecine ou pharmacie ?', 'Quels débouchés en santé ?'],
        ar: ['أي تخصص طبي مع مجموعي؟', 'طب أو صيدلة؟', 'ما فرص العمل في الصحة؟'],
      },
    },
    MATH: {
      default: {
        fr: ['Quelle école d ingénieur avec mon score ?', 'Math ou informatique ?', 'Quels débouchés en ingénierie ?'],
        ar: ['أي مدرسة مهندسين مع مجموعي؟', 'رياضيات أو إعلامية؟', 'ما فرص العمل في الهندسة؟'],
      },
    },
    ECO: {
      default: {
        fr: ['Quelle école de commerce choisir ?', 'Gestion ou finance ?', 'Carrière en économie ?'],
        ar: ['أي مدرسة تجارة نختار؟', 'تصرف أو مالية؟', 'مسار مهني في الاقتصاد؟'],
      },
    },
    INFO: {
      default: {
        fr: ['Quelle filière informatique choisir ?', 'Développement ou réseaux ?', 'Carrière dans la tech ?'],
        ar: ['أي تخصص إعلامية نختار؟', 'تطوير أو شبكات؟', 'مسار مهني في التقنية؟'],
      },
    },
    TECH: {
      default: {
        fr: ['Quelle école d ingénieur choisir ?', 'Génie civil ou mécanique ?', 'Carrière en technologie ?'],
        ar: ['أي مدرسة مهندسين نختار؟', 'هندسة مدنية أو ميكانيك؟', 'مسار مهني في التكنولوجيا؟'],
      },
    },
    LETTRES: {
      default: {
        fr: ['Quelles études littéraires choisir ?', 'Langues ou droit ?', 'Carrière dans les lettres ?'],
        ar: ['أي دراسات أدبية نختار؟', 'لغات أو قانون؟', 'مسار مهني في الآداب؟'],
      },
    },
    SPORT: {
      default: {
        fr: ['Quelles filières sportives choisir ?', 'Kiné ou éducation physique ?', 'Carrière dans le sport ?'],
        ar: ['أي تخصصات رياضية نختار؟', 'kiné أو تربية بدنية؟', 'مسار مهني في الرياضة؟'],
      },
    },
  };

  // Get suggestions: PRIMARY = interest, SECONDARY = bacType
  let suggestions: string[] = [];

  if (studentData.interest && SMART_SUGGESTIONS[studentData.interest]) {
    // Use interest-based suggestions (PRIMARY)
    const suggs = isArabic
      ? SMART_SUGGESTIONS[studentData.interest].default.ar
      : SMART_SUGGESTIONS[studentData.interest].default.fr;
    suggestions = [...suggs];
  } else if (bac && SMART_SUGGESTIONS[bac]) {
    // Fallback to bacType-based suggestions (SECONDARY)
    const suggs = isArabic
      ? SMART_SUGGESTIONS[bac].default.ar
      : SMART_SUGGESTIONS[bac].default.fr;
    suggestions = [...suggs];
  } else {
    // Generic fallback
    suggestions = isArabic
      ? ['ما هي أفضل الاختيارات لي؟', 'شنوّا المناسب لمعدلي؟', 'ما فرص العمل في تونس؟']
      : ['Quels sont mes meilleurs choix ?', 'Quelle filière pour mon score ?', 'Quelles opportunités en Tunisie ?'];
  }

  // Add score context if available
  if (score && score > 0) {
    const scoreSuffix = isArabic
      ? ` (معدلي: ${score})`
      : ` (mon score: ${score})`;
    suggestions = suggestions.map(s => s + scoreSuffix);
  }

  // Clean: remove duplicates, empty, limit to 3
  const cleaned = suggestions
    .filter((s, i, arr) => arr.indexOf(s) === i) // dedupe
    .filter((s) => s.trim().length > 0) // no empty
    .slice(0, 3); // max 3

  return cleaned;
}

interface MessageWithPrograms extends ChatMessage {
  programs?: ProgramClassification;
}

interface RoadmapCard {
  domain: string;
  field: string;
  labelFr: string;
  labelAr: string;
  icon: string;
  color: string;
  description?: string;
  relevanceScore?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  demand?: string;
}

interface RoadmapCardsResponse {
  title: string;
  subtitle: string;
  cards: RoadmapCard[];
  maxSuggestions: number;
  personalized: boolean;
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
  const [interest, setInterest] = useState<string>('');
  const [t, setT] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [roadmapCards, setRoadmapCards] = useState<RoadmapCard[]>([]);
  const [roadmapCardsLoading, setRoadmapCardsLoading] = useState(false);
  const [showRoadmaps, setShowRoadmaps] = useState(false);
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
        interest,
      },
      suggestionContext,
      suggestionIntent,
    );

    setSuggestions(result);
  }, [bac, language, score, interest, suggestionContext, suggestionIntent, suggestionRefreshKey]);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    const savedInterest = localStorage.getItem('chatInterest');

    if (savedInterest) {
      setInterest(savedInterest);
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as MessageWithPrograms[];
        const normalized = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(normalized);
        setChatStarted(true);
      } catch {
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

  // Fetch roadmap cards dynamically from backend based on BAC type and language
  useEffect(() => {
    const fetchRoadmapCards = async () => {
      setRoadmapCardsLoading(true);
      try {
        const params = new URLSearchParams({
          bacType: bac,
          language: language,
        });
        if (interest) {
          params.append('interest', interest);
        }

        const res = await fetch(`${API_BASE_URL}/chatbot/roadmap-cards?${params.toString()}`);
        if (res.ok) {
          const data: RoadmapCardsResponse = await res.json();
          setRoadmapCards(data.cards);
        } else {
          setRoadmapCards([]);
        }
      } catch {
        setRoadmapCards([]);
      } finally {
        setRoadmapCardsLoading(false);
      }
    };

    fetchRoadmapCards();
  }, [bac, language, interest]);

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
      const res = await fetch(`${API_BASE_URL}/chatbot/ask`, {
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
            interest, // Update component
          },
        }),
      });
      
      const data = await res.json();

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

  useEffect(() => {
    if (interest) {
      localStorage.setItem('chatInterest', interest);
    }
  }, [interest]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatInterest');
    setChatStarted(false);
    setInterest('');
  };

  const hideSuggestionChips = showRoadmaps;


  const sendRoadmapPrompt = async (prompt: string) => {
    if (isLoading) return;

    // Score required to send message, but roadmaps can be viewed without score
    if (!score) {
      setShowRoadmaps(true);
      return;
    }

    setChatStarted(true);
    setShowRoadmaps(true);

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0) return;

    const userMessage: MessageWithPrograms = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSuggestionRefreshKey((prev) => prev + 1);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          studentData: {
            score: numScore,
            bacType: bac,
            language,
            interest,
          },
        }),
      });

      const data = await res.json();

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
        const r = await fetch(`${API_BASE_URL}/chatbot/i18n/${lang}`);
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

              {/* Interest Selector */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label className="font-semibold block mb-3">
                  {isArabic ? 'ما هي اهتماماتك؟ (اختياري)' : 'What are your interests? (optional)'}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {INTEREST_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setInterest(interest === option.id ? '' : option.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        interest === option.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-sm font-medium">
                        {isArabic ? option.arLabel : option.label}
                      </span>
                    </button>
                  ))}
                </div>
                {interest && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                    {isArabic
                      ? `تم اختيار: ${INTEREST_OPTIONS.find((o) => o.id === interest)?.arLabel}`
                      : `Selected: ${INTEREST_OPTIONS.find((o) => o.id === interest)?.label}`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Score: {score} • Bac: {bac}
                {interest && ` • Interest: ${INTEREST_OPTIONS.find((o) => o.id === interest)?.label || interest}`}
                {' • '} {language === 'ar' ? '🇹🇳' : '🇫🇷'}
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRoadmaps((v) => !v)}
                className="whitespace-nowrap"
              >
                🗺️ Roadmaps
              </Button>
              {chatStarted && (
                <Button variant="outline" size="sm" onClick={clearChat}>
                  Clear Chat
                </Button>
              )}
            </div>
          </div>

        {showRoadmaps && (
          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 animate-[fadeIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">🗺️ Roadmaps</p>
              <button
                type="button"
                onClick={() => setShowRoadmaps(false)}
                className="text-xs text-indigo-600 dark:text-indigo-300 hover:underline"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {roadmapCardsLoading ? (
                <div className="col-span-full text-center py-4">
                  <div className="flex gap-2 justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Loading roadmaps...</p>
                </div>
              ) : roadmapCards.length === 0 ? (
                <div className="col-span-full text-center py-4 text-sm text-slate-500">
                  {isArabic ? 'لا توجد مسارات متاحة' : 'No roadmaps available for this profile'}
                </div>
              ) : (
                roadmapCards.map((c) => (
                  <button
                    key={c.domain}
                    type="button"
                    onClick={() => {
                      const prompt = `roadmap ${c.field}`;
                      sendRoadmapPrompt(prompt);
                    }}
                    className="group rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                    style={{
                      borderColor: `${c.color}55`,
                      background: `linear-gradient(135deg, ${c.color}25 0%, rgba(255,255,255,0) 70%)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{c.icon}</span>
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{isArabic ? c.labelAr : c.labelFr}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                      {isArabic ? 'انقر لعرض المسار' : 'Click to see roadmap'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}


        <div className={messageWrapperClasses}>

          {!chatStarted ? (
            <div className="mx-auto max-w-3xl py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t?.empty_intro || '💬 No messages yet. Fill in your details and ask a question to get started!'}
              </p>
              {!hideSuggestionChips && (
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
              )}
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
          {chatStarted && !isLoading && !hideSuggestionChips && (
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
