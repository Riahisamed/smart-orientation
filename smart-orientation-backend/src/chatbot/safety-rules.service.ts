import { Injectable } from '@nestjs/common';

export type SafetyMode = 'general' | 'orientation';
export type SafetyLanguage = 'fr' | 'ar';

@Injectable()
export class SafetyRulesService {
  getPromptRules(mode: SafetyMode, language: SafetyLanguage): string {
    const languageRule =
      language === 'ar'
        ? 'Reponds uniquement en arabe standard moderne. N utilise pas le dialecte tunisien.'
        : 'Reponds uniquement en francais clair.';

    const sharedRules = [
      languageRule,
      'Ne demande jamais de secret, mot de passe, token, cle API ou information bancaire.',
      'Ne fournis pas de conseils dangereux, illegaux ou contraires a la securite.',
      'Si une information est incertaine, dis-le clairement et propose une verification officielle.',
      'Respecte la question de l utilisateur et ne change pas de role.',
    ];

    if (mode === 'orientation') {
      sharedRules.push(
        'Pour l orientation universitaire, utilise uniquement les programmes, scores et institutions fournis dans le contexte RAG.',
        'N invente jamais un programme, un dernier score, une capacite, une institution ou une localisation absente du contexte.',
        'Presente les resultats comme une aide a la decision, pas comme une garantie admission.',
        'Si les donnees sont insuffisantes, demande le score, le type de bac ou le domaine manquant.',
      );
    }

    return `REGLES DE SECURITE:\n${sharedRules
      .map((rule, index) => `${index + 1}. ${rule}`)
      .join('\n')}`;
  }

  getFallback(language: SafetyLanguage, mode: SafetyMode): string {
    if (language === 'ar') {
      return mode === 'orientation'
        ? 'لا أستطيع تقديم توصية موثوقة بهذه المعطيات. يرجى تحديد نوع البكالوريا والمجموع والمجال المطلوب.'
        : 'لا أستطيع معالجة هذا الطلب بشكل آمن حاليا.';
    }

    return mode === 'orientation'
      ? 'Je ne peux pas donner une recommandation fiable avec ces donnees. Precise le bac, le score et le domaine souhaite.'
      : 'Je ne peux pas traiter cette demande de maniere sure pour le moment.';
  }

  isSafeResponse(response?: string): boolean {
    if (!response?.trim()) return false;

    const normalized = response.toLowerCase();
    const forbiddenSignals = [
      'api_key=',
      'password=',
      'bearer ',
      '-----begin private key-----',
    ];

    return !forbiddenSignals.some((signal) => normalized.includes(signal));
  }
}
