import { Injectable, Logger } from '@nestjs/common';
import { DomainMatcherService, Domain } from './domain-matcher.service';
import {
  IntentResolverService,
  IntentResult,
  IntentType,
} from './intent-resolver.service';
import * as fs from 'fs';
import * as path from 'path';

interface JobData {
  title: string;
  description: string;
  skills: string[];
  demand: string;
  unemployment_rate: number;
  salary_level?: string;
  domain: string;
}

interface JobDomainData {
  field: string;
  keywords: string[];
  jobs: JobData[];
}

interface FieldProgram {
  programs: string[];
  field: string;
  possible_jobs: string[];
  required_skills: {
    technical_skills: string[];
    soft_skills: string[];
    tools_and_technologies: string[];
  };
  demand_in_tunisia: string;
  future_outlook: string;
  unemployment_risk: string;
  recommended: boolean;
  reason: string;
}

interface FieldsData {
  fields: FieldProgram[];
}

@Injectable()
export class DynamicResponseService {
  private readonly logger = new Logger(DynamicResponseService.name);
  private readonly jobsData: JobDomainData[];
  private readonly fieldsData: FieldsData;

  constructor(
    private readonly domainMatcher: DomainMatcherService,
    private readonly intentResolver: IntentResolverService,
  ) {
    this.jobsData = this.loadJobsData();
    this.fieldsData = this.loadFieldsData();
  }

  private loadJobsData(): JobDomainData[] {
    try {
      const filePath = path.join(process.cwd(), 'data', 'jobs.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to load jobs.json', error);
      return [];
    }
  }

  private loadFieldsData(): FieldsData {
    try {
      const filePath = path.join(process.cwd(), 'data', 'fields.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to load fields.json', error);
      return { fields: [] };
    }
  }

  public generateResponse(message: string, intent: IntentResult): string {
    const language = intent.language;

    switch (intent.type) {
      case 'domain_inquiry':
        return this.generateDomainResponse(intent.domain, language);

      case 'career_inquiry':
        return this.generateCareerResponse(intent.domain, language);

      case 'roadmap_inquiry':
        return this.generateRoadmapResponse(
          intent.domain,
          intent.entities.level,
          language,
        );

      case 'comparison':
        return this.generateComparisonResponse(
          intent.entities.comparison?.domain1,
          intent.entities.comparison?.domain2,
          language,
        );

      case 'program_search':
        return this.generateProgramResponse(intent.domain, language);

      case 'general_question':
        return this.generateGeneralResponse(message, language);

      default:
        return this.generateFallbackResponse(language);
    }
  }

  private generateDomainResponse(
    domainName: string | undefined,
    language: 'fr' | 'ar' | 'mixed',
  ): string {
    if (!domainName) {
      return language === 'ar'
        ? 'لم أتمكن من تحديد المجال. هل يمكنك التوضيح أكثر؟'
        : "Je n'ai pas pu identifier le domaine. Pouvez-vous préciser ?";
    }

    const domain = this.domainMatcher.getDomainByField(domainName);
    if (!domain) {
      return this.generateFallbackResponse(language);
    }

    const fieldData = this.fieldsData.fields.find(
      (f) => f.field === domainName,
    );
    const jobs = this.getJobsForDomain(domainName);

    if (language === 'ar') {
      return this.generateArabicDomainResponse(domain, fieldData, jobs);
    } else {
      return this.generateFrenchDomainResponse(domain, fieldData, jobs);
    }
  }

  private generateArabicDomainResponse(
    domain: Domain,
    fieldData: FieldProgram | undefined,
    jobs: JobData[],
  ): string {
    const response = [
      `🎯 **مجال ${domain.field}**`,
      '',
      `**نظرة عامة:**`,
      `• الطلب في تونس: ${this.translateDemand(domain.demand_in_tunisia)}`,
      `• المستقبل: ${this.translateOutlook(domain.future_outlook)}`,
      `• مخاطر البطالة: ${this.translateRisk(domain.unemployment_risk)}`,
      '',
      `**المهارات المطلوبة:**`,
      ...domain.skills.slice(0, 5).map((skill) => `• ${skill}`),
      '',
    ];

    if (fieldData) {
      response.push(`**البرامج التعليمية:**`);
      response.push(
        ...fieldData.programs.slice(0, 4).map((program) => `• ${program}`),
      );
      response.push('');
    }

    if (jobs.length > 0) {
      response.push(`**فرص العمل:**`);
      response.push(
        ...jobs.slice(0, 3).map((job) => `• ${job.title}: ${job.description}`),
      );
      response.push('');
    }

    response.push(`**الأدوات وال تقنيات:**`);
    response.push(...domain.tools.slice(0, 5).map((tool) => `• ${tool}`));
    response.push('');
    response.push(`💡 هل تريد معرفة المسار التعليمي (roadmap) لهذا المجال؟`);

    return response.join('\n');
  }

