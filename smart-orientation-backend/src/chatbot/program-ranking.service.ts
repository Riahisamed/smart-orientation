import { Injectable, Logger } from '@nestjs/common';
import { ConversationMemory } from './memory.service';

/**
 * 🎯 PROGRAM SCORING & RANKING ENGINE
 * 
 * Intelligent university program recommendation system
 * Rank programs based on actual matching criteria, not randomly
 */

export type Program = {
  id: string;
  code: string;
  name: string;
  institution: string;
  domain: string;
  field: string;
  lastScore: number;
  difficulty: 'easy' | 'medium' | 'challenge';
  keywords: string[];
  demand_in_tunisia: 'High' | 'Medium' | 'Low';
};

export type RankedProgram = Program & {
  finalScore: number;
  scoreBreakdown: {
    fieldMatch: number;
    scoreCompatibility: number;
    difficultyPreference: number;
    interestBonus: number;
    demandBonus: number;
  };
  reasons: string[];
  category: 'best' | 'backup' | 'risky';
};

@Injectable()
export class ProgramRankingService {
  private readonly logger = new Logger(ProgramRankingService.name);

  /**
   * 🔢 MAIN SCORING ENGINE
   * Calculate final score for every program
   */
  rankPrograms(
    programs: Program[],
    memory: ConversationMemory,
    studentScore: number
  ): RankedProgram[] {
    this.logger.log(`[RANKING] Starting ranking for ${programs.length} programs, student score: ${studentScore}`);

    // Step 1: Filter out completely unmatched programs first
    const validPrograms = programs.filter(p => this.isFieldMatch(p, memory));

    this.logger.debug(`[RANKING] After field filtering: ${validPrograms.length} programs remaining`);

    // Step 2: Score each valid program
    const scoredPrograms = validPrograms.map(program => 
      this.scoreProgram(program, memory, studentScore)
    );

    // Step 3: Sort by final score descending
    scoredPrograms.sort((a, b) => b.finalScore - a.finalScore);

    // Step 4: Categorize into best / backup / risky
    return this.categorizePrograms(scoredPrograms);
  }

  /**
   * ✅ FIELD MATCH CHECK
   * Reject program completely if not matching user field
   */
  private isFieldMatch(program: Program, memory: ConversationMemory): boolean {
    if (!memory.interest) return true;
    
    const normalizedField = program.field.toLowerCase().trim();
    const normalizedInterest = memory.interest.toLowerCase().trim();
    
    return normalizedField.includes(normalizedInterest) || 
           normalizedInterest.includes(normalizedField) ||
           program.domain.toLowerCase().includes(normalizedInterest);
  }

