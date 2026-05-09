import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OllamaConfigService } from '../common/services/ollama-config.service';
import { SafetyRulesService } from './safety-rules.service';

export type AiLanguage = 'fr' | 'ar';

export type AiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AiGenerateInput = {
  message: string;
  language?: AiLanguage;
  systemInstruction?: string;
  context?: string;
  history?: AiMessage[];
  fallback?: string;
  questionType?: QuestionType;
  followUpQuestion?: string;
};

export interface ConversationState {
  domain?: string;
  subInterest?: string;
  rejectedTopics?: string[];
  preferredDifficulty?: 'easy' | 'medium' | 'challenge';
  discussedPrograms?: string[];
  discussedJobs?: string[];
  askedQuestions?: string[];
  lastQuestionType?: QuestionType;
  conversationDepth?: number;
  userStyle?: 'practical' | 'theoretical' | 'fast';
}

export type AiMemory = ConversationState & {
  interest?: string;
  difficulty?: 'easy' | 'challenge';
  preferredDomain?: string;
  refinedDomain?: string;
  journeyStep?: 'identify_interest' | 'refine_domain' | 'suggest_options' | 'give_decision';
  rejectedDomains?: string[];
  lastQuestionsAsked?: string[];
};

type AiStudentContext = {
  bacType?: string;
  score?: number;
  interest?: string;
  memory?: AiMemory;
};

export type RagContextData = {
  bacType?: string;
  score?: number;
  interest?: string;
  memory?: AiMemory;
  field?: {
    name?: string;
    demand?: string;
    unemploymentRisk?: string;
    outlook?: string;
    skills?: {
      technical?: string[];
      soft?: string[];
    };
  };
  programs?: Array<{
    name: string;
    institution: string;
    lastScore?: number;
  }>;
  jobs?: Array<{
    title: string;
    description?: string;
    skills: string[];
    unemploymentRate?: number;
    demand?: string;
  }>;
};

type DecisionLevel = 'Safe' | 'Medium' | 'Difficult';
type RagProgramContext = NonNullable<RagContextData['programs']>[number];
type ProgramDecision = {
  program: RagProgramContext;
  level: DecisionLevel;
  gap?: number;
};

export type QuestionType =
  | 'jobs'
  | 'programs'
  | 'advice'
  | 'comparison'
  | 'roadmap'
  | 'general';