  private generateFrenchDomainResponse(
    domain: Domain,
    fieldData: FieldProgram | undefined,
    jobs: JobData[],
  ): string {
    const response = [
      `🎯 **Domaine ${domain.field}**`,
      '',
      `**Aperçu :**`,
      `• Demande en Tunisie : ${domain.demand_in_tunisia}`,
      `• Perspectives d'avenir : ${domain.future_outlook}`,
      `• Risque de chômage : ${domain.unemployment_risk}`,
      '',
      `**Compétences requises :**`,
      ...domain.skills.slice(0, 5).map((skill) => `• ${skill}`),
      '',
    ];

    if (fieldData) {
      response.push(`**Programmes d'études :**`);
      response.push(
        ...fieldData.programs.slice(0, 4).map((program) => `• ${program}`),
      );
      response.push('');
    }

    if (jobs.length > 0) {
      response.push(`**Opportunités de carrière :**`);
      response.push(
        ...jobs.slice(0, 3).map((job) => `• ${job.title}: ${job.description}`),
      );
      response.push('');
    }

    response.push(`**Outils et technologies :**`);
    response.push(...domain.tools.slice(0, 5).map((tool) => `• ${tool}`));
    response.push('');
    response.push(
      `💡 Souhaitez-vous connaître la feuille de route (roadmap) pour ce domaine ?`,
    );

    return response.join('\n');
  }

  private generateCareerResponse(
    domainName: string | undefined,
    language: 'fr' | 'ar' | 'mixed',
  ): string {
    if (!domainName) {
      return language === 'ar'
        ? 'أي مجال مهني تريد الاستفسار عنه؟'
        : 'Quel domaine professionnel vous intéresse ?';
    }

    const jobs = this.getJobsForDomain(domainName);
    const domain = this.domainMatcher.getDomainByField(domainName);

    if (jobs.length === 0) {
      return language === 'ar'
        ? 'لا توجد معلومات متاحة عن فرص العمل في هذا المجال.'
        : "Aucune information disponible sur les opportunités d'emploi dans ce domaine.";
    }

    if (language === 'ar') {
      const response = [
        `💼 **فرص العمل في مجال ${domainName}**`,
        '',
        `**الوظائف المتاحة:**`,
        ...jobs.map((job) =>
          [
            `**${job.title}**`,
            `• ${job.description}`,
            `• المهارات: ${job.skills.slice(0, 3).join(', ')}`,
            `• الطلب: ${job.demand}`,
            `• معدل البطالة: ${job.unemployment_rate}%`,
            `• مستوى الراتب: ${job.salary_level || 'N/A'}`,
            '',
          ].join('\n'),
        ),
      ];

      if (domain) {
        response.push(`**نظرة سوقية:**`);
        response.push(
          `• الطلب في تونس: ${this.translateDemand(domain.demand_in_tunisia)}`,
        );
        response.push(
          `• المستقبل: ${this.translateOutlook(domain.future_outlook)}`,
        );
        response.push('');
        response.push(
          `💡 هل تريد معرفة المسار التعليمي للوصول إلى هذه الوظائف؟`,
        );
      }

      return response.join('\n');
    } else {
      const response = [
        `💼 **Opportunités de carrière en ${domainName}**`,
        '',
        `**Postes disponibles :**`,
        ...jobs.map((job) =>
          [
            `**${job.title}**`,
            `• ${job.description}`,
            `• Compétences : ${job.skills.slice(0, 3).join(', ')}`,
            `• Demande : ${job.demand}`,
            `• Taux de chômage : ${job.unemployment_rate}%`,
            `• Niveau de salaire : ${job.salary_level || 'N/A'}`,
            '',
          ].join('\n'),
        ),
      ];

      if (domain) {
        response.push(`**Perspectives du marché :**`);
        response.push(`• Demande en Tunisie : ${domain.demand_in_tunisia}`);
        response.push(`• Avenir : ${domain.future_outlook}`);
        response.push('');
        response.push(
          `💡 Souhaitez-vous connaître la feuille de route pour accéder à ces postes ?`,
        );
      }

      return response.join('\n');
    }
  }

