/**
 * Chatbot Utility Functions
 * Provides helper functions for program classification, scoring, and analysis
 */

import { Program, ProgramClassification } from '@/lib/types/ai';

/**
 * Program difficulty score calculation
 * Used to determine which programs are best matches for a student
 */
export function calculateProgramScore(
  studentScore: number,
  programLastScore: number | null,
): number {
  if (!programLastScore) return studentScore; // Unknown = full score
  return studentScore - programLastScore;
}

/**
 * Classify program difficulty relative to student score
 * SAFE: score difference >= 20 (very likely to get in)
 * POSSIBLE: 0 <= difference < 20 (maybe can get in)
 * HARD: difference < 0 (difficult to get in)
 */
export function getProgramDifficulty(
  studentScore: number,
  programLastScore: number | null,
): 'SAFE' | 'POSSIBLE' | 'HARD' | 'UNKNOWN' {
  if (!programLastScore) return 'UNKNOWN';

  const diff = studentScore - programLastScore;
  if (diff >= 20) return 'SAFE';
  if (diff >= 0) return 'POSSIBLE';
  return 'HARD';
}

/**
 * Sort programs by relevance to student
 * Priority: SAFE → POSSIBLE → HARD
 * Within each category: highest score first
 */
export function sortProgramsByRelevance(programs: Program[]): Program[] {
  return programs.sort((a, b) => {
    const scoreA = a.lastScore || 0;
    const scoreB = b.lastScore || 0;
    return scoreB - scoreA;
  });
}

/**
 * Get top N programs for quick recommendations
 */
export function getTopPrograms(programs: Program[], limit: number = 5): Program[] {
  return sortProgramsByRelevance(programs).slice(0, limit);
}

/**
 * Calculate admission probability (0-100%)
 * Based on score difference from last year's cutoff
 */
export function calculateAdmissionProbability(
  studentScore: number,
  programLastScore: number | null,
): number {
  if (!programLastScore) return 50; // Unknown

  const diff = studentScore - programLastScore;
  if (diff >= 20) return 95;
  if (diff >= 10) return 80;
  if (diff >= 0) return 60;
  if (diff >= -10) return 30;
  return 10;
}

/**
 * Generate quick recommendation message
 */
export function generateQuickRecommendation(
  classified: ProgramClassification,
  language: 'ar' | 'fr',
): string {
  if (language === 'ar') {
    const safeCount = classified.safe.length;
    const possibleCount = classified.possible.length;
    const hardCount = classified.hard.length;

    if (safeCount > 0) {
      return `لديك ${safeCount} برامج آمنة، و${possibleCount} برامج ممكنة، و${hardCount} برامج صعبة. أنصحك بالبدء بالبرامج الآمنة.`;
    } else if (possibleCount > 0) {
      return `لديك ${possibleCount} برامج ممكنة. قد تحتاج إلى بذل جهد إضافي للقبول.`;
    } else {
      return `جميع البرامج تحتاج إلى درجات أعلى. لكن لا تستسلم! يمكنك المحاولة.`;
    }
  }

  const safeCount = classified.safe.length;
  const possibleCount = classified.possible.length;
  const hardCount = classified.hard.length;

  if (safeCount > 0) {
    return `Vous avez ${safeCount} programme(s) sûr(s), ${possibleCount} possible(s), et ${hardCount} difficile(s). Je recommande de commencer par les programmes sûrs.`;
  } else if (possibleCount > 0) {
    return `Vous avez ${possibleCount} programme(s) possible(s). Vous devrez faire un effort supplémentaire pour être accepté.`;
  } else {
    return `Tous les programmes nécessitent des scores plus élevés. Mais ne vous découragez pas! Vous pouvez toujours essayer.`;
  }
}

/**
 * Format program list for display
 */
export function formatProgramsList(programs: Program[], language: 'ar' | 'fr'): string {
  if (programs.length === 0) {
    return language === 'ar' ? 'لا توجد برامج' : 'Aucun programme';
  }

  return programs
    .map((p, idx) => {
      const score = p.lastScore ? `(${p.lastScore})` : `(${language === 'ar' ? 'غير متاح' : 'N/A'})`;
      return `${idx + 1}. ${p.program} ${score}`;
    })
    .join('\n');
}

/**
 * Get emoji for program difficulty
 */
