import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ORIENTATION_QUESTIONS } from './orientation-questions';

type OrientationAnswer = {
  questionId?: string;
  value?: number;
  label?: string;
  domains?: string[];
  skills?: string[];
  interest?: string;
};

@Injectable()
export class OrientationTestService {
  constructor(private readonly prisma: PrismaService) {}

  questions() {
    return ORIENTATION_QUESTIONS;
  }

  async submit(
    userId: number,
    body: { answers?: OrientationAnswer[]; interests?: string },
  ) {
    const student = await this.prisma.student.findFirst({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const answers = Array.isArray(body.answers) ? body.answers : [];
    const domainScores = new Map<string, number>();
    const skillSet = new Set<string>();
    const questionById = new Map(
      ORIENTATION_QUESTIONS.map((question) => [question.id, question]),
    );

    for (const answer of answers) {
      const weight = Number(answer.value ?? 1);
      const question = answer.questionId
        ? questionById.get(answer.questionId)
        : undefined;
      const domains = answer.domains?.length
        ? answer.domains
        : (question?.domains ?? []);
      const skills = answer.skills?.length
        ? answer.skills
        : (question?.skills ?? []);

      for (const domain of domains) {
        domainScores.set(domain, (domainScores.get(domain) ?? 0) + weight);
      }
      for (const skill of skills) {
        skillSet.add(skill);
      }
      if (answer.interest) {
        domainScores.set(
          answer.interest,
          (domainScores.get(answer.interest) ?? 0) + 1,
        );
      }
    }

    const dominantDomains = [...domainScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, score]) => ({ domain, score }));

    const recommendations = this.buildRecommendations(
      dominantDomains.map((item) => item.domain),
      student.bacType,
    );
    const score = dominantDomains.reduce((sum, item) => sum + item.score, 0);

    const test = await this.prisma.orientationTest.create({
      data: {
        studentId: student.id,
        answers,
        interests: body.interests ?? null,
        skills: [...skillSet],
        dominantDomains,
        recommendations,
        score,
      },
    });

    const report = await this.prisma.recommendationReport.create({
      data: {
        studentId: student.id,
        orientationTestId: test.id,
        summary: this.buildSummary(student.name, dominantDomains),
        recommendations,
      },
    });

    return { test, report };
  }

  async latest(userId: number) {
    const student = await this.prisma.student.findFirst({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    return this.prisma.orientationTest.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: { report: true },
    });
  }

  async history(userId: number) {
    const student = await this.prisma.student.findFirst({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    return this.prisma.orientationTest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: { report: true },
    });
  }

  private buildRecommendations(domains: string[], bacType: string) {
    const jobs = this.loadJobs();
    const normalizedDomains = domains.map((domain) => domain.toLowerCase());
    const matches: any[] = [];

    for (const group of jobs) {
      const haystack = [
        group.domain,
        ...(group.keywords ?? []),
        ...(group.jobs ?? []).flatMap((job) => [
          job.title,
          job.description,
          ...(job.skills ?? []),
        ]),
      ]
        .join(' ')
        .toLowerCase();

      if (normalizedDomains.some((domain) => haystack.includes(domain))) {
        matches.push({
          domain: group.domain,
          bacType,
          jobs: (group.jobs ?? []).slice(0, 4),
        });
      }
    }

    if (matches.length > 0) return matches.slice(0, 5);

    return domains.slice(0, 3).map((domain) => ({
      domain,
      bacType,
      jobs: [],
      note: 'A approfondir avec les donnees du marche du travail.',
    }));
  }

  private buildSummary(
    name: string,
    dominantDomains: { domain: string; score: number }[],
  ) {
    const top = dominantDomains[0]?.domain ?? 'orientation generale';
    return `${name}, votre profil montre une affinite principale avec ${top}. Les recommandations combinent vos interets, competences et votre parcours scolaire.`;
  }

  private loadJobs() {
    try {
      const file = join(process.cwd(), 'data', 'jobs.json');
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      return Array.isArray(parsed) ? parsed : (parsed.domains ?? []);
    } catch {
      return [];
    }
  }
}