  /**
   * 🧮 CALCULATE SCORE FOR SINGLE PROGRAM
   */
  private scoreProgram(
    program: Program,
    memory: ConversationMemory,
    studentScore: number
  ): RankedProgram {
    const reasons: string[] = [];
    const scoreBreakdown = {
      fieldMatch: 0,
      scoreCompatibility: 0,
      difficultyPreference: 0,
      interestBonus: 0,
      demandBonus: 0
    };

    // 1. Field Match Score
    scoreBreakdown.fieldMatch = 5;
    reasons.push('✅ مطابقة للمجال المختار');

    // 2. Score Compatibility
    const gap = studentScore - program.lastScore;
    
    if (gap >= 20) {
      scoreBreakdown.scoreCompatibility = 5;
      reasons.push('✅ فرق النقاط ممتاز جداً');
    } else if (gap >= 10) {
      scoreBreakdown.scoreCompatibility = 3;
      reasons.push('✅ فرق النقاط جيد');
    } else if (gap >= 0) {
      scoreBreakdown.scoreCompatibility = 1;
      reasons.push('⚠️ فرق النقاط ضعيف');
    } else {
      scoreBreakdown.scoreCompatibility = -5;
      reasons.push('❌ النقاط تحت الحد الأدنى');
    }

    // 3. Difficulty Preference
    if (memory.difficulty === 'easy') {
      if (program.difficulty === 'easy') {
        scoreBreakdown.difficultyPreference = 4;
        reasons.push('✅ يطابق تفضيل السهولة');
      } else if (program.difficulty === 'medium') {
        scoreBreakdown.difficultyPreference = 2;
        reasons.push('⚖️ مستوى متوسط');
      } else {
        scoreBreakdown.difficultyPreference = -3;
        reasons.push('❌ برنامج صعب جداً');
      }
    } else if (memory.difficulty === 'challenge') {
      if (program.difficulty === 'challenge') {
        scoreBreakdown.difficultyPreference = 4;
        reasons.push('✅ يطابق تفضيل التحدي');
      } else if (program.difficulty === 'medium') {
        scoreBreakdown.difficultyPreference = 2;
        reasons.push('⚖️ مستوى متوسط');
      } else {
        scoreBreakdown.difficultyPreference = -2;
        reasons.push('⚠️ برنامج بسيط جداً');
      }
    }

    // 4. Interest Bonus
    if (memory.preferredTrack) {
      const trackKeywords = memory.preferredTrack.toLowerCase().split(' ');
      const hasMatch = trackKeywords.some(keyword => 
        program.keywords.some(k => k.toLowerCase().includes(keyword))
      );
      
      if (hasMatch) {
        scoreBreakdown.interestBonus = 4;
        reasons.push('✅ مطابقة للتخصص المفضل');
      }
    }

    // 5. Market Demand Bonus
    if (program.demand_in_tunisia === 'High') {
      scoreBreakdown.demandBonus = 2;
      reasons.push('✅ طلب مرتفع في سوق العمل');
    } else if (program.demand_in_tunisia === 'Medium') {
      scoreBreakdown.demandBonus = 1;
      reasons.push('✅ طلب متوسط في سوق العمل');
    }

    // Calculate final score
    const finalScore = Object.values(scoreBreakdown).reduce((sum, val) => sum + val, 0);

    return {
      ...program,
      finalScore,
      scoreBreakdown,
      reasons,
      category: 'best'
    };
  }

  /**
   * 📊 CATEGORIZE PROGRAMS INTO BEST / BACKUP / RISKY
   */
  private categorizePrograms(rankedPrograms: RankedProgram[]): RankedProgram[] {
    if (rankedPrograms.length === 0) return [];

    // Best Option: Highest reliable score
    if (rankedPrograms[0]) {
      rankedPrograms[0].category = 'best';
    }

    // Backup Option: Safest alternative (highest positive gap)
    const backupCandidate = rankedPrograms
      .slice(1)
      .find(p => (p.scoreBreakdown.scoreCompatibility >= 3));
    
    if (backupCandidate) {
      backupCandidate.category = 'backup';
    }

    // Risky Option: Highest potential but difficult
    const riskyCandidate = rankedPrograms
      .find(p => p.difficulty === 'challenge' && p.finalScore >= 5);
    
    if (riskyCandidate && riskyCandidate.category === 'best') {
      const nextRisky = rankedPrograms.find(p => 
        p.difficulty === 'challenge' && 
        p.finalScore >= 3 && 
        p !== riskyCandidate
      );
      if (nextRisky) nextRisky.category = 'risky';
    } else if (riskyCandidate) {
      riskyCandidate.category = 'risky';
    }

    // Return TOP 3 only
    const topPrograms = rankedPrograms.slice(0, 3);

    // Ensure we have all 3 categories if possible
    const categories = new Set(topPrograms.map(p => p.category));
    
    if (!categories.has('backup') && topPrograms.length > 1) {
      topPrograms[1].category = 'backup';
    }
    if (!categories.has('risky') && topPrograms.length > 2) {
      topPrograms[2].category = 'risky';
    }

    this.logger.log(`[RANKING] Generated ${topPrograms.length} ranked programs`);

    return topPrograms;
  }

  /**
   * 💾 GET RANKING SUMMARY FOR AI RESPONSE
   */
  getRankingSummary(rankedPrograms: RankedProgram[]): string {
    return rankedPrograms.map(p => 
      `[${p.finalScore}] ${p.name} - ${p.institution}`
    ).join('\n');
  }

  /**
   * 📝 GET DETAILED EXPLANATION
   */
  getProgramExplanation(program: RankedProgram): string {
    return `
📋 ${program.name}
🏫 ${program.institution}
⭐ النتيجة النهائية: ${program.finalScore}/20

✅ الأسباب:
${program.reasons.map(r => `  ${r}`).join('\n')}
    `.trim();
  }
}