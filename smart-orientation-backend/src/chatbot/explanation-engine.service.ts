import { Injectable, Logger } from '@nestjs/common';
import { ConversationMemory } from './memory.service';
import { RankedProgram } from './program-ranking.service';

/**
 * 🔍 EXPLANATION ENGINE
 * 
 * Generates human-readable, trust-oriented explanations for recommendations
 * Makes AI transparent and understandable
 */

@Injectable()
export class ExplanationEngineService {
  private readonly logger = new Logger(ExplanationEngineService.name);

  /**
   * 📝 GENERATE HUMAN EXPLANATION FOR PROGRAM
   */
  generateProgramExplanation(
    program: RankedProgram,
    memory: ConversationMemory,
    studentScore: number,
    language: 'fr' | 'ar' = 'ar'
  ): string {
    const lines: string[] = [];
    const gap = studentScore - program.lastScore;

    if (language === 'ar') {
      lines.push(`✅ **${program.name}**`);
      lines.push(`🏫 ${program.institution}`);
      lines.push(`⭐ النتيجة: ${program.finalScore}/20`);
      lines.push('');

      // Gap explanation
      if (gap >= 20) {
        lines.push('✅ سهل جداً للقبول مع النقاط متاعك');
      } else if (gap >= 10) {
        lines.push('✅ فرصة قبول جيدة');
      } else if (gap >= 5) {
        lines.push('⚠️ ممكن ولكن فيه منافسة');
      } else if (gap >= 0) {
        lines.push('⚠️ الحد الأدنى قريب من نقاطك');
      } else {
        lines.push('❌ نقاطك تحت الحد الأدنى');
      }

      // Difficulty explanation
      if (memory.difficulty === 'easy' && program.difficulty === 'easy') {
        lines.push('✅ يتناسب مع تفضيلك للسهولة');
      } else if (memory.difficulty === 'easy' && program.difficulty === 'challenge') {
        lines.push('⚠️ هذا البرنامج صعب ولا يتناسب مع تفضيلك');
      } else if (memory.difficulty === 'challenge' && program.difficulty === 'challenge') {
        lines.push('✅ يتناسب مع تفضيلك للتحدي');
      }

      // Demand explanation
      if (program.demand_in_tunisia === 'High') {
        lines.push('✅ طلب مرتفع جداً في سوق العمل تونس');
      } else if (program.demand_in_tunisia === 'Medium') {
        lines.push('✅ طلب متوسط في سوق العمل');
      }

      // Category explanation
      if (program.category === 'best') {
        lines.push('🎯 هذا هو الخيار الأنسب لك حالياً');
      } else if (program.category === 'backup') {
        lines.push('🛡️ خيار احتياطي آمن');
      } else if (program.category === 'risky') {
        lines.push('⚡ خيار قوي ولكن فيه نسبة مخاطرة');
      }
    } else {
      lines.push(`✅ **${program.name}**`);
      lines.push(`🏫 ${program.institution}`);
      lines.push(`⭐ Score: ${program.finalScore}/20`);
      lines.push('');

      // Gap explanation
      if (gap >= 20) {
        lines.push('✅ Très accessible avec ton score');
      } else if (gap >= 10) {
        lines.push('✅ Bonne chance d\'admission');
      } else if (gap >= 5) {
        lines.push('⚠️ Possible mais compétitif');
      } else if (gap >= 0) {
        lines.push('⚠️ Score minimum très proche');
      } else {
        lines.push('❌ Ton score est en dessous du minimum');
      }

      // Difficulty explanation
      if (memory.difficulty === 'easy' && program.difficulty === 'easy') {
        lines.push('✅ Correspond à ta préférence simplicité');
      } else if (memory.difficulty === 'easy' && program.difficulty === 'challenge') {
        lines.push('⚠️ Programme difficile, ne correspond pas');
      } else if (memory.difficulty === 'challenge' && program.difficulty === 'challenge') {
        lines.push('✅ Correspond à ta préférence challenge');
      }

      // Demand explanation
      if (program.demand_in_tunisia === 'High') {
        lines.push('✅ Très demandé sur le marché tunisien');
      } else if (program.demand_in_tunisia === 'Medium') {
        lines.push('✅ Demande moyenne');
      }

      // Category explanation
      if (program.category === 'best') {
        lines.push('🎯 Meilleure option pour toi actuellement');
      } else if (program.category === 'backup') {
        lines.push('🛡️ Option de sécurité fiable');
      } else if (program.category === 'risky') {
        lines.push('⚡ Option intéressante mais avec risque');
      }
    }

    return lines.join('\n');
  }

