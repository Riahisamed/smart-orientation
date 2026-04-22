import { NextRequest, NextResponse } from 'next/server';

// Mock dataset of programs
const PROGRAMS = [
  { id: 1, name: 'Informatique', lastYearScore: 120 },
  { id: 2, name: 'Gestion', lastYearScore: 110 },
  { id: 3, name: 'Prépa', lastYearScore: 150 },
  { id: 4, name: 'Médecine', lastYearScore: 180 },
  { id: 5, name: 'Droit', lastYearScore: 100 },
  { id: 6, name: 'Ingénierie', lastYearScore: 160 },
  { id: 7, name: 'Commerce', lastYearScore: 95 },
];

interface AIRequest {
  score: number;
  bac: string;
  language?: 'fr' | 'ar';
}

interface Program {
  id: number;
  name: string;
  lastYearScore: number;
}

interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  accessible?: Program[];
  difficult?: Program[];
}

/**
 * Classifies programs based on student score
 */
function classifyPrograms(score: number): {
  accessible: Program[];
  difficult: Program[];
} {
  const accessible = PROGRAMS.filter((p) => score >= p.lastYearScore);
  const difficult = PROGRAMS.filter((p) => score < p.lastYearScore);

  return { accessible, difficult };
}

/**
 * Builds the prompt for Ollama
 */
function buildPrompt(
  score: number,
  bac: string,
  accessible: Program[],
  difficult: Program[],
  language: 'fr' | 'ar',
): string {
  const programsList = PROGRAMS.map((p) => `• ${p.name} (${p.lastYearScore})`).join('\n');
  const accessibleList = accessible.map((p) => `• ${p.name}`).join('\n');
  const difficultList = difficult.map((p) => `• ${p.name}`).join('\n');

  const languageInstruction =
    language === 'ar'
      ? 'أجب باللغة العربية الفصحى فقط'
      : 'Répondez uniquement en français standard';

  const prompt =
    language === 'ar'
      ? `أنت مستشار توجيه جامعي في تونس.

قيود مهمة جداً:
• ${languageInstruction}
• استخدم فقط البرامج المعطاة
• لا تضيف برامج غير موجودة
• لا تستخدم اللهجة التونسية

بيانات الطالب:
• البكالوريا: ${bac}
• النقطة: ${score}

البرامج المتاحة:
${programsList}

البرامج التي يمكن الوصول إليها (Score >= ${score}):
${accessibleList || 'لا توجد برامج'}

البرامج الصعبة (Score < ${score}):
${difficultList || 'لا توجد برامج'}

شرح مفصل لخيارات الطالب مع التوصيات.`
      : `Tu es un assistant d'orientation universitaire en Tunisie.

Contraintes importantes:
• ${languageInstruction}
• Utilise uniquement les programmes fournis
• N'invente pas de nouveaux programmes
• N'utilise pas le dialecte tunisien

Données de l'étudiant:
• Bac: ${bac}
• Score: ${score}

Programmes disponibles:
${programsList}

Programmes accessibles (Score >= ${score}):
${accessibleList || 'Aucun programme'}

Programmes difficiles (Score < ${score}):
${difficultList || 'Aucun programme'}

Explique clairement les options de l'étudiant avec des recommandations.`;

  return prompt;
}

/**
 * Calls Ollama API to generate response
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
 * POST /api/ai
 * Handles AI suggestions for student orientation
 */
export async function POST(request: NextRequest): Promise<NextResponse<AIResponse>> {
  try {
    // Parse request body
    const body: AIRequest = await request.json();

    const { score, bac, language = 'fr' } = body;

    // Validate input
    if (!score || typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid score. Must be a positive number.',
        },
        { status: 400 },
      );
    }

    if (!bac || typeof bac !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bac type. Must be a non-empty string.',
        },
        { status: 400 },
      );
    }

    if (!['fr', 'ar'].includes(language)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid language. Must be "fr" or "ar".',
        },
        { status: 400 },
      );
    }

    // Classify programs
    const { accessible, difficult } = classifyPrograms(score);

    // Build prompt
    const prompt = buildPrompt(score, bac, accessible, difficult, language);

    // Call Ollama
    const aiResponse = await callOllama(prompt);

    return NextResponse.json(
      {
        success: true,
        response: aiResponse,
        accessible,
        difficult,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate AI response. Make sure Ollama is running.',
      },
      { status: 500 },
    );
  }
}