  private generateRoadmapResponse(
    domainName: string | undefined,
    level: 'beginner' | 'intermediate' | 'advanced' | undefined,
    language: 'fr' | 'ar' | 'mixed',
  ): string {
    if (!domainName) {
      return language === 'ar'
        ? 'أي مجال تريد معرفة مساره التعليمي؟'
        : 'Pour quel domaine souhaitez-vous connaître la feuille de route ?';
    }

    const domain = this.domainMatcher.getDomainByField(domainName);
    if (!domain) {
      return this.generateFallbackResponse(language);
    }

    const targetLevel = level || 'beginner';
    const roadmap = domain.roadmap[targetLevel];

    if (!roadmap) {
      return language === 'ar'
        ? 'لا توجد معلومات متاحة عن المسار التعليمي لهذا المستوى.'
        : 'Aucune information disponible pour la feuille de route de ce niveau.';
    }

    if (language === 'ar') {
      const levelNames = {
        beginner: 'مبتدئ',
        intermediate: 'متوسط',
        advanced: 'متقدم',
      };

      const response = [
        `🗺️ **المسار التعليمي لمجال ${domainName} - المستوى ${levelNames[targetLevel]}**`,
        '',
        `**المدة:** ${roadmap.duration}`,
        '',
        `**المهارات المطلوبة:**`,
        ...roadmap.skills.map((skill) => `• ${skill}`),
        '',
        `**المشاريع المقترحة:**`,
        ...roadmap.projects.map((project) => `• ${project}`),
        '',
        `**الشهادات المعتمدة:**`,
        ...roadmap.certifications.map((cert) => `• ${cert}`),
        '',
        `💡 هل تريد معرفة المستوى التالي (${targetLevel === 'beginner' ? 'المتوسط' : targetLevel === 'intermediate' ? 'المتقدم' : 'خبير'})؟`,
      ];

      return response.join('\n');
    } else {
      const levelNames = {
        beginner: 'Débutant',
        intermediate: 'Intermédiaire',
        advanced: 'Avancé',
      };

      const response = [
        `🗺️ **Feuille de route ${domainName} - Niveau ${levelNames[targetLevel]}**`,
        '',
        `**Durée :** ${roadmap.duration}`,
        '',
        `**Compétences requises :**`,
        ...roadmap.skills.map((skill) => `• ${skill}`),
        '',
        `**Projets suggérés :**`,
        ...roadmap.projects.map((project) => `• ${project}`),
        '',
        `**Certifications recommandées :**`,
        ...roadmap.certifications.map((cert) => `• ${cert}`),
        '',
        `💡 Souhaitez-vous connaître le niveau suivant (${targetLevel === 'beginner' ? 'Intermédiaire' : targetLevel === 'intermediate' ? 'Avancé' : 'Expert'}) ?`,
      ];

      return response.join('\n');
    }
  }

