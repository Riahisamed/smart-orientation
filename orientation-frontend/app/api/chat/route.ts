import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChatRequest {
  message: string;
  score: number;
  bac: string;
  language: 'ar' | 'fr';
}

interface Program {
  code: string;
  program: string;
  institution: string;
  lastScore: number | null;
  bacType: string;
}

interface ClassifiedPrograms {
  safe: Program[];
  possible: Program[];
  hard: Program[];
}

interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  programs?: {
    safe: Program[];
    possible: Program[];
    hard: Program[];
  };
}

/**
 * Loads programs from guide.json
 */
function loadProgramsFromJSON(): Array<any> {
  try {
    const filePath = path.join(process.cwd(), '../smart-orientation-backend/data/guide.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load guide.json:', error);
    return [];
  }
}

/**
 * Normalizes bac type string
 */
function normalizeBacType(bac: string): string {
  const normalized = bac.toUpperCase().trim();
  const mapping: Record<string, string[]> = {
    'MATH': ['MATH', 'MATHS', 'MATHEMATIQUE', 'MATHEMATIQUES', 'ﺭﻳﺎﺿﻴﺎﺕ', 'رياضيات'],
    'SVT': ['SVT', 'SCIENCE', 'SCIENCES', 'ﻋﻠﻮﻡ ﺗﺠﺮﻳﺒﻴﺔ', 'علوم تجريبية'],
    'ECO': ['ECO', 'ECONOMIE', 'ECONOMIEGESTION', 'ﺇﻗﺘﺼﺎﺩ ﻭﺗﺼﺮﻑ', 'اقتصاد وتصرف'],
    'TECH': ['TECH', 'TECHNIQUE', 'ﺍﻟﻌﻠﻮﻡ ﺍﻟﺘﻘﻨﻴﺔ', 'علوم تقنية'],
    'INFO': ['INFO', 'INFORMATIQUE', 'ﻋﻠﻮﻡ ﺍﻹﻋﻼﻣﻴﺔ', 'علوم الإعلامية'],
    'LETTRES': ['LETTRES', 'LITTERAIRE', 'ﺍﻵﺩﺍﺏ', 'آداب', 'ﺁﺩﺍﺑ'],
    'SPORT': ['SPORT', 'ﺍﻟﺮﻳﺎﺿﺔ', 'رياضة'],
  };

  for (const [key, aliases] of Object.entries(mapping)) {
    if (aliases.some(alias => normalized.includes(alias.toUpperCase()))) {
      return key;
    }
  }

  return normalized;
}

/**
 * Extracts programs for a specific bac type
 */
function extractProgramsForBac(allPrograms: any[], bacType: string): Program[] {
  const normalizedBac = normalizeBacType(bacType);
  const programs: Program[] = [];

  for (const filiere of allPrograms) {
    const bacTypeData = filiere.bacTypes?.find((bt: any) => {
      return normalizeBacType(bt.type) === normalizedBac;
    });

    if (bacTypeData) {
      programs.push({
        code: filiere.code,
        program: filiere.program,
        institution: filiere.institution,
        lastScore: bacTypeData.lastScore || 0,
        bacType: bacTypeData.type,
      });
    }
  }

  return programs;
}

/**
 * Classifies programs based on score difference
 */
function classifyPrograms(programs: Program[], score: number): ClassifiedPrograms {
  const classified: ClassifiedPrograms = {
    safe: [],
    possible: [],
    hard: [],
  };

  for (const program of programs) {
    if (!program.lastScore) {
      classified.safe.push(program);
      continue;
    }

    const diff = score - program.lastScore;

    if (diff >= 10) {
      classified.safe.push(program);
    } else if (diff >= 0) {
      classified.possible.push(program);
    } else {
      classified.hard.push(program);
    }
  }

  // Sort each category by best match
  classified.safe.sort((a, b) => (b.lastScore || 0) - (a.lastScore || 0));
  classified.possible.sort((a, b) => (b.lastScore || 0) - (a.lastScore || 0));
  classified.hard.sort((a, b) => (b.lastScore || 0) - (a.lastScore || 0));

  return classified;
}

/**
 * Builds the prompt for Ollama
 */
function buildPrompt(
  message: string,
  score: number,
  bac: string,
  classified: ClassifiedPrograms,
  language: 'ar' | 'fr',
): string {
  const formatPrograms = (programs: Program[]): string => {
    if (programs.length === 0) return language === 'ar' ? 'لا توجد برامج' : 'Aucun programme';
    return programs.map((p) => `• ${p.program} (${p.lastScore || 'N/A'})`).join('\n');
  };

  if (language === 'ar') {
    return `أنت مستشار توجيه جامعي في تونس.

قيود صارمة جداً:
• أجب باللغة العربية الفصحى فقط
• استخدم فقط البرامج المعطاة
• لا تضيف برامج غير موجودة
• لا تستخدم اللهجة التونسية
• كن واضحاً ومفيداً

بيانات الطالب:
• البكالوريا: ${bac}
• النقطة: ${score}

سؤال الطالب:
${message}

البرامج الآمنة (الفرق >= 10):
${formatPrograms(classified.safe)}

البرامج الممكنة (0 <= الفرق < 10):
${formatPrograms(classified.possible)}

البرامج الصعبة (الفرق < 0):
${formatPrograms(classified.hard)}

قدم إجابة واضحة مع توصيات مفيدة.`;
  }

  return `Tu es un assistant d'orientation universitaire en Tunisie.

Règles strictes:
• Réponds UNIQUEMENT en français standard
• Utilise SEULEMENT les programmes fournis
• N'invente pas de nouveaux programmes
• N'utilise pas le dialecte tunisien
• Sois clair et utile

Données de l'étudiant:
• Bac: ${bac}
• Score: ${score}

Question de l'étudiant:
${message}

Programmes sûrs (Différence >= 10):
${formatPrograms(classified.safe)}

Programmes possibles (0 <= Différence < 10):
${formatPrograms(classified.possible)}

Programmes difficiles (Différence < 0):
${formatPrograms(classified.hard)}

Fournis une réponse claire avec des recommandations utiles.`;
}

/**
 * Calls Ollama API
 */
async function callOllama(prompt: string): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Ollama API call failed:', error);
    throw error;
  }
}

/**
 * POST /api/chat
 * Handles chat messages for AI orientation
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();
    const { message, score, bac, language } = body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message cannot be empty',
        },
        { status: 400 },
      );
    }

    if (!score || typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid score',
        },
        { status: 400 },
      );
    }

    if (!bac || typeof bac !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bac type',
        },
        { status: 400 },
      );
    }

    if (!['fr', 'ar'].includes(language)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid language',
        },
        { status: 400 },
      );
    }

    // Load programs from guide.json
    const allPrograms = loadProgramsFromJSON();
    if (allPrograms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load programs data',
        },
        { status: 500 },
      );
    }

    // Extract programs for bac type
    const programs = extractProgramsForBac(allPrograms, bac);
    if (programs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No programs found for bac type: ${bac}`,
        },
        { status: 404 },
      );
    }

    // Classify programs
    const classified = classifyPrograms(programs, score);

    // Build prompt
    const prompt = buildPrompt(message, score, bac, classified, language);

    // Call Ollama
    const aiResponse = await callOllama(prompt);

    return NextResponse.json(
      {
        success: true,
        response: aiResponse,
        programs: {
          safe: classified.safe,
          possible: classified.possible,
          hard: classified.hard,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process chat message. Make sure Ollama is running.',
      },
      { status: 500 },
    );
  }
}
