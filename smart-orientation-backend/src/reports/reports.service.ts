import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(reportId: number, user: { userId: number; role: string }) {
    const report = await this.prisma.recommendationReport.findUnique({
      where: { id: reportId },
      include: { student: { include: { user: true } }, orientationTest: true },
    });

    if (!report) throw new NotFoundException('Report not found');
    if (user.role !== 'ADMIN' && report.student.userId !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    const dominantDomains = Array.isArray(
      report.orientationTest?.dominantDomains,
    )
      ? report.orientationTest.dominantDomains
      : [];
    const skills = Array.isArray(report.orientationTest?.skills)
      ? report.orientationTest.skills
          .map((skill) => String(skill))
          .filter(Boolean)
      : [];

    return this.createReportPdf({
      createdAt: report.createdAt,
      student: report.student,
      summary: report.summary,
      dominantDomains,
      skills,
      recommendations: report.recommendations,
      interests: report.orientationTest?.interests ?? report.student.interests,
    });
  }

  private normalizeDomainField(domain?: any): string | null {
    const d = domain == null ? '' : String(domain).trim();
    if (!d) return null;
    if (/^general$/i.test(d)) return null;
    return d;
  }

  private isSameDomain(a: any, b: any): boolean {
    const da = this.normalizeDomainField(a);
    const db = this.normalizeDomainField(b);
    if (!da || !db) return false;
    return da.toLowerCase() === db.toLowerCase();
  }

  private getTopDominantDomains(data: { dominantDomains: any[] }): string[] {
    const list = Array.isArray(data.dominantDomains)
      ? data.dominantDomains
      : [];
    const top = list
      .map((d) => this.normalizeDomainField(d?.domain))
      .filter(Boolean) as string[];

    // Use top-1 only; fallback to top-2 if top-1 later yields no careers.
    return top.slice(0, 1);
  }

  private getFallbackTopDomains(data: { dominantDomains: any[] }): string[] {
    const list = Array.isArray(data.dominantDomains)
      ? data.dominantDomains
      : [];
    const top = list
      .map((d) => this.normalizeDomainField(d?.domain))
      .filter(Boolean) as string[];

    return top.slice(0, 2);
  }

  private domainSpecificRoadmapBullets(domainField: string, lang: 'fr' | 'ar') {
    const fr = (items: string[]) => items;
    const ar = (items: string[]) => items;

    const normalized = domainField.trim().toLowerCase();

    // Domain aliases mapping: we try to keep it robust even if domain names differ.
    const matches = (patterns: (string | RegExp)[]) =>
      patterns.some((p) =>
        typeof p === 'string'
          ? normalized.includes(p.toLowerCase())
          : p.test(domainField),
      );

    if (
      matches([
        'design',
        'arts & design',
        'graphisme',
        'graphique',
        'ux',
        'ui',
        'digital design',
      ])
    ) {
      return {
        title: lang === 'ar' ? 'مسار التصميم' : 'Roadmap Design',
        bullets:
          lang === 'ar'
            ? ar([
                'تعلم Figma خطوة بخطوة',
                'بناء Portfolio (3 مشاريع على الأقل)',
                'تطبيق UX/UI على صفحات حقيقية',
                'اختبار التصميم مع مستخدمين/أصدقاء',
                'Freelancing أو تدريب في استوديو تصميم',
              ])
            : fr([
                'Apprendre Figma et les bases UX/UI',
                'Créer un portfolio (3 projets minimum)',
                'Pratiquer UX/UI sur des cas concrets',
                'Améliorer avec retours & itérations',
                'Freelance / stage en studio ou agence',
              ]),
      };
    }

    if (matches(['cyber', 'cybersecurity', 'sécurité', 'security'])) {
      return {
        title: lang === 'ar' ? 'مسار الأمن السيبراني' : 'Roadmap Cybersecurity',
        bullets:
          lang === 'ar'
            ? ar([
                'Comprendre les réseaux (IP, DNS, ports)',
                'Linux & commandes essentielles',
                'Étudier la sécurité (OWASP, threats)',
                'Pratiquer sur des labs (CTF / TryHackMe)',
                'Certifications: Security+ / eJPT / autres',
              ])
            : fr([
                'Comprendre les réseaux (DNS, HTTP, ports)',
                'Apprendre Linux & commandes clés',
                'Sécurité offensive (ethical hacking) + OWASP',
                'Pratiquer en labs (CTF / plateformes)',
                'Passer des certifications (ex: Security+/eJPT)',
              ]),
      };
    }

    if (
      matches([
        'marketing',
        'business',
        'gestion',
        'finance',
        'economie',
        'business / management',
      ])
    ) {
      return {
        title:
          lang === 'ar'
            ? 'مسار التسويق والأعمال'
            : 'Roadmap Marketing & Business',
        bullets:
          lang === 'ar'
            ? ar([
                'Analyser ton audience & définir une stratégie',
                'Créer du contenu (social media + blog)',
                'Appliquer SEO & optimisation mots-clés',
                'Mesurer avec analytics (KPIs, dashboards)',
                'Développer un cas réel (campagne / projet)',
              ])
            : fr([
                'Analyser l’audience & définir une stratégie',
                'Créer du contenu (réseaux sociaux + blog)',
                'Appliquer le SEO & optimiser les mots-clés',
                'Suivre les KPI avec analytics',
                'Réaliser un mini-projet/cas réel',
              ]),
      };
    }

    if (
      matches(['langues', 'languages', 'lettres', 'translation', 'traduction'])
    ) {
      return {
        title: lang === 'ar' ? 'مسار اللغات' : 'Roadmap Langues',
        bullets:
          lang === 'ar'
            ? ar([
                'تقوية مهارة الكتابة والترجمة',
                'قراءة محتوى تخصصي (مقالات/كتب)',
                'تدريب ترجمة (قصير ثم أطول)',
                'تحسين النطق والتواصل (إن أمكن)',
                'مشاريع عملية: ترجمة/محتوى/تعليم',
              ])
            : fr([
                'Renforcer rédaction & traduction',
                'Lire du contenu spécialisé',
                'S’entraîner à traduire (du court au long)',
                'Améliorer communication et correction',
                'Construire un portfolio: traductions/projets',
              ]),
      };
    }

    if (
      matches([
        'santé',
        'medical',
        'health',
        'médicine',
        'medecine',
        'infirmier',
        'pharmacie',
      ])
    ) {
      return {
        title: lang === 'ar' ? 'مسار الصحة' : 'Roadmap Santé',
        bullets:
          lang === 'ar'
            ? ar([
                'أساسيات العلوم والبيولوجيا',
                'دراسة مجالات طبية حسب اهتمامك',
                'تدريب عملي (stage/observation)',
                'تعلم مهارات تشخيصية/سريرية (حسب المسار)',
                'متابعة تخصص تدريجيًا',
              ])
            : fr([
                'Bases en sciences & biologie',
                'Approfondir le domaine médical ciblé',
                'Faire un stage/observation encadrée',
                'Développer des compétences cliniques',
                'Vers la spécialisation progressive',
              ]),
      };
    }

    if (
      matches([
        'it',
        'informatique',
        'tech',
        'frontend',
        'backend',
        'data',
        'ia',
        'ai',
      ])
    ) {
      return {
        title:
          lang === 'ar'
            ? 'مسار التقنيات الرقمية'
            : 'Roadmap Informatique / Tech',
        bullets:
          lang === 'ar'
            ? ar([
                'تعلم أساسيات البرمجة (مفاهيم + تمرين يومي)',
                'بناء مشروع صغير (Front أو Back)',
                'تعلم Git + العمل ضمن مشاريع',
                'فهم قواعد البيانات والـ API',
                'إنجاز Portfolio + تدريب/تطبيقات',
              ])
            : fr([
                'Apprendre les bases de la programmation',
                'Construire un petit projet (Front/Back)',
                'Travailler Git + bonnes pratiques',
                'Comprendre bases de données & APIs',
                'Créer un portfolio + viser stage/emploi',
              ]),
      };
    }

    if (
      matches([
        'engineering',
        'genie',
        'génie',
        'mécanique',
        'mecanique',
        'electrique',
        'civil',
        'industriel',
      ])
    ) {
      return {
        title: lang === 'ar' ? 'مسار الهندسة' : 'Roadmap Ingénierie',
        bullets:
          lang === 'ar'
            ? ar([
                'أساسيات الرياضيات والفيزياء',
                'اختيار تخصص هندسي (ميكانيك/كهرباء/مدني)',
                'مشاريع تطبيقية صغيرة',
                'تعلم أدوات التحليل والحساب',
                'تدريب ميداني و مشاريع فريق',
              ])
            : fr([
                'Bases en maths & physique',
                'Choisir une spécialité (mécanique/électrique/civil)',
                'Réaliser des mini-projets appliqués',
                'Apprendre les outils d’analyse/calcul',
                'Stages terrain + travail en équipe',
              ]),
      };
    }

    // Default generic but still domain-informed (no “commencer par les bases...” sentence)
    return {
      title: lang === 'ar' ? 'مسار مهني' : 'Roadmap',
      bullets:
        lang === 'ar'
          ? ar([
              'حدّد هدفك الأول في هذا المجال',
              'اختر مهارة أساسية وابدأ بتطبيقها',
              'أنجز مشروع صغير لتقييم مستواك',
              'اطّلع على فرص تدريب أو شهادات',
              'تابع التقدم وراجع خطتك',
            ])
          : fr([
              'Définir un premier objectif concret dans le domaine',
              'Choisir une compétence clé et la pratiquer',
              'Réaliser un mini-projet pour valider le niveau',
              'Explorer stages/certifications adaptées',
              'Ajuster ta roadmap selon tes résultats',
            ]),
    };
  }

  private buildGroupedCareers(
    value: any,
    allowedDomains: string[],
  ): Array<{ domain: string; careers: string[] }> {
    const list = Array.isArray(value) ? value : [];
    const normalizedAllowed = allowedDomains
      .map((d) => this.normalizeDomainField(d))
      .filter(Boolean) as string[];

    const pickAllowed = (domain: any) => {
      const dn = this.normalizeDomainField(domain);
      if (!dn) return false;
      return normalizedAllowed.some(
        (a) => a.toLowerCase() === dn.toLowerCase(),
      );
    };

    const filtered = list.filter((item) => pickAllowed(item?.domain));

    const groups: Record<string, string[]> = {};

    for (const item of filtered) {
      const domain = this.normalizeDomainField(item?.domain);
      if (!domain) continue;
      const jobs = Array.isArray(item.jobs) ? item.jobs : [];

      for (const job of jobs) {
        const title = job?.title ?? job?.name;
        const desc = job?.future_outlook ?? job?.description;
        const careerLine = `• ${title ?? 'Métier'}${desc ? `: ${desc}` : ''}`;
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push(careerLine);
      }
    }

    return Object.entries(groups)
      .map(([domain, careers]) => ({
        domain,
        careers: Array.from(new Set(careers)).slice(0, 6),
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain));
  }

  private buildRoadmapCards(
    recommendations: any,
    dominantDomains: any[],
    lang: 'fr' | 'ar',
  ): Array<{ domain: string; bullets: string[] }> {
    const allowedTop1 = this.getTopDominantDomains({ dominantDomains });
    const allowed = allowedTop1.length
      ? allowedTop1
      : this.getFallbackTopDomains({ dominantDomains });

    const groups = new Set<string>();
    const recList = Array.isArray(recommendations) ? recommendations : [];

    // Determine which domains exist in recommendations for allowed list
    const hasAnyAllowed = recList.some((r) =>
      allowed.some((a) => this.isSameDomain(r?.domain, a)),
    );

    const finalAllowed = hasAnyAllowed
      ? allowed
      : this.getFallbackTopDomains({ dominantDomains });

    for (const r of recList) {
      const dn = this.normalizeDomainField(r?.domain);
      if (!dn) continue;
      if (finalAllowed.some((a) => a.toLowerCase() === dn.toLowerCase())) {
        groups.add(dn);
      }
    }

    // Preserve dominant order
    const orderedDomains = finalAllowed
      .filter((d) => groups.has(d))
      .map((d) => this.normalizeDomainField(d) as string);

    return orderedDomains.slice(0, 2).map((domain) => {
      const roadmap = this.domainSpecificRoadmapBullets(domain, lang);
      return { domain, bullets: roadmap.bullets.slice(0, 5) };
    });
  }

  private createReportPdf(data: {
    createdAt: Date;
    student: any;
    summary: string;
    dominantDomains: any[];
    skills: string[];
    recommendations: any;
    interests?: any;
  }) {
    const page1: string[] = [];
    const page2: string[] = [];
    const date = data.createdAt.toISOString().slice(0, 10);
    const domains = data.dominantDomains.slice(0, 6);
    const maxScore = Math.max(
      ...domains.map((item) => Number(item.score) || 0),
      1,
    );
    const topDomain = domains[0]?.domain ?? 'Domaine a confirmer';

    this.drawRect(page1, 0, 742, 595, 100, '1F4FD8');
    this.drawRect(page1, 32, 766, 54, 42, 'FFFFFF');
    this.drawText(page1, 46, 790, 'SO', 18, '1F4FD8', 'F2');
    this.drawText(page1, 104, 796, 'Smart Orientation', 24, 'FFFFFF', 'F2');
    this.drawText(
      page1,
      104,
      773,
      'Rapport intelligent d orientation universitaire',
      11,
      'DBEAFE',
    );
    this.drawText(page1, 438, 796, `Genere le ${date}`, 10, 'DBEAFE');

    this.drawCard(page1, 32, 630, 531, 82, 'EFF6FF', 'BFDBFE');
    this.drawText(page1, 54, 685, 'Profil etudiant', 14, '0F172A', 'F2');
    this.drawText(
      page1,
      54,
      664,
      `${data.student.name ?? 'Etudiant'} - Bac ${data.student.bacType ?? '-'}`,
      12,
      '1E293B',
      'F2',
    );
    this.drawText(
      page1,
      54,
      646,
      `Moyenne: ${data.student.bacAverage ?? '-'}   FG: ${data.student.FG ?? '-'}   Gouvernorat: ${data.student.gov ?? '-'}`,
      10,
      '475569',
    );
    this.drawText(
      page1,
      54,
      631,
      `Interets: ${this.clean(data.interests ?? '-')}`,
      10,
      '475569',
    );
    this.drawText(page1, 338, 685, 'Top recommandation', 11, '1D4ED8', 'F2');
    this.drawText(page1, 338, 664, this.clean(topDomain), 15, '0F172A', 'F2');
    this.drawText(
      page1,
      338,
      645,
      'Meilleure compatibilite selon le test',
      9,
      '64748B',
    );

    this.drawSectionTitle(page1, 32, 594, 'Synthese IA');
    let y = 570;
    for (const line of this.wrapText(
      data.summary || 'Aucune synthese disponible.',
      92,
    ).slice(0, 7)) {
      this.drawText(page1, 44, y, line, 10, '334155');
      y -= 15;
    }

    this.drawSectionTitle(page1, 32, 446, 'Scores par domaine');
    this.drawBarChart(page1, 52, 284, 210, 132, domains, maxScore);
    this.drawRadarChart(page1, 340, 350, 62, data.skills.slice(0, 6));

    this.drawSectionTitle(page1, 32, 242, 'Domaines compatibles');
    y = 212;
    domains.slice(0, 4).forEach((item, index) => {
      const x = index % 2 === 0 ? 32 : 303;
      if (index === 2) y -= 70;
      this.drawCard(
        page1,
        x,
        y,
        240,
        50,
        index === 0 ? 'ECFDF5' : 'F8FAFC',
        index === 0 ? '86EFAC' : 'E2E8F0',
      );
      this.drawText(
        page1,
        x + 14,
        y + 31,
        this.clean(item.domain ?? 'Domaine'),
        11,
        '0F172A',
        'F2',
      );
      this.drawText(
        page1,
        x + 14,
        y + 14,
        `Score ${item.score ?? 0} / Compatibilite estimee ${this.percent(item.score, maxScore)}%`,
        9,
        '64748B',
      );
    });

    this.drawFooter(page1, 1, date);

    this.drawRect(page2, 0, 782, 595, 60, '0F172A');
    this.drawText(
      page2,
      32,
      812,
      'Plan d action recommande',
      20,
      'FFFFFF',
      'F2',
    );
    this.drawText(
      page2,
      32,
      792,
      'Roadmap, competences et carrieres',
      10,
      'CBD5E1',
    );

    const roadmapCards = this.buildRoadmapCards(
      data.recommendations,
      data.dominantDomains,
      'fr',
    );
    this.drawSectionTitle(page2, 32, 746, 'Roadmap recommandations');
    y = 714;

    roadmapCards.slice(0, 2).forEach((card, index) => {
      const cardFill = index % 2 === 0 ? 'F8FAFC' : 'F0F9FF';
      const cardStroke = index % 2 === 0 ? 'E2E8F0' : 'BAE6FD';
      this.drawCard(page2, 32, y - 38, 531, 120, cardFill, cardStroke);
      this.drawText(
        page2,
        48,
        y + 62,
        `Domaine: ${this.clean(card.domain)}`,
        11,
        '1D4ED8',
        'F2',
      );

      let yy = y + 44;
      card.bullets.slice(0, 5).forEach((b) => {
        if (yy < 110) return;
        this.drawText(
          page2,
          56,
          yy,
          this.clean(b).replace(/^•\s*/, ''),
          9,
          '334155',
          'F1',
        );
        yy -= 14;
      });

      y -= 136;
    });

    this.drawSectionTitle(page2, 32, y - 8, 'Carrieres et metiers');
    y -= 40;

    const topDomains = this.getFallbackTopDomains({
      dominantDomains: data.dominantDomains,
    });
    const careersGrouped = this.buildGroupedCareers(
      data.recommendations,
      topDomains,
    );

    if (!careersGrouped.length) {
      this.drawText(
        page2,
        44,
        y,
        'Aucune carrière disponible pour ton profil.',
        10,
        '475569',
        'F1',
      );
    } else {
      careersGrouped.slice(0, 2).forEach((group, gi) => {
        if (y < 96) return;
        this.drawText(
          page2,
          44,
          y,
          `Domaine: ${this.clean(group.domain)}`,
          10,
          '1D4ED8',
          'F2',
        );
        y -= 16;
        group.careers.slice(0, 6).forEach((c) => {
          if (y < 96) return;
          this.drawText(page2, 56, y, this.clean(c), 9, '475569', 'F1');
          y -= 14;
        });
        y -= 10;
      });
    }

    this.drawFooter(page2, 2, date);
    return this.buildPdf([page1.join('\n'), page2.join('\n')]);
  }

  private drawSectionTitle(
    commands: string[],
    x: number,
    y: number,
    text: string,
  ) {
    this.drawText(commands, x, y, text, 15, '0F172A', 'F2');
    this.drawLine(commands, x, y - 10, x + 531, y - 10, 'E2E8F0');
  }

  private drawCard(
    commands: string[],
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke: string,
  ) {
    this.drawRect(commands, x, y, w, h, fill);
    commands.push(`q ${this.color(stroke)} RG 1 w ${x} ${y} ${w} ${h} re S Q`);
  }

  private drawBarChart(
    commands: string[],
    x: number,
    y: number,
    w: number,
    h: number,
    domains: any[],
    maxScore: number,
  ) {
    this.drawCard(commands, x - 12, y - 28, w + 36, h + 58, 'FFFFFF', 'E2E8F0');
    domains.forEach((item, index) => {
      const barH = Math.max(
        8,
        ((Number(item.score) || 0) / maxScore) * (h - 28),
      );
      const barW = 22;
      const barX = x + index * 34;
      this.drawRect(
        commands,
        barX,
        y,
        barW,
        barH,
        index === 0 ? '2563EB' : '38BDF8',
      );
      this.drawText(
        commands,
        barX - 2,
        y - 14,
        String(item.score ?? 0),
        7,
        '64748B',
      );
      this.drawText(
        commands,
        barX - 6,
        y - 26,
        this.clean(item.domain ?? '').slice(0, 8),
        6,
        '64748B',
      );
    });
  }

  private drawRadarChart(
    commands: string[],
    cx: number,
    cy: number,
    r: number,
    skills: string[],
  ) {
    const labels = skills.length
      ? skills
      : ['Interets', 'Logique', 'Analyse', 'Creation', 'Projet'];
    this.drawCard(commands, cx - 96, cy - 94, 192, 172, 'FFFFFF', 'E2E8F0');
    this.drawText(
      commands,
      cx - 74,
      cy + 58,
      'Radar competences/interets',
      9,
      '334155',
      'F2',
    );
    const points = labels.slice(0, 6).map((_, index, arr) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / arr.length;
      const value = 0.54 + index * 0.06;
      return [
        cx + Math.cos(angle) * r * value,
        cy + Math.sin(angle) * r * value,
      ];
    });
    labels.slice(0, 6).forEach((label, index, arr) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / arr.length;
      this.drawLine(
        commands,
        cx,
        cy,
        cx + Math.cos(angle) * r,
        cy + Math.sin(angle) * r,
        'CBD5E1',
      );
      this.drawText(
        commands,
        cx + Math.cos(angle) * (r + 10) - 18,
        cy + Math.sin(angle) * (r + 10),
        this.clean(label).slice(0, 10),
        6,
        '64748B',
      );
    });
    const path = points
      .map(
        (p, index) =>
          `${p[0].toFixed(1)} ${p[1].toFixed(1)} ${index === 0 ? 'm' : 'l'}`,
      )
      .join(' ');
    commands.push(`q ${this.color('2563EB')} rg ${path} h f Q`);
    commands.push(`q ${this.color('1D4ED8')} RG 1.5 w ${path} h S Q`);
  }

  private drawFooter(commands: string[], page: number, date: string) {
    this.drawLine(commands, 32, 50, 563, 50, 'E2E8F0');
    this.drawText(
      commands,
      32,
      32,
      'Smart Orientation - rapport confidentiel etudiant',
      8,
      '64748B',
    );
    this.drawText(commands, 468, 32, `Page ${page} - ${date}`, 8, '64748B');
  }

  private drawRect(
    commands: string[],
    x: number,
    y: number,
    w: number,
    h: number,
    hex: string,
  ) {
    commands.push(`q ${this.color(hex)} rg ${x} ${y} ${w} ${h} re f Q`);
  }

  private drawLine(
    commands: string[],
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    hex: string,
  ) {
    commands.push(
      `q ${this.color(hex)} RG 1 w ${x1} ${y1} m ${x2} ${y2} l S Q`,
    );
  }

  private drawText(
    commands: string[],
    x: number,
    y: number,
    text: string,
    size = 10,
    hex = '0F172A',
    font = 'F1',
  ) {
    commands.push(
      `BT /${font} ${size} Tf ${this.color(hex)} rg ${x} ${y} Td (${this.escapePdf(this.clean(text))}) Tj ET`,
    );
  }

  private buildPdf(pageStreams: string[]) {
    const pageCount = pageStreams.length;
    const font1Id = 3 + pageCount;
    const font2Id = 4 + pageCount;
    const contentStartId = 5 + pageCount;
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      `2 0 obj << /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, i) => `${3 + i} 0 R`).join(' ')}] /Count ${pageCount} >> endobj`,
    ];

    pageStreams.forEach((_, index) => {
      objects.push(
        `${3 + index} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> /Contents ${contentStartId + index} 0 R >> endobj`,
      );
    });
    objects.push(
      `${font1Id} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
    );
    objects.push(
      `${font2Id} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`,
    );
    pageStreams.forEach((stream, index) => {
      objects.push(
        `${contentStartId + index} 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
      );
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${object}\n`;
    }
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf);
  }

  private wrapText(text: string, maxLength: number) {
    const words = this.clean(text).split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      if (`${line} ${word}`.trim().length > maxLength) {
        lines.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private percent(score: any, maxScore: number) {
    return Math.min(100, Math.round(((Number(score) || 0) / maxScore) * 100));
  }

  private clean(value: any) {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private escapePdf(value: string) {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private color(hex: string) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }
}