  private generateComparisonResponse(
    domain1Name: string | undefined,
    domain2Name: string | undefined,
    language: 'fr' | 'ar' | 'mixed',
  ): string {
    if (!domain1Name || !domain2Name) {
      return language === 'ar'
        ? 'يرجى تحديد المجالين للمقارنة.'
        : 'Veuillez spécifier les deux domaines à comparer.';
    }

    const comparison = this.domainMatcher.compareDomains(
      domain1Name,
      domain2Name,
    );

    if (!comparison.domain1 || !comparison.domain2) {
      return language === 'ar'
        ? 'لا يمكن المقارنة بين هذين المجالين.'
        : 'Impossible de comparer ces deux domaines.';
    }

    if (language === 'ar') {
      const response = [
        `⚖️ **مقارنة بين ${domain1Name} و ${domain2Name}**`,
        '',
        `**${domain1Name}:**`,
        `• الطلب: ${comparison.domain1.demand_in_tunisia}`,
        `• المستقبل: ${comparison.domain1.future_outlook}`,
        `• مخاطر البطالة: ${comparison.domain1.unemployment_risk}`,
        '',
        `**${domain2Name}:**`,
        `• الطلب: ${comparison.domain2.demand_in_tunisia}`,
        `• المستقبل: ${comparison.domain2.future_outlook}`,
        `• مخاطر البطالة: ${comparison.domain2.unemployment_risk}`,
        '',
        `**الأدوات المشتركة:** ${comparison.comparison.tools.slice(0, 5).join(', ')}`,
        `**المهارات المشتركة:** ${comparison.comparison.skills.slice(0, 5).join(', ')}`,
        '',
        `💡 هل تريد معرفة المزيد عن أحد هذين المجالين؟`,
      ];

      return response.join('\n');
    } else {
      const response = [
        `⚖️ **Comparaison : ${domain1Name} vs ${domain2Name}**`,
        '',
        `**${domain1Name} :**`,
        `• Demande : ${comparison.domain1.demand_in_tunisia}`,
        `• Avenir : ${comparison.domain1.future_outlook}`,
        `• Risque de chômage : ${comparison.domain1.unemployment_risk}`,
        '',
        `**${domain2Name} :**`,
        `• Demande : ${comparison.domain2.demand_in_tunisia}`,
        `• Avenir : ${comparison.domain2.future_outlook}`,
        `• Risque de chômage : ${comparison.domain2.unemployment_risk}`,
        '',
        `**Outils communs :** ${comparison.comparison.tools.slice(0, 5).join(', ')}`,
        `**Compétences communes :** ${comparison.comparison.skills.slice(0, 5).join(', ')}`,
        '',
        `💡 Souhaitez-vous en savoir plus sur l'un de ces deux domaines ?`,
      ];

      return response.join('\n');
    }
  }

  private generateProgramResponse(
    domainName: string | undefined,
    language: 'fr' | 'ar' | 'mixed',
  ): string {
    if (!domainName) {
      return language === 'ar'
        ? 'أي مجال تريد البحث عن برامجه التعليمية؟'
        : 'Pour quel domaine souhaitez-vous rechercher des programmes ?';
    }

    const fieldData = this.fieldsData.fields.find(
      (f) => f.field === domainName,
    );
    const domain = this.domainMatcher.getDomainByField(domainName);

    if (!fieldData) {
      return language === 'ar'
        ? 'لا توجد برامج متاحة لهذا المجال.'
        : 'Aucun programme disponible pour ce domaine.';
    }

    if (language === 'ar') {
      const response = [
        `📚 **البرامج التعليمية في مجال ${domainName}**`,
        '',
        `**البرامج المتاحة:**`,
        ...fieldData.programs.map((program) => `• ${program}`),
        '',
        `**المهارات المطلوبة:**`,
        `• المهارات التقنية: ${fieldData.required_skills.technical_skills.slice(0, 3).join(', ')}`,
        `• المهارات الشخصية: ${fieldData.required_skills.soft_skills.slice(0, 3).join(', ')}`,
        `• الأدوات: ${fieldData.required_skills.tools_and_technologies.slice(0, 3).join(', ')}`,
        '',
        `**معلومات السوق:**`,
        `• الطلب في تونس: ${this.translateDemand(fieldData.demand_in_tunisia)}`,
        `• المستقبل: ${this.translateOutlook(fieldData.future_outlook)}`,
        `• مخاطر البطالة: ${this.translateRisk(fieldData.unemployment_risk)}`,
        '',
        fieldData.recommended
          ? `✅ **موصى به:** ${fieldData.reason}`
          : `⚠️ **غير موصى به:** ${fieldData.reason}`,
        '',
        `💡 هل تريد معرفة فرص العمل لهذه البرامج؟`,
      ];

      return response.join('\n');
    } else {
      const response = [
        `📚 **Programmes d'études en ${domainName}**`,
        '',
        `**Programmes disponibles :**`,
        ...fieldData.programs.map((program) => `• ${program}`),
        '',
        `**Compétences requises :**`,
        `• Compétences techniques : ${fieldData.required_skills.technical_skills.slice(0, 3).join(', ')}`,
        `• Compétences personnelles : ${fieldData.required_skills.soft_skills.slice(0, 3).join(', ')}`,
        `• Outils : ${fieldData.required_skills.tools_and_technologies.slice(0, 3).join(', ')}`,
        '',
        `**Informations du marché :**`,
        `• Demande en Tunisie : ${fieldData.demand_in_tunisia}`,
        `• Avenir : ${fieldData.future_outlook}`,
        `• Risque de chômage : ${fieldData.unemployment_risk}`,
        '',
        fieldData.recommended
          ? `✅ **Recommandé :** ${fieldData.reason}`
          : `⚠️ **Non recommandé :** ${fieldData.reason}`,
        '',
        `💡 Souhaitez-vous connaître les opportunités d'emploi pour ces programmes ?`,
      ];

      return response.join('\n');
    }
  }