export function getDifficultyEmoji(difficulty: 'SAFE' | 'POSSIBLE' | 'HARD' | 'UNKNOWN'): string {
  switch (difficulty) {
    case 'SAFE':
      return '🟢';
    case 'POSSIBLE':
      return '🟡';
    case 'HARD':
      return '🔴';
    case 'UNKNOWN':
      return '⚪';
    default:
      return '❓';
  }
}

/**
 * Analyze classification and return insights
 */
export function analyzeClassification(
  classified: ProgramClassification,
  score: number,
  language: 'ar' | 'fr',
): {
  totalPrograms: number;
  safeCount: number;
  possibleCount: number;
  hardCount: number;
  recommendation: string;
  nextSteps: string[];
} {
  const totalPrograms = classified.safe.length + classified.possible.length + classified.hard.length;
  const safeCount = classified.safe.length;
  const possibleCount = classified.possible.length;
  const hardCount = classified.hard.length;

  let recommendation = '';
  const nextSteps: string[] = [];

  if (language === 'ar') {
    if (safeCount > 3) {
      recommendation = 'أنت في وضع ممتاز! لديك خيارات آمنة كثيرة.';
      nextSteps.push('اختر من البرامج الآمنة بناءً على اهتماماتك');
      nextSteps.push('قد تحاول أيضاً البرامج الممكنة');
    } else if (safeCount > 0) {
      recommendation = 'أنت في وضع جيد. لديك بعض الخيارات الآمنة.';
      nextSteps.push('ركز على البرامج الآمنة');
      nextSteps.push('ادرس البرامج الممكنة كخطة بديلة');
    } else if (possibleCount > 0) {
      recommendation = 'الوضع معقول. يجب أن تعمل بجد.';
      nextSteps.push('احسن درجاتك إن أمكن');
      nextSteps.push('ركز على البرامج الممكنة');
    } else {
      recommendation = 'الوضع صعب، لكن لا تستسلم!';
      nextSteps.push('حاول تحسين درجاتك');
      nextSteps.push('انظر إلى جميع الخيارات');
    }
  } else {
    if (safeCount > 3) {
      recommendation = 'Vous êtes en excellente position! Vous avez beaucoup d\'options sûres.';
      nextSteps.push('Choisissez parmi les programmes sûrs selon vos intérêts');
      nextSteps.push('Vous pouvez aussi essayer les programmes possibles');
    } else if (safeCount > 0) {
      recommendation = 'Vous êtes en bonne position. Vous avez quelques options sûres.';
      nextSteps.push('Concentrez-vous sur les programmes sûrs');
      nextSteps.push('Considérez les programmes possibles comme alternative');
    } else if (possibleCount > 0) {
      recommendation = 'La situation est correcte. Vous devrez travailler dur.';
      nextSteps.push('Améliorez vos notes si possible');
      nextSteps.push('Concentrez-vous sur les programmes possibles');
    } else {
      recommendation = 'La situation est difficile, mais ne renoncez pas!';
      nextSteps.push('Essayez d\'améliorer vos notes');
      nextSteps.push('Considérez toutes les options');
    }
  }

  return {
    totalPrograms,
    safeCount,
    possibleCount,
    hardCount,
    recommendation,
    nextSteps,
  };
}

/**
 * Generate statistics summary
 */
export function generateStatsSummary(
  classified: ProgramClassification,
  score: number,
  language: 'ar' | 'fr',
): string {
  const total = classified.safe.length + classified.possible.length + classified.hard.length;
  const safePercent = total > 0 ? ((classified.safe.length / total) * 100).toFixed(0) : '0';
  const possiblePercent = total > 0 ? ((classified.possible.length / total) * 100).toFixed(0) : '0';
  const hardPercent = total > 0 ? ((classified.hard.length / total) * 100).toFixed(0) : '0';

  if (language === 'ar') {
    return `📊 الإحصائيات:
✅ آمن: ${classified.safe.length} برنامج (${safePercent}%)
⚠️ ممكن: ${classified.possible.length} برنامج (${possiblePercent}%)
❌ صعب: ${classified.hard.length} برنامج (${hardPercent}%)`;
  }

  return `📊 Statistiques:
✅ Sûr: ${classified.safe.length} programme(s) (${safePercent}%)
⚠️ Possible: ${classified.possible.length} programme(s) (${possiblePercent}%)
❌ Difficile: ${classified.hard.length} programme(s) (${hardPercent}%)`;
}
