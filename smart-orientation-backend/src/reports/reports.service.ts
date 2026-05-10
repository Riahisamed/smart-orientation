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
      ? report.orientationTest.skills.map((skill) => String(skill)).filter(Boolean)
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

  private flattenRecommendations(value: any): string[] {
    if (!Array.isArray(value)) return ['Aucune recommandation disponible.'];
    return value.flatMap((item) => {
      const jobs = Array.isArray(item.jobs)
        ? item.jobs.map(
            (job) =>
              `- ${job.title ?? job.name ?? 'Metier'}: ${job.future_outlook ?? job.description ?? ''}`,
          )
        : [];
      return [`Domaine: ${item.domain ?? 'General'}`, ...jobs];
    });
  }

  private flattenRoadmaps(value: any): string[] {
    if (!Array.isArray(value))
      return ['- Construire un plan d apprentissage personnalise.'];
    return value.slice(0, 5).map((item) => {
      const firstJob = Array.isArray(item.jobs)
        ? item.jobs[0]?.title
        : undefined;
      return `- ${item.domain ?? 'General'}: commencer par les bases, pratiquer avec projets, viser ${firstJob ?? 'un metier compatible'}.`;
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
    const maxScore = Math.max(...domains.map((item) => Number(item.score) || 0), 1);
    const topDomain = domains[0]?.domain ?? 'Domaine a confirmer';

    this.drawRect(page1, 0, 742, 595, 100, '1F4FD8');
    this.drawRect(page1, 32, 766, 54, 42, 'FFFFFF');
    this.drawText(page1, 46, 790, 'SO', 18, '1F4FD8', 'F2');
    this.drawText(page1, 104, 796, 'Smart Orientation', 24, 'FFFFFF', 'F2');
    this.drawText(page1, 104, 773, 'Rapport intelligent d orientation universitaire', 11, 'DBEAFE');
    this.drawText(page1, 438, 796, `Genere le ${date}`, 10, 'DBEAFE');

    this.drawCard(page1, 32, 630, 531, 82, 'EFF6FF', 'BFDBFE');
    this.drawText(page1, 54, 685, 'Profil etudiant', 14, '0F172A', 'F2');
    this.drawText(page1, 54, 664, `${data.student.name ?? 'Etudiant'} - Bac ${data.student.bacType ?? '-'}`, 12, '1E293B', 'F2');
    this.drawText(page1, 54, 646, `Moyenne: ${data.student.bacAverage ?? '-'}   FG: ${data.student.FG ?? '-'}   Gouvernorat: ${data.student.gov ?? '-'}`, 10, '475569');
    this.drawText(page1, 54, 631, `Interets: ${this.clean(data.interests ?? '-')}`, 10, '475569');
    this.drawText(page1, 338, 685, 'Top recommandation', 11, '1D4ED8', 'F2');
    this.drawText(page1, 338, 664, this.clean(topDomain), 15, '0F172A', 'F2');
    this.drawText(page1, 338, 645, 'Meilleure compatibilite selon le test', 9, '64748B');

    this.drawSectionTitle(page1, 32, 594, 'Synthese IA');
    let y = 570;
    for (const line of this.wrapText(data.summary || 'Aucune synthese disponible.', 92).slice(0, 7)) {
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
      this.drawCard(page1, x, y, 240, 50, index === 0 ? 'ECFDF5' : 'F8FAFC', index === 0 ? '86EFAC' : 'E2E8F0');
      this.drawText(page1, x + 14, y + 31, this.clean(item.domain ?? 'Domaine'), 11, '0F172A', 'F2');
      this.drawText(page1, x + 14, y + 14, `Score ${item.score ?? 0} / Compatibilite estimee ${this.percent(item.score, maxScore)}%`, 9, '64748B');
    });

    this.drawFooter(page1, 1, date);

    this.drawRect(page2, 0, 782, 595, 60, '0F172A');
    this.drawText(page2, 32, 812, 'Plan d action recommande', 20, 'FFFFFF', 'F2');
    this.drawText(page2, 32, 792, 'Roadmap, competences et carrieres', 10, 'CBD5E1');

    this.drawSectionTitle(page2, 32, 746, 'Roadmap recommandations');
    y = 714;
    this.flattenRoadmaps(data.recommendations).slice(0, 6).forEach((line, index) => {
      this.drawCard(page2, 32, y - 38, 531, 44, index % 2 === 0 ? 'F8FAFC' : 'F0F9FF', index % 2 === 0 ? 'E2E8F0' : 'BAE6FD');
      this.drawText(page2, 48, y - 12, `${index + 1}. ${this.clean(line.replace(/^- /, ''))}`, 10, '334155');
      y -= 54;
    });

    this.drawSectionTitle(page2, 32, y - 8, 'Carrieres et metiers');
    y -= 40;
    this.flattenRecommendations(data.recommendations).slice(0, 12).forEach((line) => {
      if (y < 96) return;
      this.drawText(page2, 44, y, this.clean(line), 9, line.startsWith('Domaine') ? '1D4ED8' : '475569', line.startsWith('Domaine') ? 'F2' : 'F1');
      y -= 14;
    });

    this.drawFooter(page2, 2, date);
    return this.buildPdf([page1.join('\n'), page2.join('\n')]);
  }

  private drawSectionTitle(commands: string[], x: number, y: number, text: string) {
    this.drawText(commands, x, y, text, 15, '0F172A', 'F2');
    this.drawLine(commands, x, y - 10, x + 531, y - 10, 'E2E8F0');
  }

  private drawCard(commands: string[], x: number, y: number, w: number, h: number, fill: string, stroke: string) {
    this.drawRect(commands, x, y, w, h, fill);
    commands.push(`q ${this.color(stroke)} RG 1 w ${x} ${y} ${w} ${h} re S Q`);
  }

  private drawBarChart(commands: string[], x: number, y: number, w: number, h: number, domains: any[], maxScore: number) {
    this.drawCard(commands, x - 12, y - 28, w + 36, h + 58, 'FFFFFF', 'E2E8F0');
    domains.forEach((item, index) => {
      const barH = Math.max(8, ((Number(item.score) || 0) / maxScore) * (h - 28));
      const barW = 22;
      const barX = x + index * 34;
      this.drawRect(commands, barX, y, barW, barH, index === 0 ? '2563EB' : '38BDF8');
      this.drawText(commands, barX - 2, y - 14, String(item.score ?? 0), 7, '64748B');
      this.drawText(commands, barX - 6, y - 26, this.clean(item.domain ?? '').slice(0, 8), 6, '64748B');
    });
  }

  private drawRadarChart(commands: string[], cx: number, cy: number, r: number, skills: string[]) {
    const labels = skills.length ? skills : ['Interets', 'Logique', 'Analyse', 'Creation', 'Projet'];
    this.drawCard(commands, cx - 96, cy - 94, 192, 172, 'FFFFFF', 'E2E8F0');
    this.drawText(commands, cx - 74, cy + 58, 'Radar competences/interets', 9, '334155', 'F2');
    const points = labels.slice(0, 6).map((_, index, arr) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / arr.length;
      const value = 0.54 + index * 0.06;
      return [cx + Math.cos(angle) * r * value, cy + Math.sin(angle) * r * value];
    });
    labels.slice(0, 6).forEach((label, index, arr) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / arr.length;
      this.drawLine(commands, cx, cy, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 'CBD5E1');
      this.drawText(commands, cx + Math.cos(angle) * (r + 10) - 18, cy + Math.sin(angle) * (r + 10), this.clean(label).slice(0, 10), 6, '64748B');
    });
    const path = points
      .map((p, index) => `${p[0].toFixed(1)} ${p[1].toFixed(1)} ${index === 0 ? 'm' : 'l'}`)
      .join(' ');
    commands.push(`q ${this.color('2563EB')} rg ${path} h f Q`);
    commands.push(`q ${this.color('1D4ED8')} RG 1.5 w ${path} h S Q`);
  }

  private drawFooter(commands: string[], page: number, date: string) {
    this.drawLine(commands, 32, 50, 563, 50, 'E2E8F0');
    this.drawText(commands, 32, 32, 'Smart Orientation - rapport confidentiel etudiant', 8, '64748B');
    this.drawText(commands, 468, 32, `Page ${page} - ${date}`, 8, '64748B');
  }

  private drawRect(commands: string[], x: number, y: number, w: number, h: number, hex: string) {
    commands.push(`q ${this.color(hex)} rg ${x} ${y} ${w} ${h} re f Q`);
  }

  private drawLine(commands: string[], x1: number, y1: number, x2: number, y2: number, hex: string) {
    commands.push(`q ${this.color(hex)} RG 1 w ${x1} ${y1} m ${x2} ${y2} l S Q`);
  }

  private drawText(commands: string[], x: number, y: number, text: string, size = 10, hex = '0F172A', font = 'F1') {
    commands.push(`BT /${font} ${size} Tf ${this.color(hex)} rg ${x} ${y} Td (${this.escapePdf(this.clean(text))}) Tj ET`);
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
      objects.push(`${3 + index} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> /Contents ${contentStartId + index} 0 R >> endobj`);
    });
    objects.push(`${font1Id} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);
    objects.push(`${font2Id} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`);
    pageStreams.forEach((stream, index) => {
      objects.push(`${contentStartId + index} 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`);
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
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private color(hex: string) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }
}