  private generateGeneralResponse(
    message: string,
    language: 'fr' | 'ar' | 'mixed',
  ): string {
    // Try to extract any domain information and provide a helpful response
    const domainMatch = this.domainMatcher.matchDomain(message);

    if (domainMatch) {
      return this.generateDomainResponse(domainMatch.domain.field, language);
    }

    if (language === 'ar') {
      return (
        `🤔 لم أفهم سؤالك بشكل كامل. هل يمكنك أن تكون أكثر تحديدًا؟\n\n` +
        `يمكنك سؤالي عن:\n` +
        `• مجال معين (مثل: برمجة، هندسة، طب)\n` +
        `• فرص العمل في مجال معين\n` +
        `• المسار التعليمي لمجال معين\n` +
        `• مقارنة بين مجالين\n` +
        `• البرامج الدراسية المتاحة`
      );
    } else {
      return (
        `🤔 Je n'ai pas bien compris votre question. Pouvez-vous être plus précis ?\n\n` +
        `Vous pouvez me demander :\n` +
        `• Des informations sur un domaine (ex: programmation, ingénierie, médecine)\n` +
        `• Les opportunités d'emploi dans un domaine\n` +
        `• La feuille de route pour un domaine\n` +
        `• Une comparaison entre deux domaines\n` +
        `• Les programmes d'études disponibles`
      );
    }
  }

  private generateFallbackResponse(language: 'fr' | 'ar' | 'mixed'): string {
    return language === 'ar'
      ? 'عذرًا، لم أتمكن من العثور على معلومات. هل يمكنك إعادة صياغة سؤالك؟'
      : "Désolé, je n'ai pas pu trouver d'informations. Pouvez-vous reformuler votre question ?";
  }

  private getJobsForDomain(domainName: string): JobData[] {
    const jobDomain = this.jobsData.find(
      (jd) =>
        jd.field.toLowerCase() === domainName.toLowerCase() ||
        jd.field.toLowerCase().includes(domainName.toLowerCase()) ||
        domainName.toLowerCase().includes(jd.field.toLowerCase()),
    );

    return jobDomain?.jobs || [];
  }

  private translateDemand(demand: string): string {
    const translations: { [key: string]: string } = {
      'Very high': 'مرتفع جدًا',
      High: 'مرتفع',
      Moderate: 'متوسط',
      Low: 'منخفض',
      'Very low': 'منخفض جدًا',
    };
    return translations[demand] || demand;
  }

  private translateOutlook(outlook: string): string {
    const translations: { [key: string]: string } = {
      Strong: 'قوي',
      'Moderate to strong': 'متوسط إلى قوي',
      Moderate: 'متوسط',
      Average: 'متوسط',
      Weak: 'ضعيف',
    };
    return translations[outlook] || outlook;
  }

  private translateRisk(risk: string): string {
    const translations: { [key: string]: string } = {
      Low: 'منخفض',
      'Low to moderate': 'منخفض إلى متوسط',
      Moderate: 'متوسط',
      'Moderate to high': 'متوسط إلى مرتفع',
      High: 'مرتفع',
    };
    return translations[risk] || risk;
  }
}