export type AiGenerateResult = {
  text: string;
  usedFallback: boolean;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model = 'gemma';

  constructor(
    private readonly ollamaConfig: OllamaConfigService,
    private readonly safetyRules: SafetyRulesService,
  ) {}

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const prompt = this.buildPrompt(input);
    return this.callOllama(prompt, input);
  }

  async generateWithContext(
    message: string,
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage = 'fr',
    history?: AiMessage[],
    fallback?: string,
  ): Promise<AiGenerateResult> {
    this.logger.log('AI INPUT:', JSON.stringify({
      bacType: studentData.bacType,
      score: studentData.score,
      interest: studentData.interest,
      memory: studentData.memory,
      message,
    }));

    const questionType = this.detectQuestionType(message);
    const followUp = this.getFollowUpQuestion(studentData.memory, language, questionType, message);
    const deterministic = this.buildDeterministicResponse(
      questionType,
      ragData,
      studentData,
      language,
      followUp,
    );

    if (deterministic) {
      return { text: deterministic, usedFallback: false };
    }

    const input: AiGenerateInput = {
      message,
      language,
      systemInstruction: this.buildStrictSystemInstruction(language, studentData, questionType),
      context: this.buildRagContext(ragData, language, questionType),
      history,
      fallback,
      questionType,
      followUpQuestion: followUp,
    };

    return this.generate(input);
  }

  private buildDeterministicResponse(
    questionType: QuestionType,
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage,
    followUp: string,
  ): string | undefined {
    switch (questionType) {
      case 'jobs':
        return this.buildJobsResponse(ragData, language, followUp);
      case 'programs':
        return this.buildProgramsResponse(ragData, studentData, language, followUp);
      case 'advice':
        return this.buildAdviceResponse(ragData, studentData, language, followUp);
      case 'comparison':
        return this.buildComparisonResponse(ragData, studentData, language, followUp);
      case 'roadmap':
        return this.buildRoadmapResponse(ragData, studentData, language, followUp);
      case 'general':
        return this.buildGeneralContextResponse(ragData, studentData, language, followUp);
      default:
        return undefined;
    }
  }

  private buildJobsResponse(
    ragData: RagContextData,
    language: AiLanguage,
    followUp: string,
  ): string {
    const jobs = (ragData.jobs || []).filter((job) => job.title).slice(0, 3);
    if (!jobs.length) {
      return this.withFollowUp(
        [language === 'ar' ? 'Ma andich jobs mouath9in lel domaine hedha.' : 'Pas de jobs verifies dans le contexte.'],
        followUp,
      );
    }

    const lines = jobs.map((job) => {
      const description = this.shortText(job.description || job.skills?.slice(0, 2).join(', ') || 'role lie au domaine', 9);
      const demand = this.formatDemand(job.demand);
      const unemployment = this.formatUnemployment(job.unemploymentRate, language);
      return `${job.title} -> ${description} | Demande: ${demand} | ${unemployment}`;
    });

    return this.withFollowUp(lines, followUp);
  }

  private buildProgramsResponse(
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage,
    followUp: string,
  ): string {
    const score = studentData.score ?? ragData.score;
    const programs = (ragData.programs || []).filter((program) => program.name).slice(0, 3);
    if (!programs.length) {
      return this.withFollowUp(
        [language === 'ar' ? 'Ma andich programs mouath9in lel score hedha.' : 'Pas de programmes verifies dans le contexte.'],
        followUp,
      );
    }

    const lines = programs.map((program) => {
      const level = this.classifyProgram(score, program.lastScore);
      const scoreText = typeof program.lastScore === 'number' ? program.lastScore : 'N/A';
      return `${program.name} @ ${program.institution} | Score: ${scoreText} | Risk: ${level}`;
    });

    return this.withFollowUp(lines, followUp);
  }

  private buildAdviceResponse(
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage,
    followUp: string,
  ): string {
    const decisions = this.rankPrograms(ragData, studentData).slice(0, 5);
    if (!decisions.length) {
      return this.withFollowUp(
        [language === 'ar' ? 'Ma najemch na9arrer bla programs mouath9in.' : 'Je ne peux pas décider sans programmes vérifiés.'],
        followUp,
      );
    }

    const best =
      decisions.find((item) => item.level === 'Safe') ||
      decisions.find((item) => item.level === 'Medium') ||
      decisions[0];
    const backup =
      decisions.find((item) => item !== best && item.level === 'Safe') ||
      decisions.find((item) => item !== best && item.level === 'Medium');
    const risky =
      decisions.find((item) => item.level === 'Difficult') ||
      decisions.find((item) => item !== best && item !== backup);

    const score = studentData.score ?? ragData.score;
    const gap = best?.gap;

    // 🧠 SMART SCORE ANALYSIS ENGINE
    let scoreComment = '';
    if (gap !== undefined) {
      if (gap >= 15) {
        scoreComment = language === 'ar' 
          ? `${best.program.name} في ISI Ariana تبدو مناسبة ليك خاطر آخر score قريب ليك برشة. فرصتك باهية جديا ✅`
          : `${this.formatProgramName(best)} est parfait pour ton score, chances excellentes ✅`;
      } else if (gap >= 5) {
        scoreComment = language === 'ar'
          ? `${best.program.name} منطقي جدا، السكور متاعك قريب جدا من آخر سنة. فرصتك كويسة ✅`
          : `${this.formatProgramName(best)} est très logique, ton score est proche ✅`;
      } else if (gap >= -3) {
        scoreComment = language === 'ar'
          ? `${best.program.name} ممكن، يلزم تكون عندك plan B شوية. السكور تقريب 🟡`
          : `${this.formatProgramName(best)} est possible mais garde un plan B 🟡`;
      } else {
        scoreComment = language === 'ar'
          ? `${best.program.name} صعب شوية، لكن تقدر تطمح فيه إن كنت تحب التحدي 🚀`
          : `${this.formatProgramName(best)} est ambitieux mais possible 🚀`;
      }
    }

    // 🧠 DYNAMIC NATURAL VARIATION ENGINE - NO TEMPLATES
    const lines: string[] = [];
    
    const random = Math.random();
    
    if (language === 'ar') {
      if (random < 0.2) lines.push(`بصراحة...`);
      else if (random < 0.4) lines.push(`في حالتك مع السكور ${score}:`);
      else if (random < 0.6) lines.push(`لو كنت بلاصتك:`);
      else if (random < 0.8) lines.push(`مع السكور متاعك،:`);
      else lines.push(`الوضع حاليا:`);

      lines.push(scoreComment);
      
      if (backup && Math.random() > 0.4) {
        lines.push(`${backup.program.name} باقي موجود ك Plan B ⚡`);
      }
      
      if (risky && Math.random() > 0.7) {
        lines.push(`${risky.program.name} أقوى أما أصعب شوية 🚀`);
      }
    } else {
      if (random < 0.2) lines.push(`Honnêtement...`);
      else if (random < 0.4) lines.push(`Avec ton score ${score}:`);
      else if (random < 0.6) lines.push(`Si j'étais toi:`);
      else if (random < 0.8) lines.push(`Dans ton cas:`);
      else lines.push(`Actuellement:`);

      lines.push(scoreComment);
      
      if (backup && Math.random() > 0.4) {
        lines.push(`${this.formatProgramName(backup)} reste un bon plan B ⚡`);
      }
      
      if (risky && Math.random() > 0.7) {
        lines.push(`${this.formatProgramName(risky)} est plus ambitieux 🚀`);
      }
    }
    
    return this.withFollowUp(lines, followUp);
  }

  private buildComparisonResponse(
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage,
    followUp: string,
  ): string {
    const decisions = this.rankPrograms(ragData, studentData).slice(0, 3);
    if (decisions.length >= 2) {
      const [first, second] = decisions;
      const firstName = this.shortProgramLabel(first.program.name);
      const secondName = this.shortProgramLabel(second.program.name);
      const line = language === 'ar'
        ? `${firstName} ${this.levelMeaning(first.level, 'ar')}, ${secondName} ${this.levelMeaning(second.level, 'ar')}.`
        : `${firstName}: ${this.levelMeaning(first.level, 'fr')}; ${secondName}: ${this.levelMeaning(second.level, 'fr')}.`;
      return this.withFollowUp([line], followUp);
    }

    if (ragData.field) {
      const bits = [
        ragData.field.demand ? `demande ${ragData.field.demand}` : undefined,
        ragData.field.unemploymentRisk ? `chomage ${ragData.field.unemploymentRisk}` : undefined,
        ragData.field.outlook,
      ].filter(Boolean);
      return this.withFollowUp([bits.join(' | ') || 'Comparaison impossible avec le contexte actuel.'], followUp);
    }

    return this.withFollowUp(
      [language === 'ar' ? 'Ma andich zouz options mouath9in bech n9aren.' : 'Il manque deux options verifiees pour comparer.'],
      followUp,
    );
  }

  private buildRoadmapResponse(
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage,
    followUp: string,
  ): string {
    const technicalSkills = ragData.field?.skills?.technical || [];
    const jobSkills = (ragData.jobs || []).flatMap((job) => job.skills || []);
    const skills = this.unique([...technicalSkills, ...jobSkills]).slice(0, 3);
    const domain = studentData.memory?.refinedDomain || studentData.interest || ragData.field?.name || ragData.interest;

    const lines: string[] = [];
    
    if (language === 'ar') {
      if (skills.length) lines.push(`1. تبدأ بـ: ${skills.join(', ')}`);
      lines.push(`2. الخطوة الجاية: ${this.roadmapNextStep(domain, language)}`);
      lines.push(`3. بعدين تعمل: ${this.roadmapProof(domain, language)}`);
      lines.push(`تستغرق حوالي 3-6 أشهر للبداية.`);
    } else {
      if (skills.length) lines.push(`1. Commence par: ${skills.join(', ')}`);
      lines.push(`2. Prochaine étape: ${this.roadmapNextStep(domain, language)}`);
      lines.push(`3. Ensuite fais: ${this.roadmapProof(domain, language)}`);
      lines.push(`Cela prend environ 3-6 mois pour commencer.`);
    }

    return this.withFollowUp(lines, followUp);
  }

  private buildGeneralContextResponse(
    ragData: RagContextData,
    studentData: AiStudentContext,
    language: AiLanguage,
    followUp: string,
  ): string | undefined {
    if (ragData.programs?.length) {
      return this.buildAdviceResponse(ragData, studentData, language, followUp);
    }

    if (ragData.jobs?.length) {
      return this.withFollowUp(
        [language === 'ar' ? 'Najem naawnek b jobs, programs wala decision.' : 'Je peux cadrer jobs, programmes ou decision.'],
        followUp,
      );
    }

    return undefined;
  }

  private detectQuestionType(message: string): QuestionType {
    const normalized = this.normalizeForIntent(message);

    // ✅ STRICT ROADMAP DETECTION FIRST
    if (this.hasAny(normalized, [
      'roadmap', 'learning path', 'learn', 'skills', 'skill', 'certification',
      'certifications', 'project', 'projects', 'projet', 'projets', 'competence',
      'competences', 'comment reussir', 'comment réussir', 'quoi apprendre',
      'chnowa net3alem', 'chneya net3alem', 'kifech nanjah', 'kifach nanjah',
      'كيفاش ننجح', 'شنوة نتعلم', 'شنو نتعلم',
      'kifach nebda', 'kifech nebda', 'chnowa na3mel baad', 'كيفاش نبدأ', 'منين نبدأ', 'شنو نعمل بعد'
    ])) {
      return 'roadmap';
    }

    if (this.hasAny(normalized, [
      'job', 'jobs', 'metier', 'metiers', 'travail', 'emploi', 'carriere',
      'debouche', 'debouches', 'salaire', 'work', 'career', 'khedma',
      '5edma', 'khdem', 'mihna', 'مهنة', 'وظيفة', 'خدمة',
    ])) {
      return 'jobs';
    }

    if (this.hasAny(normalized, [
      'compare', 'comparer', 'comparaison', 'difference', 'different',
      'versus', ' vs ', ' ou ', 'ou bien', 'meilleur entre', 'khir bin',
      'chneya khir', 'chnowa khir', 'فرق', 'ولا', 'خير بين',
    ])) {
      return 'comparison';
    }

    if (this.hasAny(normalized, [
      'conseil', 'conseille', 'recommend', 'recommande', 'orientation',
      'choisir', 'choix', 'chance', 'chances', 'possible', 'admission',
      'best', 'meilleur', 'choose', 'choice', 'should i', 'nansahni',
      'tnasa7ni', 'chn3mel', 'chnowa na3mel', 'شنعمل', 'نختار',
      'تنصحني', 'فرصة', 'حظوظ',
    ])) {
      return 'advice';
    }

    if (this.hasAny(normalized, [
      'programme', 'programmes', 'program', 'filiere', 'filieres', 'licence',
      'cycle', 'institut', 'faculte', 'universite', 'ecole', 'etudier',
      'study', 'formation', 'formations', 'na9ra', 'n9ra', 'تخصص',
      'جامعة', 'معهد',
    ])) {
      return 'programs';
    }

    return 'general';
  }

  private buildStrictSystemInstruction(
    language: AiLanguage,
    studentData: AiStudentContext,
    questionType: QuestionType = 'general',
  ): string {
    const memory = this.formatMemory(studentData.memory || {}, language);
    return [
      'You are not the decision engine. Backend context is the source of truth.',
      `Question type: ${questionType}.`,
      'Answer only the user question. Never invent jobs, programs, scores, demand, or unemployment.',
      'Keep max 5 lines, max 3 items, no generic intro, exactly one short follow-up.',
      'Do not use canned intros, generic program labels, or broad career filler.',
      `Student: bac=${studentData.bacType || 'unknown'}, score=${studentData.score ?? 'unknown'}, interest=${studentData.interest || 'unknown'}, memory=${memory}.`,
    ].join('\n');
  }

  private buildRagContext(
    ragData: RagContextData,
    language: AiLanguage,
    questionType: QuestionType = 'general',
  ): string {
    const parts: string[] = [`Question type: ${questionType}`];

    if (ragData.field && !['jobs', 'programs'].includes(questionType)) {
      parts.push([
        `Field: ${ragData.field.name || 'unknown'}`,
        ragData.field.demand ? `Demand: ${ragData.field.demand}` : undefined,
        ragData.field.unemploymentRisk ? `Unemployment risk: ${ragData.field.unemploymentRisk}` : undefined,
        ragData.field.outlook ? `Outlook: ${ragData.field.outlook}` : undefined,
        ragData.field.skills?.technical?.length ? `Skills: ${ragData.field.skills.technical.slice(0, 5).join(', ')}` : undefined,
      ].filter(Boolean).join('\n'));
    }

    if (questionType !== 'jobs' && ragData.programs?.length) {
      parts.push(`Programs:\n${ragData.programs.slice(0, 3).map((program) => {
        const level = this.classifyProgram(ragData.score, program.lastScore);
        const score = typeof program.lastScore === 'number' ? program.lastScore : 'N/A';
        return `- ${program.name} @ ${program.institution} | Score: ${score} | Risk: ${level}`;
      }).join('\n')}`);
    }

    if (questionType !== 'programs' && ragData.jobs?.length) {
      parts.push(`Jobs:\n${ragData.jobs.slice(0, 3).map((job) => {
        const unemployment = this.formatUnemployment(job.unemploymentRate, language);
        return `- ${job.title} | ${job.description || job.skills.slice(0, 2).join(', ')} | Demand: ${this.formatDemand(job.demand)} | ${unemployment}`;
      }).join('\n')}`);
    }

    return parts.join('\n\n');
  }

  private filterAndRankPrograms(ragData: RagContextData, studentData: AiStudentContext): ProgramDecision[] {
    const score = studentData.score ?? ragData.score;
    const memory = studentData.memory || {};
    
    let programs = (ragData.programs || []).filter((program) => program.name);
    
    // Remove rejected topics
    const rejected = memory.rejectedTopics ?? [];
    if (rejected.length > 0) {
      programs = programs.filter(program => {
        const normalizedName = this.normalizeForIntent(program.name);
        return !rejected.some(rejectedTopic => 
          normalizedName.includes(this.normalizeForIntent(rejectedTopic))
        );
      });
    }
    
    // Remove already discussed programs
    const discussed = memory.discussedPrograms ?? [];
    if (discussed.length > 0) {
      programs = programs.filter(program => 
        !discussed.includes(program.name)
      );
    }
    
    // Prioritize by preferred difficulty
    const ranked = programs
      .map((program) => ({
        program,
        level: this.classifyProgram(score, program.lastScore),
        gap: this.getProgramGap(score, program.lastScore),
      }))
      .sort((a, b) => {
        // First sort by difficulty preference
        if (memory.preferredDifficulty === 'easy') {
          if (a.level === 'Safe' && b.level !== 'Safe') return -1;
          if (b.level === 'Safe' && a.level !== 'Safe') return 1;
        }
        if (memory.preferredDifficulty === 'challenge') {
          if (a.level === 'Difficult' && b.level !== 'Difficult') return -1;
          if (b.level === 'Difficult' && a.level !== 'Difficult') return 1;
        }
        // Then default level rank
        return this.levelRank(a.level) - this.levelRank(b.level);
      });
    
    return ranked;
  }

  private rankPrograms(ragData: RagContextData, studentData: AiStudentContext): ProgramDecision[] {
    return this.filterAndRankPrograms(ragData, studentData);
  }

  private classifyProgram(score: number | undefined, lastScore: number | undefined): DecisionLevel {
    const gap = this.getProgramGap(score, lastScore);
    if (gap === undefined) return 'Medium';
    if (gap >= 10) return 'Safe';
    if (gap >= -5) return 'Medium';
    return 'Difficult';
  }

  private getProgramGap(score: number | undefined, lastScore: number | undefined): number | undefined {
    if (
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      typeof lastScore !== 'number' ||
      !Number.isFinite(lastScore)
    ) {
      return undefined;
    }

    return Number((score - lastScore).toFixed(2));
  }

  private levelRank(level: DecisionLevel): number {
    const order: Record<DecisionLevel, number> = {
      Safe: 0,
      Medium: 1,
      Difficult: 2,
    };
    return order[level];
  }

  private formatProgramName(decision: ProgramDecision): string {
    return `${decision.program.name} @ ${decision.program.institution}`;
  }

  private shortProgramLabel(name: string): string {
    if (/licence/i.test(name)) return 'Licence';
    if (/engineer|ingen|ing[ée]nieur/i.test(name)) return 'Engineering';
    return this.shortText(name, 4);
  }

  private generateComparison(
    best: ProgramDecision | undefined,
    backup: ProgramDecision | undefined,
    language: AiLanguage,
  ): string {
    if (!best || !backup) {
      return language === 'ar' ? 'Decision: khoud el option elli riskha a9al.' : 'Decision: prends le risque le plus bas.';
    }

    const bestLabel = this.shortProgramLabel(best.program.name);
    const backupLabel = this.shortProgramLabel(backup.program.name);
    if (language === 'ar') {
      return `${bestLabel} ashel, ${backupLabel} backup ken theb risk akther.`;
    }

    return `${bestLabel} est plus safe; ${backupLabel} reste le backup.`;
  }

  private levelMeaning(level: DecisionLevel, language: AiLanguage): string {
    const labels: Record<AiLanguage, Record<DecisionLevel, string>> = {
      fr: {
        Safe: 'plus accessible',
        Medium: 'possible mais a confirmer',
        Difficult: 'plus fort mais plus risque',
      },
      ar: {
        Safe: 'ashel w safe',
        Medium: 'possible ama يلزم تثبت',
        Difficult: 'aqwa ama as3eb',
      },
    };
    return labels[language][level];
  }

  private roadmapNextStep(domain: string | undefined, language: AiLanguage): string {
    const normalized = this.normalizeForIntent(domain || '');
    if (this.hasAny(normalized, ['tech', 'it', 'info', 'dev', 'web', 'data', 'cyber'])) {
      return 'build 2 small apps, then one portfolio project';
    }
    if (this.hasAny(normalized, ['sport', 'coaching', 'kine'])) {
      return language === 'ar' ? 'pratique + stage fi club/clinique' : 'pratique + stage club/clinique';
    }
    if (this.hasAny(normalized, ['business', 'finance', 'marketing'])) {
      return 'case studies + Excel/analytics practice';
    }
    return language === 'ar' ? 'ebda bel basics, baad project sghir' : 'bases d abord, puis petit projet';
  }

  private roadmapProof(domain: string | undefined, language: AiLanguage): string {
    const normalized = this.normalizeForIntent(domain || '');
    if (this.hasAny(normalized, ['tech', 'it', 'info', 'dev', 'web', 'data', 'cyber'])) {
      return 'GitHub, portfolio, Google/Cisco basics';
    }
    if (this.hasAny(normalized, ['sport', 'coaching', 'kine'])) {
      return 'first aid, coaching certificate, supervised sessions';
    }
    if (this.hasAny(normalized, ['business', 'finance', 'marketing'])) {
      return 'Excel, Google Analytics, mini business plan';
    }
    return language === 'ar' ? 'project sghir + certificate mouath9a' : 'petit projet + certificat verifie';
  }

  private getFollowUpQuestion(
    memory: AiMemory | undefined,
    language: AiLanguage,
    questionType: QuestionType,
    message: string,
  ): string {
    const asked = memory?.lastQuestionsAsked || [];
    const domain = this.detectDomainFromText(message) || memory?.refinedDomain || memory?.interest || memory?.preferredDomain;
    const candidates = this.followUpCandidates(domain, memory, questionType, language);
    const fresh = candidates.find((question) => !this.wasAsked(question, asked));
    return fresh || candidates[0] || (language === 'ar' ? ' تحب نثبتو الاختيار؟' : 'Tu veux trancher quelle option ?');
  }

  private followUpCandidates(
    domain: string | undefined,
    memory: AiMemory | undefined,
    questionType: QuestionType,
    language: AiLanguage,
  ): string[] {
    const normalized = this.normalizeForIntent(domain || '');

    if (!memory?.refinedDomain) {
      if (this.hasAny(normalized, ['tech', 'it', 'info'])) {
        return language === 'ar'
          ? [
              'تحب أكثر freelance ولا شركة ؟',
              'frontend ولا backend أقرب ليك ؟',
              'تحب حاجة فيها créativité ولا logique أكثر ؟',
              'web wala data ?',
              'dev wala cyber ?'
            ]
          : [
              'Tu préfères freelance ou entreprise ?',
              'Frontend ou backend te correspond plus ?',
              'Créativité ou logique ?',
              'Web ou data ?',
              'Dev ou cybersécurité ?'
            ];
      }
      if (this.hasAny(normalized, ['sport'])) {
        return language === 'ar'
          ? [
              'coaching wala kine ?',
              'club wala clinique ?',
              'performance wala management ?',
              'تحب تخدم مع أولاد ولا كبار ؟'
            ]
          : [
              'Coaching ou kiné ?',
              'Club ou clinique ?',
              'Performance ou management ?'
            ];
      }
      if (this.hasAny(normalized, ['business', 'commerce', 'gestion'])) {
        return language === 'ar'
          ? [
              'finance wala marketing ?',
              'compta wala management ?',
              'analyse wala vente ?',
              'تحب تخدم بسرعة ولا تكمل master ؟'
            ]
          : [
              'Finance ou marketing ?',
              'Compta ou management ?',
              'Analyse ou vente ?',
              'Travailler vite ou faire master ?'
            ];
      }
      if (this.hasAny(normalized, ['health', 'sante', 'medical'])) {
        return language === 'ar'
          ? [
              'medecine wala paramedical ?',
              'hopital wala labo ?',
              'soins wala recherche ?'
            ]
          : [
              'Médecine ou paramédical ?',
              'Hôpital ou laboratoire ?',
              'Soins ou recherche ?'
            ];
      }
    }

    if (!memory?.difficulty && questionType !== 'roadmap') {
      return language === 'ar'
        ? [
            'تحب خيار آمن ولا تحدى ؟',
            'ashel wala aqwa ?',
            'تحب تطمح لحاجة قوية ؟'
          ]
        : [
            'Option sûre ou challenge ?',
            'Plus facile ou plus fort ?',
            'Tu veux viser haut ?'
          ];
    }

    if (questionType === 'jobs') {
      return language === 'ar'
        ? [
            'تحب نقولك شنيya skills لازم ؟',
            'تحب تعرف future outlook ؟',
            'نحضرولك roadmap صغيرة ؟'
          ]
        : [
            'Je te liste les skills nécessaires ?',
            'Tu veux connaître les perspectives ?',
            'Une petite roadmap ?'
          ];
    }

    return language === 'ar'
      ? [
          'تحب نقارنوهم بالscore ?',
          'نثبتولك الخيار الأفضل ؟',
          'تحب roadmap قصيرة ؟',
          'تحب نحكيلك على الخدمات ؟'
        ]
      : [
          'On compare avec ton score ?',
          'Je te donne le meilleur choix ?',
          'Tu veux une roadmap courte ?',
          'On parle des métiers ?'
        ];
  }

  private wasAsked(question: string, askedQuestions: string[]): boolean {
    const normalized = this.normalizeForIntent(question).replace(/\s+/g, ' ').trim();
    return askedQuestions.some((asked) => {
      const normalizedAsked = this.normalizeForIntent(asked).replace(/\s+/g, ' ').trim();
      return normalizedAsked.includes(normalized.slice(0, 12)) || normalized.includes(normalizedAsked.slice(0, 12));
    });
  }

  extractStateFromMessage(message: string, existingState: ConversationState = {}): ConversationState {
    const normalized = this.normalizeForIntent(message);
    const newState: ConversationState = { ...existingState };

    // Extract sub interests
    if (this.hasAny(normalized, ['web', 'frontend', 'backend', 'fullstack'])) {
      newState.subInterest = 'web';
    }
    if (this.hasAny(normalized, ['data', 'ml', 'ai', 'intelligence artificielle', 'donnees'])) {
      newState.subInterest = 'data';
    }
    if (this.hasAny(normalized, ['cyber', 'securite', 'hacking', 'reseaux', 'network'])) {
      newState.subInterest = 'cyber';
    }
    if (this.hasAny(normalized, ['mobile', 'android', 'ios', 'flutter', 'react native'])) {
      newState.subInterest = 'mobile';
    }

    // Extract rejected topics
    if (this.hasAny(normalized, ['ma nabghich', 'ma n7ebch', 'na7ebch', 'je n aime pas', 'je veux pas', 'pas de', '7abech'])) {
      if (this.hasAny(normalized, ['reseau', 'reseaux', 'network'])) {
        if (!newState.rejectedTopics) newState.rejectedTopics = [];
        if (!newState.rejectedTopics.includes('reseaux')) newState.rejectedTopics.push('reseaux');
      }
      if (this.hasAny(normalized, ['math', 'mathematiques'])) {
        if (!newState.rejectedTopics) newState.rejectedTopics = [];
        if (!newState.rejectedTopics.includes('math')) newState.rejectedTopics.push('math');
      }
      if (this.hasAny(normalized, ['dev', 'developpement'])) {
        if (!newState.rejectedTopics) newState.rejectedTopics = [];
        if (!newState.rejectedTopics.includes('dev')) newState.rejectedTopics.push('dev');
      }
    }

    // Extract difficulty preference
    if (this.hasAny(normalized, ['ashel', 'sahla', 'facile', 'easy', 'simple', 'khafe'])) {
      newState.preferredDifficulty = 'easy';
    }
    if (this.hasAny(normalized, ['challenge', 'a3la', 'aqwa', 'fort', 'ambitieux', 'mochkil'])) {
      newState.preferredDifficulty = 'challenge';
    }

    if (!newState.discussedPrograms) newState.discussedPrograms = [];
    if (!newState.discussedJobs) newState.discussedJobs = [];
    if (!newState.askedQuestions) newState.askedQuestions = [];
    
    newState.conversationDepth = (newState.conversationDepth || 0) + 1;
    
    return newState;
  }

  private detectDomainFromText(message: string): string | undefined {
    const normalized = this.normalizeForIntent(message);
    if (this.hasAny(normalized, ['it', 'tech', 'informatique', 'info', 'dev', 'software', 'data', 'cyber'])) return 'tech';
    if (this.hasAny(normalized, ['sport', 'kine', 'coaching'])) return 'sport';
    if (this.hasAny(normalized, ['health', 'sante', 'medecine', 'medical'])) return 'health';
    if (this.hasAny(normalized, ['business', 'commerce', 'gestion', 'finance', 'marketing'])) return 'business';
    if (this.hasAny(normalized, ['art', 'design', 'architecture'])) return 'art';
    return undefined;
  }

  private formatMemory(memory: AiMemory, language: AiLanguage): string {
    const rejected = memory.rejectedDomains?.length ? memory.rejectedDomains.join(', ') : 'none';
    const asked = memory.lastQuestionsAsked?.length ? memory.lastQuestionsAsked.slice(-3).join(' | ') : 'none';
    return [
      `interest=${memory.interest || 'none'}`,
      `refinedDomain=${memory.refinedDomain || 'none'}`,
      `difficulty=${memory.difficulty || 'none'}`,
      `rejected=${rejected}`,
      `askedBefore=${asked}`,
      `lang=${language}`,
    ].join(', ');
  }

  private enforceResponseShape(text: string, input: AiGenerateInput): string {
    const question = input.followUpQuestion || this.getFollowUpQuestion(
      undefined,
      input.language || 'fr',
      input.questionType || 'general',
      input.message,
    );
    const lines = (text || '')
      .split('\n')
      .map((line) => this.removeForbiddenText(line.trim()))
      .filter(Boolean)
      .filter((line) => !/[?؟]\s*$/.test(line))
      .filter((line) => this.isAllowedForType(line, input.questionType || 'general'))
      .map((line) => this.shortText(line, 18))
      .slice(0, 4);

    const body = lines.length
      ? lines
      : [input.language === 'ar' ? 'Nnajm naawnek ken b data mouath9a.' : 'Je peux aider avec les donnees verifiees.'];

    return this.withFollowUp(body, question);
  }

  private isAllowedForType(line: string, questionType: QuestionType): boolean {
    const normalized = this.normalizeForIntent(line);
    if (questionType === 'jobs') {
      return !this.hasAny(normalized, ['programme', 'program', 'filiere', 'licence', 'admission']);
    }
    if (questionType === 'programs') {
      return !this.hasAny(normalized, ['job', 'metier', 'emploi', 'travail', 'career', 'carriere']);
    }
    return true;
  }

  private removeForbiddenText(line: string): string {
    return line
      .replace(/selon ton profil[:,]?\s*/gi, '')
      .replace(/programme general[:,]?\s*/gi, '')
      .replace(/avenir professionnel[:,]?\s*/gi, '')
      .replace(/pour avancer[:,]?\s*/gi, '')
      .trim();
  }

  private withFollowUp(lines: string[], followUp: string): string {
    const body = lines
      .map((line) => this.removeForbiddenText(line))
      .filter(Boolean)
      .slice(0, 4);

    return [...body, followUp].slice(0, 5).join('\n');
  }

  private shortText(value: string, maxWords: number): string {
    const normalized = value.replace(/\s+/g, ' ').trim();
    const words = normalized.split(' ');
    return words.length > maxWords ? `${words.slice(0, maxWords).join(' ')}...` : normalized;
  }

  private formatDemand(value: string | undefined): string {
    const normalized = this.normalizeForIntent(value || '');
    if (normalized.includes('high') || normalized.includes('fort') || normalized.includes('eleve')) return 'High';
    if (normalized.includes('low') || normalized.includes('faible')) return 'Low';
    return value || 'Medium';
  }

  private formatUnemployment(value: number | undefined, language: AiLanguage): string {
    const label = language === 'ar' ? 'Chomage' : 'Chomage';
    return `${label}: ${typeof value === 'number' && Number.isFinite(value) ? `${value}%` : 'N/A'}`;
  }

  private unique(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private normalizeForIntent(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private hasAny(value: string, keywords: string[]): boolean {
    return keywords.some((keyword) => value.includes(this.normalizeForIntent(keyword)));
  }

  private async callOllama(
    prompt: string,
    input: AiGenerateInput,
  ): Promise<AiGenerateResult> {
    const config = this.ollamaConfig.getConfig();

    try {
      const response = await axios.post(
        config.url || 'http://localhost:11434/api/generate',
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: Math.min(config.temperature ?? 0, 0.2),
            num_predict: Math.min(Math.max(config.num_predict ?? 180, 120), 220),
            top_p: 0.7,
          },
        },
        { timeout: config.timeout },
      );

      const text = response.data?.response?.trim();
      if (this.safetyRules.isSafeResponse(text)) {
        return {
          text: this.enforceResponseShape(text!, input),
          usedFallback: false,
        };
      }

      this.logger.warn('Ollama returned an empty or unsafe response');
    } catch (error) {
      this.logger.warn(
        `Ollama generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      text: this.enforceResponseShape(this.getFallback(input), input),
      usedFallback: true,
    };
  }

  buildPrompt(input: AiGenerateInput): string {
    const language = input.language || 'fr';
    const languageInstruction =
      language === 'ar'
        ? 'Reply in Tunisian-friendly Arabic/translit. Keep real context only.'
        : 'Reponds en francais clair et tunisien-friendly.';
    const safetyInstruction = this.safetyRules.getPromptRules(
      'general',
      language,
    );
    const systemInstruction =
      input.systemInstruction ||
      'Tu expliques uniquement les decisions backend. N invente aucune donnee.';
    const context = input.context?.trim()
      ? `\nCONTEXTE BACKEND:\n${input.context.trim()}\n`
      : '';
    const history = this.formatHistory(input.history || []);

    return [
      systemInstruction,
      languageInstruction,
      safetyInstruction,
      context,
      history ? `HISTORIQUE:\n${history}` : '',
      `QUESTION:\n${input.message.trim()}`,
      'REPONSE:',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private formatHistory(history: AiMessage[]): string {
    return history
      .filter(
        (item) =>
          item?.content &&
          ['user', 'assistant', 'system'].includes(item.role),
      )
      .slice(-5)
      .map((item) => `${item.role}: ${item.content.trim()}`)
      .join('\n');
  }

  private getFallback(input: AiGenerateInput): string {
    if (input.fallback?.trim()) return input.fallback.trim();

    return input.language === 'ar'
      ? 'Nnajm naawnek ken b data mouath9a.'
      : 'Je peux aider seulement avec les donnees verifiees.';
  }
}