  /**
   * 🆚 GENERATE COMPARISON EXPLANATION
   */
  generateComparison(
    program1: RankedProgram,
    program2: RankedProgram,
    language: 'fr' | 'ar' = 'ar'
  ): string {
    if (language === 'ar') {
      return `
🔹 **${program1.name}**:
✅ أسهل للدخول
✅ طلب مرتفع
⚠️ مستوى أكاديمي متوسط

🔹 **${program2.name}**:
✅ أقوى أكاديمياً
✅ فرص عمل أفضل
⚠️ أصعب للقبول
      `.trim();
    } else {
      return `
🔹 **${program1.name}**:
✅ Plus facile à intégrer
✅ Bonne demande
⚠️ Niveau académique moyen

🔹 **${program2.name}**:
✅ Plus fort académiquement
✅ Meilleures opportunités
⚠️ Plus difficile à intégrer
      `.trim();
    }
  }

  /**
   * 💼 JOB EXPLANATION
   */
  generateJobExplanation(job: any, language: 'fr' | 'ar' = 'ar'): string {
    if (language === 'ar') {
      return `
💼 **${job.title}**

📝 الوصف: ${job.description}
📈 الطلب: ${job.demand}
📊 نسبة البطالة: ${job.unemployment_rate}%
${job.demand === 'High' ? '✅ هذا المجال مطلوب برشا في تونس حالياً' : ''}
      `.trim();
    } else {
      return `
💼 **${job.title}**

📝 Description: ${job.description}
📈 Demande: ${job.demand}
📊 Taux chômage: ${job.unemployment_rate}%
${job.demand === 'High' ? '✅ Ce domaine est très demandé en Tunisie actuellement' : ''}
      `.trim();
    }
  }

  /**
   * 💬 NATURAL RESPONSE FORMAT
   * Convert structured reasons into human-like explanation
   */
  toNaturalResponse(
    programs: RankedProgram[],
    language: 'fr' | 'ar' = 'ar'
  ): string {
    const lines: string[] = [];

    if (language === 'ar') {
      lines.push('الخيارات الأنسب لك حالياً:');
      lines.push('');

      programs.forEach(p => {
        const icon = p.category === 'best' ? '🎯' : p.category === 'backup' ? '🛡️' : '⚡';
        lines.push(`${icon} **${p.name}**`);
        lines.push(`   🏫 ${p.institution}`);
        lines.push(`   ⭐ ${p.finalScore}/20`);
        if (p.category === 'best') {
          lines.push('   ✅ هذا هو الخيار الأفضل');
        }
        lines.push('');
      });

      lines.push('الخيار ده مناسب ليك خاطر:');
      lines.push('✔ النقاط متاعك أعلى من آخر معدل قبول');
      lines.push('✔ المجال مطلوب في سوق العمل');
      lines.push('✔ يتناسب مع التفضيلات متاعك');
    } else {
      lines.push('Les meilleures options pour toi actuellement:');
      lines.push('');

      programs.forEach(p => {
        const icon = p.category === 'best' ? '🎯' : p.category === 'backup' ? '🛡️' : '⚡';
        lines.push(`${icon} **${p.name}**`);
        lines.push(`   🏫 ${p.institution}`);
        lines.push(`   ⭐ ${p.finalScore}/20`);
        if (p.category === 'best') {
          lines.push('   ✅ Meilleure option globale');
        }
        lines.push('');
      });

      lines.push('Ces options sont recommandées car:');
      lines.push('✔ Ton score est supérieur au dernier seuil');
      lines.push('✔ Bonne demande sur le marché');
      lines.push('✔ Correspond à tes préférences');
    }

    return lines.join('\n');
  }

  /**
   * ⚠️ RISK EXPLANATION
   */
  explainRisk(program: RankedProgram, studentScore: number, language: 'fr' | 'ar' = 'ar'): string {
    const gap = studentScore - program.lastScore;

    if (language === 'ar') {
      return `
⚠️ **تنبيه**: هذا خيار فيه مخاطرة
الفرق بين نقاطك وآخر معدل قبول هو فقط ${gap} نقاط
المنافسة عالية في هذا البرنامج
لكن إذا نجحت فيه، تكون فرص العمل ممتازة جداً
      `.trim();
    } else {
      return `
⚠️ **Attention**: Option à risque
Écart entre ton score et dernier seuil: seulement ${gap} points
Compétition élevée dans ce programme
Mais si tu réussis, très bonnes opportunités professionnelles
      `.trim();
    }
  }
}