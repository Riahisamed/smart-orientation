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
      : [];

    const lines = [
      'Smart Orientation - Rapport',
      `Date: ${report.createdAt.toISOString().slice(0, 10)}`,
      '',
      'Profil etudiant',
      `Etudiant: ${report.student.name}`,
      `Bac: ${report.student.bacType}`,
      `Moyenne: ${report.student.bacAverage}`,
      `FG: ${report.student.FG ?? '-'}`,
      `Gouvernorat: ${report.student.gov ?? '-'}`,
      `Interets: ${report.orientationTest?.interests ?? report.student.interests ?? '-'}`,
      `Competences detectees: ${skills.join(', ') || '-'}`,
      '',
      'Synthese IA',
      report.summary,
      '',
      'Resultats du test',
      ...dominantDomains.map((item: any) => `- ${item.domain}: ${item.score}`),
      '',
      'Domaines compatibles',
      ...dominantDomains.map((item: any) => `- ${item.domain}`),
      '',
      'Roadmap recommandee',
      ...this.flattenRoadmaps(report.recommendations),
      '',
      'Carrieres et metiers',
      ...this.flattenRecommendations(report.recommendations),
    ];

    return this.createSimplePdf(lines);
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

  private createSimplePdf(lines: string[]) {
    const safeLines = lines.map((line) => String(line).replace(/[()\\]/g, ''));
    const text = safeLines
      .map(
        (line, index) =>
          `BT /F1 12 Tf 50 ${780 - index * 18} Td (${line}) Tj ET`,
      )
      .join('\n');
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${Buffer.byteLength(text)} >> stream\n${text}\nendstream endobj`,
    ];

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
}
